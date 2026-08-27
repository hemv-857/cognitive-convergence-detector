import { useMemo, useId } from "react";

export default function Sparkline({ data, width = 60, height = 20, color = "#0ea5a5", dataKey = "value" }) {
  const uid = useId();
  const gradId = `spark-${uid}`;

  const { path, lastY } = useMemo(() => {
    if (!data || data.length < 2) return { path: "", lastY: null };
    const vals = data.map(d => d[dataKey]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const step = width / (vals.length - 1);
    const pts = vals.map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");
    const last = height - ((vals[vals.length - 1] - min) / range) * (height - 4) - 2;
    return { path: pts, lastY: last };
  }, [data, dataKey, width, height]);

  if (!path) return <div style={{ width, height }} className="bg-bg-3 rounded" />;

  return (
    <svg width={width} height={height} className="block">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={path + ` L${width},${height} L0,${height} Z`} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx={width} cy={lastY} r="2" fill={color} />
    </svg>
  );
}
