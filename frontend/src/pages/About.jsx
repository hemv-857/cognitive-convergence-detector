import { useState } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import ErrorBoundary from "../components/ErrorBoundary";
import { Activity, Database, Wifi, Server, Play, CheckCircle, AlertTriangle } from "lucide-react";

function StatCard({ icon: Icon, label, value, color = "#0ea5a5", sub }) {
  return (
    <div className="card p-3 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-txt-1 mono font-medium">{value}</p>
        <p className="text-[10px] text-txt-3">{label}</p>
        {sub && <p className="text-[9px] text-txt-3">{sub}</p>}
      </div>
    </div>
  );
}

export default function AboutPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const { d: health } = useData(() => api.health(), []);
  const { d: summary } = useData(() => api.summary(), []);
  const { d: detailed } = useData(() => api.healthDetailed(), []);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const r = await api.runPipeline();
      setResult(r);
    } catch (e) {
      setResult({ status: "error", message: e.message });
    }
    setRunning(false);
  };

  return (
    <ErrorBoundary>
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-base font-semibold text-txt-1">About</h1>
          <p className="text-[11px] text-txt-3">System information and diagnostics</p>
        </div>

        <div className="card p-4 space-y-3">
          <h2 className="text-[12px] font-medium text-txt-1">Cognitive Convergence Detector</h2>
          <p className="text-[11px] text-txt-3 leading-relaxed">
            Monitors institutional trading signal correlation and detects convergence events.
            When multiple managers&apos; signals become highly correlated, it may indicate crowded trades
            or systemic risk buildup.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="pill pill-cyan text-[9px]">v1.0</span>
            <span className="pill pill-green text-[9px]">LIVE DATA</span>
            <span className="pill text-[9px] bg-bg-3 text-txt-3">LOCAL</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={Activity} label="Pipeline Status" value={health?.status ?? "checking..."}
            color={health?.status === "ok" ? "#10b981" : "#ef4444"}
            sub="Auto-refreshes every 60 min" />
          <StatCard icon={Database} label="Database" value={detailed?.database?.size_human ?? "N/A"}
            color="#0ea5a5" sub="SQLite (local)" />
          <StatCard icon={Wifi} label="Data Source" value={detailed?.data_source ?? "yfinance"}
            color="#06b6d4" sub="Free tier API" />
          <StatCard icon={Server} label="Runtime" value={detailed?.status === "ok" ? "Running" : "N/A"}
            color="#8b5cf6" sub="FastAPI + SQLite" />
        </div>

        <div className="card p-4 space-y-3">
          <h2 className="text-[12px] font-medium text-txt-1">Pipeline</h2>
          <p className="text-[11px] text-txt-3">Fetch live data from yfinance and run convergence detection.</p>
          <div className="flex items-center gap-2">
            <button onClick={handleRun} disabled={running}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-50">
              {running ? (
                <><div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" /> Running...</>
              ) : (
                <><Play size={11} /> Run Pipeline</>
              )}
            </button>
            {result && (
              <span className={`pill text-[10px] ${result.status === "ok" ? "pill-green" : "pill-red"}`}>
                {result.status === "ok" ? (
                  <><CheckCircle size={9} className="mr-1" />{result.alerts_generated ?? 0} alerts</>
                ) : (
                  <><AlertTriangle size={9} className="mr-1" />{result.message ?? "failed"}</>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="card p-4 space-y-2">
          <h2 className="text-[12px] font-medium text-txt-1">System Details</h2>
          <div className="space-y-1.5">
            {[
              { label: "Backend", value: "FastAPI + SQLAlchemy + SQLite" },
              { label: "Frontend", value: "React + Vite + Tailwind CSS" },
              { label: "Charts", value: "Recharts" },
              { label: "Data", value: detailed?.data_source ?? "yfinance (Yahoo Finance)" },
              { label: "Pipeline", value: "Background threading (every 60 min)" },
              { label: "Deployment", value: "Local (no Docker)" },
              { label: "Signals", value: summary?.total_signals?.toLocaleString() ?? "—" },
              { label: "Alerts", value: summary?.total_alerts?.toLocaleString() ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[10px] text-txt-3 w-16">{label}</span>
                <span className="text-[10px] text-txt-1 mono">{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </ErrorBoundary>
  );
}
