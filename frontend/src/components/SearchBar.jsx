import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Command } from "lucide-react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";

const PAGES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "heatmap", label: "Correlation Matrix" },
  { id: "alerts", label: "Alert Feed" },
  { id: "managers", label: "Managers" },
  { id: "signals", label: "Signal Explorer" },
  { id: "trends", label: "Trend Analysis" },
  { id: "compare", label: "Compare" },
  { id: "settings", label: "Settings" },
  { id: "health", label: "System Health" },
  { id: "about", label: "About" },
];

export default function SearchBar({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const { d: managers } = useData(() => api.managers(), []);

  const managerList = useMemo(() =>
    (managers?.managers ?? []).map(m => ({ id: `manager:${m}`, label: m.replace(/_/g, " "), type: "manager" })),
    [managers]
  );

  const allItems = useMemo(() => [
    ...PAGES.map(p => ({ ...p, type: "page" })),
    ...managerList,
  ], [managerList]);

  const filtered = useMemo(() => {
    if (!query) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(item => item.label.toLowerCase().includes(q));
  }, [query, allItems]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIdx]) {
      const item = filtered[selectedIdx];
      if (item.type === "manager") {
        onNavigate("managers");
      } else {
        onNavigate(item.id);
      }
      setOpen(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-txt-3 hover:text-txt-2 bg-bg-3 hover:bg-bg-2 transition-colors">
        <Search size={12} />
        <span>Search...</span>
        <kbd className="flex items-center gap-0.5 px-1 py-0.5 bg-bg-1 rounded text-[9px] mono ml-4">
          <Command size={9} />K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-bg-1 border border-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
              <Search size={14} className="text-txt-3" />
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown} placeholder="Search pages and managers..."
                className="flex-1 bg-transparent text-[12px] text-txt-1 placeholder-txt-3 focus:outline-none" />
              <kbd className="text-[9px] text-txt-3 mono">ESC</kbd>
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="text-center text-[11px] text-txt-3 py-4">No results found</p>
              ) : (
                filtered.map((item, i) => (
                  <button key={item.id} onClick={() => {
                    if (item.type === "manager") onNavigate("managers");
                    else onNavigate(item.id);
                    setOpen(false);
                  }}
                    className={`w-full text-left px-3 py-2 rounded-md text-[11px] transition-colors flex items-center gap-2
                      ${i === selectedIdx ? "bg-accent/15 text-accent" : "text-txt-2 hover:bg-bg-3"}`}>
                    <span className="w-5 text-center text-[9px] mono text-txt-3">
                      {item.type === "manager" ? "★" : "#"}
                    </span>
                    <span className="capitalize">{item.label}</span>
                    {item.type === "manager" && (
                      <span className="ml-auto text-[9px] text-txt-3">manager</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
