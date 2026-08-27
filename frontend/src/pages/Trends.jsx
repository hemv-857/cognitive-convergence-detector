import { useState, useMemo } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import ErrorBoundary from "../components/ErrorBoundary";
import { AreaChart, CorrelationBar } from "../components/Charts";
import DataTable from "../components/DataTable";
import { Download, ArrowUpDown } from "lucide-react";

export default function Trends() {
  const [managerA, setManagerA] = useState("");
  const [managerB, setManagerB] = useState("");
  const [sortDir, setSortDir] = useState("desc");

  const { d: managers } = useData(() => api.managers(), []);
  const { d: baselines, loading: bLoading } = useData(() => api.baselines(), []);

  const managerList = managers?.managers ?? [];

  const shouldFetchHistory = managerA !== "" && managerB !== "" && managerA !== managerB;
  const { d: history, loading: hLoading } = useData(
    () => api.correlationsHistory(managerA, managerB, 90),
    [managerA, managerB],
    { enabled: shouldFetchHistory }
  );

  const sorted = useMemo(() => {
    return [...(baselines || [])].sort((a, b) => {
      return sortDir === "desc"
        ? (b.baseline_mean ?? 0) - (a.baseline_mean ?? 0)
        : (a.baseline_mean ?? 0) - (b.baseline_mean ?? 0);
    });
  }, [baselines, sortDir]);

  const columns = [
    { key: "manager_a", label: "A", render: (v) => <span className="capitalize">{v?.replace(/_/g, " ")}</span> },
    { key: "manager_b", label: "B", render: (v) => <span className="capitalize">{v?.replace(/_/g, " ")}</span> },
    { key: "asset_class", label: "Class" },
    { key: "baseline_mean", label: "Mean", render: (v) => <span className="mono">{v?.toFixed(4)}</span> },
    { key: "baseline_std", label: "Std Dev", render: (v) => <span className="mono">{v?.toFixed(4)}</span> },
    { key: "baseline_mean", label: "Status", render: (v) => (
      <span className={`pill ${v > 0.6 ? "pill-red" : v > 0.3 ? "pill-yellow" : "pill-green"}`}>
        {v > 0.6 ? "HIGH" : v > 0.3 ? "MED" : "LOW"}
      </span>
    )},
  ];

  return (
    <ErrorBoundary>
      <div className="p-3 md:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-txt-1">Trend Analysis</h1>
            <p className="text-[11px] text-txt-3">Rolling correlations, baselines, and historical trends</p>
          </div>
          <button onClick={() => api.exportCorrelations("equities", "csv")}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-txt-3 hover:text-accent hover:bg-accent/10 transition-colors">
            <Download size={10} /> <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        <div className="card p-3 space-y-3">
          <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Correlation History</p>
          <div className="flex flex-wrap items-center gap-2">
            <select value={managerA} onChange={(e) => setManagerA(e.target.value)}
              className="bg-bg-3 border border-border rounded-md px-2.5 py-1.5 text-[11px] text-txt-1 focus:outline-none focus:ring-1 focus:ring-accent">
              <option value="">Select Manager A</option>
              {managerList.map(m => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
            </select>
            <span className="text-[13px] text-accent font-bold">↔</span>
            <select value={managerB} onChange={(e) => setManagerB(e.target.value)}
              className="bg-bg-3 border border-border rounded-md px-2.5 py-1.5 text-[11px] text-txt-1 focus:outline-none focus:ring-1 focus:ring-accent">
              <option value="">Select Manager B</option>
              {managerList.filter(m => m !== managerA).map(m => (
                <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {shouldFetchHistory && (
            <div className="space-y-3">
              {hLoading ? (
                <div className="flex items-center justify-center h-32 text-txt-3 text-[11px]">
                  <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
                  Loading history...
                </div>
              ) : history && history.length > 0 ? (
                <>
                  <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                    <AreaChart data={history} yKeys={["correlation"]} colors={["#0ea5a5"]} height={200} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Latest", value: history[history.length - 1]?.correlation?.toFixed(3) ?? "N/A" },
                      { label: "Mean", value: (history.reduce((s, h) => s + h.correlation, 0) / history.length).toFixed(3) },
                      { label: "Min", value: Math.min(...history.map(h => h.correlation)).toFixed(3) },
                      { label: "Max", value: Math.max(...history.map(h => h.correlation)).toFixed(3) },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center p-2 bg-bg-3 rounded-md">
                        <p className="text-[14px] mono font-semibold text-txt-1">{value}</p>
                        <p className="text-[9px] text-txt-3">{label}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-txt-3 text-center py-6">No correlation history available for this pair</p>
              )}
            </div>
          )}

          {!shouldFetchHistory && (
            <div className="text-center py-8">
              <p className="text-[11px] text-txt-3">Select two managers above to view their correlation history</p>
            </div>
          )}
        </div>

        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Baseline Correlations ({sorted.length} pairs)</p>
            <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              className="flex items-center gap-1 text-[9px] text-txt-3 hover:text-accent transition-colors">
              <ArrowUpDown size={9} />
              {sortDir === "desc" ? "Highest first" : "Lowest first"}
            </button>
          </div>

          {bLoading ? (
            <div className="flex items-center justify-center h-24 text-txt-3 text-[11px]">
              <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <>
              <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
                {sorted.slice(0, 15).map((b, i) => (
                  <CorrelationBar
                    key={`${b.manager_a}-${b.manager_b}-${b.asset_class}`}
                    value={b.baseline_mean}
                    label={`${b.manager_a} ↔ ${b.manager_b}`}
                  />
                ))}
              </div>
              <DataTable columns={columns} data={sorted} pageSize={10} searchPlaceholder="Search pairs..." />
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
