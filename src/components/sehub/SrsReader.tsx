import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { requirements, type ReqType } from "@/docs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/finance/ui";
import { cn } from "@/lib/utils";
import { humanize } from "@/lib/format";
import { ImplBadge, ReqSheet } from "./shared";

export function SrsReader({ filter, item }: { filter?: ReqType; item?: string }) {
  const [q, setQ] = useState(""); const [type, setType] = useState<string>(filter ?? "ALL"); const [prio, setPrio] = useState("ALL"); const [status, setStatus] = useState("ALL");
  const [sel, setSel] = useState<string | null>(item ?? null); const [closed, setClosed] = useState<Set<string>>(new Set());
  useEffect(() => { setType(filter ?? "ALL"); }, [filter]);
  useEffect(() => { if (item) setSel(item); }, [item]);
  const rows = useMemo(() => requirements.filter((r) => (type === "ALL" || r.type === type) && (prio === "ALL" || r.priority === prio) && (status === "ALL" || r.status === status) &&
    (!q || `${r.id} ${r.title} ${r.description} ${r.actor}`.toLowerCase().includes(q.toLowerCase()))), [q, type, prio, status]);
  const sections = useMemo(() => [...new Set(rows.map((r) => r.section))], [rows]);
  const toggle = (s: string) => setClosed((c) => { const n = new Set(c); n.has(s) ? n.delete(s) : n.add(s); return n; });
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <nav className="card-surface h-fit p-3 lg:sticky lg:top-20" aria-label="Table of contents">
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contents</p>
        {sections.map((s) => <a key={s} href={`#sec-${s.replace(/\W+/g, "-")}`} className="block rounded px-2 py-1.5 text-sm hover:bg-muted">{s} <span className="num text-xs text-muted-foreground">({rows.filter((r) => r.section === s).length})</span></a>)}
        {!sections.length && <p className="px-2 text-xs text-muted-foreground">No sections</p>}
      </nav>
      <div className="space-y-4">
        <div className="card-surface flex flex-col gap-2 p-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative sm:w-72"><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, title, actor…" className="h-9 pl-8" aria-label="Search requirements" /></div>
          <Select value={type} onValueChange={setType}><SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All types</SelectItem><SelectItem value="FUNCTIONAL">Functional</SelectItem><SelectItem value="NON_FUNCTIONAL">Non-functional</SelectItem><SelectItem value="BUSINESS_RULE">Business rule</SelectItem></SelectContent></Select>
          <Select value={prio} onValueChange={setPrio}><SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All priorities</SelectItem>{["HIGH", "MEDIUM", "LOW"].map((p) => <SelectItem key={p} value={p}>{humanize(p)}</SelectItem>)}</SelectContent></Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem>{["IMPLEMENTED", "PARTIALLY_IMPLEMENTED", "PROPOSED", "NEEDS_VERIFICATION"].map((p) => <SelectItem key={p} value={p}>{humanize(p)}</SelectItem>)}</SelectContent></Select>
          <span className="text-xs text-muted-foreground sm:ml-auto">{rows.length} of {requirements.length}</span>
        </div>
        {sections.map((s) => (
          <section key={s} id={`sec-${s.replace(/\W+/g, "-")}`} className="card-surface scroll-mt-20 overflow-hidden">
            <button onClick={() => toggle(s)} className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left"><h2 className="text-sm font-semibold">{s}</h2><ChevronDown className={cn("size-4 transition-transform", closed.has(s) && "-rotate-90")} /></button>
            {!closed.has(s) && rows.filter((r) => r.section === s).map((r) => (
              <button key={r.id} onClick={() => setSel(r.id)} className="flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted/50 sm:flex-row sm:items-start sm:gap-4">
                <span className="num w-16 shrink-0 text-xs font-semibold text-accent-foreground">{r.id}</span>
                <span className="flex-1"><span className="block text-sm font-medium">{r.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{r.description}</span><span className="mt-1 block text-[11px] text-muted-foreground">Actor: {r.actor}</span></span>
                <span className="flex shrink-0 gap-1.5"><StatusBadge status={r.priority} /><ImplBadge s={r.status} /></span>
              </button>
            ))}
          </section>
        ))}
        {!rows.length && <p className="card-surface p-8 text-center text-sm text-muted-foreground">No requirements match these filters.</p>}
      </div>
      <ReqSheet id={sel} onClose={() => setSel(null)} />
    </div>
  );
}
