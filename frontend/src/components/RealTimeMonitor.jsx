import { useMemo } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import { MiniBar } from "./Charts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function TrendIcon({ value }) {
  if (value > 0.05) return <TrendingUp size={12} className="text-ok" />;
  if (value < -0.05) return <TrendingDown size={12} className="text-err" />;
  return <Minus size={12} className="text-txt-3" />;
}

function PairRow({ pair, onClick }) {
  const { manager_a, manager_b, correlation } = pair;
  const color = correlation > 0.6 ? "#ef4444" : correlation > 0.3 ? "#eab308" : "#10b981";
  return (
    <div onClick={() => onClick?.(pair)}
      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-bg-3 transition-colors cursor-pointer group">
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="text-[10px] text-txt-1 truncate">{manager_a}</span>
        <span className="text-[9px] text-txt-3">→</span>
        <span className="text-[10px] text-txt-1 truncate">{manager_b}</span>
      </div>
      <TrendIcon value={correlation - 0.5} />
      <span className="text-[11px] mono font-medium" style={{ color }}>{correlation.toFixed(3)}</span>
      <div className="w-16">
        <MiniBar value={correlation} max={1} color={color} height={3} />
      </div>
    </div>
  );
}

export default function RealTimeMonitor({ onPairClick }) {
  const { d: corrs, loading } = useData(() => api.correlations("equities"), [], { autoRefreshInterval: 30 });

  const { topPairs, stats } = useMemo(() => {
    if (!corrs || corrs.length === 0) return { topPairs: [], stats: null };
    const sorted = [...corrs].sort((a, b) => b.correlation - a.correlation);
    const vals = corrs.map(c => c.correlation);
    return {
      topPairs: sorted.slice(0, 5),
      stats: {
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
        max: Math.max(...vals),
        min: Math.min(...vals),
        high: vals.filter(v => v > 0.6).length,
        total: vals.length,
      },
    };
  }, [corrs]);

  if (loading) return null;

  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Real-Time Monitor</p>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse-soft" />
          <span className="text-[9px] text-ok">Live</span>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-2">
          {[
            { label: "Avg r", value: stats.avg.toFixed(3), color: "#0ea5a5" },
            { label: "Max", value: stats.max.toFixed(3), color: "#ef4444" },
            { label: "Min", value: stats.min.toFixed(3), color: "#10b981" },
            { label: "High", value: `${stats.high}/${stats.total}`, color: "#d946ef" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className="text-[12px] mono font-semibold" style={{ color }}>{value}</p>
              <p className="text-[8px] text-txt-3">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-0.5">
        <p className="text-[9px] text-txt-3 uppercase tracking-wider mb-1">Top Correlated</p>
        {topPairs.map((p, i) => (
          <PairRow key={i} pair={p} onClick={onPairClick} />
        ))}
      </div>
    </div>
  );
}
