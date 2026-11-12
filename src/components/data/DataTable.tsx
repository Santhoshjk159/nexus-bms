import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/finance/ui";

export interface Column<T> { key: string; header: string; cell: (row: T) => ReactNode; sort?: (row: T) => string | number; className?: string; hideOnMobile?: boolean }

export function DataTable<T extends { id: string }>({ rows, columns, searchText, searchPlaceholder = "Search…", toolbar, pageSize = 10, onRowClick, empty, defaultSort }: {
  rows: T[]; columns: Column<T>[]; searchText?: (row: T) => string; searchPlaceholder?: string; toolbar?: ReactNode; pageSize?: number;
  onRowClick?: (row: T) => void; empty?: ReactNode; defaultSort?: { key: string; dir: "asc" | "desc" };
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(defaultSort ?? null);
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => {
    let r = rows;
    if (q && searchText) { const n = q.toLowerCase(); r = r.filter((x) => searchText(x).toLowerCase().includes(n)); }
    const col = sort && columns.find((c) => c.key === sort.key);
    if (col?.sort) { const f = col.sort; r = [...r].sort((a, b) => { const x = f(a), y = f(b); return (x < y ? -1 : x > y ? 1 : 0) * (sort!.dir === "asc" ? 1 : -1); }); }
    return r;
  }, [rows, q, sort, columns, searchText]);
  useEffect(() => setPage(0), [q, rows.length]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice(page * pageSize, page * pageSize + pageSize);
  return (
    <div className="card-surface overflow-hidden">
      {(searchText || toolbar) && (
        <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
          {searchText && (
            <div className="relative sm:w-72">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} className="h-9 pl-8" aria-label="Search table" />
            </div>
          )}
          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">{toolbar}</div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn("whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", c.hideOnMobile && "hidden md:table-cell", c.className)}>
                  {c.sort ? (
                    <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === "desc" ? "asc" : "desc" }))}>
                      {c.header}{sort?.key === c.key ? (sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn("border-t border-border transition-colors", onRowClick && "cursor-pointer hover:bg-muted/50")}>
                {columns.map((c) => <td key={c.key} className={cn("px-4 py-3 align-middle", c.hideOnMobile && "hidden md:table-cell", c.className)}>{c.cell(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!view.length && (empty ?? <EmptyState title="No matching records" description="Try adjusting your search or filters." />)}
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        <span>{filtered.length ? `${page * pageSize + 1}–${Math.min(filtered.length, (page + 1) * pageSize)} of ${filtered.length}` : "0 records"}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-7" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></Button>
          <span className="px-1">Page {page + 1} / {pages}</span>
          <Button variant="ghost" size="icon" className="size-7" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="size-4" /></Button>
        </div>
      </div>
    </div>
  );
}
