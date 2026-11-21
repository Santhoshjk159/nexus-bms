import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { sectionBySlug } from "@/components/sehub/nav";
import { documents, testCases } from "@/docs";
import { useBank } from "@/services/store";
import { PageHeader, Panel } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { SrsReader } from "@/components/sehub/SrsReader";
import { Traceability } from "@/components/sehub/Traceability";
import { TestSummary, TestWorkspace } from "@/components/sehub/TestWorkspace";
import { UmlWorkspace } from "@/components/sehub/UmlWorkspace";
import { ArchExplorer, DataModel, DocReader, ModuleDesign } from "@/components/sehub/Explorers";
import { TestBadge, TestLink } from "@/components/sehub/shared";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/admin/se-hub/$section")({
  validateSearch: z.object({ item: z.string().optional() }),
  beforeLoad: ({ params }) => { if (!sectionBySlug(params.section)) throw notFound(); },
  head: ({ params }) => { const s = sectionBySlug(params.section); return { meta: [{ title: `${s?.label ?? "Not found"} — SE Hub · NEXUS BMS` }, { name: "description", content: `NEXUS BMS engineering documentation: ${s?.label ?? ""}.` }] }; },
  notFoundComponent: () => <p className="text-sm text-muted-foreground">This documentation section does not exist.</p>,
  component: SectionPage,
});

const DESC: Record<string, string> = { doc: "Project documentation", srs: "Software Requirements Specification", uml: "UML & system modelling", trace: "Requirement → module → diagram → test", tests: "Software quality", testplan: "Software quality", defects: "Software quality", arch: "Click a component to inspect it", modules: "Design modules with routes, files, requirements and tests", data: "Conceptual entity relationship explorer" };

function SectionPage() {
  const { section } = Route.useParams(); const { item } = Route.useSearch();
  const s = sectionBySlug(section)!; const k = s.kind;
  return (
    <>
      <PageHeader title={s.label} description={k.type === "doc" ? documents.find((d) => d.id === k.doc)?.summary : DESC[k.type]} />
      {k.type === "doc" && <DocReader id={k.doc} />}
      {k.type === "srs" && <SrsReader filter={k.filter} item={item} />}
      {k.type === "uml" && <UmlWorkspace ids={k.ids} item={item} />}
      {k.type === "trace" && <Traceability />}
      {k.type === "tests" && <TestWorkspace mode={k.mode} item={item} />}
      {k.type === "testplan" && <><div className="mb-6"><TestSummary /></div><DocReader id="testplan" /></>}
      {k.type === "defects" && <Defects />}
      {k.type === "arch" && <ArchExplorer />}
      {k.type === "modules" && <ModuleDesign item={item} />}
      {k.type === "data" && <DataModel />}
    </>
  );
}

function Defects() {
  const runs = useBank((s) => s.testRuns ?? {});
  const rows = testCases.filter((t) => runs[t.id]?.status === "FAIL" || runs[t.id]?.status === "BLOCKED").map((t) => ({ ...t, run: runs[t.id] }));
  return (
    <>
      <Panel title="Open defects from test execution" className="mb-6" bodyClassName="p-0">
        <DataTable rows={rows} empty={<p className="p-8 text-center text-sm text-muted-foreground">No failed or blocked tests have been recorded.</p>} columns={[
          { key: "id", header: "Test", cell: (t) => <TestLink id={t.id} /> }, { key: "s", header: "Scenario", cell: (t) => t.scenario },
          { key: "a", header: "Actual result", cell: (t) => <span className="text-xs">{t.run.actual}</span> }, { key: "r", header: "Remarks", cell: (t) => <span className="text-xs">{t.run.remarks || "—"}</span>, hideOnMobile: true },
          { key: "st", header: "Status", cell: (t) => <TestBadge s={t.run.status} /> }, { key: "at", header: "Recorded", cell: (t) => <span className="text-xs">{fmtDateTime(t.run.updatedAt)}</span>, hideOnMobile: true },
        ]} />
      </Panel>
      <DocReader id="defects" />
    </>
  );
}
