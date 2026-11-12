import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { actions, useBank } from "@/services/store";
import { useLookup } from "@/hooks/use-lookup";
import { Field, KV, PageHeader, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDateTime, humanize } from "@/lib/format";
import type { SupportTicket } from "@/types";

export const Route = createFileRoute("/employee/support")({
  head: () => ({ meta: [{ title: "Customer support — NEXUS BANK" }, { name: "description", content: "Tickets, complaints, assignment and resolution." }] }),
  component: Support,
});
const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

function Support() {
  const tickets = useBank((s) => s.tickets); const employees = useBank((s) => s.employees.filter((e) => e.status === "ACTIVE")); const { custName, customers } = useLookup();
  const [tab, setTab] = useState("ACTIVE"); const [selId, setSelId] = useState<string | null>(null); const [newOpen, setNewOpen] = useState(false);
  const [nf, setNf] = useState({ customerId: "", subject: "", category: "COMPLAINT", priority: "MEDIUM", description: "" }); const [err, setErr] = useState("");
  const sel = tickets.find((t) => t.id === selId);
  const rows = tickets.filter((t) => tab === "ALL" || (tab === "ACTIVE" ? t.status === "OPEN" || t.status === "IN_PROGRESS" : tab === "COMPLAINT" ? t.category === "COMPLAINT" : t.status === "RESOLVED" || t.status === "CLOSED"));
  const create = () => {
    if (!nf.customerId || nf.subject.trim().length < 5 || nf.description.trim().length < 10) return setErr("Customer, subject (5+) and description (10+) are required");
    const n = actions.createTicket(nf as Pick<SupportTicket, "customerId" | "subject" | "category" | "priority" | "description">); toast.success(`Ticket ${n} created`); setNewOpen(false); setErr(""); setNf({ customerId: "", subject: "", category: "COMPLAINT", priority: "MEDIUM", description: "" });
  };
  return (
    <>
      <PageHeader title="Customer support" actions={<Button onClick={() => setNewOpen(true)}><Plus className="size-4" />New ticket</Button>} />
      <Tabs value={tab} onValueChange={setTab} className="mb-4"><TabsList><TabsTrigger value="ACTIVE">Active</TabsTrigger><TabsTrigger value="COMPLAINT">Complaints</TabsTrigger><TabsTrigger value="DONE">Resolved</TabsTrigger><TabsTrigger value="ALL">All</TabsTrigger></TabsList></Tabs>
      <DataTable rows={rows} onRowClick={(t) => setSelId(t.id)} searchText={(t) => `${t.ticketNumber} ${t.subject} ${custName(t.customerId)}`} defaultSort={{ key: "d", dir: "desc" }} columns={[
        { key: "n", header: "Ticket", cell: (t) => <div><p className="font-medium">{t.subject}</p><p className="num text-xs text-muted-foreground">{t.ticketNumber}</p></div> },
        { key: "c", header: "Customer", cell: (t) => custName(t.customerId), hideOnMobile: true },
        { key: "cat", header: "Category", cell: (t) => humanize(t.category), hideOnMobile: true },
        { key: "p", header: "Priority", cell: (t) => <StatusBadge status={t.priority} /> },
        { key: "a", header: "Assignee", cell: (t) => t.assignedTo ?? <span className="text-muted-foreground">Unassigned</span>, hideOnMobile: true },
        { key: "d", header: "Created", cell: (t) => <span className="text-xs">{fmtDateTime(t.createdAt)}</span>, sort: (t) => t.createdAt, hideOnMobile: true },
        { key: "s", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
      ]} />
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <DialogContent className="sm:max-w-lg">
          {sel && (<>
            <DialogHeader><DialogTitle>{sel.subject}</DialogTitle><DialogDescription className="num">{sel.ticketNumber} · {custName(sel.customerId)}</DialogDescription></DialogHeader>
            <p className="rounded-md bg-muted p-3 text-sm">{sel.description}</p>
            <KV items={[["Category", humanize(sel.category)], ["Priority", humanize(sel.priority)], ["Created", fmtDateTime(sel.createdAt)], ["Status", <StatusBadge key="s" status={sel.status} />]]} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Assign to"><Select value={sel.assignedTo ?? ""} onValueChange={(v) => { actions.updateTicket(sel.id, { assignedTo: v, status: sel.status === "OPEN" ? "IN_PROGRESS" : sel.status }); toast.success(`Assigned to ${v}`); }}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Status"><Select value={sel.status} onValueChange={(v) => { actions.updateTicket(sel.id, { status: v as SupportTicket["status"] }); toast.success(`Ticket ${humanize(v).toLowerCase()}`); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent></Select></Field>
            </div>
          </>)}
        </DialogContent>
      </Dialog>
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New support ticket</DialogTitle><DialogDescription>Log a request or complaint on behalf of a customer.</DialogDescription></DialogHeader>
          <Field label="Customer"><Select value={nf.customerId} onValueChange={(v) => setNf({ ...nf, customerId: v })}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Subject"><Input value={nf.subject} onChange={(e) => setNf({ ...nf, subject: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><Select value={nf.category} onValueChange={(v) => setNf({ ...nf, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["ACCOUNT", "CARD", "TRANSFER", "LOAN", "COMPLAINT"].map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Priority"><Select value={nf.priority} onValueChange={(v) => setNf({ ...nf, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["LOW", "MEDIUM", "HIGH"].map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent></Select></Field>
          </div>
          <Field label="Description"><Textarea rows={3} value={nf.description} onChange={(e) => setNf({ ...nf, description: e.target.value })} /></Field>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <DialogFooter><Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button><Button onClick={create}>Create ticket</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
