import { useState } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import { useFavorites } from "../components/Favorites";
import ErrorBoundary from "../components/ErrorBoundary";
import Sparkline from "../components/Sparkline";
import { AreaChart, MiniBar } from "../components/Charts";
import DataTable from "../components/DataTable";
import { Star, ArrowLeft, Activity, TrendingUp, AlertTriangle } from "lucide-react";

const SIGNALS = ["equities", "fixed_income", "commodities"];
const SIGNAL_COLORS = { equities: "#0ea5a5", fixed_income: "#06b6d4", commodities: "#8b5cf6" };

export default function Managers() {
  const { d, loading } = useData(() => api.managers(), []);
  const [selected, setSelected] = useState(null);
  const [activeSignal, setActiveSignal] = useState("equities");
  const [showFavOnly, setShowFavOnly] = useState(false);
  const { favorites, toggle, isFav } = useFavorites();

  if (loading) return <Loading />;

  const managers = d?.managers ?? [];
  const display = showFavOnly ? managers.filter(m => isFav(m)) : managers;

  if (selected) {
    return <ManagerDetail managerId={selected} onBack={() => setSelected(null)} activeSignal={activeSignal} setActiveSignal={setActiveSignal} />;
  }

  return (
    <ErrorBoundary>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-txt-1">Tracked Managers</h1>
            <p className="text-[11px] text-txt-3">{managers.length} institutional managers</p>
          </div>
          <button onClick={() => setShowFavOnly(p => !p)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors
              ${showFavOnly ? "bg-accent/15 text-accent" : "text-txt-3 hover:text-txt-2 hover:bg-bg-3"}`}>
            <Star size={10} fill={showFavOnly ? "currentColor" : "none"} />
            {showFavOnly ? `Favorites (${favorites.length})` : "Show Favorites"}
          </button>
        </div>

        {display.length === 0 && showFavOnly ? (
          <div className="card py-8 text-center text-[12px] text-txt-3">
            No favorites yet. Star managers to pin them here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {display.map(m => {
              const fav = isFav(m);
              return (
                <div key={m} className="card card-hover transition-all">
                  <div className="w-full p-3 text-left flex items-center gap-2.5">
                    <button onClick={(e) => { e.stopPropagation(); toggle(m); }}
                      className="shrink-0 p-0.5 rounded hover:bg-bg-3 transition-colors">
                      <Star size={12} className={fav ? "text-accent" : "text-txt-3"} fill={fav ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => setSelected(m)}
                      className="flex-1 flex items-center gap-2.5 text-left">
                      <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center text-accent text-[11px] mono font-bold">
                        {m.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-txt-1 capitalize font-medium">{m.replace(/_/g, " ")}</p>
                        <p className="text-[10px] text-txt-3">{SIGNALS.length} asset classes</p>
                      </div>
                      <Activity size={12} className="text-txt-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function ManagerDetail({ managerId, onBack, activeSignal, setActiveSignal }) {
  const { d: signalData } = useData(() => api.signalHistory(managerId, activeSignal, 90), [managerId, activeSignal]);
  const { d: summary } = useData(() => api.summary(), []);

  const columns = [
    { key: "date", label: "Date", render: (v) => new Date(v).toLocaleDateString() },
    { key: "value", label: "Value", render: (v) => <span className="mono">{v?.toFixed(2)}</span> },
    { key: "z_score", label: "Z-Score", render: (v) => (
      <span className={`mono ${Math.abs(v) > 2 ? "text-err" : Math.abs(v) > 1 ? "text-warn" : "text-txt-2"}`}>
        {v?.toFixed(3)}
      </span>
    )},
    { key: "z_score", label: "Status", render: (v) => (
      <span className={`pill ${Math.abs(v) > 2 ? "pill-red" : Math.abs(v) > 1 ? "pill-yellow" : "pill-green"}`}>
        {Math.abs(v) > 2 ? "OUTLIER" : Math.abs(v) > 1 ? "ELEVATED" : "NORMAL"}
      </span>
    )},
  ];

  const stats = signalData ? {
    count: signalData.length,
    avg: signalData.reduce((s, d) => s + d.value, 0) / signalData.length,
    outliers: signalData.filter(d => Math.abs(d.z_score) > 2).length,
    trend: signalData.length > 1 ? signalData[signalData.length - 1].value - signalData[0].value : 0,
  } : null;

  return (
    <ErrorBoundary>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-md hover:bg-bg-3 transition-colors text-txt-3 hover:text-txt-1">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-semibold text-txt-1 capitalize">{managerId.replace(/_/g, " ")}</h1>
            <p className="text-[11px] text-txt-3">Signal history and analysis</p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Data Points", value: stats.count, icon: Activity },
              { label: "Avg Value", value: stats.avg.toFixed(1), icon: TrendingUp },
              { label: "Outliers", value: stats.outliers, icon: AlertTriangle },
              { label: "Trend", value: `${stats.trend > 0 ? "+" : ""}${stats.trend.toFixed(1)}`, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card p-2.5 flex items-center gap-2">
                <Icon size={12} className="text-accent" />
                <div>
                  <p className="text-[13px] font-semibold text-txt-1 mono">{value}</p>
                  <p className="text-[9px] text-txt-3">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1">
          {SIGNALS.map(s => (
            <button key={s} onClick={() => setActiveSignal(s)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors
                ${activeSignal === s ? "text-white" : "text-txt-3 hover:text-txt-2 bg-bg-3"}`}
              style={activeSignal === s ? { background: SIGNAL_COLORS[s] } : {}}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">
              {activeSignal.replace("_", " ")} Signal (90 days)
            </p>
            {signalData && signalData.length > 0 && (
              <Sparkline data={signalData} width={80} height={20} color={SIGNAL_COLORS[activeSignal]} />
            )}
          </div>
          {signalData && (
            <AreaChart data={signalData} yKeys={["value"]} colors={[SIGNAL_COLORS[activeSignal]]} height={180} />
          )}
        </div>

        <div className="card p-3 space-y-2">
          <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Signal Data</p>
          <DataTable columns={columns} data={signalData || []} pageSize={10} />
        </div>
      </div>
    </ErrorBoundary>
  );
}

function Loading() {
  return <div className="p-4 flex items-center justify-center h-40 text-txt-3 text-[12px]"><div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />Loading...</div>;
}
