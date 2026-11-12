import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { actions, useBank } from "@/services/store";
import { useLookup } from "@/hooks/use-lookup";
import { Field, KV, PageHeader, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate, fmtDateTime, humanize } from "@/lib/format";

export const Route = createFileRoute("/employee/kyc")({
  head: () => ({ meta: [{ title: "KYC review — NEXUS BANK Operations" }, { name: "description", content: "Review and decide KYC applications." }] }),
  component: Kyc,
});

function Kyc() {
  const apps = useBank((s) => s.kycApplications); const { cust, custName } = useLookup();
  const [tab, setTab] = useState("PENDING"); const [selId, setSelId] = useState<string | null>(null); const [remarks, setRemarks] = useState(""); const [err, setErr] = useState("");
  const sel = apps.find((a) => a.id === selId); const c = sel && cust(sel.customerId);
  const decide = (approve: boolean) => {
    if (!approve && remarks.trim().length < 5) return setErr("Rejection requires a reason (min 5 characters)");
    actions.reviewKyc(sel!.id, approve, remarks.trim() || "All documents verified"); toast.success(`KYC ${approve ? "approved" : "rejected"} for ${custName(sel!.customerId)}`); setSelId(null); setRemarks(""); setErr("");
  };
  return (
    <>
      <PageHeader title="KYC review" description="Verify identity and address documents before activating full banking." />
      <Tabs value={tab} onValueChange={setTab} className="mb-4"><TabsList>{["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => <TabsTrigger key={s} value={s}>{humanize(s)} ({s === "ALL" ? apps.length : apps.filter((a) => a.status === s).length})</TabsTrigger>)}</TabsList></Tabs>
      <DataTable rows={apps.filter((a) => tab === "ALL" || a.status === tab)} onRowClick={(a) => { setSelId(a.id); setRemarks(""); setErr(""); }} searchText={(a) => `${custName(a.customerId)} ${a.id}`} defaultSort={{ key: "d", dir: "desc" }} columns={[
        { key: "id", header: "Application", cell: (a) => <span className="num text-xs">{a.id}</span> },
        { key: "c", header: "Customer", cell: (a) => custName(a.customerId), sort: (a) => custName(a.customerId) },
        { key: "d", header: "Submitted", cell: (a) => fmtDateTime(a.submittedAt), sort: (a) => a.submittedAt },
        { key: "docs", header: "Documents", cell: (a) => `${a.documents.filter((d) => d.status === "VERIFIED").length}/${a.documents.length} verified`, hideOnMobile: true },
        { key: "r", header: "Reviewer", cell: (a) => a.reviewer ?? "—", hideOnMobile: true },
        { key: "s", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
      ]} />
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <DialogContent className="sm:max-w-lg">
          {sel && c && (<>
            <DialogHeader><DialogTitle>KYC application · {sel.id}</DialogTitle><DialogDescription>{c.firstName} {c.lastName} · {c.customerNumber}</DialogDescription></DialogHeader>
            <KV items={[["Date of birth", fmtDate(c.dateOfBirth)], ["Phone", c.phone], ["Address", `${c.address.line1}, ${c.address.city}`], ["Risk rating", humanize(c.riskRating)]]} />
            <div className="space-y-2">{sel.documents.map((d) => (<div key={d.type} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"><span className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" />{humanize(d.type)}<span className="num text-xs text-muted-foreground">{d.type}_{c.id}.pdf</span></span><StatusBadge status={d.status} /></div>))}</div>
            {sel.status === "PENDING" ? (<>
              <Field label="Reviewer remarks" error={err}><Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Required when rejecting" /></Field>
              <DialogFooter><Button variant="outline" className="text-destructive" onClick={() => decide(false)}><X className="size-4" />Reject</Button><Button onClick={() => decide(true)}><Check className="size-4" />Approve KYC</Button></DialogFooter>
            </>) : <p className="text-sm text-muted-foreground">Decided by {sel.reviewer ?? "system"}{sel.remarks ? ` — “${sel.remarks}”` : ""}.</p>}
          </>)}
        </DialogContent>
      </Dialog>
    </>
  );
}
