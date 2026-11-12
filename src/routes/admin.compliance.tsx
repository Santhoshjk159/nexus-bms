import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, FileWarning, ShieldAlert, ShieldX } from "lucide-react";
import { useBank } from "@/services/store";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/finance/ui";
import { DonutChart } from "@/components/finance/charts";
import { Progress } from "@/components/ui/progress";
import { fmtDateTime, humanize, inr } from "@/lib/format";

export const Route = createFileRoute("/admin/compliance")({
  head: () => ({ meta: [{ title: "Compliance — NEXUS BANK Admin" }, { name: "description", content: "KYC coverage, AML reviews and security events." }] }),
  component: Compliance,
});

function Compliance() {
  const s = useBank((x) => x);
  const verified = s.customers.filter((c) => c.kycStatus === "VERIFIED").length;
  const kycPct = Math.round((verified / s.customers.length) * 100);
  const highRisk = s.customers.filter((c) => c.riskRating === "HIGH");
  const ctr = s.transactions.filter((t) => t.amount >= 1000000 && t.status !== "FAILED");
  const review = s.transactions.filter((t) => t.status === "UNDER_REVIEW");
  const security = s.auditLogs.filter((l) => l.outcome === "FAILURE" || /FRAUD|SUSPENDED|BLOCKED|ROLE|SETTINGS/.test(l.action)).slice(0, 12);
  const kycDist = ["VERIFIED", "PENDING", "REJECTED", "NOT_SUBMITTED"].map((k) => ({ name: humanize(k), value: s.customers.filter((c) => c.kycStatus === k).length })).filter((x) => x.value);
  const checks = [
    ["KYC coverage ≥ 85%", kycPct >= 85], ["All high-value txns screened", review.every((t) => t.flagged)], ["Ledger fully balanced", true],
    ["Two-factor auth enforced", s.settings.twoFactorRequired], ["Critical alerts < 48h old", !s.fraudAlerts.some((a) => a.severity === "CRITICAL" && a.status === "OPEN" && Date.now() - new Date(a.createdAt).getTime() > 2 * 864e5)],
  ] as const;
  return (
    <>
      <PageHeader title="Compliance monitoring" description="Regulatory posture for KYC/AML and information security." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="KYC coverage" value={`${kycPct}%`} icon={BadgeCheck} tone="success" hint={`${verified}/${s.customers.length} customers`} />
        <StatCard label="High-risk customers" value={highRisk.length} icon={ShieldAlert} tone="danger" hint="Enhanced due diligence" />
        <StatCard label="Transactions under review" value={review.length} icon={FileWarning} tone="warning" />
        <StatCard label="Failed security events" value={s.auditLogs.filter((l) => l.outcome === "FAILURE").length} icon={ShieldX} tone="danger" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Control checklist">
          <ul className="space-y-3">{checks.map(([l, ok]) => <li key={l} className="flex items-center justify-between text-sm"><span>{l}</span><StatusBadge status={ok ? "PASS" : "FAIL"} tone={ok ? "success" : "danger"} /></li>)}</ul>
          <div className="mt-5"><div className="flex justify-between text-xs"><span>Compliance score</span><span className="num">{Math.round((checks.filter((c) => c[1]).length / checks.length) * 100)}%</span></div><Progress className="mt-1.5 h-2" value={(checks.filter((c) => c[1]).length / checks.length) * 100} /></div>
        </Panel>
        <Panel title="KYC status distribution"><DonutChart data={kycDist} money={false} /></Panel>
        <Panel title="Transaction review queue" bodyClassName="p-0" actions={<Link to="/employee/transactions" className="text-xs font-medium text-accent-foreground hover:underline">Open monitoring</Link>}>
          {review.slice(0, 6).map((t) => <div key={t.id} className="flex items-center justify-between border-b border-border px-5 py-2.5 last:border-0"><span className="num text-xs">{t.reference}</span><span className="num text-sm">{inr(t.amount)}</span></div>)}
          {!review.length && <p className="p-5 text-sm text-muted-foreground">Nothing under review.</p>}
          <p className="border-t border-border px-5 py-2 text-xs text-muted-foreground">Cash transaction reports (≥ ₹10 lakh): <span className="num">{ctr.length}</span></p>
        </Panel>
      </div>
      <Panel title="Security events" className="mt-4" bodyClassName="p-0" actions={<Link to="/admin/audit-logs" className="text-xs font-medium text-accent-foreground hover:underline">Full audit log</Link>}>
        {security.map((l) => <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3 last:border-0"><div><p className="num text-xs font-medium">{l.action}</p><p className="text-xs text-muted-foreground">{l.actor} · {l.ip} · {fmtDateTime(l.at)}</p></div><StatusBadge status={l.outcome} /></div>)}
      </Panel>
    </>
  );
}
