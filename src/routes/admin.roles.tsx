import { Fragment, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { actions, useBank } from "@/services/store";
import { Confirm, Field, PageHeader, Panel } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({ meta: [{ title: "Roles & permissions — NEXUS BANK Admin" }, { name: "description", content: "Role-based access control matrix." }] }),
  component: Roles,
});

function Roles() {
  const roles = useBank((s) => s.roles); const perms = useBank((s) => s.permissions); const emps = useBank((s) => s.employees);
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [err, setErr] = useState("");
  const modules = [...new Set(perms.map((p) => p.module))];
  const add = () => { if (name.trim().length < 3) return setErr("Role name must be at least 3 characters"); if (roles.some((r) => r.name.toLowerCase() === name.trim().toLowerCase())) return setErr("Role already exists"); actions.addRole(name.trim(), desc.trim()); toast.success("Role created"); setOpen(false); setName(""); setDesc(""); setErr(""); };
  return (
    <>
      <PageHeader title="Roles & permissions" description="Changes apply immediately and are audited." actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" />New role</Button>} />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {roles.map((r) => { const n = emps.filter((e) => e.roleId === r.id).length; return (
          <div key={r.id} className="card-surface p-4">
            <div className="flex items-start justify-between"><p className="text-sm font-semibold">{r.name}</p>{r.system ? <Lock className="size-3.5 text-muted-foreground" /> : <Confirm destructive title={`Delete ${r.name}?`} description={n ? `${n} employees hold this role — reassign them first.` : "This role will be removed."} confirmLabel="Delete" onConfirm={() => { if (n) return toast.error("Role is in use"); actions.deleteRole(r.id); toast.success("Role deleted"); }} trigger={<button aria-label="Delete role"><Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" /></button>} />}</div>
            <p className="mt-1 text-xs text-muted-foreground">{r.description || "—"}</p>
            <p className="mt-3 text-xs"><span className="num font-semibold">{r.permissions.length}</span> permissions · <span className="num font-semibold">{n}</span> users</p>
          </div>); })}
      </div>
      <Panel title="Permission matrix" bodyClassName="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60"><tr><th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Permission</th>{roles.map((r) => <th key={r.id} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{r.name}</th>)}</tr></thead>
          <tbody>{modules.map((m) => (<Fragment key={m}>
            <tr className="border-t border-border bg-muted/30"><td colSpan={roles.length + 1} className="px-4 py-1.5 text-xs font-semibold text-accent-foreground">{m}</td></tr>
            {perms.filter((p) => p.module === m).map((p) => (
              <tr key={p.key} className="border-t border-border"><td className="px-4 py-2.5"><p>{p.description}</p><p className="num text-[11px] text-muted-foreground">{p.key}</p></td>
                {roles.map((r) => <td key={r.id} className="px-3 text-center"><Checkbox checked={r.permissions.includes(p.key)} disabled={r.system} aria-label={`${r.name} ${p.key}`} onCheckedChange={() => { actions.togglePermission(r.id, p.key); toast.success(`${r.name}: ${p.key} ${r.permissions.includes(p.key) ? "revoked" : "granted"}`); }} /></td>)}
              </tr>))}
          </Fragment>))}</tbody>
        </table>
      </Panel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create role</DialogTitle><DialogDescription>Starts with read-only customer access.</DialogDescription></DialogHeader>
          <Field label="Role name" error={err}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Description"><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={add}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
