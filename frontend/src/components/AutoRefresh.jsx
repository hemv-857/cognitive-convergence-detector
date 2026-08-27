import { useState, useEffect, useRef } from "react";
import { RefreshCw, Pause, Play } from "lucide-react";

export default function AutoRefresh({ onRefresh, interval = 30 }) {
  const [enabled, setEnabled] = useState(true);
  const [countdown, setCountdown] = useState(interval);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setRefreshing(true);
          onRefresh?.();
          setTimeout(() => setRefreshing(false), 1000);
          return interval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, interval, onRefresh]);

  const handleToggle = () => {
    setEnabled(p => !p);
    setCountdown(interval);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={handleToggle}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors
          ${enabled ? "text-accent bg-accent/10" : "text-txt-3 hover:text-txt-2 hover:bg-bg-3"}`}>
        {enabled ? <Pause size={9} /> : <Play size={9} />}
        {enabled ? `${countdown}s` : "Paused"}
      </button>
      <button onClick={() => { setRefreshing(true); onRefresh?.(); setTimeout(() => setRefreshing(false), 1000); }}
        className="p-1 rounded-md text-txt-3 hover:text-accent hover:bg-accent/10 transition-colors"
        title="Refresh now">
        <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
      </button>
    </div>
  );
}
