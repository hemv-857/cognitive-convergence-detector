import { useState } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import ErrorBoundary from "../components/ErrorBoundary";
import { Download, FileText, BarChart3, Database } from "lucide-react";

export default function ExportPage() {
  const [exporting, setExporting] = useState(null);
  const [alertsFormat, setAlertsFormat] = useState("csv");
  const [corrFormat, setCorrFormat] = useState("csv");
  const [corrClass, setCorrClass] = useState("equities");
  const { d: summary } = useData(() => api.summary(), []);

  const { d: assetClasses } = useData(() => api.assetClasses(), []);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      if (type === "alerts") {
        await api.exportAlerts(null, alertsFormat);
      } else if (type === "correlations") {
        await api.exportCorrelations(corrClass, corrFormat);
      }
    } catch (e) {
      console.error("Export failed:", e);
    }
    setExporting(null);
  };

  const classes = assetClasses?.asset_classes ?? ["equities", "fixed_income", "commodities"];

  return (
    <ErrorBoundary>
      <div className="p-3 md:p-4 space-y-4">
        <div>
          <h1 className="text-base font-semibold text-txt-1">Data Export</h1>
          <p className="text-[11px] text-txt-3">Export system data in various formats</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-accent" />
              <h2 className="text-[12px] font-medium text-txt-1">Alerts</h2>
            </div>
            <p className="text-[10px] text-txt-3">
              {summary?.total_alerts ?? 0} alerts with severity, correlation, and z-score data.
            </p>
            <div className="flex items-center gap-2">
              {["csv", "json"].map(f => (
                <button key={f} onClick={() => setAlertsFormat(f)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors
                    ${alertsFormat === f ? "bg-accent/15 text-accent" : "text-txt-3 hover:text-txt-2 bg-bg-3"}`}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            <button onClick={() => handleExport("alerts")} disabled={exporting === "alerts"}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-50">
              {exporting === "alerts" ? (
                <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : <Download size={11} />}
              {exporting === "alerts" ? "Exporting..." : `Download Alerts .${alertsFormat}`}
            </button>
          </div>

          <div className="card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-accent" />
              <h2 className="text-[12px] font-medium text-txt-1">Correlations</h2>
            </div>
            <p className="text-[10px] text-txt-3">
              Pairwise correlation matrix for the selected asset class.
            </p>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1">
                {classes.map(c => (
                  <button key={c} onClick={() => setCorrClass(c)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors
                      ${corrClass === c ? "bg-accent/15 text-accent" : "text-txt-3 hover:text-txt-2 bg-bg-3"}`}>
                    {c.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {["csv", "json"].map(f => (
                  <button key={f} onClick={() => setCorrFormat(f)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors
                      ${corrFormat === f ? "bg-accent/15 text-accent" : "text-txt-3 hover:text-txt-2 bg-bg-3"}`}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => handleExport("correlations")} disabled={exporting === "correlations"}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-50">
              {exporting === "correlations" ? (
                <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : <Download size={11} />}
              {exporting === "correlations" ? "Exporting..." : `Download ${corrClass} .${corrFormat}`}
            </button>
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-accent" />
            <h2 className="text-[12px] font-medium text-txt-1">System Overview</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Signals", value: summary?.total_signals ?? 0 },
              { label: "Alerts", value: summary?.total_alerts ?? 0 },
              { label: "Managers", value: summary?.total_managers ?? 0 },
              { label: "Asset Classes", value: classes.length },
              { label: "Pairs", value: "45" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-2 bg-bg-3 rounded-md">
                <p className="text-[14px] mono font-semibold text-txt-1">{typeof value === "number" ? value.toLocaleString() : value}</p>
                <p className="text-[9px] text-txt-3">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
