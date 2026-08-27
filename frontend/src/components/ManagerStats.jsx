import { useMemo } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import { MiniBar } from "./Charts";
import { Users, AlertTriangle } from "lucide-react";

export default function ManagerStats() {
  const { d: data, loading } = useData(() => api.managerStats(), [], { autoRefreshInterval: 60 });

  const sorted = useMemo(() => {
    if (!data?.managers) return [];
    return [...data.managers].sort((a, b) => b.avg - a.avg);
  }, [data]);

  if (loading) return null;

  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Manager Stats</p>
        <Users size={12} className="text-txt-3" />
      </div>
      <div className="space-y-1">
        {sorted.map(m => {
          const outlierPct = m.count > 0 ? (m.outliers / m.count) * 100 : 0;
          return (
            <div key={m.manager_id} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-bg-3 transition-colors">
              <div className="w-5 h-5 rounded bg-accent/10 flex items-center justify-center text-accent text-[7px] mono font-bold">
                {m.manager_id.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-txt-1 truncate capitalize">{m.manager_id.replace(/_/g, " ")}</p>
                <p className="text-[8px] text-txt-3">{m.count} points • avg {m.avg.toFixed(1)}</p>
              </div>
              <div className="flex items-center gap-1">
                {m.outliers > 0 && (
                  <span className="flex items-center gap-0.5 text-[8px] text-warn">
                    <AlertTriangle size={8} />
                    {m.outliers}
                  </span>
                )}
                <div className="w-12">
                  <MiniBar value={m.avg} max={100} color={m.avg > 55 ? "#ef4444" : m.avg < 45 ? "#10b981" : "#0ea5a5"} height={3} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
