import { lazy, Suspense, useState, useCallback, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import AutoRefresh from "./components/AutoRefresh";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import { ToastProvider, useToast } from "./components/Toast";
import { FavoritesProvider } from "./components/Favorites";
import ErrorBoundary from "./components/ErrorBoundary";
import { useData } from "./hooks/useFetch";
import { api } from "./lib/api";
import { RefreshCw, Wifi, WifiOff, Bell, Menu } from "lucide-react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Heatmap = lazy(() => import("./pages/Heatmap"));
const Managers = lazy(() => import("./pages/Managers"));
const Signals = lazy(() => import("./pages/Signals"));
const Trends = lazy(() => import("./pages/Trends"));
const Compare = lazy(() => import("./pages/Compare"));
const Indicators = lazy(() => import("./pages/Indicators"));
const ExportPage = lazy(() => import("./pages/Export"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const HealthPage = lazy(() => import("./pages/Health"));
const AboutPage = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PAGES = {
  dashboard: Dashboard, heatmap: Heatmap, alerts: Alerts, managers: Managers,
  signals: Signals, trends: Trends, compare: Compare, indicators: Indicators,
  export: ExportPage, settings: SettingsPage, health: HealthPage, about: AboutPage,
};

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-40 text-txt-3 text-[12px]">
      <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
      Loading...
    </div>
  );
}

function NotificationBell({ alerts, onNavigate }) {
  const [open, setOpen] = useState(false);
  const unacked = (alerts || []).filter(a => !a.acknowledged);

  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="relative p-1.5 rounded-md text-txt-3 hover:text-accent hover:bg-accent/10 transition-colors">
        <Bell size={14} />
        {unacked.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-[7px] text-white flex items-center justify-center font-bold">
            {unacked.length > 9 ? "9+" : unacked.length}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-72 bg-bg-1 border border-border rounded-lg shadow-2xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-[11px] font-medium text-txt-1">Alerts</span>
              <button onClick={() => { onNavigate("alerts"); setOpen(false); }}
                className="text-[10px] text-accent hover:underline">View all</button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {unacked.length === 0 ? (
                <p className="text-center text-[10px] text-txt-3 py-4">No unacknowledged alerts</p>
              ) : (
                unacked.slice(0, 8).map(a => (
                  <div key={a.id} className="px-3 py-2 border-b border-border/30 hover:bg-bg-3 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`pill ${a.severity === "critical" ? "pill-red" : a.severity === "high" ? "pill-yellow" : "pill-green"}`}>
                        {a.severity[0].toUpperCase()}
                      </span>
                      <span className="text-[10px] text-txt-1 truncate flex-1">{a.message}</span>
                    </div>
                    <p className="text-[8px] text-txt-3 mt-1">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Header({ onReload, alerts, onNavigate, onRunPipeline, running, onMenuToggle }) {
  const [online, setOnline] = useState(navigator.onLine);
  const toast = useToast();

  useEffect(() => {
    const handleOnline = () => { setOnline(true); toast?.add("Network restored", "success"); };
    const handleOffline = () => { setOnline(false); toast?.add("Network disconnected — using cached data", "warning"); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  return (
    <header className="flex items-center gap-2 px-3 md:px-4 py-2 border-b border-border bg-bg-1/50 backdrop-blur-sm">
      <button onClick={onMenuToggle} className="md:hidden p-1.5 rounded-md text-txt-3 hover:text-accent hover:bg-accent/10 transition-colors">
        <Menu size={16} />
      </button>
      <SearchBar onNavigate={(p) => window.__ccd_navigate?.(p)} />
      <div className="flex items-center gap-1.5 md:gap-2 ml-auto shrink-0">
        {online ? (
          <span className="pill pill-cyan text-[9px] flex items-center gap-1 hidden sm:flex"><Wifi size={9} /> LIVE</span>
        ) : (
          <span className="pill pill-red text-[9px] flex items-center gap-1"><WifiOff size={9} /> OFFLINE</span>
        )}
        <button onClick={onRunPipeline} disabled={running}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-txt-3 hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-50">
          <RefreshCw size={10} className={running ? "animate-spin" : ""} style={{ animationDuration: "2s" }} />
          <span className="hidden sm:inline">{running ? "Running..." : "Run Pipeline"}</span>
        </button>
        <NotificationBell alerts={alerts} onNavigate={onNavigate} />
        <AutoRefresh onRefresh={onReload} interval={30} />
      </div>
    </header>
  );
}

function AppInner() {
  const [page, setPage] = useState("dashboard");
  const [running, setRunning] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { d: alertData, reload: reloadAlerts } = useData(() => api.alerts(null, 200), []);
  const toast = useToast();

  const reload = useCallback(() => {
    reloadAlerts();
  }, [reloadAlerts]);

  const go = useCallback((p) => {
    if (p && PAGES[p]) setPage(p);
    else setPage("__404__");
    setMobileOpen(false);
  }, []);

  const handleRunPipeline = useCallback(async () => {
    setRunning(true);
    toast?.add("Pipeline running — fetching live data...", "info", 8000);
    try {
      const r = await api.runPipeline();
      toast?.add(r.status === "ok" ? `Pipeline complete — ${r.alerts_generated ?? 0} alerts generated` : "Pipeline failed", r.status === "ok" ? "success" : "error");
    } catch {
      toast?.add("Pipeline request failed — server may be unreachable", "error");
    }
    setRunning(false);
  }, [toast]);

  useEffect(() => {
    window.__ccd_navigate = go;
    window.__ccd_runPipeline = handleRunPipeline;
  }, [go, handleRunPipeline]);

  useEffect(() => {
    const titles = {
      dashboard: "Dashboard", heatmap: "Correlation Matrix", alerts: "Alert Feed",
      managers: "Managers", signals: "Signals", trends: "Trend Analysis",
      compare: "Compare", indicators: "Indicators", export: "Export Data",
      settings: "Settings", health: "System Health", about: "About",
    };
    document.title = `${titles[page] || "CCD"} — Cognitive Convergence Detector`;

    const favicons = {
      dashboard: "📊", heatmap: "🔥", alerts: "🚨", managers: "👥",
      signals: "📡", trends: "📈", compare: "⚖️", indicators: "📉",
      export: "💾", settings: "⚙️", health: "💓", about: "ℹ️",
    };
    const link = document.querySelector("link[rel=\"icon\"]");
    if (link) link.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">${favicons[page] || "📊"}</text></svg>`;
  }, [page]);

  const Page = PAGES[page];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar page={PAGES[page] ? page : null} go={go} alertCount={alertData?.length ?? 0} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onReload={reload} alerts={alertData} onNavigate={go} onRunPipeline={handleRunPipeline} running={running} onMenuToggle={() => setMobileOpen(p => !p)} />
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary key={page}>
            <Suspense fallback={<PageLoader />}>
              {Page ? <Page /> : <NotFound onBack={go} />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <KeyboardShortcuts onNavigate={go} />
    </div>
  );
}

export default function App() {
  return (
    <FavoritesProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </FavoritesProvider>
  );
}
