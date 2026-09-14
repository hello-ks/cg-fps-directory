import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { HierarchyExplorer } from "./components/HierarchyExplorer";
import { MasterTable } from "./components/MasterTable";
import { F12Modal } from "./components/F12Modal";
import { District, DirectorySummary } from "./types";
import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

export default function App() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [summary, setSummary] = useState<DirectorySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"hierarchy" | "table">("hierarchy");
  const [isF12Open, setIsF12Open] = useState<boolean>(false);

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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <Header
        summary={summary}
        onOpenF12={() => setIsF12Open(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[450px] bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <h3 className="text-base font-bold text-slate-800">Loading Chhattisgarh ePDS Directory...</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md text-center">
              Fetching complete hierarchy: 33 Districts, 335 Sub-Districts, and 22,746 Fair Price Shops.
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-red-800 mb-1">Data Load Error</h3>
            <p className="text-xs text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "hierarchy" ? (
              <HierarchyExplorer districts={districts} />
            ) : (
              <MasterTable districts={districts} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> 22,746 FPS Verified
            </span>
            <span>•</span>
            <span>Food, Civil Supplies &amp; Consumer Protection Dept, Chhattisgarh</span>
          </div>
          <div>
            Official Portal:{" "}
            <a
              href="https://epos.cg.gov.in/FPS_Trans_Abstract"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              epos.cg.gov.in
            </a>
          </div>
        </div>
      </footer>

      {/* F12 Guide & Reverse Engineering Modal */}
      <F12Modal isOpen={isF12Open} onClose={() => setIsF12Open(false)} />
    </div>
  );
}
