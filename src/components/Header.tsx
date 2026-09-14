import React from "react";
import { Download, Terminal, Building2, MapPin, Store, Database, ExternalLink } from "lucide-react";
import { DirectorySummary } from "../types";

interface HeaderProps {
  summary: DirectorySummary | null;
  onOpenF12: () => void;
  activeTab: "hierarchy" | "table";
  setActiveTab: (tab: "hierarchy" | "table") => void;
}

export const Header: React.FC<HeaderProps> = ({ summary, onOpenF12, activeTab, setActiveTab }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                Chhattisgarh ePDS
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                Source:
                <a
                  href="https://epos.cg.gov.in/FPS_Trans_Abstract"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  epos.cg.gov.in/FPS_Trans_Abstract <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              District &gt; Sub-District &gt; FPS Directory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete Fair Price Shop (FPS) registry with official codes and dealer names
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="f12-guide-btn"
              onClick={onOpenF12}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-blue-600" />
              <span>F12 Network Guide</span>
            </button>

            <a
              id="download-csv-btn"
              href="/api/export/csv"
              download="chhattisgarh_epos_fps_list.csv"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV (22,746 FPS)</span>
            </a>

            <a
              id="download-json-btn"
              href="/api/export/json"
              download="chhattisgarh_epos_fps_data.json"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4 text-slate-500" />
              <span>JSON</span>
            </a>
          </div>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Districts</div>
              <div className="text-sm font-bold text-slate-900">
                {summary ? summary.total_districts : 33}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Sub-Districts (AFSOs)</div>
              <div className="text-sm font-bold text-slate-900">
                {summary ? summary.total_sub_districts : 335}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Fair Price Shops</div>
              <div className="text-sm font-bold text-emerald-700">
                {summary ? summary.total_fps.toLocaleString() : "22,746"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="p-1.5 bg-purple-100 text-purple-700 rounded-md">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Status</div>
              <div className="text-sm font-bold text-slate-800">
                100% Extracted
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-4 mt-2 -mb-px">
          <button
            id="tab-hierarchy-btn"
            onClick={() => setActiveTab("hierarchy")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "hierarchy"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Cascading Hierarchy Explorer
          </button>
          <button
            id="tab-table-btn"
            onClick={() => setActiveTab("table")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "table"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Master Search &amp; Data Table
          </button>
        </div>
      </div>
    </header>
  );
};
