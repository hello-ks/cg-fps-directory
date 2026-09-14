import urllib.request
import ssl
import re
import json
import os
import time
import concurrent.futures

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://epos.cg.gov.in/FPS_Trans_Abstract",
    "Accept": "*/*"
}

DATA_FILE = "src/data/epos_data.json"
os.makedirs("src/data", exist_ok=True)

def fetch(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, context=ctx, timeout=8) as res:
                return res.read().decode("utf-8", errors="ignore")
        except Exception as e:
            if attempt == retries - 1:
                return ""
            time.sleep(0.5)
    return ""

def main():
    print("Step 1: Fetching all 33 Districts...")
    dist_html = fetch("https://epos.cg.gov.in/Epos_Spring/Common/getDistricts")
    dist_matches = re.findall(r"<option\s+value=[\x27\"]([^\x27\"]+)[\x27\"]\s*>([^<]+)</option>", dist_html)
    districts = []
    for code, name in dist_matches:
        code = code.strip()
        name = name.strip()
        if code and code != "0" and "--select--" not in name.lower():
            districts.append({"district_code": code, "district_name": name, "sub_districts": []})
    
    print(f"Found {len(districts)} districts.")

    # Check if already cached
    existing_map = {}
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                saved = json.load(f)
                for d in saved.get("districts", []):
                    existing_map[d["district_code"]] = d
        except Exception:
            pass

    print("Step 2: Fetching Sub-Districts (AFSOs) across all districts...")
    def fetch_afso_for_dist(d):
        d_code = d["district_code"]
        d_name = d["district_name"]
        
        # If already cached with FPS
        if d_code in existing_map:
            cached = existing_map[d_code]
            if len(cached.get("sub_districts", [])) > 0:
                has_fps = any(len(s.get("fps_list", [])) > 0 for s in cached["sub_districts"])
                if has_fps:
                    return cached

        html = fetch(f"https://epos.cg.gov.in/Epos_Spring/Common/getAfso?dist_code={d_code}")
        if not html:
            html = fetch(f"https://epos.cg.gov.in/Epos_Spring/Common/getAfsoAll?dist_code={d_code}")
        items = re.findall(r"<option\s+value=[\x27\"]([^\x27\"]+)[\x27\"]\s*>([^<]+)</option>", html)
        sub_districts = []
        for code, name in items:
            code = code.strip()
            name = name.strip()
            if code and code != "0" and "--select--" not in name.lower() and "--all--" not in name.lower():
                sub_districts.append({
                    "sub_district_code": code,
                    "sub_district_name": name,
                    "fps_list": []
                })
        return {"district_code": d_code, "district_name": d_name, "sub_districts": sub_districts}

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        districts = list(pool.map(fetch_afso_for_dist, districts))

    total_afsos = sum(len(d["sub_districts"]) for d in districts)
    print(f"Total AFSOs identified: {total_afsos}")

    # Save checkpoint
    with open(DATA_FILE, "w") as f:
        json.dump({"last_updated": time.strftime("%Y-%m-%d %H:%M:%S"), "districts": districts}, f, indent=2)

    # Step 3: Fetch FPS for each AFSO
    print("Step 3: Fetching FPS list for all AFSOs...")
    tasks = []
    for d in districts:
        for s in d["sub_districts"]:
            if len(s.get("fps_list", [])) == 0:
                tasks.append((d["district_code"], d["district_name"], s["sub_district_code"], s["sub_district_name"], s))

    print(f"AFSOs to fetch FPS for: {len(tasks)}")

    def fetch_fps(t):
        d_code, d_name, s_code, s_name, sub_obj = t
        html = fetch(f"https://epos.cg.gov.in/Epos_Spring/Common/getFPSs?dist_code={d_code}&afso_code={s_code}")
        items = re.findall(r"<option\s+value=[\x27\"]([^\x27\"]+)[\x27\"]\s*>([^<]+)</option>", html)
        fps_list = []
        for code, label in items:
            code = code.strip()
            label = label.strip()
            if not code or code == "0" or "--select--" in label.lower() or "--all--" in label.lower():
                continue
            m = re.match(r"^(\d+)\s*\((.*)\)$", label)
            if m:
                fps_code = m.group(1)
                fps_name = m.group(2).strip()
            else:
                fps_code = code
                fps_name = label
            fps_list.append({
                "fps_code": fps_code,
                "fps_name": fps_name,
                "raw_label": label
            })
        sub_obj["fps_list"] = fps_list
        return (d_name, s_name, len(fps_list))

    completed = 0
    total_fps = 0
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(fetch_fps, t): t for t in tasks}
        for future in concurrent.futures.as_completed(futures):
            completed += 1
            try:
                d_name, s_name, count = future.result()
                total_fps += count
                if completed % 20 == 0 or completed == len(tasks):
                    elapsed = time.time() - start_time
                    rate = completed / max(1, elapsed)
                    remaining = (len(tasks) - completed) / max(0.1, rate)
                    print(f"[{completed}/{len(tasks)}] AFSOs crawled | {total_fps} FPS found | {rate:.1f} req/s | ~{remaining:.0f}s remaining")
                    # Checkpoint
                    with open(DATA_FILE, "w") as f:
                        json.dump({
                            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
                            "source_url": "https://epos.cg.gov.in/FPS_Trans_Abstract",
                            "districts": districts
                        }, f, indent=2)
            except Exception as e:
                print("Error:", e)

    # Final write
    final_fps_count = sum(len(s.get("fps_list", [])) for d in districts for s in d["sub_districts"])
    print(f"\nCOMPLETED! Total Districts: {len(districts)} | Total Sub-Districts: {total_afsos} | Total FPS: {final_fps_count}")
    with open(DATA_FILE, "w") as f:
        json.dump({
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
            "source_url": "https://epos.cg.gov.in/FPS_Trans_Abstract",
            "total_districts": len(districts),
            "total_sub_districts": total_afsos,
            "total_fps": final_fps_count,
            "districts": districts
        }, f, indent=2)

if __name__ == "__main__":
    main()
