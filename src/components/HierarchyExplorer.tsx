import React, { useState, useMemo } from "react";
import { District, SubDistrict, FpsItem } from "../types";
import { Search, ChevronRight, Copy, Check, Store, Building2, MapPin, Download, Filter, CreditCard } from "lucide-react";

interface HierarchyExplorerProps {
  districts: District[];
  onViewMappedCards?: (fpsCode: string) => void;
}

export const HierarchyExplorer: React.FC<HierarchyExplorerProps> = ({ districts, onViewMappedCards }) => {
  const [selectedDistCode, setSelectedDistCode] = useState<string>(districts[0]?.district_code || "");
  const [selectedAfsoCode, setSelectedAfsoCode] = useState<string>("");
  const [distSearch, setDistSearch] = useState("");
  const [afsoSearch, setAfsoSearch] = useState("");
  const [fpsSearch, setFpsSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Selected district
  const selectedDistrict = useMemo(() => {
    return districts.find((d) => d.district_code === selectedDistCode) || districts[0] || null;
  }, [districts, selectedDistCode]);

  // Ensure an AFSO is selected when district changes
  const currentAfsos = useMemo(() => {
    return selectedDistrict?.sub_districts || [];
  }, [selectedDistrict]);

  const activeAfso = useMemo(() => {
    if (!currentAfsos.length) return null;
    const found = currentAfsos.find((a) => a.sub_district_code === selectedAfsoCode);
    return found || currentAfsos[0];
  }, [currentAfsos, selectedAfsoCode]);

  // Filtered lists
  const filteredDistricts = useMemo(() => {
    if (!distSearch.trim()) return districts;
    const q = distSearch.toLowerCase();
    return districts.filter(
      (d) => d.district_name.toLowerCase().includes(q) || d.district_code.includes(q)
    );
  }, [districts, distSearch]);

  const filteredAfsos = useMemo(() => {
    if (!afsoSearch.trim()) return currentAfsos;
    const q = afsoSearch.toLowerCase();
    return currentAfsos.filter(
      (a) => a.sub_district_name.toLowerCase().includes(q) || a.sub_district_code.includes(q)
    );
  }, [currentAfsos, afsoSearch]);

  const filteredFpsList = useMemo(() => {
    const list = activeAfso?.fps_list || [];
    if (!fpsSearch.trim()) return list;
    const q = fpsSearch.toLowerCase();
    return list.filter(
      (f) => f.fps_code.toLowerCase().includes(q) || f.fps_name.toLowerCase().includes(q)
    );
  }, [activeAfso, fpsSearch]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const exportCurrentAfsoCsv = () => {
    if (!selectedDistrict || !activeAfso) return;
    const rows = [
      ["District Code", "District Name", "Sub-District Code", "Sub-District Name", "FPS Code", "Fair Price Shop / Dealer Name"],
      ...activeAfso.fps_list.map((f) => [
        selectedDistrict.district_code,
        selectedDistrict.district_name,
        activeAfso.sub_district_code,
        activeAfso.sub_district_name,
        f.fps_code,
        f.fps_name,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map((val) => `"${(val || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FPS_${selectedDistrict.district_name}_${activeAfso.sub_district_name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-190px)] min-h-[580px] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-md">
      {/* Current selection breadcrumb bar */}
      <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <span className="text-slate-400">Hierarchy:</span>
          <span className="bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded font-semibold border border-blue-800/70">
            {selectedDistrict ? `${selectedDistrict.district_name} [${selectedDistrict.district_code}]` : "Select District"}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded font-semibold border border-indigo-800/70">
            {activeAfso ? `${activeAfso.sub_district_name} [${activeAfso.sub_district_code}]` : "Select Sub-District"}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/70">
            {filteredFpsList.length} Shops Listed
          </span>
        </div>

        {activeAfso && activeAfso.fps_list.length > 0 && (
          <button
            onClick={exportCurrentAfsoCsv}
            className="inline-flex items-center gap-1 text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors cursor-pointer border border-slate-700"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span>Export Sub-District CSV</span>
          </button>
        )}
      </div>

      {/* 3-Column Drilldown Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
        {/* Column 1: Districts (3 cols) */}
        <div className="md:col-span-3 bg-slate-900 flex flex-col h-full overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-850/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                1. District ({filteredDistricts.length})
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={distSearch}
                onChange={(e) => setDistSearch(e.target.value)}
                placeholder="Search district name or code..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
            {filteredDistricts.map((d) => {
              const isSelected = selectedDistrict?.district_code === d.district_code;
              const totalFpsInDist = d.sub_districts.reduce((sum, s) => sum + s.fps_list.length, 0);
              return (
                <button
                  key={d.district_code}
                  onClick={() => {
                    setSelectedDistCode(d.district_code);
                    setSelectedAfsoCode("");
                  }}
                  className={`w-full text-left px-3 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    isSelected ? "bg-blue-950/60 text-blue-300 font-semibold border-l-4 border-blue-500" : "hover:bg-slate-800/60 text-slate-300"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate font-medium">{d.district_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Code: {d.district_code}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono border border-slate-700">
                      {d.sub_districts.length} AFSO
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 font-mono border border-emerald-800/60">
                      {totalFpsInDist} FPS
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-blue-400" : "text-slate-600"}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Sub-Districts / AFSO (3 cols) */}
        <div className="md:col-span-3 bg-slate-900 flex flex-col h-full overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-850/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                2. Sub-District ({filteredAfsos.length})
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={afsoSearch}
                onChange={(e) => setAfsoSearch(e.target.value)}
                placeholder="Search sub-district..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
            {filteredAfsos.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No sub-districts found</div>
            ) : (
              filteredAfsos.map((a) => {
                const isSelected = activeAfso?.sub_district_code === a.sub_district_code;
                return (
                  <button
                    key={a.sub_district_code}
                    onClick={() => setSelectedAfsoCode(a.sub_district_code)}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected ? "bg-indigo-950/60 text-indigo-300 font-semibold border-l-4 border-indigo-500" : "hover:bg-slate-800/60 text-slate-300"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-medium">{a.sub_district_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Code: {a.sub_district_code}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 font-mono font-bold border border-emerald-800/60">
                        {a.fps_list.length} FPS
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-400" : "text-slate-600"}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Fair Price Shops (6 cols) */}
        <div className="md:col-span-6 bg-slate-950 flex flex-col h-full overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                3. Fair Price Shops in {activeAfso?.sub_district_name} ({filteredFpsList.length})
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={fpsSearch}
                onChange={(e) => setFpsSearch(e.target.value)}
                placeholder="Search FPS by code or dealer name..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredFpsList.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 rounded-lg border border-slate-800 text-slate-400 text-xs">
                {activeAfso ? "No FPS shops found matching your search." : "Select a District and Sub-District to view Fair Price Shops."}
              </div>
            ) : (
              filteredFpsList.map((fps, index) => (
                <div
                  key={fps.fps_code + "-" + index}
                  className="bg-slate-900 p-3 rounded-lg border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850/60 transition-all flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        FPS Code: {fps.fps_code}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200 break-words">
                      {fps.fps_name || "Dealer Name Not Specified"}
                    </div>
                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3">
                      <span>District: {selectedDistrict?.district_name} ({selectedDistrict?.district_code})</span>
                      <span>•</span>
                      <span>Sub-District: {activeAfso?.sub_district_name} ({activeAfso?.sub_district_code})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onViewMappedCards && (
                      <button
                        onClick={() => onViewMappedCards(fps.fps_code)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-blue-950/80 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-800/80 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                        title="View Mapped Ration Cards"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Ration Cards</span>
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(fps.fps_code)}
                      title="Copy FPS Code"
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    >
                      {copiedCode === fps.fps_code ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
