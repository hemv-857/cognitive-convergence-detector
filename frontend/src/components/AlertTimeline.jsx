import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = { critical: "#ef4444", high: "#eab308", warning: "#10b981" };

export default function AlertTimeline({ alerts }) {
  const data = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];
    const buckets = {};
    alerts.forEach(a => {
      const d = new Date(a.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!buckets[key]) buckets[key] = { date: key, critical: 0, high: 0, warning: 0 };
      buckets[key][a.severity]++;
    });
    return Object.values(buckets).slice(-14);
  }, [alerts]);

  if (data.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-bg-2 border border-border rounded-md p-2 shadow-xl text-[10px]">
        <p className="font-medium text-txt-1 mb-1">{label}</p>
        {payload.filter(p => p.value > 0).map(p => (
          <p key={p.dataKey} className="text-txt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: COLORS[p.dataKey] }} />
            {p.dataKey}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="card p-3 space-y-2">
      <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Alert Timeline (14 days)</p>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#4a4a60" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#4a4a60" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
            <Bar dataKey="critical" stackId="a" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS.critical} />)}
            </Bar>
            <Bar dataKey="high" stackId="a">
              {data.map((_, i) => <Cell key={i} fill={COLORS.high} />)}
            </Bar>
            <Bar dataKey="warning" stackId="a">
              {data.map((_, i) => <Cell key={i} fill={COLORS.warning} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
