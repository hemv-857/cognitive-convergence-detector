import { useState, useCallback } from "react";

const STORAGE_KEY = "ccd_widget_config";

const DEFAULT_WIDGETS = [
  { id: "stats", label: "Stats Row", defaultVisible: true },
  { id: "gauge", label: "Convergence Gauge", defaultVisible: true },
  { id: "heatmap", label: "Heatmap", defaultVisible: true },
  { id: "correlation_stats", label: "Correlation Distribution", defaultVisible: true },
  { id: "alert_timeline", label: "Alert Timeline", defaultVisible: true },
  { id: "network", label: "Network Graph", defaultVisible: true },
  { id: "top_pairs", label: "Top Pairs", defaultVisible: true },
  { id: "recent_alerts", label: "Recent Alerts", defaultVisible: true },
  { id: "manager_stats", label: "Manager Stats", defaultVisible: true },
  { id: "realtime", label: "Real-Time Monitor", defaultVisible: true },
];

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.order) {
      const byId = new Map(DEFAULT_WIDGETS.map(w => [w.id, w]));
      return saved.order
        .filter(id => byId.has(id))
        .map(id => ({
          ...byId.get(id),
          visible: saved.visible?.[id] ?? byId.get(id).defaultVisible,
        }));
    }
  } catch {}
  return DEFAULT_WIDGETS.map(w => ({ ...w, visible: w.defaultVisible }));
}

function saveConfig(widgets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    order: widgets.map(w => w.id),
    visible: Object.fromEntries(widgets.map(w => [w.id, w.visible])),
  }));
}

export default function useWidgetConfig() {
  const [widgets, setWidgets] = useState(loadConfig);

  const toggle = useCallback((id) => {
    setWidgets(prev => {
      const next = prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
      saveConfig(next);
      return next;
    });
  }, []);

  const moveUp = useCallback((id) => {
    setWidgets(prev => {
      const i = prev.findIndex(w => w.id === id);
      if (i <= 0) return prev;
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      saveConfig(next);
      return next;
    });
  }, []);

  const moveDown = useCallback((id) => {
    setWidgets(prev => {
      const i = prev.findIndex(w => w.id === id);
      if (i < 0 || i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      saveConfig(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = DEFAULT_WIDGETS.map(w => ({ ...w, visible: w.defaultVisible }));
    setWidgets(fresh);
    saveConfig(fresh);
  }, []);

  const visible = new Set(widgets.filter(w => w.visible).map(w => w.id));

  return { widgets, visible, toggle, moveUp, moveDown, reset };
}
