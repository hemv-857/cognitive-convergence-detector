import { X, AlertTriangle, Clock, MapPin, Activity, CheckCircle } from "lucide-react";

const SEV_CONFIG = {
  critical: { color: "#ef4444", bg: "bg-red-900/20", border: "border-red-800/30", icon: AlertTriangle },
  high: { color: "#eab308", bg: "bg-yellow-900/20", border: "border-yellow-800/30", icon: AlertTriangle },
  warning: { color: "#10b981", bg: "bg-emerald-900/20", border: "border-emerald-800/30", icon: AlertTriangle },
};

export default function AlertModal({ alert, onClose }) {
  if (!alert) return null;

  const config = SEV_CONFIG[alert.severity] || SEV_CONFIG.warning;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-bg-1 border border-border rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className={`flex items-center justify-between px-4 py-3 ${config.bg} border-b ${config.border}`}>
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: config.color }} />
            <div>
              <h3 className="text-[13px] font-semibold text-txt-1 capitalize">{alert.severity} Alert</h3>
              <p className="text-[10px] text-txt-3 mono">ID: {alert.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors">
            <X size={14} className="text-txt-3" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-bg-3 rounded-md p-3">
            <p className="text-[11px] text-txt-1 leading-relaxed">{alert.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity size={11} className="text-accent" />
                <div>
                  <p className="text-[9px] text-txt-3 uppercase">Type</p>
                  <p className="text-[11px] text-txt-1 capitalize">{alert.alert_type?.replace(/_/g, " ")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={11} className="text-accent" />
                <div>
                  <p className="text-[9px] text-txt-3 uppercase">Asset Class</p>
                  <p className="text-[11px] text-txt-1 capitalize">{alert.asset_class?.replace(/_/g, " ")}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock size={11} className="text-accent" />
                <div>
                  <p className="text-[9px] text-txt-3 uppercase">Time</p>
                  <p className="text-[11px] text-txt-1">{new Date(alert.created_at).toLocaleString()}</p>
                </div>
              </div>
              {alert.acknowledged ? (
                <div className="flex items-center gap-2">
                  <CheckCircle size={11} className="text-ok" />
                  <div>
                    <p className="text-[9px] text-txt-3 uppercase">Status</p>
                    <p className="text-[11px] text-ok">Acknowledged</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-bg-3 rounded-md p-3 space-y-2">
            <p className="text-[9px] text-txt-3 uppercase">Managers</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-center">
                <p className="text-[12px] text-txt-1 font-medium capitalize">{alert.manager_a?.replace(/_/g, " ")}</p>
              </div>
              <span className="text-[11px] text-accent">↔</span>
              <div className="flex-1 text-center">
                <p className="text-[12px] text-txt-1 font-medium capitalize">{alert.manager_b?.replace(/_/g, " ")}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            {alert.correlation != null && (
              <div className="text-center">
                <p className="text-[16px] mono font-bold text-txt-1">{alert.correlation.toFixed(3)}</p>
                <p className="text-[9px] text-txt-3">Correlation</p>
              </div>
            )}
            {alert.z_score != null && (
              <div className="text-center">
                <p className={`text-[16px] mono font-bold ${Math.abs(alert.z_score) > 2 ? "text-err" : Math.abs(alert.z_score) > 1 ? "text-warn" : "text-txt-1"}`}>
                  {alert.z_score.toFixed(2)}
                </p>
                <p className="text-[9px] text-txt-3">Z-Score</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
