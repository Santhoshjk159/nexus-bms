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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { inr } from "@/lib/format";
import type { Branch } from "@/types";

export const Route = createFileRoute("/admin/branches")({
  head: () => ({ meta: [{ title: "Branches — NEXUS BANK Admin" }, { name: "description", content: "Branch network management." }] }),
  component: Branches,
});
const schema = z.object({ code: z.string().regex(/^NXB\d{3}$/, "Format NXB001"), name: z.string().min(3, "Required"), city: z.string().min(2, "Required"), ifsc: z.string().regex(/^NXBK0\d{6}$/, "Format NXBK0000001"), manager: z.string().min(3, "Required") });

function Branches() {
  const branches = useBank((s) => s.branches); const customers = useBank((s) => s.customers); const accounts = useBank((s) => s.accounts);
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string>(); const [errors, setErrors] = useState<Record<string, string>>({});
  const blank = { code: "", name: "", city: "", ifsc: "", manager: "", status: "ACTIVE" as Branch["status"] }; const [f, setF] = useState(blank);
  const save = () => { const p = schema.safeParse(f); if (!p.success) return setErrors(Object.fromEntries(p.error.issues.map((i) => [i.path[0], i.message]))); if (branches.some((b) => b.code === f.code && b.id !== editId)) return setErrors({ code: "Code already used" }); actions.saveBranch({ ...f, id: editId }); toast.success(editId ? "Branch updated" : "Branch created"); setOpen(false); };
  const custCount = (b: Branch) => customers.filter((c) => c.branchId === b.id).length;
  const dep = (b: Branch) => accounts.filter((a) => a.branchId === b.id).reduce((s, a) => s + a.balance, 0);
  return (
    <>
      <PageHeader title="Branches" actions={<Button onClick={() => { setEditId(undefined); setF(blank); setErrors({}); setOpen(true); }}><Plus className="size-4" />Add branch</Button>} />
      <DataTable rows={branches} searchText={(b) => `${b.name} ${b.city} ${b.code} ${b.ifsc}`} columns={[
        { key: "n", header: "Branch", cell: (b) => <div><p className="font-medium">{b.name}</p><p className="num text-xs text-muted-foreground">{b.code} · {b.ifsc}</p></div>, sort: (b) => b.name },
        { key: "c", header: "City", cell: (b) => b.city }, { key: "m", header: "Manager", cell: (b) => b.manager, hideOnMobile: true },
        { key: "cu", header: "Customers", cell: (b) => <span className="num">{custCount(b)}</span>, sort: custCount },
        { key: "d", header: "Deposits", cell: (b) => <span className="num">{inr(dep(b), true)}</span>, sort: dep, hideOnMobile: true },
        { key: "s", header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
        { key: "x", header: "", className: "text-right", cell: (b) => (<div className="flex items-center justify-end gap-2"><Switch checked={b.status === "ACTIVE"} aria-label="Active" onCheckedChange={(v) => { actions.saveBranch({ ...b, status: v ? "ACTIVE" : "INACTIVE" }); toast.success(`${b.name} ${v ? "activated" : "deactivated"}`); }} /><Button variant="ghost" size="icon" className="size-8" aria-label="Edit" onClick={() => { setEditId(b.id); setF({ code: b.code, name: b.name, city: b.city, ifsc: b.ifsc, manager: b.manager, status: b.status }); setErrors({}); setOpen(true); }}><Pencil className="size-4" /></Button></div>) },
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit branch" : "Add branch"}</DialogTitle><DialogDescription>Branch codes and IFSC must be unique.</DialogDescription></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["code", "name", "city", "ifsc", "manager"] as const).map((k) => <Field key={k} label={k === "ifsc" ? "IFSC" : k[0].toUpperCase() + k.slice(1)} error={errors[k]}><Input className={k === "code" || k === "ifsc" ? "num uppercase" : ""} value={f[k]} onChange={(e) => setF({ ...f, [k]: k === "code" || k === "ifsc" ? e.target.value.toUpperCase() : e.target.value })} /></Field>)}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
