import { useState } from "react";
import { useFavorites } from "./Favorites";
import { LayoutDashboard, Grid3X3, Bell, Users, Activity, TrendingUp, BarChart3, LineChart, Settings, HeartPulse, Info, Download, PanelLeftClose, PanelLeft, X } from "lucide-react";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "heatmap", label: "Correlation Matrix", icon: Grid3X3 },
  { id: "alerts", label: "Alert Feed", icon: Bell },
  { id: "managers", label: "Managers", icon: Users },
  { id: "signals", label: "Signals", icon: Activity },
  { id: "trends", label: "Trend Analysis", icon: TrendingUp },
  { id: "compare", label: "Compare", icon: BarChart3 },
  { id: "indicators", label: "Indicators", icon: LineChart },
];

const NAV2 = [
  { id: "export", label: "Export Data", icon: Download },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "health", label: "System Health", icon: HeartPulse },
  { id: "about", label: "About", icon: Info },
];

export default function Sidebar({ page, go, alertCount, mobileOpen, onClose }) {
  const { favorites } = useFavorites();
  const [collapsed, setCollapsed] = useState(false);

  const renderBtn = (item) => {
    const active = page === item.id;
    const Icon = item.icon;
    return (
      <button key={item.id} onClick={() => go(item.id)}
        title={collapsed ? item.label : undefined}
        className={`w-full flex items-center rounded-md text-[11px] font-medium transition-all duration-200 text-left group
          ${active ? "bg-accent/15 text-accent" : "text-txt-3 hover:text-txt-2 hover:bg-bg-3"}
          ${collapsed ? "justify-center px-0 py-2" : "gap-2.5 px-2.5 py-2"}`}>
        <Icon size={14} className={`${active ? "text-accent" : "text-txt-3 group-hover:text-txt-2"} shrink-0`} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.id === "alerts" && alertCount > 0 && (
              <span className="pill pill-red text-[8px] min-w-4 text-center">{alertCount > 99 ? "99+" : alertCount}</span>
            )}
            {item.id === "managers" && favorites.length > 0 && (
              <span className="pill pill-cyan text-[8px] min-w-4 text-center">{favorites.length}</span>
            )}
          </>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <aside className={`${collapsed ? "w-12" : "w-48"} border-r border-border bg-bg-1 flex flex-col shrink-0 h-full overflow-y-auto transition-all duration-200`}>
      {/* Logo */}
      <div className={`${collapsed ? "p-2" : "p-3"} border-b border-border`}>
        <div className="flex flex-col items-center gap-1.5">
          <button onClick={() => go("dashboard")}
            className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center shrink-0 group"
            title="Dashboard">
            <Activity size={14} className="text-accent" />
          </button>
          {!collapsed && (
            <div className="text-center">
              <p className="text-[11px] font-semibold text-txt-1 group-hover:text-accent transition-colors">CCD</p>
              <p className="text-[8px] text-txt-3 mono">v1.0</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 space-y-0.5 ${collapsed ? "p-1.5" : "p-2"}`}>
        {NAV.map(renderBtn)}
      </nav>

      {/* Bottom nav + collapse */}
      <div className={`border-t border-border space-y-0.5 ${collapsed ? "p-1.5" : "p-2"}`}>
        {NAV2.map(renderBtn)}
        <button onClick={() => setCollapsed(p => !p)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`w-full flex items-center rounded-md text-[11px] font-medium transition-all duration-200 text-txt-3 hover:text-txt-2 hover:bg-bg-3
            ${collapsed ? "justify-center px-0 py-2" : "gap-2.5 px-2.5 py-2"}`}>
          {collapsed ? <PanelLeft size={14} /> : <><PanelLeftClose size={14} /><span className="flex-1">Collapse</span></>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebarContent}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <div className="relative">
              {sidebarContent}
              <button onClick={onClose}
                className="absolute top-2 right-2 p-1 rounded-md text-txt-3 hover:text-accent hover:bg-accent/10 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
