import { useMemo, useState } from "react";

const SHORT = {
  blackrock: "BlackRock", citadel: "Citadel", point72: "Point72",
  renaissance: "Renaissance", jane_street: "Jane St", two_sigma: "Two Sigma",
  deutsche_bank: "Deutsche", goldman_sachs: "Goldman", jpmorgan: "JPMorgan",
  morgan_stanley: "Morgan S",
};

export default function NetworkGraph({ correlations }) {
  const [hovered, setHovered] = useState(null);

  const { nodes, edges, positions } = useMemo(() => {
    if (!correlations || correlations.length === 0) return { nodes: [], edges: [], positions: [] };

    const managerSet = new Set();
    correlations.forEach(c => { managerSet.add(c.manager_a); managerSet.add(c.manager_b); });
    const managers = [...managerSet].sort();
    const n = managers.length;
    const indexMap = Object.fromEntries(managers.map((m, i) => [m, i]));

    const edges = correlations
      .filter(c => c.manager_a !== c.manager_b)
      .map(c => ({
        source: indexMap[c.manager_a],
        target: indexMap[c.manager_b],
        weight: Math.abs(c.correlation),
        value: c.correlation,
      }));

    const nodeData = managers.map(m => ({ id: m, label: SHORT[m] || m, degree: 0 }));
    edges.forEach(e => { nodeData[e.source].degree++; nodeData[e.target].degree++; });

    // Simple circle layout — no force simulation needed for 10 nodes
    const positions = managers.map((_, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      return {
        x: 0.5 + Math.cos(angle) * 0.38,
        y: 0.5 + Math.sin(angle) * 0.38,
      };
    });

    return { nodes: nodeData, edges, positions };
  }, [correlations]);

  if (nodes.length === 0) return null;

  const svgW = 360;
  const svgH = 300;
  const cx = i => positions[i].x * svgW;
  const cy = i => positions[i].y * svgH;

  const connectedEdges = hovered !== null
    ? edges.filter(e => e.source === hovered || e.target === hovered)
    : [];

  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Correlation Network</p>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[8px] text-txt-3"><span className="w-3 h-0.5 bg-red-500 inline-block rounded" /> &gt;0.6</span>
          <span className="flex items-center gap-1 text-[8px] text-txt-3"><span className="w-3 h-0.5 bg-yellow-500 inline-block rounded" /> 0.3–0.6</span>
          <span className="flex items-center gap-1 text-[8px] text-txt-3"><span className="w-3 h-0.5 bg-green-500 inline-block rounded" /> &lt;0.3</span>
        </div>
      </div>
      <div className="rounded-lg overflow-hidden" style={{ background: "radial-gradient(ellipse at center, #0c0c14 0%, #050508 100%)" }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
          <defs>
            <filter id="ng"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {edges.map((e, i) => {
            const isActive = connectedEdges.some(ce => ce.source === e.source && ce.target === e.target);
            const corrColor = e.value > 0.6 ? "#ef4444" : e.value > 0.3 ? "#eab308" : "#10b981";
            const show = hovered === null || isActive;
            if (!show) return <line key={i} x1={cx(e.source)} y1={cy(e.source)} x2={cx(e.target)} y2={cy(e.target)} stroke="#111827" strokeWidth="0.3" />;
            return (
              <line key={i}
                x1={cx(e.source)} y1={cy(e.source)}
                x2={cx(e.target)} y2={cy(e.target)}
                stroke={corrColor}
                strokeWidth={isActive ? Math.max(1.5, e.weight * 2) : 0.6}
                strokeOpacity={isActive ? 0.85 : 0.3}
              />
            );
          })}
          {nodes.map((n, i) => {
            const isHovered = hovered === i;
            const isConnected = connectedEdges.some(e => e.source === i || e.target === i);
            const showLabel = hovered === null || isHovered || isConnected;
            const size = 7;

            return (
              <g key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer">
                {isHovered && (
                  <circle cx={cx(i)} cy={cy(i)} r={size + 10}
                    fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.4" />
                )}
                <circle
                  cx={cx(i)} cy={cy(i)} r={size}
                  fill={isHovered ? "#22d3ee" : isConnected ? "#0ea5a5" : "#374151"}
                  stroke={isHovered ? "#22d3ee" : "#1f2937"}
                  strokeWidth={isHovered ? 2 : 1}
                  opacity={hovered === null || isHovered || isConnected ? 1 : 0.6}
                  filter={isHovered ? "url(#ng)" : ""}
                />
                {showLabel && (
                  <text x={cx(i)} y={cy(i) - size - 7} textAnchor="middle"
                    fontSize="9" fill={isHovered ? "#22d3ee" : isConnected ? "#9ca3af" : "#6b7280"}
                    className="pointer-events-none mono font-medium">
                    {n.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
