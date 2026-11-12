import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Flag, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { actions, useBank } from "@/services/store";
import { useLookup } from "@/hooks/use-lookup";
import { Amount, PageHeader, StatCard, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { TxnDrawer } from "@/components/finance/TxnDrawer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { fmtDateTime, humanize, inr } from "@/lib/format";
import { Activity, AlertTriangle, XCircle } from "lucide-react";

export const Route = createFileRoute("/employee/transactions")({
  head: () => ({ meta: [{ title: "Transaction monitoring — NEXUS BANK" }, { name: "description", content: "Monitor, review and escalate transactions." }] }),
  component: Monitor,
});

function Monitor() {
  const txns = useBank((s) => s.transactions); const { acct, custName } = useLookup();
  const [status, setStatus] = useState("ALL"); const [flagged, setFlagged] = useState(false); const [selId, setSelId] = useState<string | null>(null);
  const sel = txns.find((t) => t.id === selId) ?? null;
  const rows = useMemo(() => txns.filter((t) => (status === "ALL" || t.status === status) && (!flagged || t.flagged)), [txns, status, flagged]);
  const owner = (accountId: string) => { const a = acct(accountId); return a ? custName(a.customerId) : "—"; };
  return (
    <>
      <PageHeader title="Transaction monitoring" description="Bank-wide real-time transaction feed." />
      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <StatCard label="Total transactions" value={txns.length.toLocaleString("en-IN")} icon={Activity} />
        <StatCard label="Under review" value={txns.filter((t) => t.status === "UNDER_REVIEW").length} icon={AlertTriangle} tone="warning" />
        <StatCard label="Failed" value={txns.filter((t) => t.status === "FAILED").length} icon={XCircle} tone="danger" />
        <StatCard label="Flagged value" value={inr(txns.filter((t) => t.flagged).reduce((s, t) => s + t.amount, 0), true)} icon={Flag} tone="teal" />
      </div>
      <DataTable rows={rows} onRowClick={(t) => setSelId(t.id)} pageSize={12} searchText={(t) => `${t.reference} ${t.description} ${owner(t.accountId)} ${acct(t.accountId)?.accountNumber}`} searchPlaceholder="Reference, account or customer" defaultSort={{ key: "d", dir: "desc" }}
        toolbar={<>
          <label className="flex items-center gap-2 text-xs"><Switch checked={flagged} onCheckedChange={setFlagged} />Flagged only</label>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem>{["COMPLETED", "PENDING", "FAILED", "UNDER_REVIEW"].map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent></Select>
        </>}
        columns={[
          { key: "d", header: "Time", cell: (t) => <span className="text-xs">{fmtDateTime(t.createdAt)}</span>, sort: (t) => t.createdAt },
          { key: "r", header: "Reference", cell: (t) => <span className="num text-xs">{t.flagged && <Flag className="mr-1 inline size-3 text-destructive" />}{t.reference}</span> },
          { key: "c", header: "Customer", cell: (t) => owner(t.accountId), hideOnMobile: true },
          { key: "x", header: "Description", cell: (t) => t.description, hideOnMobile: true },
          { key: "s", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
          { key: "a", header: "Amount", cell: (t) => <Amount value={t.amount} type={t.type} />, sort: (t) => t.amount, className: "text-right" },
        ]} />
      <TxnDrawer txn={sel} onClose={() => setSelId(null)} footer={sel && (<>
        {sel.status !== "UNDER_REVIEW" && <Button variant="outline" onClick={() => { actions.setTxnStatus(sel.id, "UNDER_REVIEW"); toast.success("Transaction placed under review"); }}><Flag className="size-4" />Place under review</Button>}
        {sel.status === "UNDER_REVIEW" && <Button variant="outline" onClick={() => { actions.setTxnStatus(sel.id, "COMPLETED"); toast.success("Review cleared, transaction released"); }}><CheckCircle2 className="size-4" />Clear review</Button>}
        <Button variant="destructive" onClick={() => { actions.escalateTxn(sel.id); toast.success("Escalated to fraud monitoring"); }}><ShieldAlert className="size-4" />Escalate</Button>
      </>)} />
    </>
  );
}
