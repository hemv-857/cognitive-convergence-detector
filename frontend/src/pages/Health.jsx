import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import ErrorBoundary from "../components/ErrorBoundary";
import { Database, Activity, Server, HardDrive, Wifi, Cpu } from "lucide-react";

function StatusIndicator({ status }) {
  const colors = { ok: "bg-ok", warning: "bg-warn", error: "bg-err", unknown: "bg-txt-3" };
  const labels = { ok: "Healthy", warning: "Warning", error: "Error", unknown: "Unknown" };
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status] || colors.unknown}`} />
      <span className="text-[10px] text-txt-2">{labels[status] || "Unknown"}</span>
    </div>
  );
}

function ServiceCard({ name, status, detail, icon: Icon }) {
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-md bg-bg-3 flex items-center justify-center">
        <Icon size={14} className="text-txt-2" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-txt-1 font-medium">{name}</p>
        <p className="text-[9px] text-txt-3 truncate">{detail || "—"}</p>
      </div>
      <StatusIndicator status={status} />
    </div>
  );
}

function MetricRow({ label, value, unit, threshold, inverted = false }) {
  const isOk = inverted ? value <= threshold : value >= threshold;
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-txt-3">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] mono text-txt-1">{value?.toLocaleString()}{unit}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${isOk ? "bg-ok" : "bg-warn"}`} />
      </div>
    </div>
  );
}

export default function HealthPage() {
  const { d: health, loading: hLoading } = useData(() => api.health(), []);
  const { d: detailed, loading: dLoading } = useData(() => api.healthDetailed(), []);
  const { d: summary } = useData(() => api.summary(), []);

  if (hLoading || dLoading) return <Loading />;

  const services = [
    { name: "API Server", status: health?.status === "ok" ? "ok" : "error", detail: health?.status, icon: Server },
    { name: "Database", status: detailed?.status === "ok" ? "ok" : "error", detail: detailed?.database?.size_human ?? "N/A", icon: Database },
    { name: "Market Data", status: detailed?.data_source?.includes("yfinance") ? "ok" : "warning", detail: detailed?.data_source ?? "yfinance", icon: Wifi },
    { name: "Pipeline", status: detailed?.auto_refresh ? "ok" : "warning", detail: detailed?.auto_refresh ?? "N/A", icon: Activity },
  ];

  return (
    <ErrorBoundary>
      <div className="p-3 md:p-4 space-y-4">
        <div>
          <h1 className="text-base font-semibold text-txt-1">System Health</h1>
          <p className="text-[11px] text-txt-3">Service status and diagnostics</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {services.map(s => <ServiceCard key={s.name} {...s} />)}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive size={14} className="text-accent" />
              <h2 className="text-[12px] font-medium text-txt-1">Database</h2>
            </div>
            <MetricRow label="Size" value={detailed?.database?.size_human ?? "N/A"} />
            <MetricRow label="Type" value={detailed?.database?.type ?? "SQLite"} />
            <MetricRow label="Signals" value={detailed?.counts?.signals} />
            <MetricRow label="Correlations" value={detailed?.counts?.correlations} />
            <MetricRow label="Last Signal" value={detailed?.last_signal ? new Date(detailed.last_signal).toLocaleDateString() : "N/A"} />
          </div>

          <div className="card p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={14} className="text-accent" />
              <h2 className="text-[12px] font-medium text-txt-1">Performance</h2>
            </div>
            <MetricRow label="Uptime" value={detailed?.uptime ?? "N/A"} />
            <MetricRow label="Last Alert" value={detailed?.last_alert ? new Date(detailed.last_alert).toLocaleDateString() : "N/A"} />
            <MetricRow label="Total Signals" value={summary?.total_signals} />
            <MetricRow label="Total Alerts" value={summary?.total_alerts} />
            <MetricRow label="Managers" value={summary?.total_managers} />
            <MetricRow label="Alerts (Critical)" value={summary?.alerts_by_severity?.critical} />
            <MetricRow label="Alerts (High)" value={summary?.alerts_by_severity?.high} />
            <MetricRow label="Alerts (Warning)" value={summary?.alerts_by_severity?.warning} />
          </div>
        </div>

      </div>
    </ErrorBoundary>
  );
}

function Loading() {
  return <div className="p-4 flex items-center justify-center h-40 text-txt-3 text-[12px]"><div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />Loading...</div>;
}
