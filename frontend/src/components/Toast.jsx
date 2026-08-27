import { useState, useEffect, useCallback, createContext, useContext } from "react";

const ToastContext = createContext(null);

const ICONS = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

const COLORS = {
  success: { bg: "bg-ok/10", border: "border-ok/30", text: "text-ok" },
  error: { bg: "bg-err/10", border: "border-err/30", text: "text-err" },
  warning: { bg: "bg-warn/10", border: "border-warn/30", text: "text-warn" },
  info: { bg: "bg-accent/10", border: "border-accent/30", text: "text-accent" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm">
        {toasts.length > 1 && (
          <button onClick={() => setToasts([])}
            className="pointer-events-auto ml-auto block text-[9px] text-txt-3 hover:text-txt-1 transition-colors mb-1">
            Dismiss all ({toasts.length})
          </button>
        )}
        {toasts.map(toast => {
          const colors = COLORS[toast.type] || COLORS.info;
          return (
            <div key={toast.id}
              className={`pointer-events-auto flex items-start gap-2 px-3 py-2.5 rounded-lg border shadow-lg backdrop-blur-sm
                ${colors.bg} ${colors.border} animate-slide-up`}>
              <span className={`text-[12px] ${colors.text} shrink-0`}>{ICONS[toast.type]}</span>
              <p className={`text-[11px] ${colors.text} flex-1`}>{toast.message}</p>
              <button onClick={() => remove(toast.id)}
                className="shrink-0 text-txt-3 hover:text-txt-1 text-[10px] transition-colors">×</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
