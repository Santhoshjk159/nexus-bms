import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Headphones, Landmark, ShieldAlert, Wallet, ArrowLeftRight } from "lucide-react";
import { useBank } from "@/services/store";
import { useLookup } from "@/hooks/use-lookup";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/finance/ui";
import { BarsChart, byMonth } from "@/components/finance/charts";
import { fmtDateTime, inr } from "@/lib/format";
import { getSession } from "@/lib/auth";

export const Route = createFileRoute("/employee/dashboard")({
  head: () => ({ meta: [{ title: "Operations dashboard — NEXUS BANK" }, { name: "description", content: "Work queues for KYC, fraud, loans and support." }] }),
  component: EmpDash,
});

function EmpDash() {
  const kyc = useBank((s) => s.kycApplications.filter((k) => k.status === "PENDING"));
  const alerts = useBank((s) => s.fraudAlerts.filter((a) => a.status === "OPEN" || a.status === "INVESTIGATING"));
  const loans = useBank((s) => s.loans.filter((l) => l.status === "APPLIED" || l.status === "UNDER_REVIEW"));
  const tickets = useBank((s) => s.tickets.filter((t) => t.status === "OPEN"));
  const apps = useBank((s) => s.accountApplications.filter((a) => a.status === "PENDING"));
  const txns = useBank((s) => s.transactions);
  const { custName } = useLookup();
  const today = txns.filter((t) => new Date(t.createdAt).toDateString() === new Date().toDateString());
  const vol = useMemo(() => byMonth(txns.filter((t) => t.status === "COMPLETED"), (t) => t.createdAt, 6, { count: () => 1 }), [txns]);
  return (
    <>
      <PageHeader title={`Operations · ${getSession()?.name}`} description="Your work queues across the bank." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Pending KYC" value={kyc.length} icon={BadgeCheck} tone="warning" />
        <StatCard label="Open fraud alerts" value={alerts.length} icon={ShieldAlert} tone="danger" />
        <StatCard label="Loan applications" value={loans.length} icon={Landmark} tone="teal" />
        <StatCard label="Account requests" value={apps.length} icon={Wallet} />
        <StatCard label="Open tickets" value={tickets.length} icon={Headphones} tone="primary" hint={`${today.length} txns today`} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Transaction volume" description="Completed transactions per month" className="xl:col-span-2"><BarsChart data={vol} keys={[{ key: "count", label: "Transactions" }]} money={false} /></Panel>
        <Panel title="Priority alerts" bodyClassName="p-0" actions={<Link to="/employee/fraud-monitoring" className="text-xs font-medium text-accent-foreground hover:underline">Open queue</Link>}>
          {alerts.slice(0, 6).map((a) => (<div key={a.id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0"><div><p className="text-sm font-medium">{a.rule}</p><p className="text-xs text-muted-foreground">{custName(a.customerId)} · <span className="num">{inr(a.amount)}</span></p></div><StatusBadge status={a.severity} /></div>))}
          {!alerts.length && <p className="p-5 text-sm text-muted-foreground">No open alerts.</p>}
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="KYC queue" bodyClassName="p-0" actions={<Link to="/employee/kyc" className="text-xs font-medium text-accent-foreground hover:underline">Review</Link>}>
          {kyc.slice(0, 5).map((k) => (<div key={k.id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0"><div><p className="text-sm font-medium">{custName(k.customerId)}</p><p className="text-xs text-muted-foreground">{fmtDateTime(k.submittedAt)}</p></div><StatusBadge status={k.status} /></div>))}
          {!kyc.length && <p className="p-5 text-sm text-muted-foreground">Queue is clear.</p>}
        </Panel>
        <Panel title="Loan desk" bodyClassName="p-0" actions={<Link to="/employee/loans" className="text-xs font-medium text-accent-foreground hover:underline">Review</Link>}>
          {loans.slice(0, 5).map((l) => (<div key={l.id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0"><div><p className="text-sm font-medium">{custName(l.customerId)}</p><p className="num text-xs text-muted-foreground">{l.loanNumber} · {inr(l.principal)}</p></div><StatusBadge status={l.status} /></div>))}
          {!loans.length && <p className="p-5 text-sm text-muted-foreground">No pending applications.</p>}
        </Panel>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeftRight className="size-3.5" />All actions are recorded in the audit trail.</p>
    </>
  );
}
