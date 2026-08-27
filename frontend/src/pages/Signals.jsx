import { useState, useMemo } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import ErrorBoundary from "../components/ErrorBoundary";
import { AreaChart } from "../components/Charts";
import { TrendingUp, TrendingDown, Minus, Search, ArrowUpDown } from "lucide-react";

const SIGNAL_COLORS = { equities: "#0ea5a5", fixed_income: "#06b6d4", commodities: "#8b5cf6" };

export default function Signals() {
  const [manager, setManager] = useState("");
  const [signal, setSignal] = useState("equities");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("z_score");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedManager, setSelectedManager] = useState(null);

  const { d: managers } = useData(() => api.managers(), []);
  const { d: latest, loading } = useData(() => api.signalsLatest(), []);
  const { d: history } = useData(
    () => api.signalHistory(selectedManager, signal, 90),
    [selectedManager, signal],
    { enabled: !!selectedManager }
  );

  const managerList = managers?.managers ?? [];
  const signals = ["equities", "fixed_income", "commodities"];

  const filtered = useMemo(() => {
    if (!latest) return [];
    let result = [...latest];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => r.manager_id.includes(q) || r.signal_id.includes(q));
    }
    result.sort((a, b) => {
      const mul = sortDir === "desc" ? -1 : 1;
      if (sortBy === "z_score") return mul * (a.z_score - b.z_score);
      if (sortBy === "value") return mul * (a.value - b.value);
      if (sortBy === "manager") return mul * a.manager_id.localeCompare(b.manager_id);
      return mul * a.signal_id.localeCompare(b.signal_id);
    });
    return result;
  }, [latest, sortBy, sortDir, search]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const zColor = (z) => Math.abs(z) > 2 ? "#ef4444" : Math.abs(z) > 1 ? "#eab308" : "#0ea5a5";
  const zPill = (z) => Math.abs(z) > 2 ? "pill-red" : Math.abs(z) > 1 ? "pill-yellow" : "pill-green";
  const zLabel = (z) => Math.abs(z) > 2 ? "EXTREME" : Math.abs(z) > 1 ? "ELEVATED" : "NORMAL";

  return (
    <ErrorBoundary>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-txt-1">Signals</h1>
            <p className="text-[11px] text-txt-3">Live indicator values and historical trends for each manager</p>
          </div>
        </div>

        <div className="card p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">History</span>
              <select value={selectedManager || ""} onChange={(e) => setSelectedManager(e.target.value || null)}
                className="bg-bg-3 border border-border rounded-md px-2.5 py-1.5 text-[11px] text-txt-1 focus:outline-none focus:ring-1 focus:ring-accent">
                <option value="">Select a manager</option>
                {managerList.map(m => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
              </select>
              <div className="flex items-center gap-1">
                {signals.map(s => (
                  <button key={s} onClick={() => setSignal(s)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors
                      ${signal === s ? "text-white" : "text-txt-3 hover:text-txt-2 bg-bg-3"}`}
                    style={signal === s ? { background: SIGNAL_COLORS[s] } : {}}>
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-txt-3" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter..."
                className="w-36 bg-bg-3 border border-border rounded-md pl-7 pr-2 py-1.5 text-[11px] text-txt-1 placeholder-txt-3 focus:outline-none focus:ring-1 focus:ring-accent" />
            </div>
          </div>

          {selectedManager && (
            <div className="rounded-md p-2" style={{ background: "#0a0a12" }}>
              {history && history.length > 0 ? (
                <AreaChart data={history} yKeys={["value"]} colors={[SIGNAL_COLORS[signal]]} height={160} />
              ) : (
                <p className="text-[11px] text-txt-3 text-center py-6">No history data</p>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-txt-3 text-[12px]">
            <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
            Loading...
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-3/50">
                  {[
                    { key: "manager", label: "Manager" },
                    { key: "signal", label: "Signal" },
                    { key: "value", label: "Value" },
                    { key: "z_score", label: "Z-Score" },
                    { key: "date", label: "Date" },
                  ].map(({ key, label }) => (
                    <th key={key} onClick={() => key !== "date" && handleSort(key)}
                      className={`px-3 py-2 text-left text-[10px] font-medium text-txt-3 uppercase tracking-wider ${key !== "date" ? "cursor-pointer hover:text-txt-2 select-none" : ""}`}>
                      <div className="flex items-center gap-1">
                        {label}
                        {key !== "date" && <ArrowUpDown size={8} className={sortBy === key ? "text-accent" : "opacity-30"} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={`${r.manager_id}-${r.signal_id}`}
                    onClick={() => setSelectedManager(r.manager_id)}
                    className="border-b border-border/30 hover:bg-bg-3/30 transition-colors cursor-pointer">
                    <td className="px-3 py-2">
                      <span className="text-[11px] text-txt-1 capitalize">{r.manager_id.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: SIGNAL_COLORS[r.signal_id] }} />
                        <span className="text-[10px] text-txt-2">{r.signal_id.replace("_", " ")}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[12px] mono font-medium text-txt-1">{r.value.toFixed(1)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`pill ${zPill(r.z_score)}`}>
                        {r.z_score > 0 ? "+" : ""}{r.z_score.toFixed(2)}σ
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[9px] text-txt-3">{r.date?.split("T")[0]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-8 text-center text-[11px] text-txt-3">No signals match your filter</div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
