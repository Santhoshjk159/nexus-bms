import { useEffect, useMemo, useRef, useState } from "react";
import { Printer, Search, Link2 } from "lucide-react";
import { archComponents, documents, entities, modules, relationships, requirements, testCases, type ArchComponent } from "@/docs";
import { Panel, StatusBadge } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ModuleChip, ReqLink, TestLink } from "./shared";

const LAYERS: [ArchComponent["layer"], string][] = [["PRESENTATION", "Presentation"], ["ROUTING", "Routing & access"], ["STATE", "Hooks"], ["SERVICE", "Service layer"], ["DOMAIN", "Domain"], ["BACKEND", "Backend integration"]];
export function ArchExplorer() {
  const [sel, setSel] = useState("store"); const c = archComponents.find((x) => x.id === sel)!;
  const deps = new Set(c.dependsOn); const users = new Set(archComponents.filter((x) => x.dependsOn.includes(c.id)).map((x) => x.id));
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="card-surface space-y-3 p-4">
        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-3 rounded border border-border bg-card" />Current</span><span className="flex items-center gap-1.5"><span className="size-3 rounded border border-dashed border-muted-foreground" />Proposed</span><span className="flex items-center gap-1.5"><span className="size-3 rounded bg-accent" />Depends on</span><span className="flex items-center gap-1.5"><span className="size-3 rounded bg-warning-soft" />Used by</span></div>
        {LAYERS.map(([layer, label]) => (
          <div key={layer} className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="flex flex-wrap gap-2">
              {archComponents.filter((x) => x.layer === layer).map((x) => (
                <button key={x.id} onClick={() => setSel(x.id)} className={cn("rounded-md border px-3 py-2 text-left text-sm transition-colors", x.state === "PROPOSED" ? "border-dashed border-muted-foreground/60 text-muted-foreground" : "border-border bg-card", deps.has(x.id) && "bg-accent", users.has(x.id) && "bg-warning-soft", sel === x.id && "border-primary ring-2 ring-teal")}>{x.name}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Panel title={c.name} actions={<StatusBadge status={c.state} tone={c.state === "CURRENT" ? "success" : "info"} />}>
        <div className="space-y-4 text-sm">
          <p>{c.responsibility}</p>
          <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Related modules</p><div className="flex flex-wrap gap-1">{c.modules.length ? c.modules.map((m) => <ModuleChip key={m} id={m} />) : <span className="text-xs text-muted-foreground">—</span>}</div></div>
          <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source files</p>{c.files.length ? <ul className="num space-y-0.5 text-xs">{c.files.map((f) => <li key={f}>{f}</li>)}</ul> : <p className="text-xs text-muted-foreground">Not implemented yet</p>}</div>
          <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Depends on</p><div className="flex flex-wrap gap-1">{c.dependsOn.length ? c.dependsOn.map((d) => <button key={d} onClick={() => setSel(d)} className="rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground">{archComponents.find((x) => x.id === d)?.name}</button>) : <span className="text-xs text-muted-foreground">None</span>}</div></div>
          <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Used by</p><div className="flex flex-wrap gap-1">{users.size ? [...users].map((d) => <button key={d} onClick={() => setSel(d)} className="rounded bg-warning-soft px-2 py-0.5 text-xs">{archComponents.find((x) => x.id === d)?.name}</button>) : <span className="text-xs text-muted-foreground">None</span>}</div></div>
        </div>
      </Panel>
    </div>
  );
}

export function DataModel() {
  const [sel, setSel] = useState("BankAccount"); const e = entities.find((x) => x.name === sel)!;
  const rels = relationships.filter((r) => r.from === sel || r.to === sel); const linked = new Set(rels.flatMap((r) => [r.from, r.to]));
  return (
    <>
      <p className="mb-3 rounded-md bg-accent p-3 text-xs text-accent-foreground">Conceptual model mirrored from the TypeScript entities. PK/FK markers are conceptual identifiers — the current build has no SQL database or enforced constraints.</p>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="card-surface grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-4">
          {entities.map((x) => (<button key={x.name} onClick={() => setSel(x.name)} className={cn("rounded-md border border-border p-3 text-left transition-all", linked.has(x.name) && x.name !== sel && "border-teal bg-accent", x.name === sel && "border-primary bg-primary text-primary-foreground", !linked.has(x.name) && x.name !== sel && "opacity-60")}><p className="text-sm font-semibold">{x.name}</p><p className={cn("mt-0.5 text-[11px]", x.name === sel ? "opacity-80" : "text-muted-foreground")}>{x.attrs.length} attributes</p></button>))}
        </div>
        <Panel title={e.name} description={e.description} bodyClassName="p-0">
          <table className="w-full text-sm"><tbody>{e.attrs.map((a) => (
            <tr key={a.name} className="border-b border-border last:border-0"><td className="w-10 px-4 py-2">{a.key && <span className={cn("num rounded px-1 text-[10px] font-bold", a.key === "PK" ? "bg-warning-soft text-warning" : "bg-info-soft text-info")}>{a.key}</span>}</td><td className="num py-2 text-xs font-medium">{a.name}</td><td className="px-4 py-2 text-xs text-muted-foreground">{a.type}{a.ref && <> → <button className="text-accent-foreground underline" onClick={() => setSel(a.ref!)}>{a.ref}</button></>}{a.note && <span className="block text-[10px]">{a.note}</span>}</td></tr>
          ))}</tbody></table>
          <div className="border-t border-border p-4"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Relationships</p>
            <ul className="space-y-1 text-xs">{rels.map((r, i) => <li key={i} className="flex items-center gap-1.5"><Link2 className="size-3 text-muted-foreground" /><button onClick={() => setSel(r.from)} className="font-medium hover:underline">{r.from}</button><span className="num text-muted-foreground">.{r.via} →</span><button onClick={() => setSel(r.to)} className="font-medium hover:underline">{r.to}</button></li>)}{!rels.length && <li className="text-muted-foreground">None</li>}</ul>
          </div>
        </Panel>
      </div>
      <div className="mt-6"><DocReader id="database" /></div>
    </>
  );
}

export function ModuleDesign({ item }: { item?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (item) ref.current?.querySelector(`#${item}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [item]);
  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((m) => {
        const reqs = requirements.filter((r) => r.modules.includes(m.id)); const tests = testCases.filter((t) => t.module === m.id);
        return (
          <div key={m.id} id={m.id} className={cn("card-surface scroll-mt-24 p-4", item === m.id && "ring-2 ring-teal")}>
            <div className="flex items-start justify-between"><p className="num text-xs font-semibold text-accent-foreground">{m.id}</p><StatusBadge status={m.portal} tone="neutral" /></div>
            <p className="mt-1 text-sm font-semibold">{m.name}</p><p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
            <p className="num mt-3 text-[11px] text-muted-foreground">{m.routes.join(" · ")}</p>
            <ul className="num mt-2 space-y-0.5 text-[11px]">{m.files.map((f) => <li key={f}>{f}</li>)}</ul>
            <div className="mt-3 flex flex-wrap gap-1">{reqs.map((r) => <ReqLink key={r.id} id={r.id} />)}</div>
            <div className="mt-1.5 flex flex-wrap gap-1">{tests.map((t) => <TestLink key={t.id} id={t.id} />)}</div>
          </div>
        );
      })}
    </div>
  );
}

export function DocReader({ id }: { id: string }) {
  const doc = documents.find((d) => d.id === id)!; const [q, setQ] = useState("");
  const secs = useMemo(() => doc.sections.filter((s) => !q || JSON.stringify(s).toLowerCase().includes(q.toLowerCase())), [doc, q]);
  const hl = (t: string) => { if (!q) return t; const i = t.toLowerCase().indexOf(q.toLowerCase()); return i < 0 ? t : <>{t.slice(0, i)}<mark className="rounded bg-warning-soft px-0.5">{t.slice(i, i + q.length)}</mark>{t.slice(i + q.length)}</>; };
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <nav className="card-surface h-fit p-3 lg:sticky lg:top-20 print:hidden" aria-label="Table of contents">
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contents</p>
        {doc.sections.map((s) => <a key={s.id} href={`#doc-${doc.id}-${s.id}`} className="block rounded px-2 py-1.5 text-sm hover:bg-muted">{s.title}</a>)}
      </nav>
      <article className="card-surface p-5 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
          <div><h2 className="text-lg font-semibold">{doc.title}</h2><p className="text-sm text-muted-foreground">{doc.summary}</p></div>
          <div className="flex gap-2"><div className="relative"><Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search document" className="h-9 w-48 pl-8" aria-label="Search document" /></div><Button variant="outline" size="sm" className="h-9" onClick={() => window.print()}><Printer className="size-4" />Print</Button></div>
        </div>
        <p className="mb-4 text-[11px] text-muted-foreground print:hidden">No PDF file exists for this document; use Print → Save as PDF to export it.</p>
        <div className="space-y-7">
          {secs.map((s) => (
            <section key={s.id} id={`doc-${doc.id}-${s.id}`} className="scroll-mt-24">
              <h3 className="mb-2 text-base font-semibold">{s.title}</h3>
              {s.body.map((b, i) => <p key={i} className="mb-2 text-sm leading-relaxed text-foreground/90">{hl(b)}</p>)}
              {s.bullets && <ul className="list-disc space-y-1 pl-5 text-sm">{s.bullets.map((b) => <li key={b}>{hl(b)}</li>)}</ul>}
              {s.table && <div className="mt-2 overflow-x-auto rounded-md border border-border"><table className="w-full text-sm"><thead className="bg-muted/60"><tr>{s.table.head.map((h) => <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr></thead><tbody>{s.table.rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((c, j) => <td key={j} className={cn("px-3 py-2", j === 1 && doc.id === "api" && "num text-xs")}>{hl(c)}</td>)}</tr>)}</tbody></table></div>}
            </section>
          ))}
          {!secs.length && <p className="text-sm text-muted-foreground">No sections match “{q}”.</p>}
        </div>
      </article>
    </div>
  );
}
