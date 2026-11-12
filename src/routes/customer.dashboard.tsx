import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CreditCard, Landmark, PiggyBank, Receipt, UserPlus, Wallet } from "lucide-react";
import { useCustomer } from "@/hooks/use-customer";
import { Amount, PageHeader, Panel, StatCard, StatusBadge } from "@/components/finance/ui";
import { BarsChart, DonutChart, byMonth } from "@/components/finance/charts";
import { TxnDrawer } from "@/components/finance/TxnDrawer";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtDateTime, humanize, inr, mask } from "@/lib/format";
import type { Transaction } from "@/types";

export const Route = createFileRoute("/customer/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NEXUS BANK" }, { name: "description", content: "Your balances, spending and recent activity." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { customer, accounts, txns } = useCustomer();
  const [sel, setSel] = useState<Transaction | null>(null);
  const done = txns.filter((t) => t.status === "COMPLETED");
  const liquid = accounts.filter((a) => a.type !== "FIXED_DEPOSIT").reduce((s, a) => s + a.balance, 0);
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const cutoff = Date.now() - 30 * 864e5;
  const deposits = done.filter((t) => t.type === "CREDIT" && new Date(t.createdAt).getTime() > cutoff).reduce((s, t) => s + t.amount, 0);
  const withdrawals = done.filter((t) => t.type === "DEBIT" && new Date(t.createdAt).getTime() > cutoff).reduce((s, t) => s + t.amount, 0);
  const monthly = useMemo(() => byMonth(done, (t) => t.createdAt, 6, { inflow: (t) => (t.type === "CREDIT" ? t.amount : 0), outflow: (t) => (t.type === "DEBIT" ? t.amount : 0) }), [done]);
  const spending = useMemo(() => {
    const m = new Map<string, number>();
    done.filter((t) => t.type === "DEBIT" && new Date(t.createdAt).getTime() > Date.now() - 90 * 864e5).forEach((t) => m.set(humanize(t.category), (m.get(humanize(t.category)) ?? 0) + t.amount));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [done]);
  const goal = 1500000, saved = accounts.filter((a) => a.type !== "CURRENT").reduce((s, a) => s + a.balance, 0);
  const quick = [
    { to: "/customer/transfers", label: "Transfer", icon: ArrowLeftRight }, { to: "/customer/beneficiaries", label: "Add payee", icon: UserPlus },
    { to: "/customer/transactions", label: "Statement", icon: Receipt }, { to: "/customer/cards", label: "Cards", icon: CreditCard }, { to: "/customer/loans", label: "Loans", icon: Landmark },
  ] as const;

  return (
    <>
      <PageHeader title={`Good day, ${customer.firstName}`} description={`Customer ID ${customer.customerNumber} · Last login ${fmtDateTime(new Date(Date.now() - 864e5).toISOString())}`} actions={<Button asChild><Link to="/customer/transfers"><ArrowLeftRight className="size-4" />New transfer</Link></Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available balance" value={inr(liquid)} icon={Wallet} hint="Savings + current" />
        <StatCard label="Total relationship" value={inr(total)} icon={PiggyBank} tone="teal" hint={`${accounts.length} accounts`} />
        <StatCard label="Deposits · 30 days" value={inr(deposits)} icon={ArrowDownLeft} tone="success" />
        <StatCard label="Withdrawals · 30 days" value={inr(withdrawals)} icon={ArrowUpRight} tone="warning" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Monthly transaction summary" description="Inflow vs outflow, last 6 months" className="xl:col-span-2"><BarsChart data={monthly} keys={[{ key: "inflow", label: "Inflow" }, { key: "outflow", label: "Outflow" }]} /></Panel>
        <Panel title="Spending analytics" description="Top categories, last 90 days">{spending.length ? <DonutChart data={spending} /> : <p className="text-sm text-muted-foreground">No spending yet.</p>}</Panel>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Accounts overview" actions={<Link to="/customer/accounts" className="text-xs font-medium text-accent-foreground hover:underline">View all</Link>} className="xl:col-span-2" bodyClassName="p-0">
          {accounts.map((a) => (
            <Link key={a.id} to="/customer/accounts" className="flex items-center justify-between border-b border-border px-5 py-3.5 last:border-0 hover:bg-muted/50">
              <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md bg-secondary text-primary"><Wallet className="size-4" /></span><div><p className="text-sm font-medium">{a.nickname}</p><p className="num text-xs text-muted-foreground">{humanize(a.type)} · {mask(a.accountNumber)}</p></div></div>
              <div className="text-right"><Amount value={a.balance} /><div className="mt-0.5"><StatusBadge status={a.status} /></div></div>
            </Link>
          ))}
        </Panel>
        <Panel title="Quick actions">
          <div className="grid grid-cols-3 gap-2">
            {quick.map((q) => (<Link key={q.label} to={q.to} className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-xs font-medium transition-colors hover:border-teal hover:bg-accent"><q.icon className="size-4 text-accent-foreground" />{q.label}</Link>))}
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-xs"><span className="font-medium">Savings goal · Home down payment</span><span className="num text-muted-foreground">{Math.min(100, Math.round((saved / goal) * 100))}%</span></div>
            <Progress value={Math.min(100, (saved / goal) * 100)} className="mt-2 h-2" />
            <p className="num mt-1.5 text-xs text-muted-foreground">{inr(saved)} of {inr(goal)}</p>
          </div>
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Recent transactions" className="xl:col-span-2" bodyClassName="p-0" actions={<Link to="/customer/transactions" className="text-xs font-medium text-accent-foreground hover:underline">View all</Link>}>
          {txns.slice(0, 7).map((t) => (
            <button key={t.id} onClick={() => setSel(t)} className="flex w-full items-center justify-between border-b border-border px-5 py-3 text-left last:border-0 hover:bg-muted/50">
              <div className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-full ${t.type === "CREDIT" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{t.type === "CREDIT" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</span><div><p className="text-sm font-medium">{t.description}</p><p className="text-xs text-muted-foreground">{fmtDate(t.createdAt)} · {humanize(t.category)}</p></div></div>
              <div className="text-right"><Amount value={t.amount} type={t.type} />{t.status !== "COMPLETED" && <div className="mt-0.5"><StatusBadge status={t.status} /></div>}</div>
            </button>
          ))}
        </Panel>
        <Panel title="Account activity">
          <ol className="relative space-y-4 border-l border-border pl-4">
            {txns.slice(0, 6).map((t) => (<li key={t.id} className="relative"><span className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-card bg-teal" /><p className="text-sm">{t.type === "CREDIT" ? "Received" : "Paid"} <span className="num font-medium">{inr(t.amount)}</span> {t.type === "CREDIT" ? "from" : "to"} {t.counterparty}</p><p className="text-xs text-muted-foreground">{fmtDateTime(t.createdAt)}</p></li>))}
          </ol>
        </Panel>
      </div>
      <TxnDrawer txn={sel} onClose={() => setSel(null)} />
    </>
  );
}
