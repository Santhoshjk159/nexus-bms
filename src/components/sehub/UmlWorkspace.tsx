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
    <div className="space-y-3">
      <div className="card-surface flex flex-wrap items-center gap-1.5 p-2" role="tablist" aria-label="Diagram selector">
        {diagrams.map((x) => {
          const local = ids.includes(x.id);
          const cls = cn("rounded-md px-2.5 py-1.5 text-xs transition-colors", x.id === cur ? "bg-primary text-primary-foreground" : local ? "bg-accent text-accent-foreground hover:bg-accent/70" : "text-muted-foreground hover:bg-muted");
          return local
            ? <button key={x.id} role="tab" aria-selected={x.id === cur} onClick={() => setCur(x.id)} className={cls}><span className="num mr-1 opacity-70">{x.id}</span>{x.title}</button>
            : <Link key={x.id} to="/admin/se-hub/$section" params={{ section: slugForDiagram(x.id) }} search={{ item: x.id }} className={cls}><span className="num mr-1 opacity-70">{x.id}</span>{x.title}</Link>;
        })}
      </div>
      <MermaidDiagram key={d.id} diagram={d} height={680} />
      <div className="card-surface flex flex-wrap items-center gap-2 p-3 text-xs"><span className="font-medium">Traces to</span>{d.requirements.map((r) => <ReqLink key={r} id={r} />)}<span className="ml-2 font-medium">Verified by</span>{tests.map((t) => <TestLink key={t} id={t} />)}</div>
    </div>
  );
}
