import { useState, useMemo, useEffect, useRef } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import ErrorBoundary from "../components/ErrorBoundary";
import { AreaChart } from "../components/Charts";
import Sparkline from "../components/Sparkline";
import { Download } from "lucide-react";

const CELL_COLORS = [
  { max: 0.2, bg: "bg-emerald-900/40", text: "text-emerald-300" },
  { max: 0.4, bg: "bg-emerald-800/50", text: "text-emerald-200" },
  { max: 0.6, bg: "bg-yellow-900/50", text: "text-yellow-300" },
  { max: 0.8, bg: "bg-orange-900/50", text: "text-orange-300" },
  { max: 1.0, bg: "bg-red-900/50", text: "text-red-300" },
];

function getColor(val) {
  const abs = Math.abs(val ?? 0);
  for (const c of CELL_COLORS) if (abs < c.max) return c;
  return CELL_COLORS[CELL_COLORS.length - 1];
}

function sevPill(v) {
  if (v > 0.6) return <span className="pill pill-red text-[8px]">HIGH</span>;
  if (v > 0.3) return <span className="pill pill-yellow text-[8px]">MED</span>;
  return <span className="pill pill-green text-[8px]">LOW</span>;
}

function HeatmapGrid({ correlations, onCellClick, selectedPair, hover, setHover, hoverHistory }) {
  const managers = [...new Set(correlations.flatMap(c => [c.manager_a, c.manager_b]))].sort();
  const matrix = {};
  correlations.forEach(c => {
    matrix[`${c.manager_a}|${c.manager_b}`] = c.correlation;
    matrix[`${c.manager_b}|${c.manager_a}`] = c.correlation;
  });

  return (
    <div className="space-y-1">
      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-20" />
              {managers.map(m => (
                <th key={m} className="px-0.5 py-0.5 text-[7px] mono text-txt-3 text-center max-w-[52px] truncate" title={m}>
                  {m.slice(0, 8)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {managers.map((row) => (
              <tr key={row}>
                <td className="px-0.5 py-0.5 text-[7px] mono text-txt-3 text-right pr-1.5 truncate max-w-[80px]" title={row}>
                  {row.slice(0, 8)}
                </td>
                {managers.map((col) => {
                  const val = matrix[`${row}|${col}`] ?? (row === col ? 1 : null);
                  const isDiag = row === col;
                  const color = isDiag ? { bg: "bg-accent/20", text: "text-accent" } : getColor(val);
                  const isSelected = selectedPair && (
                    (selectedPair.a === row && selectedPair.b === col) ||
                    (selectedPair.a === col && selectedPair.b === row)
                  );
                  return (
                    <td key={col}
                      onMouseEnter={() => !isDiag && val != null && setHover({ row, col, val })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => !isDiag && val != null && onCellClick?.(row, col)}
                      className={`text-center px-0 py-0.5 text-[8px] mono font-medium transition-all
                        ${color.bg} ${color.text}
                        ${isSelected ? "ring-1.5 ring-accent ring-inset" : ""}
                        ${isDiag ? "" : "cursor-pointer hover:ring-1 hover:ring-white/40"}`}>
                      {val != null ? val.toFixed(2) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover tooltip with sparkline */}
      {hover && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-bg-3 border border-border text-[10px]">
          <span className="text-txt-1 capitalize">{hover.row.replace(/_/g, " ")}</span>
          <span className="text-accent">↔</span>
          <span className="text-txt-1 capitalize">{hover.col.replace(/_/g, " ")}</span>
          <span className="mono font-medium" style={{ color: hover.val > 0.6 ? "#ef4444" : hover.val > 0.3 ? "#eab308" : "#10b981" }}>
            {hover.val.toFixed(3)}
          </span>
          {sevPill(hover.val)}
          {hoverHistory && hoverHistory.length > 1 && (
            <Sparkline data={hoverHistory} dataKey="correlation" width={60} height={16} />
          )}
        </div>
      )}
    </div>
  );
}

export default function Heatmap() {
  const [assetClass, setAssetClass] = useState("equities");
  const [selectedPair, setSelectedPair] = useState(null);
  const [hover, setHover] = useState(null);
  const hoverTimer = useRef(null);
  const [hoveredPair, setHoveredPair] = useState(null);

  const { d: assetClasses } = useData(() => api.assetClasses(), []);
  const { d: correlations, loading } = useData(() => api.correlations(assetClass), [assetClass]);
  const { d: history } = useData(
    () => selectedPair ? api.correlationsHistory(selectedPair.a, selectedPair.b, 90) : Promise.resolve(null),
    [selectedPair]
  );
  const { d: hoverHistory } = useData(
    () => hoveredPair ? api.correlationsHistory(hoveredPair.a, hoveredPair.b, 30) : Promise.resolve(null),
    [hoveredPair]
  );

  useEffect(() => {
    if (hover) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => {
        setHoveredPair({ a: hover.row, b: hover.col });
      }, 150);
    } else {
      clearTimeout(hoverTimer.current);
      setHoveredPair(null);
    }
    return () => clearTimeout(hoverTimer.current);
  }, [hover]);

  const classes = assetClasses?.asset_classes ?? ["equities", "fixed_income", "commodities"];

  const handleCellClick = (a, b) => {
    setSelectedPair({ a, b });
  };

  return (
    <ErrorBoundary>
      <div className="p-3 md:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-txt-1">Correlation Heatmap</h1>
            <p className="text-[11px] text-txt-3">Pairwise correlation matrix — hover for details, click for history</p>
          </div>
          <button onClick={() => api.exportCorrelations(assetClass, "csv")}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-txt-3 hover:text-accent hover:bg-accent/10 transition-colors">
            <Download size={10} /> <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {classes.map(c => (
            <button key={c} onClick={() => { setAssetClass(c); setSelectedPair(null); }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors
                ${assetClass === c ? "bg-accent text-white" : "text-txt-3 hover:text-txt-2 bg-bg-3"}`}>
              {c.replace("_", " ")}
            </button>
          ))}
          {selectedPair && (
            <button onClick={() => setSelectedPair(null)}
              className="ml-2 px-2 py-1 rounded-md text-[10px] text-accent hover:bg-accent/10 transition-colors">
              ✕ Clear selection
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 card p-3">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-txt-3 text-[12px]">
                <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              <>
                <HeatmapGrid correlations={correlations || []} onCellClick={handleCellClick} selectedPair={selectedPair} hover={hover} setHover={setHover} hoverHistory={hoverHistory} />
                <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-border">
                  {CELL_COLORS.map(({ max }, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded ${CELL_COLORS[i].bg}`} />
                      <span className="text-[9px] text-txt-3">
                        {i === 0 ? "0" : (CELL_COLORS[i - 1]?.max ?? 0).toFixed(1)}-{max.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            {selectedPair ? (
              <PairDetail pair={selectedPair} history={history} onClose={() => setSelectedPair(null)} />
            ) : (
              <div className="card p-4 text-center text-[11px] text-txt-3">
                Click a cell to view pair history
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function PairDetail({ pair, history, onClose }) {
  const latest = history?.length > 0 ? history[history.length - 1]?.correlation : null;
  const avg = history?.length > 0 ? history.reduce((s, h) => s + h.correlation, 0) / history.length : null;
  const min = history?.length > 0 ? Math.min(...history.map(h => h.correlation)) : null;
  const max = history?.length > 0 ? Math.max(...history.map(h => h.correlation)) : null;

  return (
    <div className="card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Pair History</p>
        <button onClick={onClose} className="text-[10px] text-accent hover:underline">Close</button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-txt-1 capitalize font-medium">{pair.a.replace(/_/g, " ")}</span>
        <span className="text-[13px] text-accent font-bold">↔</span>
        <span className="text-[11px] text-txt-1 capitalize font-medium">{pair.b.replace(/_/g, " ")}</span>
      </div>

      {history && history.length > 0 ? (
        <>
          <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
            <AreaChart data={history} yKeys={["correlation"]} colors={["#0ea5a5"]} height={140} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Latest", value: latest?.toFixed(3), color: latest > 0.6 ? "#ef4444" : latest > 0.3 ? "#eab308" : "#10b981" },
              { label: "Mean", value: avg?.toFixed(3) },
              { label: "Min", value: min?.toFixed(3), color: "#10b981" },
              { label: "Max", value: max?.toFixed(3), color: "#ef4444" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-1.5 bg-bg-3 rounded-md">
                <p className="text-[12px] mono font-semibold" style={{ color: color || "#e8e8f0" }}>{value}</p>
                <p className="text-[8px] text-txt-3">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-txt-3">{history.length} data points over 90 days</p>
        </>
      ) : (
        <p className="text-[11px] text-txt-3 text-center py-4">No history available</p>
      )}
    </div>
  );
}
