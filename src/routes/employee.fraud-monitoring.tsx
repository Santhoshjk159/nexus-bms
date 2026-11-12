import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, ShieldCheck, Siren, Search } from "lucide-react";
import { toast } from "sonner";
import { actions, useBank } from "@/services/store";
import { useLookup } from "@/hooks/use-lookup";
import { Field, KV, PageHeader, Panel, StatCard, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { DonutChart } from "@/components/finance/charts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fmtDateTime, humanize, inr } from "@/lib/format";
import type { FraudAlert } from "@/types";

export const Route = createFileRoute("/employee/fraud-monitoring")({
  head: () => ({ meta: [{ title: "Fraud monitoring — NEXUS BANK" }, { name: "description", content: "Rule-based fraud alerts, investigation and analyst notes." }] }),
  component: Fraud,
});
const SEV = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function Fraud() {
  const alerts = useBank((s) => s.fraudAlerts); const { custName } = useLookup();
  const [sev, setSev] = useState("ALL"); const [st, setSt] = useState("ALL"); const [selId, setSelId] = useState<string | null>(null); const [note, setNote] = useState("");
  const sel = alerts.find((a) => a.id === selId);
  const rows = alerts.filter((a) => (sev === "ALL" || a.severity === sev) && (st === "ALL" || a.status === st));
  const byRule = Object.entries(alerts.reduce<Record<string, number>>((m, a) => ((m[a.rule] = (m[a.rule] ?? 0) + 1), m), {})).map(([name, value]) => ({ name, value }));
  const update = (status: FraudAlert["status"]) => { actions.updateAlert(sel!.id, status, note.trim() || undefined); setNote(""); toast.success(`Alert marked ${humanize(status).toLowerCase()}`); };
  return (
    <>
      <PageHeader title="Fraud monitoring" description="Alerts raised by the rule engine: large transfers, velocity, failed attempts and suspicious activity." />
      <div className="grid gap-4 xl:grid-cols-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-3">
          <StatCard label="Open" value={alerts.filter((a) => a.status === "OPEN").length} icon={Siren} tone="danger" />
          <StatCard label="Investigating / escalated" value={alerts.filter((a) => a.status === "INVESTIGATING" || a.status === "ESCALATED").length} icon={Search} tone="warning" />
          <StatCard label="Resolved" value={alerts.filter((a) => a.status === "CLEARED" || a.status === "CONFIRMED").length} icon={ShieldCheck} tone="success" />
          <div className="sm:col-span-2 xl:col-span-3">
            <DataTable rows={rows} onRowClick={(a) => { setSelId(a.id); setNote(""); }} searchText={(a) => `${a.transactionRef} ${a.accountNumber} ${custName(a.customerId)} ${a.rule}`} defaultSort={{ key: "score", dir: "desc" }}
              toolbar={<>
                <Select value={sev} onValueChange={setSev}><SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All severity</SelectItem>{SEV.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent></Select>
                <Select value={st} onValueChange={setSt}><SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem>{["OPEN", "INVESTIGATING", "ESCALATED", "CLEARED", "CONFIRMED"].map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent></Select>
              </>}
              columns={[
                { key: "rule", header: "Rule", cell: (a) => <div><p className="font-medium">{a.rule}</p><p className="num text-xs text-muted-foreground">{a.transactionRef}</p></div> },
                { key: "c", header: "Customer", cell: (a) => custName(a.customerId), hideOnMobile: true },
                { key: "amt", header: "Amount", cell: (a) => <span className="num">{inr(a.amount)}</span>, sort: (a) => a.amount, hideOnMobile: true },
                { key: "score", header: "Score", cell: (a) => <span className="num font-semibold">{a.score}</span>, sort: (a) => a.score },
                { key: "sev", header: "Severity", cell: (a) => <StatusBadge status={a.severity} />, sort: (a) => SEV.indexOf(a.severity) },
                { key: "st", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
              ]} />
          </div>
        </div>
        <Panel title="Alerts by rule"><DonutChart data={byRule} money={false} height={300} /></Panel>
      </div>
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sel && (<>
            <SheetHeader><SheetTitle className="flex items-center gap-2"><ShieldAlert className="size-5 text-destructive" />{sel.rule}</SheetTitle><SheetDescription className="num">{sel.id} · {sel.transactionRef}</SheetDescription></SheetHeader>
            <div className="mt-6 space-y-6">
              <KV items={[["Customer", custName(sel.customerId)], ["Account", <span key="a" className="num">{sel.accountNumber}</span>], ["Amount", <span key="m" className="num">{inr(sel.amount)}</span>], ["Risk score", <span key="s" className="num">{sel.score}/100</span>], ["Severity", <StatusBadge key="v" status={sel.severity} />], ["Status", <StatusBadge key="t" status={sel.status} />], ["Raised", fmtDateTime(sel.createdAt)]]} />
              <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analyst notes</p>
                <ul className="space-y-2">{sel.notes.map((n, i) => (<li key={i} className="rounded-md bg-muted p-3 text-sm"><p>{n.text}</p><p className="mt-1 text-[11px] text-muted-foreground">{n.by} · {fmtDateTime(n.at)}</p></li>))}{!sel.notes.length && <li className="text-sm text-muted-foreground">No notes yet.</li>}</ul>
              </div>
              <Field label="Add note"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Findings, customer callback outcome…" /></Field>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={!note.trim()} onClick={() => { actions.updateAlert(sel.id, sel.status, note.trim()); setNote(""); toast.success("Note added"); }}>Save note</Button>
                {sel.status === "OPEN" && <Button variant="outline" onClick={() => update("INVESTIGATING")}>Start investigation</Button>}
                {sel.status !== "ESCALATED" && sel.status !== "CLEARED" && sel.status !== "CONFIRMED" && <Button variant="outline" onClick={() => update("ESCALATED")}>Escalate</Button>}
                {sel.status !== "CLEARED" && sel.status !== "CONFIRMED" && <><Button onClick={() => update("CLEARED")}>Clear (false positive)</Button><Button variant="destructive" onClick={() => update("CONFIRMED")}>Confirm fraud</Button></>}
              </div>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </>
  );
}
