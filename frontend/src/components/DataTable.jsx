import { useState, useMemo } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

export default function DataTable({ columns, data, pageSize = 10, searchPlaceholder = "Search..." }) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    let result = [...data];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        columns.some(col => {
          const val = row[col.key];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }
    if (sortKey) {
      result.sort((a, b) => {
        const va = a[sortKey] ?? "";
        const vb = b[sortKey] ?? "";
        const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [data, sortKey, sortDir, search, columns]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize);

  if (!data || data.length === 0) {
    return <p className="text-center text-[11px] text-txt-3 py-4">No data available</p>;
  }

  return (
    <div className="space-y-2">
      <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        placeholder={searchPlaceholder}
        className="w-full bg-bg-3 border border-border rounded-md px-2.5 py-1 text-[11px] text-txt-1 placeholder-txt-3 focus:outline-none focus:ring-1 focus:ring-accent" />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              {columns.map(col => (
                <th key={col.key} onClick={() => {
                  if (sortKey === col.key) setSortDir(d => d === "asc" ? "desc" : "asc");
                  else { setSortKey(col.key); setSortDir("asc"); }
                }}
                  className="px-2 py-1.5 text-left text-[10px] font-medium text-txt-3 uppercase tracking-wider cursor-pointer hover:text-txt-2 transition-colors select-none">
                  <div className="flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown size={8} className={sortKey === col.key ? "text-accent" : "opacity-30"} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-bg-3/50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-2 py-1.5 text-[11px] text-txt-2">
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-txt-3">
            {filtered.length} rows • Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1 rounded hover:bg-bg-3 disabled:opacity-30 transition-colors">
              <ChevronLeft size={12} className="text-txt-3" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1 rounded hover:bg-bg-3 disabled:opacity-30 transition-colors">
              <ChevronRight size={12} className="text-txt-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
