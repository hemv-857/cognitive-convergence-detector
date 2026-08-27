import { useId } from "react";
import { AreaChart as ReAreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export function MiniBar({ value, max = 100, color = "#0ea5a5", height = 4 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full bg-bg-3 rounded-full overflow-hidden" style={{ height }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function Gauge({ value, max = 100, size = 80, thickness = 7, color = "#0ea5a5", label = "" }) {
  const pct = Math.min(100, Math.max(0, value / max));
  const r = (size - thickness) / 2;
  const circ = Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 2 + thickness} viewBox={`0 0 ${size} ${size / 2 + thickness}`}>
        <defs>
          <linearGradient id={`gauge-${label}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d={`M ${thickness / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - thickness / 2} ${size / 2}`}
          fill="none" stroke="#1e293b" strokeWidth={thickness} strokeLinecap="round"
        />
        <path
          d={`M ${thickness / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - thickness / 2} ${size / 2}`}
          fill="none" stroke={`url(#gauge-${label})`} strokeWidth={thickness} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#e8e8f0" className="mono">
          {Math.round(value)}
        </text>
      </svg>
      {label && <span className="text-[9px] text-txt-3 uppercase tracking-wider">{label}</span>}
    </div>
  );
}

export function AreaChart({ data, yKeys = ["value"], colors = ["#0ea5a5"], height = 200, title = "" }) {
  const uid = useId();
  const tooltipStyle = {
    contentStyle: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 6, fontSize: 11, color: "#e8e8f0" },
    itemStyle: { color: "#e8e8f0" },
    cursor: { stroke: "#334155", strokeWidth: 1 },
  };

  return (
    <div>
      {title && <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium mb-2">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <ReAreaChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 4 }}>
          <defs>
            {yKeys.map((k, i) => (
              <linearGradient key={k} id={`grad-${uid}-${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.35} />
                <stop offset="50%" stopColor={colors[i % colors.length]} stopOpacity={0.1} />
                <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2a" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#4a4a60" }} tickLine={false} axisLine={false}
            tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} />
          <YAxis tick={{ fontSize: 10, fill: "#4a4a60" }} tickLine={false} axisLine={false} width={40} />
          <Tooltip {...tooltipStyle} />
          {yKeys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]}
              fill={`url(#grad-${uid}-${k})`} strokeWidth={2} dot={false}
              activeDot={{ r: 4, fill: colors[i % colors.length], stroke: "#0a0a10", strokeWidth: 2 }} />
          ))}
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CorrelationBar({ value, label, max = 1 }) {
  const pct = Math.abs(value) / max * 100;
  const color = value > 0.6 ? "#ef4444" : value > 0.3 ? "#eab308" : "#10b981";
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[10px] text-txt-3 w-28 truncate" title={label}>{label}</span>
      <div className="flex-1 h-2.5 bg-bg-3 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
      <span className="text-[10px] mono w-12 text-right font-medium" style={{ color }}>{value.toFixed(3)}</span>
    </div>
  );
}
