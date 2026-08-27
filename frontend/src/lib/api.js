const BASE = "/api/v1";

async function request(path, opts = {}) {
  const { baseUrl = BASE, retries = 2, retryDelay = 1000, ...fetchOpts } = opts;
  const url = `${baseUrl}${path}`;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json", ...fetchOpts.headers },
        ...fetchOpts,
      });
      
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API error ${res.status}: ${text || res.statusText}`);
      }
      
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      if (err.message?.includes("API error")) throw err;
      await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)));
    }
  }
}

async function download(path, filename) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  health: () => request("/health", { baseUrl: "" }),
  healthDetailed: () => request("/health/detailed"),
  summary: () => request("/stats/summary"),
  managerStats: () => request("/stats/managers"),
  correlationSummary: (ac) => request(`/stats/correlation-summary?asset_class=${ac || "equities"}`),
  convergence: (ac) => request(`/convergence/current?asset_class=${ac || "equities"}`),
  alerts: (severity, limit) => request(`/alerts/recent?${severity ? `severity=${severity}&` : ""}limit=${limit || 50}`),
  acknowledgeAlert: (id) => request(`/alerts/${id}/acknowledge`, { method: "POST" }),
  correlations: (ac) => request(`/correlations/matrix?asset_class=${ac || "equities"}`),
  baselines: () => request("/baselines"),
  signalsLatest: () => request("/signals/latest"),
  signalHistory: (manager, signal, days) => request(`/signals/history?manager_id=${manager}&signal_id=${signal}&days=${days || 90}`),
  correlationsHistory: (a, b, days) => request(`/correlations/history?manager_a=${a}&manager_b=${b}&days=${days || 90}`),
  managers: () => request("/managers"),
  assetClasses: () => request("/asset-classes"),
  settings: () => request("/settings"),
  updateSettings: (data) => request("/settings", { method: "POST", body: JSON.stringify(data) }),
  runPipeline: () => request("/pipeline/run", { method: "POST", retries: 0 }),
  seedData: () => request("/seed", { method: "POST" }),
  exportAlerts: (severity, fmt) => download(`/export/alerts?${severity ? `severity=${severity}&` : ""}fmt=${fmt || "csv"}`, `alerts.${fmt || "csv"}`),
  exportCorrelations: (ac, fmt) => download(`/export/correlations?asset_class=${ac || "equities"}&fmt=${fmt || "csv"}`, `correlations.${fmt || "csv"}`),
  indicators: (manager, signal, days) => request(`/indicators/${manager}/${signal}?days=${days || 90}`),
  correlationRegime: (ac, days) => request(`/correlations/regime/${ac || "equities"}?days=${days || 90}`),
};
