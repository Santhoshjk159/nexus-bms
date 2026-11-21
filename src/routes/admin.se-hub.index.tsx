import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, ClipboardCheck, Database, FileText, FlaskConical, GitBranch, Layers, ListChecks, Network, ShieldCheck, Workflow, BookOpen } from "lucide-react";
import { useBank } from "@/services/store";
import { hubMetrics, requirements, diagrams, modules, testCases } from "@/docs";
import { documents } from "@/docs";
import { PageHeader, Panel, StatCard } from "@/components/finance/ui";
import { Progress } from "@/components/ui/progress";
import { humanize } from "@/lib/format";

export const Route = createFileRoute("/admin/se-hub/")({
  head: () => ({ meta: [{ title: "Software Engineering Hub — NEXUS BMS" }, { name: "description", content: "Centralized engineering documentation, system architecture, requirements and quality assurance." }] }),
  component: HubDashboard,
});

function HubDashboard() {
  const m = hubMetrics(useBank((s) => s.testRuns ?? {}));
  const executed = m.tests - m.exec.NOT_RUN;
  const cards = [
    { slug: "srs", title: "Software Requirements", icon: FileText, meta: `${requirements.length} requirements`, desc: "Interactive SRS with flows and status." },
    { slug: "use-case", title: "UML Diagrams", icon: GitBranch, meta: `${diagrams.length} diagrams`, desc: "Zoomable, exportable system models." },
    { slug: "architecture", title: "System Architecture", icon: Layers, meta: "Current vs proposed", desc: "Layered component explorer." },
    { slug: "database", title: "Data Model", icon: Database, meta: "17 entities", desc: "Entities, keys and relationships." },
    { slug: "api", title: "API Documentation", icon: Network, meta: "Spring Boot contract", desc: "Endpoint map and configuration." },
    { slug: "test-cases", title: "Test Cases", icon: FlaskConical, meta: `${testCases.length} test cases`, desc: "Record execution results." },
    { slug: "overview", title: "Project Documentation", icon: BookOpen, meta: `${documents.length} documents`, desc: "Report, methodology, roadmap." },
  ] as const;
  const statusCount = (s: string) => requirements.filter((r) => r.status === s).length;
  return (
    <>
      <PageHeader title="NEXUS BMS — Software Engineering Hub" description="Centralized engineering documentation, system architecture, requirements and quality assurance." />
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Functional reqs" value={m.functional} icon={ListChecks} />
        <StatCard label="Non-functional" value={m.nonFunctional} icon={ShieldCheck} tone="teal" hint={`+ ${m.businessRules} business rules`} />
        <StatCard label="UML diagrams" value={m.diagrams} icon={Workflow} />
        <StatCard label="Modules" value={m.modules} icon={Boxes} tone="teal" />
        <StatCard label="Test cases" value={m.tests} icon={FlaskConical} />
        <StatCard label="Executed" value={`${executed}/${m.tests}`} icon={ClipboardCheck} tone={m.exec.FAIL ? "danger" : "success"} hint={`${m.exec.PASS} pass · ${m.exec.FAIL} fail`} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.slug} to="/admin/se-hub/$section" params={{ section: c.slug }} className="card-surface group p-4 transition-all hover:-translate-y-0.5 hover:border-teal">
            <c.icon className="size-5 text-accent-foreground" /><p className="mt-3 text-sm font-semibold">{c.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p><p className="num mt-3 text-[11px] font-medium text-accent-foreground">{c.meta} →</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Requirement implementation status">
          <div className="space-y-3">{["IMPLEMENTED", "PARTIALLY_IMPLEMENTED", "PROPOSED", "NEEDS_VERIFICATION"].map((s) => (<div key={s}><div className="flex justify-between text-xs"><span>{humanize(s)}</span><span className="num">{statusCount(s)}</span></div><Progress className="mt-1 h-1.5" value={(statusCount(s) / requirements.length) * 100} /></div>))}</div>
        </Panel>
        <Panel title="Test execution">
          <div className="space-y-3">{(["PASS", "FAIL", "BLOCKED", "NOT_RUN"] as const).map((s) => (<div key={s}><div className="flex justify-between text-xs"><span>{humanize(s)}</span><span className="num">{m.exec[s]}</span></div><Progress className="mt-1 h-1.5" value={(m.exec[s] / m.tests) * 100} /></div>))}</div>
          <p className="mt-3 text-xs text-muted-foreground">Results come only from manual entries in Test Execution.</p>
        </Panel>
      </div>
    </>
  );
}
