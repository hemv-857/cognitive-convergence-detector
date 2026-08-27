import { useMemo } from "react";

const CELL_COLORS = [
  { max: 0.2, bg: "rgba(16,185,129,0.25)", text: "#6ee7b7" },
  { max: 0.4, bg: "rgba(16,185,129,0.35)", text: "#34d399" },
  { max: 0.6, bg: "rgba(234,179,8,0.30)", text: "#fbbf24" },
  { max: 0.8, bg: "rgba(249,115,22,0.35)", text: "#fb923c" },
  { max: 1.0, bg: "rgba(239,68,68,0.40)", text: "#f87171" },
];

function getColor(val) {
  const abs = Math.abs(val ?? 0);
  for (const c of CELL_COLORS) if (abs < c.max) return c;
  return CELL_COLORS[CELL_COLORS.length - 1];
}

export default function HeatmapMini({ correlations }) {
  const { managers, matrix } = useMemo(() => {
    if (!correlations || correlations.length === 0) return { managers: [], matrix: {} };
    const m = [...new Set(correlations.flatMap(c => [c.manager_a, c.manager_b]))].sort();
    const mx = {};
    correlations.forEach(c => {
      mx[`${c.manager_a}|${c.manager_b}`] = c.correlation;
      mx[`${c.manager_b}|${c.manager_a}`] = c.correlation;
    });
    return { managers: m, matrix: mx };
  }, [correlations]);

  if (managers.length === 0) return null;

  return (
    <div className="card p-3 space-y-2">
      <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Correlation Heatmap</p>
      <div className="overflow-auto rounded-md">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-16" />
              {managers.map(m => (
                <th key={m} className="px-1 py-1 text-[8px] mono text-txt-3 text-center truncate max-w-12" title={m}>
                  {m.length > 8 ? m.slice(0, 7) + "…" : m.slice(0, 8)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {managers.map(row => (
              <tr key={row}>
                <td className="px-1 py-1 text-[8px] mono text-txt-3 text-right pr-2 truncate" title={row}>
                  {row.length > 8 ? row.slice(0, 7) + "…" : row.slice(0, 8)}
                </td>
                {managers.map(col => {
                  const val = matrix[`${row}|${col}`] ?? (row === col ? 1 : null);
                  const isDiag = row === col;
                  const c = isDiag ? { bg: "rgba(14,165,165,0.30)", text: "#22d3ee" } : getColor(val);
                  return (
                    <td key={col}
                      title={isDiag ? "" : `${row} ↔ ${col}: ${val?.toFixed(3)}`}
                      style={{ background: c.bg, color: c.text }}
                      className={`text-center px-1 py-1 text-[9px] mono font-medium transition-all
                        ${isDiag ? "" : "hover:brightness-150 hover:scale-110 cursor-default"}`}>
                      {val != null ? val.toFixed(2) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center gap-3 pt-1 border-t border-border">
        {CELL_COLORS.map(({ max, bg }, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: bg }} />
            <span className="text-[8px] text-txt-3">
              {i === 0 ? "0" : (CELL_COLORS[i - 1]?.max ?? 0).toFixed(1)}–{max.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
