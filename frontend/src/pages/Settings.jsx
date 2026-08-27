import { useState, useEffect } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import ErrorBoundary from "../components/ErrorBoundary";
import { Save, RotateCcw, Play, AlertTriangle, Activity, Info, Zap } from "lucide-react";
import { useToast } from "../components/Toast";

function ThresholdSlider({ value, onChange, min, max, step, label, desc, color = "#0ea5a5" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-txt-2 font-medium">{label}</label>
        <span className="text-[12px] mono font-bold" style={{ color }}>{value}</span>
      </div>
      <p className="text-[9px] text-txt-3">{desc}</p>
      <div className="relative">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-bg-3 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: color }} />
        <div className="flex justify-between text-[8px] text-txt-3 mt-0.5">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const { d: settings, loading } = useData(() => api.settings(), []);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => { if (settings) setForm({ ...settings }); }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(form);
      toast?.add("Settings saved — will apply on next pipeline run", "success");
    } catch {
      toast?.add("Failed to save settings", "error");
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await api.updateSettings(form);
      const r = await api.runPipeline();
      toast?.add(`Test complete — ${r.alerts_generated ?? 0} alerts generated with new thresholds`, "success");
    } catch {
      toast?.add("Test failed", "error");
    }
    setTesting(false);
  };

  const handleReset = () => {
    setForm(settings);
    toast?.add("Reset to saved values", "info");
  };

  if (loading || !form) return <Loading />;

  return (
    <ErrorBoundary>
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-base font-semibold text-txt-1">Settings</h1>
          <p className="text-[11px] text-txt-3">Configure detection thresholds and alert behavior</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="card p-4 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-accent" />
                <h2 className="text-[12px] font-medium text-txt-1">Alert Thresholds</h2>
              </div>
              <div className="space-y-4">
                <ThresholdSlider
                  value={form.level1_threshold} min={0.3} max={1.0} step={0.05}
                  label="Level 1: Pair Correlation" desc="Individual pair must exceed this to trigger"
                  onChange={(v) => setForm({ ...form, level1_threshold: v })} color="#0ea5a5" />
                <ThresholdSlider
                  value={form.level2_pairs_pct} min={0.05} max={0.5} step={0.05}
                  label="Level 2: Pairs %" desc="What fraction of pairs must be elevated"
                  onChange={(v) => setForm({ ...form, level2_pairs_pct: v })} color="#eab308" />
                <ThresholdSlider
                  value={form.level3_percentile} min={50} max={99} step={1}
                  label="Level 3: Percentile" desc="Overall correlation must be above this percentile"
                  onChange={(v) => setForm({ ...form, level3_percentile: v })} color="#ef4444" />
                <ThresholdSlider
                  value={form.correlation_window} min={7} max={180} step={1}
                  label="Rolling Window (days)" desc="Lookback period for correlation calculation"
                  onChange={(v) => setForm({ ...form, correlation_window: v })} color="#8b5cf6" />
              </div>
            </div>

            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-accent" />
                <h2 className="text-[12px] font-medium text-txt-1">Quick Actions</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={handleTest} disabled={testing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-50">
                  {testing ? <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" /> : <Play size={11} />}
                  {testing ? "Testing..." : "Test & Run Pipeline"}
                </button>
              </div>
              <p className="text-[9px] text-txt-3">Saves settings then runs pipeline to verify threshold behavior</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-accent" />
                <h2 className="text-[12px] font-medium text-txt-1">Current Configuration</h2>
              </div>
              <div className="space-y-2">
                {Object.entries(form).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-[10px] text-txt-3 capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="text-[11px] mono text-txt-1">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-accent" />
                <h2 className="text-[12px] font-medium text-txt-1">How It Works</h2>
              </div>
              <div className="space-y-2 text-[10px] text-txt-3 leading-relaxed">
                <p><span className="text-accent font-medium">Level 1</span> — Any single pair correlation above threshold triggers a warning.</p>
                <p><span className="text-warn font-medium">Level 2</span> — When enough pairs are elevated simultaneously, it escalates to high.</p>
                <p><span className="text-err font-medium">Level 3</span> — Overall market correlation above the percentile triggers critical.</p>
                <p className="pt-1 border-t border-border/50">Higher thresholds = fewer but more meaningful alerts. Lower = more sensitive detection.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50">
            {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={11} />}
            Save Settings
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-txt-3 hover:text-txt-2 hover:bg-bg-3 transition-colors">
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function Loading() {
  return <div className="p-4 flex items-center justify-center h-40 text-txt-3 text-[12px]"><div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />Loading...</div>;
}
