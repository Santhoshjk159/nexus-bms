import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftRight, CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useCustomer } from "@/hooks/use-customer";
import { actions, useBank, type TransferResult } from "@/services/store";
import { Amount, Field, KV, PageHeader, Panel, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtDateTime, inr, mask } from "@/lib/format";

export const Route = createFileRoute("/customer/transfers")({
  head: () => ({ meta: [{ title: "Fund transfers — NEXUS BANK" }, { name: "description", content: "Transfer funds between accounts and to beneficiaries." }] }),
  component: Transfers,
});
type Mode = "OWN" | "INTERNAL" | "BENEFICIARY";

function Transfers() {
  const { id, accounts, txns } = useCustomer();
  const bens = useBank((s) => s.beneficiaries.filter((b) => b.customerId === id));
  const allAccounts = useBank((s) => s.accounts);
  const customers = useBank((s) => s.customers);
  const limit = useBank((s) => s.settings.maxDailyTransfer);
  const sources = accounts.filter((a) => a.type !== "FIXED_DEPOSIT");
  const [mode, setMode] = useState<Mode>("OWN");
  const [from, setFrom] = useState(sources[0]?.id ?? "");
  const [to, setTo] = useState("");
  const [acctNo, setAcctNo] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"form" | "confirm" | "result">("form");
  const [result, setResult] = useState<TransferResult | null>(null);
  const src = sources.find((a) => a.id === from);
  const ben = bens.find((b) => b.id === to);
  const resolveDest = () => {
    if (mode === "OWN") { const a = accounts.find((x) => x.id === to); return a && { number: a.accountNumber, name: `${a.nickname} (${mask(a.accountNumber)})` }; }
    if (mode === "BENEFICIARY") return ben && { number: ben.accountNumber, name: ben.name };
    const a = allAccounts.find((x) => x.accountNumber === acctNo.trim()); const c = a && customers.find((x) => x.id === a.customerId);
    return a && c ? { number: a.accountNumber, name: `${c.firstName} ${c.lastName}` } : null;
  };
  const validate = () => {
    const e: Record<string, string> = {}; const amt = Number(amount);
    if (!src) e.from = "Select a source account";
    if (mode === "OWN" && (!to || to === from)) e.to = "Select a different destination account";
    if (mode === "BENEFICIARY") { if (!ben) e.to = "Select a beneficiary"; else if (ben.verification !== "VERIFIED") e.to = "Beneficiary verification is pending"; else if (amt > ben.transferLimit) e.amount = `Exceeds beneficiary limit of ${inr(ben.transferLimit)}`; }
    if (mode === "INTERNAL") { if (!/^\d{12}$/.test(acctNo.trim())) e.to = "Enter a 12-digit NEXUS account number"; else if (!resolveDest()) e.to = "No NEXUS BANK account found with this number"; else if (accounts.some((a) => a.accountNumber === acctNo.trim())) e.to = "Use own-account transfer for your accounts"; }
    if (!amount || isNaN(amt) || amt <= 0) e.amount = "Enter a valid amount"; else if (amt < 1) e.amount = "Minimum transfer is ₹1";
    else if (src && amt > src.balance) e.amount = `Insufficient balance (${inr(src.balance)} available)`; else if (amt > limit) e.amount = `Exceeds daily limit of ${inr(limit)}`;
    if (remarks.length > 80) e.remarks = "Max 80 characters";
    setErrors(e); return !Object.keys(e).length;
  };
  const execute = () => {
    const d = resolveDest()!;
    const r = actions.transfer({ fromAccountId: from, toAccountNumber: d.number, toName: d.name, amount: Number(amount), mode, remarks });
    setResult(r); setStep("result");
    if (r.ok) toast.success(r.flagged ? "Transfer held for security review" : "Transfer successful"); else toast.error(r.error);
  };
  const reset = () => { setStep("form"); setAmount(""); setRemarks(""); setTo(""); setAcctNo(""); setResult(null); };
  const history = txns.filter((t) => t.category === "TRANSFER" && t.type === "DEBIT");

  return (
    <>
      <PageHeader title="Fund transfers" description="Simulated transfers are posted instantly to the double-entry ledger." />
      <div className="grid gap-4 xl:grid-cols-5">
        <Panel title={step === "confirm" ? "Confirm transfer" : step === "result" ? "Transfer status" : "New transfer"} className="xl:col-span-3">
          {step === "form" && (
            <form onSubmit={(e) => { e.preventDefault(); if (validate()) setStep("confirm"); }} className="space-y-4" noValidate>
              <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); setTo(""); setErrors({}); }}><TabsList className="w-full"><TabsTrigger value="OWN" className="flex-1">Own account</TabsTrigger><TabsTrigger value="INTERNAL" className="flex-1">Within NEXUS</TabsTrigger><TabsTrigger value="BENEFICIARY" className="flex-1">Beneficiary</TabsTrigger></TabsList></Tabs>
              <Field label="From account" error={errors.from}>
                <Select value={from} onValueChange={setFrom}><SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger><SelectContent>{sources.map((a) => <SelectItem key={a.id} value={a.id}>{a.nickname} · {mask(a.accountNumber)} · {inr(a.balance)}</SelectItem>)}</SelectContent></Select>
              </Field>
              {mode === "OWN" && <Field label="To account" error={errors.to}><Select value={to} onValueChange={setTo}><SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger><SelectContent>{accounts.filter((a) => a.id !== from).map((a) => <SelectItem key={a.id} value={a.id}>{a.nickname} · {mask(a.accountNumber)}</SelectItem>)}</SelectContent></Select></Field>}
              {mode === "BENEFICIARY" && <Field label="Beneficiary" error={errors.to} hint={bens.length ? undefined : "No beneficiaries yet"}><Select value={to} onValueChange={setTo}><SelectTrigger><SelectValue placeholder="Select beneficiary" /></SelectTrigger><SelectContent>{bens.map((b) => <SelectItem key={b.id} value={b.id}>{b.name} · {b.bankName} · {mask(b.accountNumber)}{b.verification !== "VERIFIED" ? " (pending)" : ""}</SelectItem>)}</SelectContent></Select></Field>}
              {mode === "INTERNAL" && <Field label="Recipient account number" error={errors.to} hint={resolveDest()?.name ? `Account holder: ${resolveDest()!.name}` : `Try ${allAccounts.find((a) => a.customerId === "C0002")?.accountNumber}`}><Input className="num" inputMode="numeric" maxLength={12} value={acctNo} onChange={(e) => setAcctNo(e.target.value.replace(/\D/g, ""))} placeholder="12-digit account number" /></Field>}
              <Field label="Amount (₹)" error={errors.amount} hint={ben ? `Beneficiary limit ${inr(ben.transferLimit)}` : `Daily limit ${inr(limit)}`}><Input className="num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00" /></Field>
              <Field label="Remarks (optional)" error={errors.remarks}><Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Rent for November" /></Field>
              <Button type="submit" className="w-full"><ArrowLeftRight className="size-4" />Review transfer</Button>
            </form>
          )}
          {step === "confirm" && (
            <div className="space-y-5">
              <div className="rounded-lg bg-muted p-5 text-center"><p className="text-xs uppercase tracking-wider text-muted-foreground">You are sending</p><p className="num mt-1 text-3xl font-semibold">{inr(Number(amount))}</p></div>
              <KV items={[["From", `${src?.nickname} · ${mask(src!.accountNumber)}`], ["To", resolveDest()?.name], ["Transfer type", mode === "OWN" ? "Own account" : mode === "INTERNAL" ? "Within NEXUS BANK" : "Beneficiary"], ["Charges", "₹0.00"], ["Remarks", remarks || "—"], ["Balance after", inr(src!.balance - Number(amount))]]} />
              <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setStep("form")}>Edit</Button><Button className="flex-1" onClick={execute}>Confirm & transfer</Button></div>
            </div>
          )}
          {step === "result" && result && (
            <div className="py-4 text-center">
              {result.ok ? (result.flagged ? <ShieldAlert className="mx-auto size-12 text-warning" /> : <CheckCircle2 className="mx-auto size-12 text-success" />) : <XCircle className="mx-auto size-12 text-destructive" />}
              <h3 className="mt-3 text-lg font-semibold">{result.ok ? (result.flagged ? "Transfer under security review" : "Transfer successful") : "Transfer failed"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{result.ok ? (result.flagged ? "Funds are debited and held pending review by our fraud team." : `${inr(Number(amount))} sent to ${resolveDest()?.name}.`) : result.error}</p>
              <p className="mt-4 text-xs text-muted-foreground">Transaction reference</p><p className="num text-sm font-semibold">{result.reference}</p>
              <div className="mt-6 flex justify-center gap-2"><Button variant="outline" asChild><Link to="/customer/transactions">View transactions</Link></Button><Button onClick={reset}>New transfer</Button></div>
            </div>
          )}
        </Panel>
        <Panel title="Transfer limits" className="xl:col-span-2">
          <KV items={[["Daily transfer limit", inr(limit)], ["Per beneficiary", "As configured"], ["Own account", "No additional limit"], ["Processing", "Instant (simulated)"]]} />
          <p className="mt-4 rounded-md bg-accent p-3 text-xs text-accent-foreground">Transfers above the fraud threshold are automatically screened and may be held for review.</p>
        </Panel>
      </div>
      <h2 className="mb-3 mt-8 text-sm font-semibold">Transfer history</h2>
      <DataTable rows={history} pageSize={8} searchText={(t) => `${t.counterparty} ${t.reference}`} defaultSort={{ key: "date", dir: "desc" }} columns={[
        { key: "date", header: "Date", cell: (t) => fmtDateTime(t.createdAt), sort: (t) => t.createdAt },
        { key: "to", header: "Recipient", cell: (t) => t.counterparty },
        { key: "ref", header: "Reference", cell: (t) => <span className="num text-xs">{t.reference}</span>, hideOnMobile: true },
        { key: "st", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
        { key: "amt", header: "Amount", cell: (t) => <Amount value={t.amount} type="DEBIT" />, sort: (t) => t.amount, className: "text-right" },
      ]} />
    </>
  );
}
