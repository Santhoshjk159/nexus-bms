import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { actions, useBank } from "@/services/store";
import { Field, PageHeader, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate } from "@/lib/format";
import type { Employee } from "@/types";

export const Route = createFileRoute("/admin/employees")({
  head: () => ({ meta: [{ title: "Employees — NEXUS BANK Admin" }, { name: "description", content: "Manage bank staff, roles and branches." }] }),
  component: Emps,
});
const schema = z.object({ name: z.string().trim().min(3, "Full name required"), email: z.string().email("Invalid email").refine((e) => e.endsWith("@nexusbank.demo"), "Must be a @nexusbank.demo address"), designation: z.string().min(2, "Required"), roleId: z.string().min(1, "Select a role"), branchId: z.string().min(1, "Select a branch") });

function Emps() {
  const emps = useBank((s) => s.employees); const roles = useBank((s) => s.roles); const branches = useBank((s) => s.branches);
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string>(); const [errors, setErrors] = useState<Record<string, string>>({});
  const blank = { name: "", email: "", designation: "", roleId: "", branchId: "", status: "ACTIVE" as Employee["status"] };
  const [f, setF] = useState(blank);
  const save = () => {
    const p = schema.safeParse(f); if (!p.success) return setErrors(Object.fromEntries(p.error.issues.map((i) => [i.path[0], i.message])));
    if (emps.some((e) => e.email === f.email && e.id !== editId)) return setErrors({ email: "Email already in use" });
    actions.saveEmployee({ ...f, id: editId }); toast.success(editId ? "Employee updated" : "Employee onboarded"); setOpen(false);
  };
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? "—";
  return (
    <>
      <PageHeader title="Employees" description={`${emps.filter((e) => e.status === "ACTIVE").length} active staff`} actions={<Button onClick={() => { setEditId(undefined); setF(blank); setErrors({}); setOpen(true); }}><Plus className="size-4" />Add employee</Button>} />
      <DataTable rows={emps} searchText={(e) => `${e.name} ${e.email} ${e.employeeCode}`} columns={[
        { key: "n", header: "Employee", cell: (e) => <div><p className="font-medium">{e.name}</p><p className="num text-xs text-muted-foreground">{e.employeeCode}</p></div>, sort: (e) => e.name },
        { key: "e", header: "Email", cell: (e) => <span className="text-xs">{e.email}</span>, hideOnMobile: true },
        { key: "r", header: "Role", cell: (e) => roleName(e.roleId), sort: (e) => roleName(e.roleId) },
        { key: "b", header: "Branch", cell: (e) => branches.find((b) => b.id === e.branchId)?.name, hideOnMobile: true },
        { key: "j", header: "Joined", cell: (e) => fmtDate(e.joinedAt), sort: (e) => e.joinedAt, hideOnMobile: true },
        { key: "s", header: "Status", cell: (e) => <StatusBadge status={e.status} /> },
        { key: "x", header: "", className: "text-right", cell: (e) => (<div className="flex items-center justify-end gap-2">
          <Switch checked={e.status === "ACTIVE"} disabled={e.roleId === "R1"} aria-label="Active" onCheckedChange={(v) => { actions.saveEmployee({ ...e, status: v ? "ACTIVE" : "INACTIVE" }); toast.success(`${e.name} ${v ? "activated" : "deactivated"}`); }} />
          <Button variant="ghost" size="icon" className="size-8" aria-label="Edit" onClick={() => { setEditId(e.id); setF({ name: e.name, email: e.email, designation: e.designation, roleId: e.roleId, branchId: e.branchId, status: e.status }); setErrors({}); setOpen(true); }}><Pencil className="size-4" /></Button>
        </div>) },
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit employee" : "Add employee"}</DialogTitle><DialogDescription>Access is granted through the assigned role.</DialogDescription></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" error={errors.name}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Work email" error={errors.email}><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Designation" error={errors.designation}><Input value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} /></Field>
            <Field label="Role" error={errors.roleId}><Select value={f.roleId} onValueChange={(v) => setF({ ...f, roleId: v })}><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Branch" error={errors.branchId}><Select value={f.branchId} onValueChange={(v) => setF({ ...f, branchId: v })}><SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger><SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? "Save" : "Add employee"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
