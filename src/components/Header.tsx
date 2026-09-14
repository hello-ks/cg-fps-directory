import React from "react";
import { Download, Building2, MapPin, Store, Database, ExternalLink, CreditCard, Moon, Sun } from "lucide-react";
import { DirectorySummary } from "../types";

interface HeaderProps {
  summary: DirectorySummary | null;
  onOpenF12?: () => void;
  activeTab: "hierarchy" | "table" | "cards";
  setActiveTab: (tab: "hierarchy" | "table" | "cards") => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  activeTab,
  setActiveTab,
  isDark = true,
  onToggleTheme,
}) => {
  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-30 shadow-md backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-800/80">
                Chhattisgarh ePDS
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                Sources:
                <a
                  href="https://epos.cg.gov.in/KeyRegCards_Interface"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5 font-medium transition-colors"
                >
                  KeyRegCards_Interface <ExternalLink className="w-3 h-3" />
                </a>
                <span>&bull;</span>
                <a
                  href="https://epos.cg.gov.in/FPS_Trans_Abstract"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-200 hover:underline flex items-center gap-0.5 transition-colors"
                >
                  FPS_Trans_Abstract
                </a>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mt-1">
              Chhattisgarh Fair Price Shops &amp; Ration Cards Directory
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete Fair Price Shop (FPS) registry with mapped Ration Card numbers, family units, and scheme distribution
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              </button>
            )}

            <a
              id="download-csv-btn"
              href="/api/export/csv"
              download="chhattisgarh_epos_fps_list.csv"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download FPS CSV</span>
            </a>

            <a
              id="download-json-btn"
              href="/api/export/json"
              download="chhattisgarh_epos_fps_data.json"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4 text-slate-400" />
              <span>JSON</span>
            </a>
          </div>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2.5 p-2.5 bg-slate-850 rounded-lg border border-slate-800">
            <div className="p-1.5 bg-blue-950/80 text-blue-400 border border-blue-800/60 rounded-md">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Districts</div>
              <div className="text-sm font-bold text-slate-100">
                {summary ? summary.total_districts : 33}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 bg-slate-850 rounded-lg border border-slate-800">
            <div className="p-1.5 bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 rounded-md">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Sub-Districts (AFSOs)</div>
              <div className="text-sm font-bold text-slate-100">
                {summary ? summary.total_sub_districts : 335}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 bg-slate-850 rounded-lg border border-slate-800">
            <div className="p-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-md">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Fair Price Shops</div>
              <div className="text-sm font-bold text-emerald-400">
                {summary ? summary.total_fps.toLocaleString() : "22,746"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 bg-slate-850 rounded-lg border border-slate-800">
            <div className="p-1.5 bg-purple-950/80 text-purple-400 border border-purple-800/60 rounded-md">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Ration Cards Mapping</div>
              <div className="text-sm font-bold text-purple-400">
                Live ePDS Sync
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-4 mt-2 -mb-px overflow-x-auto">
          <button
            id="tab-cards-btn"
            onClick={() => setActiveTab("cards")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "cards"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Mapped Ration Cards (Key Register)</span>
            <span className="px-1.5 py-0.2 bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold rounded-full">
              Live
            </span>
          </button>
          <button
            id="tab-hierarchy-btn"
            onClick={() => setActiveTab("hierarchy")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "hierarchy"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Cascading Hierarchy Explorer
          </button>
          <button
            id="tab-table-btn"
            onClick={() => setActiveTab("table")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "table"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Master Search &amp; Data Table
          </button>
        </div>
      </div>
    </header>
  );
};
