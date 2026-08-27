import { useState, useEffect } from "react";
import { X } from "lucide-react";

const SHORTCUTS = [
  { group: "Navigation", items: [
    { keys: ["1"], desc: "Dashboard" },
    { keys: ["2"], desc: "Correlation Matrix" },
    { keys: ["3"], desc: "Alert Feed" },
    { keys: ["4"], desc: "Managers" },
    { keys: ["5"], desc: "Signals" },
    { keys: ["6"], desc: "Trends" },
    { keys: ["7"], desc: "Compare" },
  ]},
  { group: "Actions", items: [
    { keys: ["⌘", "K"], desc: "Search" },
    { keys: ["R"], desc: "Run Pipeline" },
    { keys: ["S"], desc: "Settings" },
    { keys: ["H"], desc: "System Health" },
    { keys: ["?"], desc: "Show Shortcuts" },
  ]},
];

export default function KeyboardShortcuts({ onNavigate }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

      const key = e.key.toLowerCase();
      const pageMap = { "1": "dashboard", "2": "heatmap", "3": "alerts", "4": "managers", "5": "signals", "6": "trends", "7": "compare" };

      if (pageMap[key]) { e.preventDefault(); onNavigate(pageMap[key]); }
      else if (key === "s") { e.preventDefault(); onNavigate("settings"); }
      else if (key === "h") { e.preventDefault(); onNavigate("health"); }
      else if (key === "r") { e.preventDefault(); window.__ccd_runPipeline?.(); }
      else if (key === "?") { e.preventDefault(); setShow(p => !p); }
      else if (key === "escape") { setShow(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNavigate]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShow(false)}>
      <div className="bg-bg-1 border border-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-[12px] font-medium text-txt-1">Keyboard Shortcuts</h2>
          <button onClick={() => setShow(false)} className="p-1 rounded hover:bg-bg-3 text-txt-3 hover:text-txt-1 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map(({ group, items }) => (
            <div key={group}>
              <p className="text-[10px] text-txt-3 uppercase tracking-wider font-medium mb-2">{group}</p>
              <div className="space-y-1">
                {items.map(({ keys, desc }) => (
                  <div key={desc} className="flex items-center justify-between py-1.5">
                    <span className="text-[11px] text-txt-2">{desc}</span>
                    <div className="flex items-center gap-0.5">
                      {keys.map(k => (
                        <kbd key={k} className="px-1.5 py-0.5 bg-bg-3 rounded text-[9px] mono text-txt-2 font-medium min-w-[20px] text-center">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
