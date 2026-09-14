import React, { useState } from "react";
import { Terminal, X, Copy, Check, ExternalLink, Play, Server } from "lucide-react";

interface F12ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const F12Modal: React.FC<F12ModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [liveDistCode, setLiveDistCode] = useState("646");
  const [liveAfsoCode, setLiveAfsoCode] = useState("802012");
  const [liveResponse, setLiveResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const runLiveTest = async (type: "districts" | "afso" | "fps") => {
    setLoading(true);
    setLiveResponse("");
    try {
      let url = "";
      if (type === "districts") {
        url = "/api/live/districts";
      } else if (type === "afso") {
        url = `/api/live/sub-districts?dist_code=${liveDistCode}`;
      } else {
        url = `/api/live/fps?dist_code=${liveDistCode}&afso_code=${liveAfsoCode}`;
      }
      const res = await fetch(url);
      const data = await res.text();
      setLiveResponse(data.trim());
    } catch (e: any) {
      setLiveResponse(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Step 1: Open Chrome / Edge DevTools (F12)",
      desc: "Navigate to https://epos.cg.gov.in/FPS_Trans_Abstract and press F12. Open the Network tab and filter by Fetch/XHR.",
      curl: `curl -k -s "https://epos.cg.gov.in/Epos_Spring/Common/getDistricts" \\
  -H "Referer: https://epos.cg.gov.in/FPS_Trans_Abstract" \\
  -H "User-Agent: Mozilla/5.0"`,
      returns: "<option value='646'>BALOD</option><option value='644'>BALODABAZAR</option>... (All 33 Districts)",
    },
    {
      title: "Step 2: Inspect Sub-District (AFSO) AJAX Call",
      desc: "Selecting any District triggers an asynchronous GET request to getAfso with dist_code.",
      curl: `curl -k -s "https://epos.cg.gov.in/Epos_Spring/Common/getAfso?dist_code=646" \\
  -H "Referer: https://epos.cg.gov.in/FPS_Trans_Abstract" \\
  -H "User-Agent: Mozilla/5.0"`,
      returns: "<option value='802012'>ARJUNDA</option><option value='802015'>BALOD</option>... (Sub-Districts in Balod)",
    },
    {
      title: "Step 3: Inspect Fair Price Shop (FPS) AJAX Call",
      desc: "Selecting a Sub-District triggers getFPSs with dist_code and afso_code. Notice the value is the FPS code and label contains the Dealer Name.",
      curl: `curl -k -s "https://epos.cg.gov.in/Epos_Spring/Common/getFPSs?dist_code=646&afso_code=802012" \\
  -H "Referer: https://epos.cg.gov.in/FPS_Trans_Abstract" \\
  -H "User-Agent: Mozilla/5.0"`,
      returns: "<option value='432003036'>432003036(SHRI MATI MINA DEWANGAN)</option><option value='491021037'>491021037(LALITA NISHAD)</option>",
    },
  ];

  return (
    <div id="f12-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div id="f12-modal-content" className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">F12 Network Inspection & Reverse-Engineering Guide</h2>
              <p className="text-xs text-slate-500">How data is requested on https://epos.cg.gov.in/FPS_Trans_Abstract</p>
            </div>
          </div>
          <button
            id="close-f12-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Architecture overview */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-emerald-600" />
              SMART-PDS Architecture Overview
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              The ePDS Chhattisgarh portal runs a React Single-Page Application (SPA) client backed by a Spring Boot
              backend (<code>/Epos_Spring/</code>). When selecting cascading dropdowns for <strong>District &gt; Sub-District &gt; FPS</strong>,
              the frontend triggers parameterized AJAX calls returning server-rendered HTML <code>&lt;option&gt;</code> tags.
            </p>
          </div>

          {/* Network Steps */}
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-slate-800">{step.title}</h4>
                  <button
                    onClick={() => copyCode(step.curl, idx)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedIndex === idx ? "Copied" : "Copy cURL"}
                  </button>
                </div>
                <p className="text-xs text-slate-600 mb-2">{step.desc}</p>
                <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-md overflow-x-auto whitespace-pre mb-2">
                  {step.curl}
                </div>
                <div className="bg-slate-100 p-2.5 rounded text-xs text-slate-700 font-mono">
                  <span className="text-slate-500 font-sans font-semibold">Response: </span>
                  {step.returns}
                </div>
              </div>
            ))}
          </div>

          {/* Live Request Tester */}
          <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Play className="w-4 h-4 text-blue-600" />
              Live Endpoint Test Playground
            </h4>
            <p className="text-xs text-slate-600 mb-3">
              Trigger live requests directly to the ePDS Spring endpoints through our backend proxy:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">District Code</label>
                <input
                  type="text"
                  value={liveDistCode}
                  onChange={(e) => setLiveDistCode(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="e.g. 646"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-District Code</label>
                <input
                  type="text"
                  value={liveAfsoCode}
                  onChange={(e) => setLiveAfsoCode(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="e.g. 802012"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => runLiveTest("districts")}
                  disabled={loading}
                  className="flex-1 px-2 py-1.5 text-xs font-medium bg-slate-800 text-white rounded hover:bg-slate-900 disabled:opacity-50 cursor-pointer"
                >
                  Fetch Districts
                </button>
                <button
                  onClick={() => runLiveTest("afso")}
                  disabled={loading}
                  className="flex-1 px-2 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  Fetch AFSO
                </button>
                <button
                  onClick={() => runLiveTest("fps")}
                  disabled={loading}
                  className="flex-1 px-2 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  Fetch FPS
                </button>
              </div>
            </div>

            {loading && (
              <div className="text-xs text-blue-600 font-medium py-2">
                Connecting to epos.cg.gov.in...
              </div>
            )}

            {liveResponse && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-slate-600 mb-1">Live Raw Response from Server:</div>
                <pre className="bg-slate-900 text-emerald-300 font-mono text-xs p-3 rounded max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
                  {liveResponse}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
          <a
            href="https://epos.cg.gov.in/FPS_Trans_Abstract"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Open Official Portal <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
