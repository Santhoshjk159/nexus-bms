import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useCustomer } from "@/hooks/use-customer";
import { Amount, KV, PageHeader, Panel, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { TxnDrawer } from "@/components/finance/TxnDrawer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtDate, humanize, mask } from "@/lib/format";
import type { Transaction } from "@/types";

export const Route = createFileRoute("/customer/accounts")({
  head: () => ({ meta: [{ title: "Accounts — NEXUS BANK" }, { name: "description", content: "Savings, current and fixed deposit accounts." }] }),
  component: Accounts,
});

function Accounts() {
  const { accounts, txns } = useCustomer();
  const [filter, setFilter] = useState("ALL");
  const list = accounts.filter((a) => filter === "ALL" || a.type === filter);
  const [selId, setSelId] = useState(accounts[0]?.id);
  const [reveal, setReveal] = useState(false);
  const [txn, setTxn] = useState<Transaction | null>(null);
  const sel = accounts.find((a) => a.id === selId) ?? accounts[0];
  const history = useMemo(() => txns.filter((t) => t.accountId === sel?.id), [txns, sel]);
  return (
    <>
      <PageHeader title="Accounts" description="All deposit accounts held with NEXUS BANK." />
      <Tabs value={filter} onValueChange={setFilter} className="mb-4"><TabsList><TabsTrigger value="ALL">All</TabsTrigger><TabsTrigger value="SAVINGS">Savings</TabsTrigger><TabsTrigger value="CURRENT">Current</TabsTrigger><TabsTrigger value="FIXED_DEPOSIT">Fixed deposits</TabsTrigger></TabsList></Tabs>
      <div className="grid gap-4 md:grid-cols-3">
        {list.map((a) => (
          <button key={a.id} onClick={() => setSelId(a.id)} className={cn("card-surface p-5 text-left transition-all hover:-translate-y-0.5", sel?.id === a.id && "ring-2 ring-teal")}>
            <div className="flex items-center justify-between"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{humanize(a.type)}</p><StatusBadge status={a.status} /></div>
            <p className="mt-1 text-sm font-medium">{a.nickname}</p>
            <Amount value={a.balance} className="mt-3 block text-xl" />
            <p className="num mt-1 text-xs text-muted-foreground">{mask(a.accountNumber)} {a.interestRate > 0 && `· ${a.interestRate}% p.a.`}</p>
          </button>
        ))}
        {!list.length && <p className="text-sm text-muted-foreground">No accounts of this type.</p>}
      </div>
      {sel && (
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <Panel title="Account details" actions={<Button variant="ghost" size="sm" onClick={() => setReveal(!reveal)}>{reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{reveal ? "Hide" : "Reveal"}</Button>}>
            <KV items={[
              ["Account number", <span key="n" className="num inline-flex items-center gap-1.5">{reveal ? sel.accountNumber : mask(sel.accountNumber)}<button aria-label="Copy account number" onClick={() => { navigator.clipboard?.writeText(sel.accountNumber); toast.success("Account number copied"); }}><Copy className="size-3.5 text-muted-foreground" /></button></span>],
              ["Account type", humanize(sel.type)], ["Status", <StatusBadge key="s" status={sel.status} />], ["Opened on", fmtDate(sel.openedAt)],
              ["Interest rate", sel.interestRate ? `${sel.interestRate}% p.a.` : "Not applicable"], ["Currency", sel.currency],
              ...(sel.maturityDate ? [["Maturity date", fmtDate(sel.maturityDate)] as [string, string]] : []), ["IFSC", "NXBK0000001"],
            ]} />
          </Panel>
          <div className="xl:col-span-2">
            <DataTable rows={history} pageSize={8} onRowClick={setTxn} searchText={(t) => `${t.description} ${t.reference}`} defaultSort={{ key: "date", dir: "desc" }} columns={[
              { key: "date", header: "Date", cell: (t) => fmtDate(t.createdAt), sort: (t) => t.createdAt },
              { key: "desc", header: "Description", cell: (t) => <div><p className="font-medium">{t.description}</p><p className="num text-xs text-muted-foreground">{t.reference}</p></div> },
              { key: "status", header: "Status", cell: (t) => <StatusBadge status={t.status} />, hideOnMobile: true },
              { key: "amt", header: "Amount", cell: (t) => <Amount value={t.amount} type={t.type} />, sort: (t) => t.amount, className: "text-right" },
              { key: "bal", header: "Balance", cell: (t) => <Amount value={t.balanceAfter} />, className: "text-right", hideOnMobile: true },
            ]} />
          </div>
        </div>
      )}
      <TxnDrawer txn={txn} onClose={() => setTxn(null)} />
    </>
  );
}
