

export function SkeletonLine({ width = "100%", height = "0.75rem", className = "" }) {
  return (
    <div
      className={`animate-pulse bg-bg-3 rounded ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ lines = 3, className = "" }) {
  return (
    <div className={`card p-3 space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? "60%" : i === lines - 1 ? "40%" : "80%"} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = "" }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex gap-2 px-2 py-1">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width={`${100 / cols}%`} height="0.6rem" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2 px-2 py-1">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLine key={j} width={`${100 / cols}%`} height="0.5rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonHeatmap({ size = 8, className = "" }) {
  return (
    <div className={`grid gap-1 ${className}`} style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {Array.from({ length: size * size }).map((_, i) => (
        <div key={i} className="animate-pulse bg-bg-3 rounded aspect-square" />
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard lines={5} />
        <SkeletonHeatmap size={10} />
      </div>
    </div>
  );
}
