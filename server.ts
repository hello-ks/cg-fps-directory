import express from "express";
import path from "path";
import fs from "fs";
import https from "https";
import { createServer as createViteServer } from "vite";

// Bypass SSL certificate errors for Indian NIC gov servers
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_FILE = path.join(process.cwd(), "src", "data", "epos_data.json");

// Helper to load dataset
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      console.error("Error reading epos_data.json:", e);
    }
  }
  return { districts: [], total_districts: 0, total_sub_districts: 0, total_fps: 0, last_updated: "Loading..." };
}

// Summary endpoint
app.get("/api/summary", (req, res) => {
  const data = loadData();
  const districts = data.districts || [];
  let totalSub = 0;
  let totalFps = 0;
  let crawledAfsos = 0;

  for (const d of districts) {
    for (const s of d.sub_districts || []) {
      totalSub++;
      const fpsCount = (s.fps_list || []).length;
      totalFps += fpsCount;
      if (fpsCount > 0) crawledAfsos++;
    }
  }

  res.json({
    total_districts: districts.length,
    total_sub_districts: totalSub,
    total_fps: totalFps,
    crawled_sub_districts: crawledAfsos,
    is_complete: crawledAfsos >= totalSub && totalSub > 0,
    last_updated: data.last_updated || new Date().toISOString(),
    source_url: "https://epos.cg.gov.in/FPS_Trans_Abstract",
  });
});

// Full dataset or filtered by district / sub-district
app.get("/api/dataset", (req, res) => {
  const data = loadData();
  const { district_code, sub_district_code } = req.query;

  if (district_code) {
    const dist = (data.districts || []).find((d: any) => d.district_code === district_code);
    if (!dist) return res.status(404).json({ error: "District not found" });

    if (sub_district_code) {
      const sub = (dist.sub_districts || []).find((s: any) => s.sub_district_code === sub_district_code);
      if (!sub) return res.status(404).json({ error: "Sub-district not found" });
      return res.json({ district: dist.district_name, district_code, sub_district: sub });
    }

    return res.json(dist);
  }

  res.json(data);
});

// Flat list for fast global search and tabular browsing
app.get("/api/flat", (req, res) => {
  const data = loadData();
  const q = ((req.query.q as string) || "").toLowerCase().trim();
  const limit = parseInt((req.query.limit as string) || "50", 10);
  const offset = parseInt((req.query.offset as string) || "0", 10);
  const district_code = req.query.district_code as string;
  const sub_district_code = req.query.sub_district_code as string;

  let flatList: any[] = [];
  for (const d of data.districts || []) {
    if (district_code && d.district_code !== district_code) continue;
    for (const s of d.sub_districts || []) {
      if (sub_district_code && s.sub_district_code !== sub_district_code) continue;
      for (const f of s.fps_list || []) {
        if (
          !q ||
          f.fps_code.toLowerCase().includes(q) ||
          f.fps_name.toLowerCase().includes(q) ||
          d.district_name.toLowerCase().includes(q) ||
          s.sub_district_name.toLowerCase().includes(q) ||
          d.district_code.includes(q) ||
          s.sub_district_code.includes(q)
        ) {
          flatList.push({
            district_code: d.district_code,
            district_name: d.district_name,
            sub_district_code: s.sub_district_code,
            sub_district_name: s.sub_district_name,
            fps_code: f.fps_code,
            fps_name: f.fps_name,
          });
        }
      }
    }
  }

  const total = flatList.length;
  const paginated = flatList.slice(offset, offset + limit);

  res.json({
    total,
    offset,
    limit,
    items: paginated,
  });
});

// CSV Export
app.get("/api/export/csv", (req, res) => {
  const csvFile = path.join(process.cwd(), "src", "data", "chhattisgarh_fps_directory.csv");
  if (fs.existsSync(csvFile)) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="chhattisgarh_epos_fps_list.csv"');
    return fs.createReadStream(csvFile).pipe(res);
  }
  const data = loadData();
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="chhattisgarh_epos_fps_list.csv"');

  res.write("District Code,District Name,Sub-District Code,Sub-District Name,FPS Code,Fair Price Shop Name / Dealer\n");

  for (const d of data.districts || []) {
    for (const s of d.sub_districts || []) {
      for (const f of s.fps_list || []) {
        const dCode = `"${d.district_code}"`;
        const dName = `"${(d.district_name || "").replace(/"/g, '""')}"`;
        const sCode = `"${s.sub_district_code}"`;
        const sName = `"${(s.sub_district_name || "").replace(/"/g, '""')}"`;
        const fCode = `"${f.fps_code}"`;
        const fName = `"${(f.fps_name || "").replace(/"/g, '""')}"`;
        res.write(`${dCode},${dName},${sCode},${sName},${fCode},${fName}\n`);
      }
    }
  }

  res.end();
});

// JSON Export
app.get("/api/export/json", (req, res) => {
  if (fs.existsSync(DATA_FILE)) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", 'attachment; filename="chhattisgarh_epos_fps_data.json"');
    fs.createReadStream(DATA_FILE).pipe(res);
  } else {
    res.status(404).json({ error: "Data file not ready yet" });
  }
});

// Live Proxy endpoints for testing epos portal in real-time
app.get("/api/live/districts", async (req, res) => {
  try {
    const response = await fetch("https://epos.cg.gov.in/Epos_Spring/Common/getDistricts", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://epos.cg.gov.in/FPS_Trans_Abstract",
      },
    });
    const text = await response.text();
    res.send(text);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/live/sub-districts", async (req, res) => {
  const dist_code = req.query.dist_code as string;
  if (!dist_code) return res.status(400).json({ error: "dist_code is required" });
  try {
    const response = await fetch(`https://epos.cg.gov.in/Epos_Spring/Common/getAfso?dist_code=${dist_code}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://epos.cg.gov.in/FPS_Trans_Abstract",
      },
    });
    const text = await response.text();
    res.send(text);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/live/fps", async (req, res) => {
  const dist_code = req.query.dist_code as string;
  const afso_code = req.query.afso_code as string;
  if (!dist_code || !afso_code) return res.status(400).json({ error: "dist_code and afso_code required" });
  try {
    const response = await fetch(
      `https://epos.cg.gov.in/Epos_Spring/Common/getFPSs?dist_code=${dist_code}&afso_code=${afso_code}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": "https://epos.cg.gov.in/FPS_Trans_Abstract",
        },
      }
    );
    const text = await response.text();
    res.send(text);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// F12 Network Tips & Explanations
app.get("/api/f12-info", (req, res) => {
  res.json({
    portal_url: "https://epos.cg.gov.in/FPS_Trans_Abstract",
    app_type: "React Single Page Application (SMART-PDS)",
    bundle_source: "/static/js/main.61917e58.js",
    endpoints: [
      {
        step: 1,
        name: "District Dropdown",
        method: "GET",
        url: "https://epos.cg.gov.in/Epos_Spring/Common/getDistricts",
        description: "Returns HTML <option> tags containing 33 District Codes and Names across Chhattisgarh.",
      },
      {
        step: 2,
        name: "Sub-District (AFSO) Dropdown",
        method: "GET",
        url: "https://epos.cg.gov.in/Epos_Spring/Common/getAfso?dist_code={dist_code}",
        description: "Triggered on District select. Returns HTML <option> tags containing all AFSO / Block codes & names.",
      },
      {
        step: 3,
        name: "Fair Price Shop (FPS) Dropdown",
        method: "GET",
        url: "https://epos.cg.gov.in/Epos_Spring/Common/getFPSs?dist_code={dist_code}&afso_code={afso_code}",
        description: "Triggered on Sub-District select. Returns HTML <option> tags with FPS Code as value and 'CODE(DEALER_NAME)' as display text.",
      },
      {
        step: 4,
        name: "Transactions Abstract",
        method: "POST",
        url: "https://epos.cg.gov.in/Epos_Spring/fps/fpstransactionwitoutcatptcha",
        description: "Triggered on Submit with Month, Year, and FPS ID.",
      },
    ],
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
