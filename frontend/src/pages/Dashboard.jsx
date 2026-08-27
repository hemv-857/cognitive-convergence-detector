import { useState } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import ErrorBoundary from "../components/ErrorBoundary";
import HeatmapMini from "../components/HeatmapMini";
import NetworkGraph from "../components/NetworkGraph";
import AlertTimeline from "../components/AlertTimeline";
import RealTimeMonitor from "../components/RealTimeMonitor";
import ManagerStats from "../components/ManagerStats";
import { MiniBar, Gauge } from "../components/Charts";
import useWidgetConfig from "../hooks/useWidgetConfig";
import { Activity, TrendingUp, AlertTriangle, RefreshCw, Download, Star, Settings, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";

function StatsRow() {
  const { d, loading, error, refreshing, reload } = useData(() => api.summary(), [], { autoRefreshInterval: 30 });
  const { d: corrs } = useData(() => api.correlations("equities"), []);

  if (loading) return <div className="flex gap-2">{[1,2,3,4].map(i => <div key={i} className="card p-3 animate-pulse bg-bg-3 h-16 flex-1" />)}</div>;
  if (error) return <div className="card p-3 border border-err/20 text-err text-[11px]">{error} <button onClick={reload} className="underline">retry</button></div>;

  const stats = [
    { label: "Signals", value: d.total_signals, icon: Activity, color: "#0ea5a5" },
    { label: "Alerts", value: d.total_alerts, icon: AlertTriangle, color: "#d946ef" },
    { label: "Managers", value: d.total_managers, icon: Star, color: "#06b6d4" },
    { label: "Pairs", value: corrs?.length ?? 0, icon: TrendingUp, color: "#10b981" },
  ];

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card p-3 flex-1 min-w-[140px] flex items-center gap-2.5 group hover:ring-1 hover:ring-border transition-all">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `${color}10` }}>
            <Icon size={14} style={{ color }} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-txt-1 mono">{value?.toLocaleString()}</p>
            <p className="text-[10px] text-txt-3 uppercase tracking-wider">{label}</p>
          </div>
        </div>
      ))}
      <button onClick={reload} disabled={refreshing}
        className="p-2 rounded-md text-txt-3 hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
        title="Refresh stats">
        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
      </button>
    </div>
  );
}

function CorrelationStats({ correlations }) {
  if (!correlations || correlations.length === 0) return null;
  const vals = correlations.map(c => c.correlation);
  const high = vals.filter(v => v > 0.6).length;
  const med = vals.filter(v => v > 0.3 && v <= 0.6).length;
  const low = vals.filter(v => v <= 0.3).length;
  const total = vals.length;
  const avg = vals.reduce((a, b) => a + b, 0) / total;

  return (
    <div className="card p-3 space-y-2">
      <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Correlation Distribution</p>
      <div className="flex items-center gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="pill pill-red w-3 h-3" />
            <span className="text-[10px] text-txt-3 flex-1">High (&gt;0.6)</span>
            <span className="text-[10px] mono text-txt-2">{high}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="pill pill-yellow w-3 h-3" />
            <span className="text-[10px] text-txt-3 flex-1">Medium (0.3-0.6)</span>
            <span className="text-[10px] mono text-txt-2">{med}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="pill pill-green w-3 h-3" />
            <span className="text-[10px] text-txt-3 flex-1">Low (&lt;0.3)</span>
            <span className="text-[10px] mono text-txt-2">{low}</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[18px] font-bold text-txt-1 mono">{avg.toFixed(3)}</p>
          <p className="text-[9px] text-txt-3 uppercase">Avg r</p>
        </div>
      </div>
    </div>
  );
}

function TopPairs({ correlations }) {
  if (!correlations || correlations.length === 0) return null;
  const sorted = [...correlations].sort((a, b) => b.correlation - a.correlation).slice(0, 5);

  return (
    <div className="card p-3 space-y-2">
      <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Top Correlated Pairs</p>
      <div className="space-y-1.5">
        {sorted.map((c, i) => (
          <div key={i} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-bg-3 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-txt-1 truncate">
                <span className="text-accent">{c.manager_a}</span>
                {" → "}
                <span className="text-accent">{c.manager_b}</span>
              </p>
              <p className="text-[9px] text-txt-3">{c.asset_class}</p>
            </div>
            <div className="text-right">
              <p className={`text-[11px] mono font-medium ${c.correlation > 0.6 ? "text-err" : c.correlation > 0.3 ? "text-warn" : "text-ok"}`}>
                {c.correlation.toFixed(3)}
              </p>
              {c.p_value != null && (
                <p className="text-[8px] text-txt-3 mono">p={c.p_value.toFixed(4)}</p>
              )}
            </div>
            <div className="w-12">
              <MiniBar value={c.correlation * 100} max={100} color={c.correlation > 0.6 ? "#ef4444" : c.correlation > 0.3 ? "#eab308" : "#10b981"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentAlerts() {
  const { d: alerts } = useData(() => api.alerts(null, 10), []);
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="card p-3 space-y-2">
      <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Recent Alerts</p>
      <div className="space-y-1">
        {alerts.slice(0, 5).map(a => (
          <div key={a.id} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-bg-3 transition-colors">
            <span className={`pill ${a.severity === "critical" ? "pill-red" : a.severity === "high" ? "pill-yellow" : "pill-green"}`}>
              {a.severity[0].toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-txt-1 truncate">{a.message}</p>
              <p className="text-[9px] text-txt-3">{a.manager_a} → {a.manager_b}</p>
            </div>
            <span className="text-[9px] mono text-txt-3">{new Date(a.created_at).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConvergenceGauge({ data }) {
  const severity = data?.severity_index ?? 0;
  const label = severity > 80 ? "CRITICAL" : severity > 60 ? "HIGH" : severity > 40 ? "ELEVATED" : "NORMAL";
  const color = severity > 80 ? "#ef4444" : severity > 60 ? "#eab308" : severity > 40 ? "#0ea5a5" : "#10b981";

  return (
    <div className="card p-3 flex items-center gap-4">
      <Gauge value={severity} max={100} size={90} thickness={8} color={color} label="CONVERGENCE" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="pill" style={{ background: `${color}20`, color }}>{label}</span>
          <span className="text-[10px] text-txt-3">{data?.asset_class}</span>
        </div>
        <p className="text-[11px] text-txt-3">
          {severity > 60
            ? `${data?.pair_correlations?.length ?? 0} pairs detected — elevated correlation risk`
            : "Market signals within normal correlation range"}
        </p>
        {data?.alerts_today?.length > 0 && (
          <p className="text-[9px] text-txt-3">{data.alerts_today.length} alert{data.alerts_today.length > 1 ? "s" : ""} triggered today</p>
        )}
      </div>
    </div>
  );
}

function CustomizeModal({ widgets, toggle, moveUp, moveDown, reset, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-bg-1 border border-border rounded-lg shadow-2xl w-full max-w-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[12px] font-medium text-txt-1">Customize Dashboard</span>
            <button onClick={onClose} className="text-[10px] text-txt-3 hover:text-accent">Close</button>
          </div>
          <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
            {widgets.map((w, i) => (
              <div key={w.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-bg-3 transition-colors">
                <button onClick={() => toggle(w.id)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${w.visible ? "bg-accent" : "bg-bg-3 border border-border"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${w.visible ? "left-4" : "left-0.5"}`} />
                </button>
                <span className={`text-[11px] flex-1 ${w.visible ? "text-txt-1" : "text-txt-3"}`}>{w.label}</span>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => moveUp(w.id)} disabled={i === 0}
                    className="p-0.5 rounded text-txt-3 hover:text-accent disabled:opacity-30"><ChevronUp size={10} /></button>
                  <button onClick={() => moveDown(w.id)} disabled={i === widgets.length - 1}
                    className="p-0.5 rounded text-txt-3 hover:text-accent disabled:opacity-30"><ChevronDown size={10} /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-border flex justify-between">
            <button onClick={reset} className="flex items-center gap-1 text-[10px] text-txt-3 hover:text-accent transition-colors">
              <RotateCcw size={9} /> Reset defaults
            </button>
            <button onClick={onClose} className="px-3 py-1 rounded-md text-[10px] bg-accent text-white hover:bg-accent/90 transition-colors">
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { d: conv } = useData(() => api.convergence("equities"), []);
  const { d: corrs } = useData(() => api.correlations("equities"), []);
  const { widgets, visible, toggle, moveUp, moveDown, reset } = useWidgetConfig();
  const [customizeOpen, setCustomizeOpen] = useState(false);

  return (
    <ErrorBoundary>
      <div className="p-3 md:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-txt-1">Dashboard</h1>
            <p className="text-[11px] text-txt-3">Institutional trading signal convergence</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => api.exportCorrelations("equities", "csv")}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-txt-3 hover:text-accent hover:bg-accent/10 transition-colors">
              <Download size={10} /> <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button onClick={() => setCustomizeOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-txt-3 hover:text-accent hover:bg-accent/10 transition-colors">
              <Settings size={10} /> <span className="hidden sm:inline">Customize</span>
            </button>
          </div>
        </div>

        {visible.has("stats") && <StatsRow />}
        {visible.has("gauge") && <ConvergenceGauge data={conv} />}

        {(visible.has("heatmap") || visible.has("correlation_stats") || visible.has("alert_timeline") || visible.has("network")) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-3">
              {visible.has("heatmap") && <HeatmapMini correlations={corrs} />}
              {visible.has("correlation_stats") && <CorrelationStats correlations={corrs} />}
            </div>
            <div className="space-y-3">
              {visible.has("alert_timeline") && <AlertTimeline alerts={conv?.alerts_today} />}
              {visible.has("network") && <NetworkGraph correlations={corrs} />}
            </div>
          </div>
        )}

        {(visible.has("top_pairs") || visible.has("recent_alerts") || visible.has("manager_stats")) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {visible.has("top_pairs") && <TopPairs correlations={corrs} />}
            {visible.has("recent_alerts") && <RecentAlerts />}
            {visible.has("manager_stats") && <ManagerStats />}
          </div>
        )}

        {visible.has("realtime") && <RealTimeMonitor />}

        {customizeOpen && (
          <CustomizeModal widgets={widgets} toggle={toggle} moveUp={moveUp} moveDown={moveDown} reset={reset} onClose={() => setCustomizeOpen(false)} />
        )}
      </div>
    </ErrorBoundary>
  );
}
