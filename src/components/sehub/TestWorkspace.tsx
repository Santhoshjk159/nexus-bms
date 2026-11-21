import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, CircleSlash, FlaskConical, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { actions, useBank } from "@/services/store";
import { hubMetrics, modules, testCases, type TestCase, type TestStatus } from "@/docs";
import { DataTable } from "@/components/data/DataTable";
import { DonutChart, BarsChart } from "@/components/finance/charts";
import { Field, KV, Panel, StatCard, StatusBadge } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDateTime, humanize } from "@/lib/format";
import { ModuleChip, ReqLink, TestBadge } from "./shared";

const STATUSES: TestStatus[] = ["NOT_RUN", "PASS", "FAIL", "BLOCKED"];

export function TestSummary() {
  const runs = useBank((s) => s.testRuns ?? {}); const m = hubMetrics(runs);
  const data = STATUSES.map((s) => ({ name: humanize(s), value: m.exec[s] })).filter((d) => d.value);
  const byModule = modules.map((mod) => { const ts = testCases.filter((t) => t.module === mod.id); return { label: mod.id, pass: ts.filter((t) => runs[t.id]?.status === "PASS").length, fail: ts.filter((t) => runs[t.id]?.status === "FAIL").length, notrun: ts.filter((t) => !runs[t.id] || runs[t.id].status === "NOT_RUN").length }; }).filter((r) => r.pass + r.fail + r.notrun);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Documented tests" value={m.tests} icon={FlaskConical} />
        <StatCard label="Not run" value={m.exec.NOT_RUN} icon={ClipboardCheck} />
        <StatCard label="Pass" value={m.exec.PASS} icon={CheckCircle2} tone="success" />
        <StatCard label="Fail" value={m.exec.FAIL} icon={XCircle} tone="danger" />
        <StatCard label="Blocked" value={m.exec.BLOCKED} icon={CircleSlash} tone="warning" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Execution status"><DonutChart data={data} money={false} height={220} /></Panel>
        <Panel title="Results by module" className="xl:col-span-2"><BarsChart data={byModule} stacked money={false} height={220} keys={[{ key: "pass", label: "Pass" }, { key: "fail", label: "Fail" }, { key: "notrun", label: "Not run" }]} /></Panel>
      </div>
    </>
  );
}

export function TestWorkspace({ mode, item }: { mode: "cases" | "execution"; item?: string }) {
  const runs = useBank((s) => s.testRuns ?? {});
  const [mod, setMod] = useState("ALL"); const [st, setSt] = useState("ALL"); const [selId, setSelId] = useState<string | null>(item ?? null);
  const [form, setForm] = useState({ status: "NOT_RUN" as TestStatus, actual: "", remarks: "" }); const [err, setErr] = useState("");
  useEffect(() => { if (item) setSelId(item); }, [item]);
  const sel = testCases.find((t) => t.id === selId);
  useEffect(() => { if (sel) { const r = runs[sel.id]; setForm({ status: r?.status ?? "NOT_RUN", actual: r?.actual ?? "", remarks: r?.remarks ?? "" }); setErr(""); } }, [selId]); // eslint-disable-line react-hooks/exhaustive-deps
  const status = (t: TestCase) => runs[t.id]?.status ?? "NOT_RUN";
  const rows = useMemo(() => testCases.filter((t) => (mod === "ALL" || t.module === mod) && (st === "ALL" || status(t) === st)), [mod, st, runs]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = () => {
    if (form.status !== "NOT_RUN" && form.actual.trim().length < 3) return setErr("Enter the actual result observed (min 3 characters)");
    if (form.status === "NOT_RUN") actions.resetTestRun(sel!.id); else actions.recordTestRun(sel!.id, { status: form.status, actual: form.actual.trim(), remarks: form.remarks.trim() });
    toast.success(`${sel!.id} marked ${humanize(form.status).toLowerCase()}`); setSelId(null);
  };
  return (
    <>
      {mode === "execution" && <div className="mb-4"><TestSummary /></div>}
      <p className="mb-3 text-xs text-muted-foreground">Test cases are documented in the hub's source files. Execution results appear only after an administrator records them here (marked “Manually recorded”).</p>
      <DataTable rows={rows} pageSize={12} onRowClick={(t) => setSelId(t.id)} searchText={(t) => `${t.id} ${t.scenario} ${t.input} ${t.requirements.join(" ")}`} searchPlaceholder="Search test ID or scenario"
        toolbar={<>
          <Select value={mod} onValueChange={setMod}><SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All modules</SelectItem>{modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.id} · {m.name}</SelectItem>)}</SelectContent></Select>
          <Select value={st} onValueChange={setSt}><SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent></Select>
        </>}
        columns={[
          { key: "id", header: "Test case", sort: (t) => t.id, cell: (t) => <span className="num text-xs font-semibold text-accent-foreground">{t.id}</span> },
          { key: "m", header: "Module", cell: (t) => <span className="num text-xs">{t.module}</span>, hideOnMobile: true },
          { key: "s", header: "Scenario", cell: (t) => <span className="text-sm">{t.scenario}</span> },
          ...(mode === "cases" ? [
            { key: "pre", header: "Preconditions", cell: (t: TestCase) => <span className="text-xs text-muted-foreground">{t.preconditions}</span>, hideOnMobile: true },
            { key: "in", header: "Input", cell: (t: TestCase) => <span className="text-xs">{t.input}</span>, hideOnMobile: true },
            { key: "exp", header: "Expected result", cell: (t: TestCase) => <span className="text-xs">{t.expected}</span>, hideOnMobile: true },
          ] : []),
          { key: "act", header: "Actual result", cell: (t) => runs[t.id]?.actual ? <span className="text-xs">{runs[t.id].actual}</span> : <span className="text-xs text-muted-foreground">—</span>, hideOnMobile: true },
          { key: "p", header: "Priority", cell: (t) => <StatusBadge status={t.priority} />, sort: (t) => ["HIGH", "MEDIUM", "LOW"].indexOf(t.priority) },
          { key: "st", header: "Execution", cell: (t) => <div><TestBadge s={status(t)} />{runs[t.id] && <p className="mt-0.5 text-[10px] text-muted-foreground">Manually recorded</p>}</div>, sort: (t) => STATUSES.indexOf(status(t)) },
        ]} />
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {sel && (<>
            <DialogHeader><DialogTitle><span className="num text-accent-foreground">{sel.id}</span> · {sel.scenario}</DialogTitle><DialogDescription>Documented test case</DialogDescription></DialogHeader>
            <KV items={[["Module", <ModuleChip key="m" id={sel.module} />], ["Priority", humanize(sel.priority)], ["Preconditions", sel.preconditions], ["Input", sel.input], ["Expected result", sel.expected], ["Requirements", <span key="r" className="flex flex-wrap gap-1">{sel.requirements.map((r) => <ReqLink key={r} id={r} />)}</span>]]} />
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Record execution</p>
              <Field label="Execution status"><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TestStatus })}><SelectTrigger aria-label="Execution status"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Actual result" error={err}><Textarea rows={2} value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} placeholder="What you observed" /></Field>
              <Field label="Remarks"><Textarea rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Defect notes, environment…" /></Field>
              {runs[sel.id] && <p className="text-xs text-muted-foreground">Last recorded by {runs[sel.id].updatedBy} on {fmtDateTime(runs[sel.id].updatedAt)}.</p>}
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setSelId(null)}>Cancel</Button><Button onClick={save}>Save result</Button></DialogFooter>
          </>)}
        </DialogContent>
      </Dialog>
    </>
  );
}
