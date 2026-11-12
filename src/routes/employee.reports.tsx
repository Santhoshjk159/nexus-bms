import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useBank } from "@/services/store";
import { PageHeader, Panel } from "@/components/finance/ui";
import { BarsChart, DonutChart, TrendChart, byMonth } from "@/components/finance/charts";
import { Button } from "@/components/ui/button";
import { downloadCsv, humanize } from "@/lib/format";

export const Route = createFileRoute("/employee/reports")({
  head: () => ({ meta: [{ title: "Reports — NEXUS BANK Operations" }, { name: "description", content: "Daily transactions, acquisition, account growth and loan portfolio." }] }),
  component: Reports,
});

function Reports() {
  const txns = useBank((s) => s.transactions); const customers = useBank((s) => s.customers); const accounts = useBank((s) => s.accounts); const loans = useBank((s) => s.loans);
  const daily = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 864e5); const day = txns.filter((t) => new Date(t.createdAt).toDateString() === d.toDateString());
    return { label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), credit: Math.round(day.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0)), debit: Math.round(day.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0)) };
  }), [txns]);
  const acq = useMemo(() => byMonth(customers, (c) => c.createdAt, 12, { customers: () => 1 }), [customers]);
  const growth = useMemo(() => byMonth(accounts, (a) => a.openedAt, 12, { savings: (a) => +(a.type === "SAVINGS"), current: (a) => +(a.type === "CURRENT"), fd: (a) => +(a.type === "FIXED_DEPOSIT") }), [accounts]);
  const portfolio = ["PERSONAL", "EDUCATION", "HOME"].map((p) => ({ name: humanize(p), value: loans.filter((l) => l.product === p && l.status === "ACTIVE").reduce((s, l) => s + l.outstanding, 0) }));
  const exp = (name: string, rows: Record<string, unknown>[]) => { downloadCsv(`${name}.csv`, rows); toast.success(`${humanize(name)} report exported`); };
  const btn = (name: string, rows: Record<string, unknown>[]) => <Button size="sm" variant="ghost" onClick={() => exp(name, rows)}><Download className="size-4" />CSV</Button>;
  return (
    <>
      <PageHeader title="Reports" description="Operational MIS generated from live (simulated) core data." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Daily transaction report" description="Last 14 days" actions={btn("daily_transactions", daily)}><BarsChart data={daily} keys={[{ key: "credit", label: "Credits" }, { key: "debit", label: "Debits" }]} /></Panel>
        <Panel title="Customer acquisition" description="New customers per month" actions={btn("customer_acquisition", acq)}><TrendChart data={acq} keys={[{ key: "customers", label: "New customers" }]} money={false} /></Panel>
        <Panel title="Account growth" description="Accounts opened per month by type" actions={btn("account_growth", growth)}><BarsChart data={growth} stacked money={false} keys={[{ key: "savings", label: "Savings" }, { key: "current", label: "Current" }, { key: "fd", label: "Fixed deposit" }]} /></Panel>
        <Panel title="Loan portfolio" description="Outstanding by product (active)" actions={btn("loan_portfolio", portfolio)}><DonutChart data={portfolio} /></Panel>
      </div>
    </>
  );
}
