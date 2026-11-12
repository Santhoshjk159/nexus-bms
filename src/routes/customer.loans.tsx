import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Calculator, GraduationCap, Home, Landmark, User } from "lucide-react";
import { toast } from "sonner";
import { useCustomer } from "@/hooks/use-customer";
import { actions, useBank } from "@/services/store";
import { amortization, calcEmi, loanEligibility } from "@/lib/banking";
import { loanRates } from "@/mocks/seed";
import { repaymentsFor } from "@/mocks/seed";
import { EmptyState, Field, KV, PageHeader, Panel, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { fmtDate, humanize, inr } from "@/lib/format";
import type { Loan, LoanProduct } from "@/types";

export const Route = createFileRoute("/customer/loans")({
  head: () => ({ meta: [{ title: "Loans — NEXUS BANK" }, { name: "description", content: "Explore loans, check eligibility and track applications." }] }),
  component: Loans,
});
const PRODUCTS: { id: LoanProduct; name: string; icon: typeof Home; max: number; tenure: number; blurb: string }[] = [
  { id: "PERSONAL", name: "Personal loan", icon: User, max: 2500000, tenure: 60, blurb: "Up to ₹25 lakh, minimal documentation." },
  { id: "EDUCATION", name: "Education loan", icon: GraduationCap, max: 7500000, tenure: 120, blurb: "Tuition, living and travel costs in India or abroad." },
  { id: "HOME", name: "Home loan", icon: Home, max: 50000000, tenure: 360, blurb: "Up to 30 years tenure, balance transfer available." },
];
const STEPS = ["APPLIED", "UNDER_REVIEW", "APPROVED", "ACTIVE"];

function Loans() {
  const { id } = useCustomer();
  const myLoans = useBank((s) => s.loans.filter((l) => l.customerId === id));
  const [product, setProduct] = useState<LoanProduct>("PERSONAL");
  const p = PRODUCTS.find((x) => x.id === product)!;
  const [principal, setPrincipal] = useState(500000); const [tenure, setTenure] = useState(36);
  const [income, setIncome] = useState("150000"); const [existing, setExisting] = useState("0"); const [score, setScore] = useState("760");
  const [purpose, setPurpose] = useState(""); const [applyOpen, setApplyOpen] = useState(false); const [err, setErr] = useState("");
  const [schedule, setSchedule] = useState<Loan | null>(null);
  const rate = loanRates[product];
  const emi = calcEmi(principal, rate, tenure);
  const elig = loanEligibility(Number(income) || 0, Number(existing) || 0, Number(score) || 0, rate, tenure);
  const pickProduct = (x: LoanProduct) => { const pp = PRODUCTS.find((q) => q.id === x)!; setProduct(x); setPrincipal(Math.min(principal, pp.max)); setTenure(Math.min(tenure, pp.tenure)); };
  const submit = () => {
    if (purpose.trim().length < 10) return setErr("Describe the purpose in at least 10 characters");
    if (!elig.eligible || principal > elig.maxPrincipal) return setErr("Requested amount exceeds your eligibility");
    const n = actions.applyLoan({ customerId: id, product, principal, rate, tenureMonths: tenure, emi, monthlyIncome: Number(income), purpose, creditScore: Number(score) });
    setApplyOpen(false); setPurpose(""); toast.success("Loan application submitted", { description: `Application ${n} is with our loan desk.` });
  };
  const sched = useMemo(() => schedule ? (schedule.status === "ACTIVE" ? repaymentsFor(schedule) : amortization(schedule.principal, schedule.rate, schedule.tenureMonths).map((r) => ({ ...r, id: String(r.installment), loanId: schedule.id, status: "DUE" as const }))) : [], [schedule]);
  return (
    <>
      <PageHeader title="Loans" description="Borrow with transparent rates and a clear repayment plan." />
      <Tabs defaultValue="catalogue">
        <TabsList><TabsTrigger value="catalogue">Catalogue & calculator</TabsTrigger><TabsTrigger value="mine">My loans ({myLoans.length})</TabsTrigger></TabsList>
        <TabsContent value="catalogue" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {PRODUCTS.map((x) => (
              <button key={x.id} onClick={() => pickProduct(x.id)} className={cn("card-surface p-5 text-left transition-all hover:-translate-y-0.5", product === x.id && "ring-2 ring-teal")}>
                <x.icon className="size-5 text-accent-foreground" /><p className="mt-3 font-semibold">{x.name}</p><p className="mt-1 text-xs text-muted-foreground">{x.blurb}</p>
                <p className="num mt-3 text-sm"><span className="font-semibold">{loanRates[x.id]}%</span> p.a. onwards</p>
              </button>
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="EMI calculator" description={`${p.name} at ${rate}% p.a.`} actions={<Calculator className="size-4 text-muted-foreground" />}>
              <div className="space-y-6">
                <div><div className="mb-2 flex justify-between text-sm"><span>Loan amount</span><span className="num font-semibold">{inr(principal)}</span></div><Slider value={[principal]} min={50000} max={p.max} step={10000} onValueChange={([v]) => setPrincipal(v)} /></div>
                <div><div className="mb-2 flex justify-between text-sm"><span>Tenure</span><span className="num font-semibold">{tenure} months</span></div><Slider value={[tenure]} min={6} max={p.tenure} step={6} onValueChange={([v]) => setTenure(v)} /></div>
                <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted p-4 text-center">
                  <div><p className="text-xs text-muted-foreground">Monthly EMI</p><p className="num mt-1 font-semibold">{inr(emi)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Total interest</p><p className="num mt-1 font-semibold">{inr(emi * tenure - principal)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Total payable</p><p className="num mt-1 font-semibold">{inr(emi * tenure)}</p></div>
                </div>
              </div>
            </Panel>
            <Panel title="Eligibility check" description="Simulated — no impact on your credit score">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Monthly income (₹)"><Input className="num" value={income} onChange={(e) => setIncome(e.target.value.replace(/\D/g, ""))} /></Field>
                <Field label="Existing EMIs (₹)"><Input className="num" value={existing} onChange={(e) => setExisting(e.target.value.replace(/\D/g, ""))} /></Field>
                <Field label="Credit score"><Input className="num" value={score} maxLength={3} onChange={(e) => setScore(e.target.value.replace(/\D/g, ""))} /></Field>
              </div>
              <div className={cn("mt-4 rounded-lg p-4", elig.eligible ? "bg-success-soft" : "bg-destructive-soft")}>
                <p className={cn("text-sm font-semibold", elig.eligible ? "text-success" : "text-destructive")}>{elig.eligible ? "You're eligible" : "Not eligible right now"}</p>
                <p className="mt-1 text-xs text-foreground">{elig.eligible ? <>Up to <b className="num">{inr(elig.maxPrincipal)}</b> for {tenure} months · max EMI <span className="num">{inr(elig.maxEmi)}</span></> : "A credit score of 650+ and EMIs under 50% of income are required."}</p>
              </div>
              <Button className="mt-4 w-full" disabled={!elig.eligible} onClick={() => { setErr(""); setApplyOpen(true); }}><Landmark className="size-4" />Apply for {p.name.toLowerCase()}</Button>
            </Panel>
          </div>
        </TabsContent>
        <TabsContent value="mine" className="mt-4 space-y-4">
          {!myLoans.length && <div className="card-surface"><EmptyState title="No loans yet" description="Applications you submit appear here." /></div>}
          {myLoans.map((l) => {
            const idx = STEPS.indexOf(l.status);
            return (
              <Panel key={l.id} title={`${humanize(l.product)} loan · ${l.loanNumber}`} actions={<StatusBadge status={l.status} />}>
                <KV items={[["Sanctioned amount", inr(l.principal)], ["Outstanding", inr(l.outstanding)], ["EMI", `${inr(l.emi)} / month`], ["Rate · Tenure", `${l.rate}% · ${l.tenureMonths} months`], ["Applied on", fmtDate(l.appliedAt)], ["Purpose", l.purpose]]} />
                {l.status === "REJECTED" ? <p className="mt-4 text-xs text-destructive">This application was declined. You may reapply after 90 days.</p> : (
                  <div className="mt-5 flex items-center gap-2">
                    {STEPS.map((s, i) => (<div key={s} className="flex flex-1 flex-col gap-1.5"><div className={cn("h-1.5 rounded-full", i <= idx || l.status === "CLOSED" ? "bg-teal" : "bg-muted")} /><span className="text-[11px] text-muted-foreground">{humanize(s)}</span></div>))}
                  </div>
                )}
                {l.status === "ACTIVE" && <div className="mt-4"><div className="flex justify-between text-xs"><span>Repaid</span><span className="num">{Math.round((1 - l.outstanding / l.principal) * 100)}%</span></div><Progress className="mt-1.5 h-2" value={(1 - l.outstanding / l.principal) * 100} /></div>}
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setSchedule(l)}>View repayment schedule</Button>
              </Panel>
            );
          })}
        </TabsContent>
      </Tabs>
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Loan application</DialogTitle><DialogDescription>{p.name} · {inr(principal)} · {tenure} months · EMI {inr(emi)}</DialogDescription></DialogHeader>
          <Field label="Purpose of loan" error={err}><Textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Renovation of kitchen and bathrooms" /></Field>
          <p className="text-xs text-muted-foreground">By submitting you consent to a simulated bureau check. Income: <span className="num">{inr(Number(income))}</span>, score: <span className="num">{score}</span>.</p>
          <DialogFooter><Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button><Button onClick={submit}>Submit application</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!schedule} onOpenChange={(o) => !o && setSchedule(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Repayment schedule</DialogTitle><DialogDescription>{schedule?.loanNumber} · {schedule?.tenureMonths} installments</DialogDescription></DialogHeader>
          <DataTable rows={sched} pageSize={12} columns={[
            { key: "n", header: "#", cell: (r) => r.installment }, { key: "d", header: "Due date", cell: (r) => fmtDate(r.dueDate) },
            { key: "e", header: "EMI", cell: (r) => <span className="num">{inr(r.emi)}</span> }, { key: "p", header: "Principal", cell: (r) => <span className="num">{inr(r.principal)}</span>, hideOnMobile: true },
            { key: "i", header: "Interest", cell: (r) => <span className="num">{inr(r.interest)}</span>, hideOnMobile: true }, { key: "b", header: "Balance", cell: (r) => <span className="num">{inr(r.balance)}</span> },
            { key: "s", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
          ]} />
        </DialogContent>
      </Dialog>
    </>
  );
}
