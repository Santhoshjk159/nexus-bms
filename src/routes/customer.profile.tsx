import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, FileCheck2, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useCustomer } from "@/hooks/use-customer";
import { actions, useBank } from "@/services/store";
import { Field, KV, PageHeader, Panel, StatusBadge } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate, humanize } from "@/lib/format";

export const Route = createFileRoute("/customer/profile")({
  head: () => ({ meta: [{ title: "Profile & KYC — NEXUS BANK" }, { name: "description", content: "Your personal details and KYC verification status." }] }),
  component: Profile,
});
const schema = z.object({ email: z.string().email("Invalid email"), phone: z.string().regex(/^\+91 ?\d{10}$/, "Use format +91 9876543210"), line1: z.string().min(5, "Address too short"), city: z.string().min(2, "City required"), postalCode: z.string().regex(/^\d{6}$/, "6-digit PIN code"), reason: z.string().min(5, "Tell us why") });

function Profile() {
  const { id, customer: c } = useCustomer();
  const kyc = useBank((s) => s.kycApplications.find((k) => k.customerId === id));
  const myTickets = useBank((s) => s.tickets.filter((t) => t.customerId === id));
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ email: c.email, phone: c.phone.replace(/\s(?=\d{10})/, " "), line1: c.address.line1, city: c.address.city, postalCode: c.address.postalCode, reason: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = () => {
    const p = schema.safeParse(f); if (!p.success) return setErrors(Object.fromEntries(p.error.issues.map((i) => [i.path[0], i.message])));
    const n = actions.createTicket({ customerId: id, subject: "Profile update request", category: "ACCOUNT", priority: "MEDIUM", description: `Change to: ${f.email}, ${f.phone}, ${f.line1}, ${f.city} ${f.postalCode}. Reason: ${f.reason}` });
    setOpen(false); setErrors({}); toast.success("Update request submitted", { description: `Request ${n} will be verified by your branch.` });
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <PageHeader title="Profile & KYC" description="Details are changed through a verified request for your security." actions={<Button onClick={() => setOpen(true)}><Send className="size-4" />Request profile update</Button>} />
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Personal information" className="xl:col-span-2">
          <div className="mb-5 flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">{c.firstName[0]}{c.lastName[0]}</span><div><p className="font-semibold">{c.firstName} {c.lastName}</p><p className="num text-xs text-muted-foreground">{c.customerNumber} · Customer since {fmtDate(c.createdAt)}</p></div></div>
          <KV items={[["Date of birth", fmtDate(c.dateOfBirth)], ["Risk category", humanize(c.riskRating)], ["Email", c.email], ["Mobile", c.phone], ["Address", `${c.address.line1}, ${c.address.city}`], ["State · PIN", `${c.address.state} · ${c.address.postalCode}`], ["Country", c.address.country], ["Home branch", c.branchId]]} />
        </Panel>
        <Panel title="KYC verification" actions={<StatusBadge status={c.kycStatus} />}>
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3"><BadgeCheck className="size-8 text-accent-foreground" /><div><p className="text-sm font-medium">{c.kycStatus === "VERIFIED" ? "Full KYC complete" : c.kycStatus === "PENDING" ? "Under review" : "Action required"}</p><p className="text-xs text-muted-foreground">{kyc ? `Submitted ${fmtDate(kyc.submittedAt)}` : "No submission on file"}</p></div></div>
          <ul className="mt-4 space-y-2">{(kyc?.documents ?? []).map((d) => (<li key={d.type} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><FileCheck2 className="size-4 text-muted-foreground" />{humanize(d.type)}</span><StatusBadge status={d.status} /></li>))}</ul>
          {kyc?.remarks && <p className="mt-3 text-xs text-destructive">Reviewer note: {kyc.remarks}</p>}
          {(c.kycStatus === "REJECTED" || c.kycStatus === "NOT_SUBMITTED") && <Button className="mt-4 w-full" onClick={() => { actions.submitKyc(id); toast.success("KYC documents re-submitted for review"); }}>Re-submit documents</Button>}
        </Panel>
      </div>
      <Panel title="Service requests" className="mt-4" bodyClassName="p-0">
        {myTickets.map((t) => (<div key={t.id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0"><div><p className="text-sm font-medium">{t.subject}</p><p className="num text-xs text-muted-foreground">{t.ticketNumber} · {fmtDate(t.createdAt)}</p></div><StatusBadge status={t.status} /></div>))}
        {!myTickets.length && <p className="p-5 text-sm text-muted-foreground">No service requests.</p>}
      </Panel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Request profile update</DialogTitle><DialogDescription>Changes take effect after branch verification.</DialogDescription></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email" error={errors.email}><Input value={f.email} onChange={set("email")} /></Field>
            <Field label="Mobile" error={errors.phone}><Input className="num" value={f.phone} onChange={set("phone")} /></Field>
            <div className="sm:col-span-2"><Field label="Address" error={errors.line1}><Input value={f.line1} onChange={set("line1")} /></Field></div>
            <Field label="City" error={errors.city}><Input value={f.city} onChange={set("city")} /></Field>
            <Field label="PIN code" error={errors.postalCode}><Input className="num" value={f.postalCode} onChange={set("postalCode")} /></Field>
            <div className="sm:col-span-2"><Field label="Reason for change" error={errors.reason}><Textarea rows={2} value={f.reason} onChange={set("reason")} /></Field></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Submit request</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
