import { useState, useMemo } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import ErrorBoundary from "../components/ErrorBoundary";
import { AreaChart } from "../components/Charts";
import { BarChart3, ArrowLeftRight } from "lucide-react";

const SIGNALS = ["equities", "fixed_income", "commodities"];
const SIGNAL_COLORS = { equities: "#0ea5a5", fixed_income: "#06b6d4", commodities: "#8b5cf6" };

function computeCorrelation(dataA, dataB) {
  const n = Math.min(dataA.length, dataB.length);
  if (n < 2) return 0;
  const a = dataA.slice(0, n).map(d => d.value);
  const b = dataB.slice(0, n).map(d => d.value);
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  return num / Math.sqrt(denA * denB) || 0;
}

function statBlock(data) {
  if (!data || data.length === 0) return null;
  const vals = data.map(d => d.value);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length;
  return {
    avg, std: Math.sqrt(variance), min: Math.min(...vals), max: Math.max(...vals),
    outliers: data.filter(d => Math.abs(d.z_score) > 2).length,
    count: data.length,
    trend: vals[vals.length - 1] - vals[0],
  };
}

function StatCard({ label, value, sub }) {
  return (
    <div className="text-center p-2 bg-bg-3 rounded-md">
      <p className="text-[14px] mono font-semibold text-txt-1">{value}</p>
      <p className="text-[9px] text-txt-3">{label}</p>
      {sub && <p className="text-[8px] text-txt-3 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Compare() {
  const [managerA, setManagerA] = useState("");
  const [managerB, setManagerB] = useState("");
  const [signal, setSignal] = useState("equities");

  const { d: managers } = useData(() => api.managers(), []);
  const managerList = managers?.managers ?? [];

  const shouldFetch = managerA && managerB && managerA !== managerB;
  const { d: dataA } = useData(
    () => api.signalHistory(managerA, signal, 90),
    [managerA, signal],
    { enabled: shouldFetch }
  );
  const { d: dataB } = useData(
    () => api.signalHistory(managerB, signal, 90),
    [managerB, signal],
    { enabled: shouldFetch }
  );

  const merged = useMemo(() => {
    if (!dataA || !dataB) return [];
    const bMap = Object.fromEntries(dataB.map(d => [d.date, d.value]));
    return dataA.map(a => ({
      date: a.date,
      [managerA]: a.value,
      [managerB]: bMap[a.date] ?? null,
    })).filter(d => d[managerB] !== null);
  }, [dataA, dataB, managerA, managerB]);

  const crossCorr = useMemo(() => {
    if (!dataA || !dataB) return 0;
    return computeCorrelation(dataA, dataB);
  }, [dataA, dataB]);

  const statsA = statBlock(dataA);
  const statsB = statBlock(dataB);

  return (
    <ErrorBoundary>
      <div className="p-3 md:p-4 space-y-3">
        <div>
          <h1 className="text-base font-semibold text-txt-1">Compare Managers</h1>
          <p className="text-[11px] text-txt-3">Side-by-side signal overlay and statistics</p>
        </div>

        <div className="card p-3 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={managerA} onChange={(e) => setManagerA(e.target.value)}
              className="bg-bg-3 border border-border rounded-md px-3 py-1.5 text-[11px] text-txt-1 focus:outline-none focus:ring-1 focus:ring-accent min-w-[140px]">
              <option value="">Manager A</option>
              {managerList.map(m => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
            </select>
            <button onClick={() => { const t = managerA; setManagerA(managerB); setManagerB(t); }}
              className="p-1.5 rounded-md hover:bg-bg-3 transition-colors text-txt-3 hover:text-accent">
              <ArrowLeftRight size={14} />
            </button>
            <select value={managerB} onChange={(e) => setManagerB(e.target.value)}
              className="bg-bg-3 border border-border rounded-md px-3 py-1.5 text-[11px] text-txt-1 focus:outline-none focus:ring-1 focus:ring-accent min-w-[140px]">
              <option value="">Manager B</option>
              {managerList.filter(m => m !== managerA).map(m => (
                <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
              ))}
            </select>
            <div className="flex items-center gap-1 ml-2">
              {SIGNALS.map(s => (
                <button key={s} onClick={() => setSignal(s)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors
                    ${signal === s ? "text-white" : "text-txt-3 hover:text-txt-2 bg-bg-3"}`}
                  style={signal === s ? { background: SIGNAL_COLORS[s] } : {}}>
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {!shouldFetch && (
            <div className="text-center py-12">
              <BarChart3 size={32} className="text-txt-3 mx-auto mb-3 opacity-50" />
              <p className="text-[12px] text-txt-3">Select two managers to compare their signals</p>
            </div>
          )}

          {shouldFetch && merged.length === 0 && (
            <p className="text-[11px] text-txt-3 text-center py-8">No overlapping data for this pair</p>
          )}

          {merged.length > 0 && (
            <div className="space-y-3">
              <div className="rounded-lg p-2" style={{ background: "#0a0a12" }}>
                <AreaChart
                  data={merged}
                  yKeys={[managerA, managerB]}
                  colors={[SIGNAL_COLORS[signal], "#d946ef"]}
                  height={220}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ManagerStats name={managerA} stats={statsA} color={SIGNAL_COLORS[signal]} />
                <ManagerStats name={managerB} stats={statsB} color="#d946ef" />
              </div>

              {statsA && statsB && (
                <div className="card p-3 space-y-2">
                  <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Cross-Correlation</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Correlation" value={crossCorr.toFixed(3)}
                      sub={crossCorr > 0.6 ? "Strong" : crossCorr > 0.3 ? "Moderate" : "Weak"} />
                    <StatCard label="Avg Gap" value={Math.abs(statsA.avg - statsB.avg).toFixed(2)} sub="signal difference" />
                    <StatCard label="Std Ratio" value={(statsA.std / (statsB.std || 1)).toFixed(2)} sub="volatility ratio" />
                    <StatCard label="Shared Outliers" value={Math.min(statsA.outliers, statsB.outliers)} sub="both managers" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

function ManagerStats({ name, stats, color }) {
  if (!stats) return null;
  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
        <p className="text-[11px] text-txt-1 capitalize font-medium">{name.replace(/_/g, " ")}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Avg", value: stats.avg.toFixed(1) },
          { label: "Std", value: stats.std.toFixed(2) },
          { label: "Outliers", value: stats.outliers },
          { label: "Min", value: stats.min.toFixed(1) },
          { label: "Max", value: stats.max.toFixed(1) },
          { label: "Trend", value: `${stats.trend > 0 ? "+" : ""}${stats.trend.toFixed(1)}` },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-[12px] mono font-medium text-txt-1">{value}</p>
            <p className="text-[8px] text-txt-3">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
