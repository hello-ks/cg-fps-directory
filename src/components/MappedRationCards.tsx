import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Search,
  Building2,
  MapPin,
  Store,
  Users,
  Download,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Filter,
  Calendar,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  FileJson,
  Layers,
  ArrowUpDown,
  ShoppingBag,
  Info,
} from "lucide-react";
import {
  FpsKeyRegSummary,
  MappedRationCard,
  KeyRegDistrict,
  KeyRegAfso,
  District,
} from "../types";

interface MappedRationCardsProps {
  initialFpsId?: string;
  onFpsSelect?: (fpsId: string) => void;
  districtsData?: District[];
}

export const MappedRationCards: React.FC<MappedRationCardsProps> = ({
  initialFpsId = "431003001",
  onFpsSelect,
  districtsData = [],
}) => {
  // Navigation / View modes
  const [viewMode, setViewMode] = useState<"lookup" | "hierarchy">("lookup");
  const [fpsInput, setFpsInput] = useState(initialFpsId);
  const [selectedFpsId, setSelectedFpsId] = useState(initialFpsId);

  // Key Register Hierarchy state
  const [selectedMonth, setSelectedMonth] = useState("3");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [districtsList, setDistrictsList] = useState<KeyRegDistrict[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [activeDistrict, setActiveDistrict] = useState<KeyRegDistrict | null>(null);
  const [afsoList, setAfsoList] = useState<KeyRegAfso[]>([]);
  const [loadingAfso, setLoadingAfso] = useState(false);
  const [activeAfso, setActiveAfso] = useState<KeyRegAfso | null>(null);
  const [fpsList, setFpsList] = useState<any[]>([]);
  const [loadingFpsList, setLoadingFpsList] = useState(false);

  // Mapped Cards Data for current FPS
  const [fpsData, setFpsData] = useState<FpsKeyRegSummary | null>(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Table filtering & pagination
  const [rcSearch, setRcSearch] = useState("");
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Quick suggestions based on districtsData
  const sampleFpsList = useMemo(() => {
    const list: Array<{ fps_code: string; fps_name: string; district: string }> = [];
    for (const d of districtsData) {
      for (const s of d.sub_districts || []) {
        for (const f of s.fps_list || []) {
          if (list.length < 8) {
            list.push({
              fps_code: f.fps_code,
              fps_name: f.fps_name,
              district: d.district_name,
            });
          }
        }
      }
    }
    return list;
  }, [districtsData]);

  // Handle copy text
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Sync when initialFpsId prop changes
  useEffect(() => {
    if (initialFpsId && initialFpsId !== selectedFpsId) {
      setSelectedFpsId(initialFpsId);
      setFpsInput(initialFpsId);
    }
  }, [initialFpsId]);

  // Fetch Mapped Ration Cards for selected FPS
  const fetchFpsCards = async (fpsId: string) => {
    if (!fpsId) return;
    setLoadingCards(true);
    setCardError(null);
    try {
      const res = await fetch(
        `/api/keyreg/fps-cards?fps_id=${encodeURIComponent(
          fpsId
        )}&month=${selectedMonth}&year=${selectedYear}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch cards for FPS ${fpsId}`);
      }
      const data: FpsKeyRegSummary = await res.json();
      setFpsData(data);
      setPage(1);
    } catch (err: any) {
      console.error("Error fetching FPS cards:", err);
      setCardError(err.message || "Failed to load mapped ration cards");
    } finally {
      setLoadingCards(false);
    }
  };

  // Trigger fetch when selectedFpsId changes
  useEffect(() => {
    if (selectedFpsId) {
      fetchFpsCards(selectedFpsId);
    }
  }, [selectedFpsId, selectedMonth, selectedYear]);

  // Fetch Key Register Districts
  const loadDistrictsAbstract = async () => {
    setLoadingDistricts(true);
    try {
      const res = await fetch(
        `/api/keyreg/districts?month=${selectedMonth}&year=${selectedYear}`
      );
      if (!res.ok) throw new Error("Failed to fetch districts key register");
      const json = await res.json();
      if (json.rep_code === "200" && Array.isArray(json.data)) {
        setDistrictsList(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Load districts on mount or when month/year changes if hierarchy tab is open
  useEffect(() => {
    if (viewMode === "hierarchy") {
      loadDistrictsAbstract();
    }
  }, [viewMode, selectedMonth, selectedYear]);

  // Select District in hierarchy
  const handleSelectDistrict = async (d: KeyRegDistrict) => {
    setActiveDistrict(d);
    setActiveAfso(null);
    setAfsoList([]);
    setFpsList([]);
    setLoadingAfso(true);
    try {
      const res = await fetch(
        `/api/keyreg/afso?dist_code=${d.dist_Code}&month=${selectedMonth}&year=${selectedYear}`
      );
      const json = await res.json();
      if (json.rep_code === "200" && Array.isArray(json.data)) {
        setAfsoList(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAfso(false);
    }
  };

  // Select AFSO in hierarchy
  const handleSelectAfso = async (a: KeyRegAfso) => {
    setActiveAfso(a);
    setFpsList([]);
    setLoadingFpsList(true);
    try {
      const res = await fetch(
        `/api/keyreg/fps?dist_code=${a.dist_Code}&afso_code=${a.afso_code}&month=${selectedMonth}&year=${selectedYear}`
      );
      const json = await res.json();
      if (json.rep_code === "200" && Array.isArray(json.data)) {
        setFpsList(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFpsList(false);
    }
  };

  // Filter cards by search & scheme
  const filteredCards = useMemo(() => {
    if (!fpsData || !fpsData.mapped_cards) return [];
    return fpsData.mapped_cards.filter((card) => {
      const matchesSearch =
        !rcSearch ||
        card.rc_id.toLowerCase().includes(rcSearch.toLowerCase()) ||
        (card.family_head &&
          card.family_head.toLowerCase().includes(rcSearch.toLowerCase())) ||
        (card.txn_id &&
          card.txn_id.toLowerCase().includes(rcSearch.toLowerCase()));

      const matchesScheme =
        selectedSchemeFilter === "ALL" ||
        card.scheme_short_name.toUpperCase() ===
          selectedSchemeFilter.toUpperCase();

      return matchesSearch && matchesScheme;
    });
  }, [fpsData, rcSearch, selectedSchemeFilter]);

  // Pagination slice
  const paginatedCards = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCards.slice(start, start + pageSize);
  }, [filteredCards, page, pageSize]);

  const totalPages = Math.ceil(filteredCards.length / pageSize) || 1;

  // Scheme style badge helper
  const getSchemeBadge = (scheme: string) => {
    const s = (scheme || "").toUpperCase();
    if (s.includes("AAY")) {
      return "bg-rose-950/80 text-rose-300 border-rose-800/80";
    }
    if (s.includes("PHH")) {
      return "bg-sky-950/80 text-sky-300 border-sky-800/80";
    }
    if (s.includes("APL")) {
      return "bg-amber-950/80 text-amber-300 border-amber-800/80";
    }
    if (s.includes("SAAY") || s.includes("SPHH")) {
      return "bg-purple-950/80 text-purple-300 border-purple-800/80";
    }
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  // Export filtered cards to client JSON
  const handleExportJson = () => {
    if (!fpsData) return;
    const blob = new Blob([JSON.stringify(fpsData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fps_${selectedFpsId}_mapped_ration_cards.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-xs">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Ration Card Number Mapped with FPS ID
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-950/90 text-emerald-300 rounded-full border border-emerald-800/80 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live ePDS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Query and audit all 12-digit Ration Cards mapped to any Fair Price Shop (FPS) with scheme allocations, family units, and commodity distribution.
              </p>
            </div>
          </div>

          {/* External portal link and view switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode("lookup")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMode === "lookup"
                    ? "bg-slate-800 text-blue-400 shadow-xs border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                FPS Quick Search
              </button>
              <button
                onClick={() => {
                  setViewMode("hierarchy");
                  loadDistrictsAbstract();
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMode === "hierarchy"
                    ? "bg-slate-800 text-blue-400 shadow-xs border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Key Register Abstract
              </button>
            </div>

            <a
              href="https://epos.cg.gov.in/KeyRegCards_Interface"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Official Chhattisgarh ePDS Portal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Official Portal</span>
            </a>
          </div>
        </div>

        {/* Lookup bar (when viewMode is lookup) */}
        {viewMode === "lookup" && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={fpsInput}
                  onChange={(e) => setFpsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && fpsInput.trim()) {
                      setSelectedFpsId(fpsInput.trim());
                      if (onFpsSelect) onFpsSelect(fpsInput.trim());
                    }
                  }}
                  placeholder="Enter 9-digit FPS Code (e.g., 431003001, 431003002, 441005001)..."
                  className="w-full pl-9 pr-24 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  onClick={() => {
                    if (fpsInput.trim()) {
                      setSelectedFpsId(fpsInput.trim());
                      if (onFpsSelect) onFpsSelect(fpsInput.trim());
                    }
                  }}
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Load Cards
                </button>
              </div>

              {/* Month/Year selectors */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
                  >
                    <option value="1" className="bg-slate-900 text-slate-100">January</option>
                    <option value="2" className="bg-slate-900 text-slate-100">February</option>
                    <option value="3" className="bg-slate-900 text-slate-100">March</option>
                    <option value="4" className="bg-slate-900 text-slate-100">April</option>
                    <option value="5" className="bg-slate-900 text-slate-100">May</option>
                    <option value="6" className="bg-slate-900 text-slate-100">June</option>
                    <option value="7" className="bg-slate-900 text-slate-100">July</option>
                    <option value="8" className="bg-slate-900 text-slate-100">August</option>
                    <option value="9" className="bg-slate-900 text-slate-100">September</option>
                    <option value="10" className="bg-slate-900 text-slate-100">October</option>
                    <option value="11" className="bg-slate-900 text-slate-100">November</option>
                    <option value="12" className="bg-slate-900 text-slate-100">December</option>
                  </select>
                  <span>/</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
                  >
                    <option value="2026" className="bg-slate-900 text-slate-100">2026</option>
                    <option value="2025" className="bg-slate-900 text-slate-100">2025</option>
                    <option value="2024" className="bg-slate-900 text-slate-100">2024</option>
                  </select>
                </div>

                <button
                  onClick={() => fetchFpsCards(selectedFpsId)}
                  disabled={loadingCards}
                  className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  title="Refresh Data"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loadingCards ? "animate-spin text-blue-400" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Quick Sample FPS Chips */}
            <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-400 flex-wrap">
              <span className="font-medium text-slate-300">Quick Samples:</span>
              {[
                { code: "431003001", name: "Bhushan Patel (Balod)" },
                { code: "431003002", name: "Dharmendra Patel (Balod)" },
                { code: "432003036", name: "Mina Dewangan (Arjunda)" },
                { code: "441005001", name: "Punitaram Yadav (Baloda Bazar)" },
              ].map((s) => (
                <button
                  key={s.code}
                  onClick={() => {
                    setFpsInput(s.code);
                    setSelectedFpsId(s.code);
                    if (onFpsSelect) onFpsSelect(s.code);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                    selectedFpsId === s.code
                      ? "bg-blue-950 border-blue-600 text-blue-300 font-bold"
                      : "bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300"
                  }`}
                >
                  {s.code} - {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Key Register Hierarchy View (When hierarchy mode selected) */}
      {viewMode === "hierarchy" && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Key Register Abstract Directory
              </span>
              <span className="text-[11px] text-slate-400">
                (Mirrors https://epos.cg.gov.in/KeyRegCards_Interface)
              </span>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => {
                  setActiveDistrict(null);
                  setActiveAfso(null);
                }}
                className={`font-semibold hover:underline cursor-pointer ${
                  !activeDistrict ? "text-blue-400 font-bold" : "text-slate-400"
                }`}
              >
                Chhattisgarh (All Districts)
              </button>
              {activeDistrict && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                  <button
                    onClick={() => setActiveAfso(null)}
                    className={`font-semibold hover:underline cursor-pointer ${
                      !activeAfso ? "text-blue-400 font-bold" : "text-slate-400"
                    }`}
                  >
                    {activeDistrict.dist_name_en}
                  </button>
                </>
              )}
              {activeAfso && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                  <span className="text-blue-400 font-bold">
                    {activeAfso.afso_name_en}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Level 1: Districts list */}
          {!activeDistrict && (
            <div>
              <div className="text-xs text-slate-400 mb-2">
                Select a district below to drill down to AFSO/Block level and view Fair Price Shops with mapped ration card statistics:
              </div>
              {loadingDistricts ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  Loading Key Register Districts from epos.cg.gov.in...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {districtsList.map((d) => (
                    <button
                      key={d.dist_Code}
                      onClick={() => handleSelectDistrict(d)}
                      className="text-left p-3 rounded-lg border border-slate-800 bg-slate-850 hover:border-blue-500 hover:bg-slate-800 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-200 group-hover:text-blue-300">
                          {d.dist_name_en}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1 rounded border border-slate-700">
                          {d.dist_Code}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{d.total_shops?.toLocaleString() || "—"} Shops</span>
                        <span className="font-bold text-slate-200">
                          {d.total_cards?.toLocaleString() || "—"} Cards
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Level 2: Sub-districts (AFSO) */}
          {activeDistrict && !activeAfso && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setActiveDistrict(null)}
                  className="text-xs font-semibold text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to All Districts
                </button>
                <div className="text-xs font-medium text-slate-300">
                  Sub-Districts in <span className="font-bold text-slate-100">{activeDistrict.dist_name_en}</span>
                </div>
              </div>

              {loadingAfso ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  Loading AFSO offices for {activeDistrict.dist_name_en}...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {afsoList.map((a) => (
                    <button
                      key={a.afso_code}
                      onClick={() => handleSelectAfso(a)}
                      className="text-left p-3 rounded-lg border border-slate-800 bg-slate-850 hover:border-indigo-500 hover:bg-slate-800 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-200 group-hover:text-indigo-300">
                          {a.afso_name_en}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1 rounded border border-slate-700">
                          {a.afso_code}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{a.total_shops?.toLocaleString() || "—"} Shops</span>
                        <span className="font-bold text-slate-200">
                          {a.total_cards?.toLocaleString() || "—"} Cards
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Level 3: Fair Price Shops list */}
          {activeDistrict && activeAfso && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setActiveAfso(null)}
                  className="text-xs font-semibold text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to AFSOs
                </button>
                <div className="text-xs font-medium text-slate-300">
                  Fair Price Shops in <span className="font-bold text-slate-100">{activeAfso.afso_name_en}</span> ({fpsList.length} shops)
                </div>
              </div>

              {loadingFpsList ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  Loading Fair Price Shops in {activeAfso.afso_name_en}...
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg max-h-[300px] overflow-y-auto">
                  {fpsList.map((fps) => (
                    <div
                      key={fps.fps_id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/60 bg-slate-850/50 text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-100 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                            {fps.fps_id}
                          </span>
                          <span className="font-semibold text-slate-200">
                            {fps.del_name || "Dealer Not Specified"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex gap-3">
                          <span>Total Cards: <strong className="text-slate-200">{fps.total_cards || 0}</strong></span>
                          <span>•</span>
                          <span>Total Units: <strong className="text-slate-200">{fps.total_units || 0}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedFpsId(fps.fps_id);
                          setFpsInput(fps.fps_id);
                          setViewMode("lookup");
                          if (onFpsSelect) onFpsSelect(fps.fps_id);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                      >
                        View Mapped Cards
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main FPS Card Details & Mapped Ration Cards View */}
      {loadingCards && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center shadow-md">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
          <div className="text-sm font-bold text-slate-100">
            Querying Mapped Ration Cards for FPS {selectedFpsId}...
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Resolving live records and Key Register data from Chhattisgarh ePDS portal...
          </div>
        </div>
      )}

      {!loadingCards && cardError && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-6 text-center text-xs text-rose-300">
          <div className="font-bold text-sm mb-1">Failed to load Ration Cards</div>
          <div>{cardError}</div>
          <button
            onClick={() => fetchFpsCards(selectedFpsId)}
            className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-semibold cursor-pointer transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {!loadingCards && fpsData && (
        <div className="space-y-4">
          {/* FPS Profile & Scheme Distribution Card */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              {/* Left Profile details */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold bg-blue-950/80 text-blue-300 border border-blue-800/80 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" /> FPS Code: {fpsData.fps_id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(fpsData.fps_id)}
                    className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
                    title="Copy FPS Code"
                  >
                    {copiedText === fpsData.fps_id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span className="text-slate-600">|</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    District: <strong className="text-slate-200">{fpsData.dist_name || "—"}</strong> ({fpsData.dist_code})
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    Sub-District / AFSO: <strong className="text-slate-200">{fpsData.afso_name || "—"}</strong> ({fpsData.afso_code})
                  </span>
                </div>

                <div className="text-lg font-bold text-slate-100">
                  {fpsData.del_name || "Fair Price Shop"}
                </div>
                <div className="text-xs text-slate-400">
                  {fpsData.heading || `Mapped Register for FPS ${fpsData.fps_id}`} • Source: {fpsData.source_note}
                </div>
              </div>

              {/* Action Buttons: CSV & JSON Export */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/keyreg/export-csv?fps_id=${fpsData.fps_id}&month=${selectedMonth}&year=${selectedYear}`}
                  download={`fps_${fpsData.fps_id}_mapped_ration_cards.csv`}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </a>

                <button
                  onClick={handleExportJson}
                  className="px-3 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-slate-850 border border-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  Total Mapped Cards
                </div>
                <div className="text-xl font-extrabold text-slate-100 mt-0.5">
                  {fpsData.total_cards.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Key Register Count</div>
              </div>

              <div className="bg-slate-850 border border-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  Total Family Units
                </div>
                <div className="text-xl font-extrabold text-blue-400 mt-0.5">
                  {fpsData.total_units.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Registered Members</div>
              </div>

              <div className="bg-slate-850 border border-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  Loaded Card Records
                </div>
                <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                  {fpsData.mapped_cards.length.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Individual 12-Digit RCs</div>
              </div>

              <div className="bg-slate-850 border border-slate-800 rounded-lg p-3">
                <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  ePDS Sync Status
                </div>
                <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-4 h-4" /> Live Verified
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">epos.cg.gov.in API</div>
              </div>
            </div>

            {/* Scheme Breakdown Chips */}
            {fpsData.schemes && fpsData.schemes.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Scheme-wise Mapped Distribution:
                </div>
                <div className="flex flex-wrap gap-2">
                  {fpsData.schemes.map((sch) => (
                    <div
                      key={sch.scheme_id + "-" + sch.scheme_short_name}
                      className={`px-2.5 py-1 rounded-md text-xs border flex items-center gap-2 ${getSchemeBadge(
                        sch.scheme_short_name
                      )}`}
                    >
                      <span className="font-bold">{sch.scheme_short_name}</span>
                      <span>•</span>
                      <span>
                        Cards: <strong>{sch.cards}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Units: <strong>{sch.units}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mapped Ration Cards Table Card */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-md">
            {/* Table Header & Search Filter Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-850/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Mapped Ration Cards Directory ({filteredCards.length} matching)
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-400">
                    Page size:
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="ml-1.5 bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-xs focus:outline-hidden"
                    >
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Filters row */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={rcSearch}
                    onChange={(e) => {
                      setRcSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search by 12-digit Ration Card Number, Txn ID, or beneficiary..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Scheme Filter Pills */}
                <div className="flex items-center gap-1 shrink-0 overflow-x-auto max-w-full pb-1 sm:pb-0">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3" /> Scheme:
                  </span>
                  {["ALL", "AAY", "PHH", "APL", "SAAY", "SPHH"].map((sc) => (
                    <button
                      key={sc}
                      onClick={() => {
                        setSelectedSchemeFilter(sc);
                        setPage(1);
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        selectedSchemeFilter === sc
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-950 border border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-850 text-slate-300 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 w-12 text-slate-500">#</th>
                    <th className="py-2.5 px-4">Ration Card Number (RC ID)</th>
                    <th className="py-2.5 px-4">Scheme</th>
                    <th className="py-2.5 px-4">Allocated Commodities</th>
                    <th className="py-2.5 px-4 text-center">Amount (₹)</th>
                    <th className="py-2.5 px-4">Date / Transaction Time</th>
                    <th className="py-2.5 px-4">Transaction ID</th>
                    <th className="py-2.5 px-3 w-16 text-center">Copy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedCards.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-1">
                          <p className="font-semibold text-slate-300">No Ration Cards found</p>
                          <p className="text-[11px] text-slate-500">
                            Try adjusting your search criteria or scheme filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedCards.map((card, idx) => {
                      const absoluteIndex = (page - 1) * pageSize + idx + 1;
                      const isCopied = copiedText === card.rc_id;

                      return (
                        <tr
                          key={card.rc_id + "-" + idx}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                            {absoluteIndex}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-xs">
                                {card.rc_id}
                              </span>
                              {card.source === "live_epos" && (
                                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 font-semibold px-1 rounded border border-emerald-800/80">
                                  Live
                                </span>
                              )}
                            </div>
                            {card.family_head && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {card.family_head}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getSchemeBadge(
                                card.scheme_short_name
                              )}`}
                            >
                              {card.scheme_short_name}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            {card.commodities && card.commodities.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {card.commodities.map((c, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono"
                                  >
                                    <ShoppingBag className="w-2.5 h-2.5 text-slate-400" />
                                    {c.name}: {c.qty} {c.unit || "kg"}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">
                                Standard entitlement
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-100">
                            ₹{card.amount ?? 0}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="text-xs text-slate-200">
                              {card.trans_date || "Current Cycle"}
                            </div>
                            {card.trans_time && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                Time: {card.trans_time}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {card.txn_id ? (
                              <span
                                className="font-mono text-[10px] text-slate-400 truncate max-w-[140px] block cursor-pointer hover:text-slate-200"
                                title={card.txn_id}
                                onClick={() => copyToClipboard(card.txn_id!)}
                              >
                                {card.txn_id.slice(0, 16)}...
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => copyToClipboard(card.rc_id)}
                              className="p-1 text-slate-400 hover:text-blue-400 rounded transition-colors cursor-pointer"
                              title="Copy Ration Card Number"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-850/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                Showing <strong className="text-slate-200">{paginatedCards.length}</strong> of{" "}
                <strong className="text-slate-200">{filteredCards.length}</strong> filtered cards
                (from <strong className="text-slate-200">{fpsData.mapped_cards.length}</strong> total mapped)
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="font-medium text-slate-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
