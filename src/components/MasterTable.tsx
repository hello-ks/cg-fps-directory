import React, { useState, useEffect, useMemo } from "react";
import { Search, Download, Copy, Check, Filter, ChevronLeft, ChevronRight, ArrowUpDown, CreditCard } from "lucide-react";
import { District, FlatFpsRecord } from "../types";

interface MasterTableProps {
  districts: District[];
  onViewMappedCards?: (fpsCode: string) => void;
}

export const MasterTable: React.FC<MasterTableProps> = ({ districts, onViewMappedCards }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<"district_name" | "sub_district_name" | "fps_code" | "fps_name">("fps_code");
  const [sortAsc, setSortAsc] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Available sub-districts based on selected district
  const availableSubDistricts = useMemo(() => {
    if (!selectedDistrict) return [];
    const dist = districts.find((d) => d.district_code === selectedDistrict);
    return dist ? dist.sub_districts : [];
  }, [districts, selectedDistrict]);

  // Flatten all FPS items
  const allRecords = useMemo(() => {
    const list: FlatFpsRecord[] = [];
    for (const d of districts) {
      for (const s of d.sub_districts) {
        for (const f of s.fps_list) {
          list.push({
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
    return list;
  }, [districts]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let result = allRecords;

    if (selectedDistrict) {
      result = result.filter((r) => r.district_code === selectedDistrict);
    }

    if (selectedSubDistrict) {
      result = result.filter((r) => r.sub_district_code === selectedSubDistrict);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.fps_code.toLowerCase().includes(q) ||
          r.fps_name.toLowerCase().includes(q) ||
          r.district_name.toLowerCase().includes(q) ||
          r.sub_district_name.toLowerCase().includes(q) ||
          r.district_code.includes(q) ||
          r.sub_district_code.includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      const valA = (a[sortField] || "").toLowerCase();
      const valB = (b[sortField] || "").toLowerCase();
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    return result;
  }, [allRecords, selectedDistrict, selectedSubDistrict, searchTerm, sortField, sortAsc]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedDistrict, selectedSubDistrict, pageSize]);

  // Paginated items
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const toggleSort = (field: "district_name" | "sub_district_name" | "fps_code" | "fps_name") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const exportFilteredCsv = () => {
    const rows = [
      ["District Code", "District Name", "Sub-District Code", "Sub-District Name", "FPS Code", "Fair Price Shop / Dealer Name"],
      ...filteredRecords.map((r) => [
        r.district_code,
        r.district_name,
        r.sub_district_code,
        r.sub_district_name,
        r.fps_code,
        r.fps_name,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map((val) => `"${(val || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chhattisgarh_fps_filtered_${filteredRecords.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md flex flex-col overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-850/80 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Global search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by FPS Code (e.g. 432003036), Dealer Name, Sub-District or District..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* District dropdown filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedSubDistrict("");
              }}
              className="text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Districts (33)</option>
              {districts.map((d) => (
                <option key={d.district_code} value={d.district_code}>
                  {d.district_name} ({d.district_code})
                </option>
              ))}
            </select>

            {/* Sub-district dropdown filter */}
            <select
              value={selectedSubDistrict}
              onChange={(e) => setSelectedSubDistrict(e.target.value)}
              disabled={!selectedDistrict}
              className="text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-medium disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Sub-Districts</option>
              {availableSubDistricts.map((s) => (
                <option key={s.sub_district_code} value={s.sub_district_code}>
                  {s.sub_district_name} ({s.sub_district_code})
                </option>
              ))}
            </select>

            <button
              onClick={exportFilteredCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Download currently filtered records as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV ({filteredRecords.length.toLocaleString()})</span>
            </button>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div>
            Showing <span className="font-bold text-slate-100">{filteredRecords.length.toLocaleString()}</span> of{" "}
            <span className="font-bold text-slate-100">{allRecords.length.toLocaleString()}</span> total Fair Price Shops
            {searchTerm && ` for query "${searchTerm}"`}
          </div>

          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-0.5"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-850 text-slate-300 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-4 w-12 text-slate-500">#</th>
              <th
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => toggleSort("district_name")}
              >
                <div className="flex items-center gap-1">
                  <span>District [Code]</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => toggleSort("sub_district_name")}
              >
                <div className="flex items-center gap-1">
                  <span>Sub-District (AFSO) [Code]</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => toggleSort("fps_code")}
              >
                <div className="flex items-center gap-1">
                  <span>FPS Code</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => toggleSort("fps_name")}
              >
                <div className="flex items-center gap-1">
                  <span>Fair Price Shop / Dealer Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-2.5 px-4 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No matching Fair Price Shops found. Try adjusting your search or filters.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r, index) => {
                const globalIndex = (page - 1) * pageSize + index + 1;
                return (
                  <tr key={`${r.fps_code}-${globalIndex}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 font-mono">{globalIndex}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-slate-200">{r.district_name}</span>{" "}
                      <span className="text-slate-500 font-mono text-[10px]">[{r.district_code}]</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-medium text-slate-300">{r.sub_district_name}</span>{" "}
                      <span className="text-slate-500 font-mono text-[10px]">[{r.sub_district_code}]</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-400 bg-blue-950/50 rounded border border-blue-900/40">
                      {r.fps_code}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-100 max-w-md truncate" title={r.fps_name}>
                      {r.fps_name || "—"}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onViewMappedCards && (
                          <button
                            onClick={() => onViewMappedCards(r.fps_code)}
                            title="View Mapped Ration Cards"
                            className="px-2 py-1 text-[11px] font-semibold bg-blue-950/80 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-800/80 rounded transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Cards</span>
                          </button>
                        )}
                        <button
                          onClick={() => copyToClipboard(r.fps_code)}
                          title="Copy FPS Code"
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        >
                          {copiedCode === r.fps_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-850/90 flex items-center justify-between text-xs">
        <div className="text-slate-400">
          Page <span className="font-bold text-slate-100">{page}</span> of{" "}
          <span className="font-bold text-slate-100">{totalPages}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 border border-slate-700 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-slate-300 font-medium">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 border border-slate-700 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
