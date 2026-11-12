import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { useCustomer } from "@/hooks/use-customer";
import { Amount, PageHeader, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { TxnDrawer } from "@/components/finance/TxnDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadCsv, fmtDate, humanize, mask } from "@/lib/format";
import type { Transaction } from "@/types";

export const Route = createFileRoute("/customer/transactions")({
  head: () => ({ meta: [{ title: "Transactions — NEXUS BANK" }, { name: "description", content: "Search, filter and download your transaction history." }] }),
  component: Txns,
});

function Txns() {
  const { accounts, txns } = useCustomer();
  const [type, setType] = useState("ALL"), [status, setStatus] = useState("ALL"), [range, setRange] = useState("90"), [min, setMin] = useState(""), [max, setMax] = useState(""), [acct, setAcct] = useState("ALL");
  const [sel, setSel] = useState<Transaction | null>(null);
  const [stmt, setStmt] = useState(false);
  const rows = useMemo(() => txns.filter((t) =>
    (type === "ALL" || t.type === type) && (status === "ALL" || t.status === status) && (acct === "ALL" || t.accountId === acct) &&
    (range === "ALL" || new Date(t.createdAt).getTime() > Date.now() - Number(range) * 864e5) && (!min || t.amount >= Number(min)) && (!max || t.amount <= Number(max))), [txns, type, status, range, min, max, acct]);
  const exportCsv = () => {
    downloadCsv(`nexus-statement-${new Date().toISOString().slice(0, 10)}.csv`, rows.map((t) => ({ date: t.createdAt, reference: t.reference, description: t.description, type: t.type, amount: t.amount, status: t.status, balance: t.balanceAfter })));
    toast.success(`Statement downloaded · ${rows.length} transactions`); setStmt(false);
  };
  return (
    <>
      <PageHeader title="Transactions" description="Complete history across all your accounts." actions={<Button onClick={() => setStmt(true)}><Download className="size-4" />Download statement</Button>} />
      <DataTable rows={rows} onRowClick={setSel} searchText={(t) => `${t.description} ${t.reference} ${t.counterparty}`} searchPlaceholder="Search description or reference" defaultSort={{ key: "date", dir: "desc" }}
        toolbar={<>
          <Select value={acct} onValueChange={setAcct}><SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All accounts</SelectItem>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.nickname}</SelectItem>)}</SelectContent></Select>
          <Select value={range} onValueChange={setRange}><SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="90">Last 90 days</SelectItem><SelectItem value="ALL">All time</SelectItem></SelectContent></Select>
          <Select value={type} onValueChange={setType}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All types</SelectItem><SelectItem value="CREDIT">Credit</SelectItem><SelectItem value="DEBIT">Debit</SelectItem></SelectContent></Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem>{["COMPLETED", "PENDING", "FAILED", "UNDER_REVIEW"].map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent></Select>
          <Input value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder="Min ₹" className="num h-9 w-24" aria-label="Minimum amount" />
          <Input value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="Max ₹" className="num h-9 w-24" aria-label="Maximum amount" />
        </>}
        columns={[
          { key: "date", header: "Date", cell: (t) => fmtDate(t.createdAt), sort: (t) => t.createdAt },
          { key: "desc", header: "Description", cell: (t) => <div><p className="font-medium">{t.description}</p><p className="text-xs text-muted-foreground">{humanize(t.category)} · {humanize(t.channel)}</p></div> },
          { key: "ref", header: "Reference", cell: (t) => <span className="num text-xs">{t.reference}</span>, hideOnMobile: true },
          { key: "acct", header: "Account", cell: (t) => <span className="num text-xs">{mask(accounts.find((a) => a.id === t.accountId)?.accountNumber ?? "")}</span>, hideOnMobile: true },
          { key: "st", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
          { key: "amt", header: "Amount", cell: (t) => <Amount value={t.amount} type={t.type} />, sort: (t) => t.amount, className: "text-right" },
        ]} />
      <TxnDrawer txn={sel} onClose={() => setSel(null)} />
      <Dialog open={stmt} onOpenChange={setStmt}>
        <DialogContent>
          <DialogHeader><DialogTitle>Download statement</DialogTitle><DialogDescription>Exports the {rows.length} transactions matching your current filters.</DialogDescription></DialogHeader>
          <div className="flex items-center gap-3 rounded-md border border-border p-3"><FileText className="size-8 text-accent-foreground" /><div><p className="text-sm font-medium">CSV statement</p><p className="text-xs text-muted-foreground">Date, reference, description, amount, status, balance</p></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setStmt(false)}>Cancel</Button><Button onClick={exportCsv} disabled={!rows.length}><Download className="size-4" />Download</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
