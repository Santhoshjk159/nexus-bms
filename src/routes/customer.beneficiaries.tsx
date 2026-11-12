import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useCustomer } from "@/hooks/use-customer";
import { actions, useBank } from "@/services/store";
import { Confirm, EmptyState, Field, PageHeader, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate, inr, mask } from "@/lib/format";
import type { Beneficiary } from "@/types";

export const Route = createFileRoute("/customer/beneficiaries")({
  head: () => ({ meta: [{ title: "Beneficiaries — NEXUS BANK" }, { name: "description", content: "Manage saved payees and transfer limits." }] }),
  component: Bens,
});
const schema = z.object({
  name: z.string().trim().min(3, "Enter the full name").max(60), nickname: z.string().trim().min(2, "Nickname required").max(20),
  accountNumber: z.string().regex(/^\d{9,18}$/, "Account number must be 9–18 digits"), ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC (e.g. HDFC0001234)"),
  bankName: z.string().trim().min(2, "Bank name required"), transferLimit: z.coerce.number().min(1000, "Minimum ₹1,000").max(1000000, "Maximum ₹10,00,000"),
});
const empty = { name: "", nickname: "", accountNumber: "", ifsc: "", bankName: "", transferLimit: "50000" };

function Bens() {
  const { id } = useCustomer();
  const rows = useBank((s) => s.beneficiaries.filter((b) => b.customerId === id));
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string>();
  const [form, setForm] = useState<Record<string, string>>(empty); const [errors, setErrors] = useState<Record<string, string>>({});
  const startAdd = () => { setEditId(undefined); setForm(empty); setErrors({}); setOpen(true); };
  const startEdit = (b: Beneficiary) => { setEditId(b.id); setForm({ ...b, transferLimit: String(b.transferLimit) }); setErrors({}); setOpen(true); };
  const save = () => {
    const p = schema.safeParse(form);
    if (!p.success) return setErrors(Object.fromEntries(p.error.issues.map((i) => [i.path[0], i.message])));
    if (!editId && rows.some((b) => b.accountNumber === p.data.accountNumber)) return setErrors({ accountNumber: "This beneficiary already exists" });
    actions.saveBeneficiary({ ...p.data, id: editId, customerId: id }); setOpen(false);
    toast.success(editId ? "Beneficiary updated" : "Beneficiary added", { description: editId ? undefined : p.data.ifsc.startsWith("NXBK") ? "Verified instantly (NEXUS account)" : "Verification in progress — usually under 30 minutes" });
  };
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <>
      <PageHeader title="Beneficiaries" description="Saved payees for faster, safer transfers." actions={<Button onClick={startAdd}><Plus className="size-4" />Add beneficiary</Button>} />
      <DataTable rows={rows} searchText={(b) => `${b.name} ${b.nickname} ${b.bankName}`} empty={<EmptyState icon={UsersRound} title="No beneficiaries" description="Add a payee to start transferring." action={<Button size="sm" onClick={startAdd}>Add beneficiary</Button>} />} columns={[
        { key: "name", header: "Beneficiary", cell: (b) => <div><p className="font-medium">{b.name}</p><p className="text-xs text-muted-foreground">{b.nickname}</p></div>, sort: (b) => b.name },
        { key: "bank", header: "Bank", cell: (b) => <div><p>{b.bankName}</p><p className="num text-xs text-muted-foreground">{b.ifsc}</p></div>, hideOnMobile: true },
        { key: "acct", header: "Account", cell: (b) => <span className="num">{mask(b.accountNumber)}</span> },
        { key: "lim", header: "Limit", cell: (b) => <span className="num">{inr(b.transferLimit)}</span>, sort: (b) => b.transferLimit, hideOnMobile: true },
        { key: "ver", header: "Verification", cell: (b) => <StatusBadge status={b.verification} /> },
        { key: "added", header: "Added", cell: (b) => fmtDate(b.addedAt), hideOnMobile: true },
        { key: "act", header: "", className: "text-right", cell: (b) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => startEdit(b)} aria-label="Edit"><Pencil className="size-4" /></Button>
            <Confirm destructive title="Remove beneficiary?" description={`${b.name} will be removed. You'll need to re-verify to pay them again.`} confirmLabel="Remove" onConfirm={() => { actions.removeBeneficiary(b.id); toast.success("Beneficiary removed"); }} trigger={<Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label="Remove"><Trash2 className="size-4" /></Button>} />
          </div>) },
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit beneficiary" : "Add beneficiary"}</DialogTitle><DialogDescription>New beneficiaries are verified before first transfer.</DialogDescription></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" error={errors.name}><Input value={form.name} onChange={set("name")} /></Field>
            <Field label="Nickname" error={errors.nickname}><Input value={form.nickname} onChange={set("nickname")} /></Field>
            <Field label="Account number" error={errors.accountNumber}><Input className="num" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, "") })} disabled={!!editId} /></Field>
            <Field label="IFSC" error={errors.ifsc}><Input className="num uppercase" value={form.ifsc} onChange={set("ifsc")} /></Field>
            <Field label="Bank name" error={errors.bankName}><Input value={form.bankName} onChange={set("bankName")} /></Field>
            <Field label="Transfer limit (₹)" error={errors.transferLimit}><Input className="num" value={form.transferLimit} onChange={(e) => setForm({ ...form, transferLimit: e.target.value.replace(/\D/g, "") })} /></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? "Save changes" : "Add beneficiary"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
