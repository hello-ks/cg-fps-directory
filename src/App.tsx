import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { HierarchyExplorer } from "./components/HierarchyExplorer";
import { MasterTable } from "./components/MasterTable";
import { MappedRationCards } from "./components/MappedRationCards";
import { F12Modal } from "./components/F12Modal";
import { District, DirectorySummary } from "./types";
import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

export default function App() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [summary, setSummary] = useState<DirectorySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"hierarchy" | "table" | "cards">("cards");
  const [selectedFpsId, setSelectedFpsId] = useState<string>("431003001");
  const [isF12Open, setIsF12Open] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("cg_epds_theme");
    return saved !== null ? saved === "dark" : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("cg_epds_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("cg_epds_theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, dataRes] = await Promise.all([
        fetch("/api/summary"),
        fetch("/api/dataset"),
      ]);

      if (!sumRes.ok || !dataRes.ok) {
        throw new Error("Failed to load ePDS directory data from server.");
      }

      const sumJson = await sumRes.json();
      const dataJson = await dataRes.json();

      setSummary(sumJson);
      setDistricts(dataJson.districts || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewMappedCards = (fpsCode: string) => {
    setSelectedFpsId(fpsCode);
    setActiveTab("cards");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        summary={summary}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[450px] bg-slate-900 rounded-xl border border-slate-800 p-8 shadow-md">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <h3 className="text-base font-bold text-slate-100">Loading Chhattisgarh ePDS Directory &amp; Mapped Ration Cards...</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md text-center">
              Fetching complete hierarchy: 33 Districts, 335 Sub-Districts, 22,746 Fair Price Shops, and Key Register endpoints.
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-6 text-center max-w-lg mx-auto my-12">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-rose-300 mb-1">Data Load Error</h3>
            <p className="text-xs text-rose-400 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-500 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "cards" ? (
              <MappedRationCards
                initialFpsId={selectedFpsId}
                onFpsSelect={(id) => setSelectedFpsId(id)}
                districtsData={districts}
              />
            ) : activeTab === "hierarchy" ? (
              <HierarchyExplorer
                districts={districts}
                onViewMappedCards={handleViewMappedCards}
              />
            ) : (
              <MasterTable
                districts={districts}
                onViewMappedCards={handleViewMappedCards}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> 22,746 FPS Verified
            </span>
            <span>•</span>
            <span>Key Register &amp; Mapped Ration Cards Sync</span>
            <span>•</span>
            <span>Food, Civil Supplies &amp; Consumer Protection Dept, Chhattisgarh</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://epos.cg.gov.in/KeyRegCards_Interface"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors"
            >
              KeyRegCards_Interface
            </a>
            <span>•</span>
            <a
              href="https://epos.cg.gov.in/FPS_Trans_Abstract"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 hover:underline transition-colors"
            >
              FPS_Trans_Abstract
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
