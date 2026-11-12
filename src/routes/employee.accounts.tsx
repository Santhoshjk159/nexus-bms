import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { actions, useBank } from "@/services/store";
import { useLookup } from "@/hooks/use-lookup";
import { Amount, Field, PageHeader, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { TxnDrawer } from "@/components/finance/TxnDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate, humanize, inr } from "@/lib/format";
import type { AccountType, BankAccount, Transaction } from "@/types";

export const Route = createFileRoute("/employee/accounts")({
  head: () => ({ meta: [{ title: "Account operations — NEXUS BANK" }, { name: "description", content: "Open, review, suspend and activate accounts." }] }),
  component: AcctOps,
});

function AcctOps() {
  const accounts = useBank((s) => s.accounts); const apps = useBank((s) => s.accountApplications); const txns = useBank((s) => s.transactions);
  const { custName, customers } = useLookup();
  const [statusTarget, setStatusTarget] = useState<BankAccount | null>(null); const [reason, setReason] = useState(""); const [authCode, setAuthCode] = useState(""); const [err, setErr] = useState("");
  const [history, setHistory] = useState<BankAccount | null>(null); const [txn, setTxn] = useState<Transaction | null>(null);
  const [openNew, setOpenNew] = useState(false); const [nCust, setNCust] = useState(""); const [nType, setNType] = useState<AccountType>("SAVINGS"); const [nDep, setNDep] = useState("10000"); const [nErr, setNErr] = useState("");
  const applyStatus = () => {
    if (reason.trim().length < 5) return setErr("Provide a reason (min 5 characters)");
    if (authCode !== "2468") return setErr("Invalid supervisor authorization code (demo: 2468)");
    const next = statusTarget!.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    actions.setAccountStatus(statusTarget!.id, next, reason); toast.success(`Account ${next === "ACTIVE" ? "activated" : "suspended"}`); setStatusTarget(null);
  };
  const openAccount = () => {
    const d = Number(nDep);
    if (!nCust) return setNErr("Select a customer");
    if (customers.find((c) => c.id === nCust)?.kycStatus !== "VERIFIED") return setNErr("Customer KYC must be verified first");
    if (nType === "FIXED_DEPOSIT" ? d < 10000 : d < 1000) return setNErr(`Minimum deposit is ${inr(nType === "FIXED_DEPOSIT" ? 10000 : 1000)}`);
    const n = actions.openAccount(nCust, nType, d); toast.success("Account opened", { description: `Account number ${n}` }); setOpenNew(false); setNErr("");
  };
  return (
    <>
      <PageHeader title="Account operations" actions={<Button onClick={() => { setOpenNew(true); setNErr(""); }}><Plus className="size-4" />Open new account</Button>} />
      <Tabs defaultValue="all">
        <TabsList><TabsTrigger value="all">All accounts</TabsTrigger><TabsTrigger value="apps">Applications ({apps.filter((a) => a.status === "PENDING").length})</TabsTrigger></TabsList>
        <TabsContent value="all" className="mt-4">
          <DataTable rows={accounts} searchText={(a) => `${a.accountNumber} ${custName(a.customerId)}`} searchPlaceholder="Account number or customer" columns={[
            { key: "n", header: "Account", cell: (a) => <div><p className="num font-medium">{a.accountNumber}</p><p className="text-xs text-muted-foreground">{humanize(a.type)}</p></div> },
            { key: "c", header: "Customer", cell: (a) => custName(a.customerId), sort: (a) => custName(a.customerId) },
            { key: "b", header: "Balance", cell: (a) => <Amount value={a.balance} />, sort: (a) => a.balance },
            { key: "o", header: "Opened", cell: (a) => fmtDate(a.openedAt), sort: (a) => a.openedAt, hideOnMobile: true },
            { key: "s", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
            { key: "x", header: "", className: "text-right", cell: (a) => (<div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => setHistory(a)}>History</Button><Button size="sm" variant="outline" onClick={() => { setStatusTarget(a); setReason(""); setAuthCode(""); setErr(""); }}>{a.status === "ACTIVE" ? "Suspend" : "Activate"}</Button></div>) },
          ]} />
        </TabsContent>
        <TabsContent value="apps" className="mt-4">
          <DataTable rows={apps} columns={[
            { key: "id", header: "Application", cell: (a) => <span className="num text-xs">{a.id}</span> }, { key: "c", header: "Customer", cell: (a) => custName(a.customerId) },
            { key: "t", header: "Type", cell: (a) => humanize(a.type) }, { key: "d", header: "Initial deposit", cell: (a) => <Amount value={a.initialDeposit} /> },
            { key: "at", header: "Submitted", cell: (a) => fmtDate(a.submittedAt), hideOnMobile: true }, { key: "s", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
            { key: "x", header: "", className: "text-right", cell: (a) => a.status === "PENDING" ? (<div className="flex justify-end gap-1"><Button size="sm" variant="ghost" className="text-destructive" onClick={() => { actions.reviewApplication(a.id, false); toast.success("Application rejected"); }}>Reject</Button><Button size="sm" onClick={() => { actions.reviewApplication(a.id, true); toast.success("Application approved and account opened"); }}>Approve</Button></div>) : null },
          ]} />
        </TabsContent>
      </Tabs>
      <Dialog open={!!statusTarget} onOpenChange={(o) => !o && setStatusTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{statusTarget?.status === "ACTIVE" ? "Suspend" : "Activate"} account</DialogTitle><DialogDescription className="num">{statusTarget?.accountNumber} · {statusTarget && custName(statusTarget.customerId)}</DialogDescription></DialogHeader>
          <Field label="Reason"><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <Field label="Supervisor authorization code" hint="Demo code: 2468"><Input type="password" className="num" maxLength={4} value={authCode} onChange={(e) => setAuthCode(e.target.value)} /></Field>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <DialogFooter><Button variant="outline" onClick={() => setStatusTarget(null)}>Cancel</Button><Button onClick={applyStatus} variant={statusTarget?.status === "ACTIVE" ? "destructive" : "default"}>Authorize</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open new account</DialogTitle><DialogDescription>Only KYC-verified customers are eligible.</DialogDescription></DialogHeader>
          <Field label="Customer"><Select value={nCust} onValueChange={setNCust}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.customerNumber} {c.kycStatus !== "VERIFIED" ? "(KYC " + humanize(c.kycStatus) + ")" : ""}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Account type"><Select value={nType} onValueChange={(v) => setNType(v as AccountType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SAVINGS">Savings</SelectItem><SelectItem value="CURRENT">Current</SelectItem><SelectItem value="FIXED_DEPOSIT">Fixed deposit</SelectItem></SelectContent></Select></Field>
          <Field label="Initial deposit (₹)"><Input className="num" value={nDep} onChange={(e) => setNDep(e.target.value.replace(/\D/g, ""))} /></Field>
          {nErr && <p className="text-xs text-destructive">{nErr}</p>}
          <DialogFooter><Button variant="outline" onClick={() => setOpenNew(false)}>Cancel</Button><Button onClick={openAccount}>Open account</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!history} onOpenChange={(o) => !o && setHistory(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Account history</DialogTitle><DialogDescription className="num">{history?.accountNumber}</DialogDescription></DialogHeader>
          <DataTable rows={txns.filter((t) => t.accountId === history?.id)} pageSize={8} onRowClick={setTxn} columns={[
            { key: "d", header: "Date", cell: (t) => fmtDate(t.createdAt) }, { key: "x", header: "Description", cell: (t) => t.description },
            { key: "s", header: "Status", cell: (t) => <StatusBadge status={t.status} /> }, { key: "a", header: "Amount", cell: (t) => <Amount value={t.amount} type={t.type} />, className: "text-right" },
          ]} />
        </DialogContent>
      </Dialog>
      <TxnDrawer txn={txn} onClose={() => setTxn(null)} />
    </>
  );
}
