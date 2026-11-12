import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, BadgeCheck, Landmark, ShieldAlert, Users, Wallet, Banknote } from "lucide-react";
import { useBank } from "@/services/store";
import { PageHeader, Panel, StatCard } from "@/components/finance/ui";
import { BarsChart, DonutChart, TrendChart, byMonth } from "@/components/finance/charts";
import { humanize, inr } from "@/lib/format";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin dashboard — NEXUS BANK" }, { name: "description", content: "Bank-wide KPIs, revenue and portfolio analytics." }] }),
  component: AdminDash,
});

function AdminDash() {
  const s = useBank((x) => x);
  const done = s.transactions.filter((t) => t.status === "COMPLETED");
  const deposits = done.filter((t) => t.type === "CREDIT").reduce((a, t) => a + t.amount, 0);
  const withdrawals = done.filter((t) => t.type === "DEBIT").reduce((a, t) => a + t.amount, 0);
  const portfolio = s.loans.filter((l) => l.status === "ACTIVE").reduce((a, l) => a + l.outstanding, 0);
  const revenue = useMemo(() => byMonth(done, (t) => t.createdAt, 6, { interest: (t) => (t.type === "DEBIT" ? t.amount * 0.012 : 0), fees: (t) => (t.channel === "CARD" ? t.amount * 0.018 : 0) }), [done]);
  const volume = useMemo(() => byMonth(done, (t) => t.createdAt, 6, { value: (t) => t.amount }), [done]);
  const growth = useMemo(() => { let c = s.customers.filter((x) => new Date(x.createdAt) < new Date(Date.now() - 365 * 864e5)).length; return byMonth(s.customers, (x) => x.createdAt, 12, { n: () => 1 }).map((r) => ({ label: r.label, customers: (c += Number(r.n)) })); }, [s.customers]);
  const dist = ["SAVINGS", "CURRENT", "FIXED_DEPOSIT"].map((t) => ({ name: humanize(t), value: s.accounts.filter((a) => a.type === t).reduce((x, a) => x + a.balance, 0) }));
  const lp = ["PERSONAL", "EDUCATION", "HOME"].map((p) => ({ label: humanize(p), sanctioned: s.loans.filter((l) => l.product === p && ["ACTIVE", "APPROVED", "CLOSED"].includes(l.status)).reduce((x, l) => x + l.principal, 0), outstanding: s.loans.filter((l) => l.product === p && l.status === "ACTIVE").reduce((x, l) => x + l.outstanding, 0) }));
  return (
    <>
      <PageHeader title="Enterprise overview" description="Consolidated view across all branches." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total customers" value={s.customers.length} icon={Users} delta={8.2} hint="vs last quarter" />
        <StatCard label="Active accounts" value={s.accounts.filter((a) => a.status === "ACTIVE").length} icon={Wallet} tone="teal" hint={`${s.accounts.length} total`} />
        <StatCard label="Total deposits" value={inr(deposits, true)} icon={ArrowDownLeft} tone="success" delta={5.4} />
        <StatCard label="Total withdrawals" value={inr(withdrawals, true)} icon={ArrowUpRight} tone="warning" delta={-2.1} />
        <StatCard label="Loan portfolio" value={inr(portfolio, true)} icon={Landmark} hint={`${s.loans.filter((l) => l.status === "ACTIVE").length} active loans`} />
        <StatCard label="Pending KYC" value={s.kycApplications.filter((k) => k.status === "PENDING").length} icon={BadgeCheck} tone="warning" />
        <StatCard label="Suspicious transactions" value={s.fraudAlerts.filter((a) => !["CLEARED", "CONFIRMED"].includes(a.status)).length} icon={ShieldAlert} tone="danger" />
        <StatCard label="Deposit book" value={inr(s.accounts.reduce((a, x) => a + x.balance, 0), true)} icon={Banknote} tone="teal" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Revenue analytics" description="Estimated interest margin and fee income"><BarsChart data={revenue} stacked keys={[{ key: "interest", label: "Net interest" }, { key: "fees", label: "Fees" }]} /></Panel>
        <Panel title="Transaction volume trend" description="Completed value per month"><TrendChart data={volume} keys={[{ key: "value", label: "Volume" }]} /></Panel>
        <Panel title="Customer growth" description="Cumulative customers, 12 months"><TrendChart data={growth} keys={[{ key: "customers", label: "Customers" }]} money={false} /></Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Panel title="Account distribution"><DonutChart data={dist} /></Panel>
          <Panel title="Loan portfolio"><BarsChart data={lp} height={240} keys={[{ key: "sanctioned", label: "Sanctioned" }, { key: "outstanding", label: "Outstanding" }]} /></Panel>
        </div>
      </div>
    </>
  );
}
