import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { diagrams } from "@/docs";
import { cn } from "@/lib/utils";
import { MermaidDiagram } from "./MermaidDiagram";
import { ReqLink, TestLink } from "./shared";
import { slugForDiagram } from "./nav";
import { testsForReq } from "@/docs";

export function UmlWorkspace({ ids, item }: { ids: string[]; item?: string }) {
  const [cur, setCur] = useState(item && ids.includes(item) ? item : ids[0]);
  useEffect(() => { setCur(item && ids.includes(item) ? item : ids[0]); }, [ids, item]);
  const d = diagrams.find((x) => x.id === cur)!;
  const tests = [...new Set(d.requirements.flatMap((r) => testsForReq(r).map((t) => t.id)))];
  return (
    <div className="grid gap-4 xl:grid-cols-[240px_1fr]">
      <div className="space-y-4">
        {ids.length > 1 && <div className="card-surface p-2">{ids.map((id) => { const x = diagrams.find((y) => y.id === id)!; return <button key={id} onClick={() => setCur(id)} className={cn("block w-full rounded px-3 py-2 text-left text-sm", cur === id ? "bg-primary text-primary-foreground" : "hover:bg-muted")}><span className="num mr-2 text-xs opacity-70">{id}</span>{x.title}</button>; })}</div>}
        <div className="card-surface p-3">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">All diagrams</p>
          {diagrams.map((x) => <Link key={x.id} to="/admin/se-hub/$section" params={{ section: slugForDiagram(x.id) }} search={{ item: x.id }} className={cn("block rounded px-2 py-1 text-xs hover:bg-muted", x.id === cur && "font-semibold text-accent-foreground")}><span className="num mr-1.5 text-muted-foreground">{x.id}</span>{x.title}</Link>)}
        </div>
      </div>
      <div className="min-w-0 space-y-3">
        <MermaidDiagram key={d.id} diagram={d} />
        <div className="card-surface flex flex-wrap items-center gap-2 p-3 text-xs"><span className="font-medium">Traces to</span>{d.requirements.map((r) => <ReqLink key={r} id={r} />)}<span className="ml-2 font-medium">Verified by</span>{tests.map((t) => <TestLink key={t} id={t} />)}</div>
      </div>
    </div>
  );
}
