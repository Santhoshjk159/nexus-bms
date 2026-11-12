import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { actions, useBank } from "@/services/store";
import { useLookup } from "@/hooks/use-lookup";
import { loanEligibility } from "@/lib/banking";
import { repaymentsFor } from "@/mocks/seed";
import { KV, PageHeader, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { fmtDate, humanize, inr } from "@/lib/format";

export const Route = createFileRoute("/employee/loans")({
  head: () => ({ meta: [{ title: "Loan operations — NEXUS BANK" }, { name: "description", content: "Review, approve and track loans." }] }),
  component: LoanOps,
});

function LoanOps() {
  const loans = useBank((s) => s.loans); const { custName } = useLookup();
  const [tab, setTab] = useState("PIPELINE"); const [selId, setSelId] = useState<string | null>(null);
  const sel = loans.find((l) => l.id === selId);
  const rows = loans.filter((l) => tab === "ALL" || (tab === "PIPELINE" ? ["APPLIED", "UNDER_REVIEW"].includes(l.status) : l.status === tab));
  const elig = sel && loanEligibility(sel.monthlyIncome, 0, sel.creditScore, sel.rate, sel.tenureMonths);
  const sched = sel?.status === "ACTIVE" ? repaymentsFor(sel) : [];
  return (
    <>
      <PageHeader title="Loan operations" description="Underwrite applications and monitor repayment." />
      <Tabs value={tab} onValueChange={setTab} className="mb-4"><TabsList><TabsTrigger value="PIPELINE">Pipeline</TabsTrigger><TabsTrigger value="ACTIVE">Active</TabsTrigger><TabsTrigger value="APPROVED">Approved</TabsTrigger><TabsTrigger value="REJECTED">Rejected</TabsTrigger><TabsTrigger value="ALL">All</TabsTrigger></TabsList></Tabs>
      <DataTable rows={rows} onRowClick={(l) => setSelId(l.id)} searchText={(l) => `${l.loanNumber} ${custName(l.customerId)}`} columns={[
        { key: "n", header: "Loan", cell: (l) => <div><p className="num font-medium">{l.loanNumber}</p><p className="text-xs text-muted-foreground">{humanize(l.product)}</p></div> },
        { key: "c", header: "Applicant", cell: (l) => custName(l.customerId), sort: (l) => custName(l.customerId) },
        { key: "p", header: "Amount", cell: (l) => <span className="num">{inr(l.principal)}</span>, sort: (l) => l.principal },
        { key: "s", header: "Score", cell: (l) => <span className={cn("num", l.creditScore < 650 && "text-destructive")}>{l.creditScore}</span>, sort: (l) => l.creditScore, hideOnMobile: true },
        { key: "o", header: "Outstanding", cell: (l) => <span className="num">{inr(l.outstanding)}</span>, hideOnMobile: true },
        { key: "d", header: "Applied", cell: (l) => fmtDate(l.appliedAt), sort: (l) => l.appliedAt, hideOnMobile: true },
        { key: "st", header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
      ]} />
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sel && elig && (<>
            <SheetHeader><SheetTitle>{humanize(sel.product)} loan</SheetTitle><SheetDescription className="num">{sel.loanNumber} · {custName(sel.customerId)}</SheetDescription></SheetHeader>
            <div className="mt-6 space-y-6">
              <KV items={[["Requested", inr(sel.principal)], ["Rate · Tenure", `${sel.rate}% · ${sel.tenureMonths} mo`], ["EMI", inr(sel.emi)], ["Monthly income", inr(sel.monthlyIncome)], ["Credit score", sel.creditScore], ["Purpose", sel.purpose], ["Status", <StatusBadge key="s" status={sel.status} />], ["Applied", fmtDate(sel.appliedAt)]]} />
              <div className={cn("rounded-lg p-4 text-sm", elig.eligible && sel.principal <= elig.maxPrincipal ? "bg-success-soft" : "bg-destructive-soft")}>
                <p className="font-semibold">Eligibility assessment</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>Credit score ≥ 650: <b>{sel.creditScore >= 650 ? "Pass" : "Fail"}</b></li>
                  <li>FOIR (EMI / income): <b className="num">{((sel.emi / sel.monthlyIncome) * 100).toFixed(1)}%</b> (limit 50%)</li>
                  <li>Max eligible amount: <b className="num">{inr(elig.maxPrincipal)}</b></li>
                </ul>
              </div>
              {["APPLIED", "UNDER_REVIEW"].includes(sel.status) && (
                <div className="flex flex-wrap gap-2">
                  {sel.status === "APPLIED" && <Button variant="outline" onClick={() => { actions.setLoanStatus(sel.id, "UNDER_REVIEW"); toast.success("Moved to underwriting"); }}>Start review</Button>}
                  <Button variant="outline" className="text-destructive" onClick={() => { actions.decideLoan(sel.id, false); toast.success("Loan rejected"); }}><X className="size-4" />Reject</Button>
                  <Button onClick={() => { actions.decideLoan(sel.id, true); toast.success("Loan approved"); }}><Check className="size-4" />Approve</Button>
                </div>
              )}
              {sel.status === "APPROVED" && <Button onClick={() => { actions.setLoanStatus(sel.id, "ACTIVE"); toast.success("Loan disbursed (simulated)"); }}>Disburse loan</Button>}
              {sel.status === "ACTIVE" && (<div>
                <div className="flex justify-between text-xs"><span>Repayment progress</span><span className="num">{sched.filter((r) => r.status === "PAID").length}/{sched.length} EMIs</span></div>
                <Progress className="mt-2 h-2" value={(sched.filter((r) => r.status === "PAID").length / sched.length) * 100} />
                <div className="mt-4 space-y-1.5">{sched.filter((r) => r.status !== "PAID").slice(0, 4).map((r) => (<div key={r.id} className="flex justify-between text-sm"><span>EMI #{r.installment} · {fmtDate(r.dueDate)}</span><span className="num">{inr(r.emi)}</span></div>))}</div>
              </div>)}
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </>
  );
}
