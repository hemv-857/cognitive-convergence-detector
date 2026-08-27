import { useState, useMemo } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import ErrorBoundary from "../components/ErrorBoundary";
import { ArrowUpDown, Download, CheckCheck } from "lucide-react";

const SEV = { critical: { cls: "pill-red", order: 0 }, high: { cls: "pill-yellow", order: 1 }, warning: { cls: "pill-green", order: 2 } };

export default function Alerts() {
  const [filter, setFilter] = useState(null);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [grouped, setGrouped] = useState(false);
  const { d: alerts, loading, reloading, reload } = useData(() => api.alerts(null, 200), [filter], { autoRefreshInterval: 15 });
  const [acked, setAcked] = useState(new Set());
  const [selected, setSelected] = useState(new Set());

  const handleAck = async (id) => {
    try {
      await api.acknowledgeAlert(id);
      setAcked(p => new Set([...p, id]));
    } catch {}
  };

  const handleBulkAck = async () => {
    const ids = [...selected].filter(id => !acked.has(id));
    for (const id of ids) {
      try { await api.acknowledgeAlert(id); } catch {}
    }
    setAcked(p => new Set([...p, ...ids]));
    setSelected(new Set());
  };

  const toggleSelect = (id) => {
    setSelected(p => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allVisible = filtered.map(a => a.id);
    if (selected.size === allVisible.length) setSelected(new Set());
    else setSelected(new Set(allVisible));
  };

  const sorted = useMemo(() => {
    const list = [...(alerts || [])].map(a => ({
      ...a,
      acknowledged: acked.has(a.id) || a.acknowledged,
    }));
    list.sort((a, b) => {
      if (sortBy === "severity") return (SEV[a.severity]?.order ?? 3) - (SEV[b.severity]?.order ?? 3);
      if (sortBy === "correlation") return (b.correlation ?? 0) - (a.correlation ?? 0);
      if (sortBy === "z_score") return (b.z_score ?? 0) - (a.z_score ?? 0);
      const da = new Date(a.created_at);
      const db = new Date(b.created_at);
      return sortDir === "desc" ? db - da : da - db;
    });
    return list;
  }, [alerts, sortBy, sortDir, acked]);

  const filtered = useMemo(() => {
    if (!filter) return sorted;
    return sorted.filter(a => a.severity === filter);
  }, [sorted, filter]);

  const grouped2 = useMemo(() => {
    if (!grouped) return null;
    const groups = {};
    filtered.forEach(a => {
      const key = `${a.manager_a}-${a.manager_b}`;
      if (!groups[key]) groups[key] = { pair: key, alerts: [], maxSev: a.severity };
      groups[key].alerts.push(a);
    });
    return Object.values(groups).sort((a, b) => (SEV[a.maxSev]?.order ?? 3) - (SEV[b.maxSev]?.order ?? 3));
  }, [filtered, grouped]);

  const counts = { all: alerts?.length ?? 0, critical: 0, high: 0, warning: 0 };
  (alerts || []).forEach(a => { if (counts[a.severity] !== undefined) counts[a.severity]++; });

  const unackedCount = filtered.filter(a => !a.acknowledged).length;
  const selectedUnacked = [...selected].filter(id => !acked.has(id)).length;

  return (
    <ErrorBoundary>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-txt-1">Alert Feed</h1>
            <p className="text-[11px] text-txt-3">{counts.all} alerts — {unackedCount} unacknowledged</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedUnacked > 0 && (
              <button onClick={handleBulkAck}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-accent text-white hover:bg-accent/90 transition-colors">
                <CheckCheck size={10} /> Ack ({selectedUnacked})
              </button>
            )}
            <button onClick={() => setGrouped(p => !p)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors
                ${grouped ? "bg-accent/15 text-accent" : "text-txt-3 hover:text-txt-2 hover:bg-bg-3"}`}>
              {grouped ? "Ungroup" : "Group by Pair"}
            </button>
            <button onClick={() => api.exportAlerts(filter, "csv")}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-txt-3 hover:text-accent hover:bg-accent/10 transition-colors">
              <Download size={10} /> Export
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[null, "critical", "high", "warning"].map(f => (
            <button key={f ?? "all"} onClick={() => { setFilter(f); setSelected(new Set()); }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5
                ${filter === f ? "bg-accent/15 text-accent" : "text-txt-3 hover:text-txt-2 hover:bg-bg-3"}`}>
              {f ?? "All"}
              <span className="mono text-[9px] opacity-60">{f ? counts[f] ?? 0 : counts.all}</span>
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            {["created_at", "severity", "correlation", "z_score"].map(s => (
              <button key={s} onClick={() => { setSortBy(s); setSortDir(d => d === "desc" ? "asc" : "desc"); }}
                className={`px-2 py-1 rounded text-[9px] font-medium transition-colors flex items-center gap-1
                  ${sortBy === s ? "bg-accent/15 text-accent" : "text-txt-3 hover:text-txt-2 bg-bg-3"}`}>
                {s.replace("_", " ")}
                {sortBy === s && <ArrowUpDown size={8} />}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-txt-3 text-[12px]">
            <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card py-12 text-center text-[12px] text-txt-3">No alerts found</div>
        ) : grouped2 ? (
          <div className="space-y-2">
            {grouped2.map((g, i) => (
              <div key={i} className="card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`pill ${SEV[g.maxSev]?.cls}`}>{g.alerts.length}</span>
                    <span className="text-[11px] text-txt-1 capitalize">{g.pair.replace(/-/g, " ↔ ").replace(/_/g, " ")}</span>
                  </div>
                </div>
                <div className="space-y-1 pl-4 border-l-2 border-border">
                  {g.alerts.map(a => (
                    <AlertRow key={a.id} alert={a} onAck={handleAck} selected={selected.has(a.id)} onSelect={toggleSelect} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-2 py-1">
              <button onClick={toggleSelectAll}
                className="w-4 h-4 rounded border border-border hover:border-accent transition-colors flex items-center justify-center text-[8px] text-accent">
                {selected.size === filtered.length && filtered.length > 0 ? "✓" : ""}
              </button>
              <span className="text-[9px] text-txt-3">Select all</span>
            </div>
            {filtered.map(a => (
              <AlertRow key={a.id} alert={a} onAck={handleAck} selected={selected.has(a.id)} onSelect={toggleSelect} />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function AlertRow({ alert: a, onAck, selected, onSelect }) {
  return (
    <div className={`card card-hover p-2.5 flex items-center gap-2.5 ${a.acknowledged ? "opacity-40" : ""}`}>
      <button onClick={() => onSelect?.(a.id)}
        className={`w-4 h-4 rounded border shrink-0 transition-colors flex items-center justify-center text-[8px]
          ${selected ? "bg-accent border-accent text-white" : "border-border hover:border-accent text-transparent"}`}>
        {selected ? "✓" : ""}
      </button>
      <span className={`pill ${SEV[a.severity]?.cls ?? "pill-blue"}`}>{a.severity[0].toUpperCase()}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-txt-1 truncate">{a.message}</p>
        <div className="flex items-center gap-2.5 mt-0.5 text-[9px] mono text-txt-3">
          {a.manager_a && <span>{a.manager_a} ↔ {a.manager_b}</span>}
          {a.asset_class && <span>{a.asset_class}</span>}
          {a.correlation != null && <span>r={a.correlation.toFixed(3)}</span>}
          {a.z_score != null && <span>z={a.z_score.toFixed(2)}</span>}
        </div>
      </div>
      <span className="text-[9px] mono text-txt-3 whitespace-nowrap">
        {new Date(a.created_at).toLocaleString()}
      </span>
      {!a.acknowledged ? (
        <button onClick={() => onAck(a.id)}
          className="text-[10px] text-accent hover:underline transition-colors">
          Ack
        </button>
      ) : (
        <span className="text-[10px] text-ok">✓</span>
      )}
    </div>
  );
}
