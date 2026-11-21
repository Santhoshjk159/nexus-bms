import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/finance/ui";
import { diagramById, moduleById, reqById, testsForReq, type ImplStatus, type TestStatus } from "@/docs";
import { slugForDiagram } from "./nav";
import { humanize } from "@/lib/format";

const IMPL_TONE: Record<ImplStatus, "success" | "warning" | "info" | "neutral"> = { IMPLEMENTED: "success", PARTIALLY_IMPLEMENTED: "warning", PROPOSED: "info", NEEDS_VERIFICATION: "neutral" };
export const ImplBadge = ({ s }: { s: ImplStatus }) => <StatusBadge status={s} tone={IMPL_TONE[s]} />;
const TEST_TONE: Record<TestStatus, "success" | "danger" | "warning" | "neutral"> = { PASS: "success", FAIL: "danger", BLOCKED: "warning", NOT_RUN: "neutral" };
export const TestBadge = ({ s }: { s: TestStatus }) => <StatusBadge status={s} tone={TEST_TONE[s]} />;

const chip = "num inline-flex rounded border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground hover:border-teal hover:bg-accent";
export const ReqLink = ({ id }: { id: string }) => <Link to="/admin/se-hub/$section" params={{ section: "srs" }} search={{ item: id }} className={chip}>{id}</Link>;
export const DiagramLink = ({ id }: { id: string }) => <Link to="/admin/se-hub/$section" params={{ section: slugForDiagram(id) }} search={{ item: id }} className={chip} title={diagramById(id)?.title}>{id}</Link>;
export const TestLink = ({ id }: { id: string }) => <Link to="/admin/se-hub/$section" params={{ section: "test-cases" }} search={{ item: id }} className={chip}>{id}</Link>;
export const ModuleChip = ({ id }: { id: string }) => <Link to="/admin/se-hub/$section" params={{ section: "modules" }} search={{ item: id }} className={chip} title={moduleById(id)?.name}>{id}</Link>;

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>{children}</div>;
}
export function ReqSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const r = id ? reqById(id) : undefined;
  return (
    <Sheet open={!!r} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {r && (<>
          <SheetHeader><SheetTitle className="flex items-center gap-2"><span className="num text-accent-foreground">{r.id}</span>{r.title}</SheetTitle><SheetDescription>{r.section} · {humanize(r.type)} · {humanize(r.priority)} priority</SheetDescription></SheetHeader>
          <div className="mt-5 space-y-5 text-sm">
            <div className="flex gap-2"><ImplBadge s={r.status} /><StatusBadge status={r.priority} /></div>
            <p className="leading-relaxed">{r.description}</p>
            <Block title="Actor"><p>{r.actor}</p></Block>
            {r.preconditions.length > 0 && <Block title="Preconditions"><ul className="list-disc space-y-1 pl-5">{r.preconditions.map((x) => <li key={x}>{x}</li>)}</ul></Block>}
            {r.mainFlow.length > 0 && <Block title="Main flow"><ol className="list-decimal space-y-1 pl-5">{r.mainFlow.map((x) => <li key={x}>{x}</li>)}</ol></Block>}
            {r.alternativeFlow.length > 0 && <Block title="Alternative flow"><ul className="list-disc space-y-1 pl-5">{r.alternativeFlow.map((x) => <li key={x}>{x}</li>)}</ul></Block>}
            <Block title="Expected outcome"><p>{r.expectedOutcome}</p></Block>
            <Block title="Traceability"><div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5"><span className="w-20 text-xs text-muted-foreground">Modules</span>{r.modules.map((m) => <ModuleChip key={m} id={m} />)}</div>
              <div className="flex flex-wrap items-center gap-1.5"><span className="w-20 text-xs text-muted-foreground">Diagrams</span>{r.diagrams.length ? r.diagrams.map((d) => <DiagramLink key={d} id={d} />) : <span className="text-xs text-muted-foreground">—</span>}</div>
              <div className="flex flex-wrap items-center gap-1.5"><span className="w-20 text-xs text-muted-foreground">Tests</span>{testsForReq(r.id).length ? testsForReq(r.id).map((t) => <TestLink key={t.id} id={t.id} />) : <span className="text-xs text-muted-foreground">No test case yet</span>}</div>
            </div></Block>
            {r.sources.length > 0 && <Block title="Source references"><ul className="num space-y-0.5 text-xs text-muted-foreground">{r.sources.map((s) => <li key={s}>{s}</li>)}</ul></Block>}
          </div>
        </>)}
      </SheetContent>
    </Sheet>
  );
}
