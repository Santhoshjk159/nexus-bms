import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { actions, useBank } from "@/services/store";
import { Amount, Confirm, KV, PageHeader, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fmtDate, humanize, inr, mask } from "@/lib/format";
import type { Customer } from "@/types";

export const Route = createFileRoute("/employee/customers")({
  head: () => ({ meta: [{ title: "Customers — NEXUS BANK Operations" }, { name: "description", content: "Search and manage customer profiles." }] }),
  component: Customers,
});

function Customers() {
  const customers = useBank((s) => s.customers); const accounts = useBank((s) => s.accounts); const loans = useBank((s) => s.loans);
  const [kyc, setKyc] = useState("ALL"); const [risk, setRisk] = useState("ALL"); const [selId, setSelId] = useState<string | null>(null);
  const sel = customers.find((c) => c.id === selId);
  const rows = customers.filter((c) => (kyc === "ALL" || c.kycStatus === kyc) && (risk === "ALL" || c.riskRating === risk));
  const rel = (c: Customer) => accounts.filter((a) => a.customerId === c.id).reduce((s, a) => s + a.balance, 0);
  return (
    <>
      <PageHeader title="Customers" description={`${customers.length} customers across all branches.`} />
      <DataTable rows={rows} onRowClick={(c) => setSelId(c.id)} searchText={(c) => `${c.firstName} ${c.lastName} ${c.customerNumber} ${c.email} ${c.phone}`} searchPlaceholder="Name, CIF, email or phone"
        toolbar={<>
          <Select value={kyc} onValueChange={setKyc}><SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All KYC</SelectItem>{["VERIFIED", "PENDING", "REJECTED"].map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent></Select>
          <Select value={risk} onValueChange={setRisk}><SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All risk</SelectItem>{["LOW", "MEDIUM", "HIGH"].map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent></Select>
        </>}
        columns={[
          { key: "n", header: "Customer", cell: (c) => <div><p className="font-medium">{c.firstName} {c.lastName}</p><p className="num text-xs text-muted-foreground">{c.customerNumber}</p></div>, sort: (c) => c.firstName },
          { key: "e", header: "Contact", cell: (c) => <div className="text-xs"><p>{c.email}</p><p className="text-muted-foreground">{c.phone}</p></div>, hideOnMobile: true },
          { key: "b", header: "Relationship", cell: (c) => <span className="num">{inr(rel(c), true)}</span>, sort: rel, hideOnMobile: true },
          { key: "k", header: "KYC", cell: (c) => <StatusBadge status={c.kycStatus} /> },
          { key: "r", header: "Risk", cell: (c) => <StatusBadge status={c.riskRating} /> },
          { key: "s", header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
        ]} />
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sel && (<>
            <SheetHeader><SheetTitle>{sel.firstName} {sel.lastName}</SheetTitle><SheetDescription className="num">{sel.customerNumber}</SheetDescription></SheetHeader>
            <div className="mt-6 space-y-6">
              <KV items={[["Email", sel.email], ["Phone", sel.phone], ["Date of birth", fmtDate(sel.dateOfBirth)], ["Address", `${sel.address.line1}, ${sel.address.city}`], ["KYC", <StatusBadge key="k" status={sel.kycStatus} />], ["Risk", <StatusBadge key="r" status={sel.riskRating} />], ["Branch", sel.branchId], ["Customer since", fmtDate(sel.createdAt)]]} />
              <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accounts</p>
                {accounts.filter((a) => a.customerId === sel.id).map((a) => (<div key={a.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0"><div><p>{humanize(a.type)}</p><p className="num text-xs text-muted-foreground">{mask(a.accountNumber)}</p></div><div className="text-right"><Amount value={a.balance} /><div><StatusBadge status={a.status} /></div></div></div>))}
              </div>
              <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loans</p>
                {loans.filter((l) => l.customerId === sel.id).map((l) => (<div key={l.id} className="flex justify-between py-1.5 text-sm"><span>{humanize(l.product)} · <span className="num">{inr(l.principal)}</span></span><StatusBadge status={l.status} /></div>))}
                {!loans.some((l) => l.customerId === sel.id) && <p className="text-sm text-muted-foreground">None</p>}
              </div>
              {sel.status === "ACTIVE"
                ? <Confirm destructive title="Block customer?" description="Blocks all digital banking access for this customer." confirmLabel="Block" onConfirm={() => { actions.setCustomerStatus(sel.id, "BLOCKED"); toast.success("Customer blocked"); }} trigger={<Button variant="outline" className="text-destructive"><Ban className="size-4" />Block customer</Button>} />
                : <Button onClick={() => { actions.setCustomerStatus(sel.id, "ACTIVE"); toast.success("Customer reactivated"); }}><CheckCircle2 className="size-4" />Reactivate customer</Button>}
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </>
  );
}
