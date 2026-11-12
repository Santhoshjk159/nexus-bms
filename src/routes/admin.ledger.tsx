import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCheck, Scale } from "lucide-react";
import { toast } from "sonner";
import { actions, useBank } from "@/services/store";
import { isBalanced } from "@/lib/banking";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtDateTime, inr, mask } from "@/lib/format";
import { BookOpenCheck, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/ledger")({
  head: () => ({ meta: [{ title: "General ledger — NEXUS BANK Admin" }, { name: "description", content: "Double-entry journal postings and reconciliation." }] }),
  component: Ledger,
});

function Ledger() {
  const entries = useBank((s) => s.ledgerEntries); const gls = useBank((s) => s.ledgerAccounts);
  const [gl, setGl] = useState("ALL"); const [rec, setRec] = useState("ALL");
  const glName = (id: string) => gls.find((g) => g.id === id)?.name ?? id;
  const journals = useMemo(() => {
    const m = new Map<string, typeof entries>(); entries.forEach((e) => m.set(e.journalRef, [...(m.get(e.journalRef) ?? []), e]));
    return [...m.entries()].map(([ref, es]) => ({ id: ref, ref, es, txn: es[0].transactionRef, at: es[0].postedAt, amount: es.reduce((s, e) => s + e.debit, 0), balanced: isBalanced(es), status: es[0].postingStatus, reconciled: es.every((e) => e.reconciled), narration: es[0].narration }));
  }, [entries]);
  const tb = gls.map((g) => { const es = entries.filter((e) => e.ledgerAccountId === g.id && e.postingStatus !== "REVERSED"); const d = es.reduce((s, e) => s + e.debit, 0), c = es.reduce((s, e) => s + e.credit, 0); return { ...g, d, c }; });
  const totD = tb.reduce((s, r) => s + r.d, 0), totC = tb.reduce((s, r) => s + r.c, 0);
  const pending = journals.filter((j) => !j.reconciled && j.status === "POSTED");
  const lines = entries.filter((e) => (gl === "ALL" || e.ledgerAccountId === gl) && (rec === "ALL" || String(e.reconciled) === rec));
  return (
    <>
      <PageHeader title="General ledger" description="Every transaction posts as balanced debit and credit entries." actions={<Button disabled={!pending.length} onClick={() => { const n = actions.reconcile(pending.map((j) => j.ref)); toast.success(`${n} journals reconciled`); }}><CheckCheck className="size-4" />Reconcile {pending.length} posted journals</Button>} />
      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <StatCard label="Journals" value={journals.length} icon={BookOpenCheck} />
        <StatCard label="Total debits" value={inr(totD, true)} icon={Scale} tone="teal" />
        <StatCard label="Total credits" value={inr(totC, true)} icon={Scale} tone="teal" hint={Math.abs(totD - totC) < 0.01 ? "Books balanced ✓" : "Out of balance"} />
        <StatCard label="Unreconciled" value={journals.filter((j) => !j.reconciled).length} icon={AlertCircle} tone="warning" />
      </div>
      <Tabs defaultValue="journals">
        <TabsList><TabsTrigger value="journals">Journals</TabsTrigger><TabsTrigger value="entries">Ledger entries</TabsTrigger><TabsTrigger value="tb">Trial balance</TabsTrigger></TabsList>
        <TabsContent value="journals" className="mt-4">
          <DataTable rows={journals} searchText={(j) => `${j.ref} ${j.txn} ${j.narration}`} defaultSort={{ key: "at", dir: "desc" }} columns={[
            { key: "ref", header: "Journal", cell: (j) => <div><p className="num font-medium">{j.ref}</p><p className="text-xs text-muted-foreground">{j.narration}</p></div> },
            { key: "txn", header: "Txn ref", cell: (j) => <span className="num text-xs">{j.txn}</span>, hideOnMobile: true },
            { key: "legs", header: "Postings", cell: (j) => <div className="space-y-0.5 text-xs">{j.es.map((e) => <p key={e.id}><span className="num">{e.debit ? "Dr" : "Cr"}</span> {glName(e.ledgerAccountId)}</p>)}</div>, hideOnMobile: true },
            { key: "amt", header: "Amount", cell: (j) => <span className="num">{inr(j.amount)}</span>, sort: (j) => j.amount },
            { key: "bal", header: "Balanced", cell: (j) => <StatusBadge status={j.balanced ? "BALANCED" : "UNBALANCED"} tone={j.balanced ? "success" : "danger"} /> },
            { key: "st", header: "Posting", cell: (j) => <StatusBadge status={j.status} /> },
            { key: "rec", header: "Reconciled", cell: (j) => <StatusBadge status={j.reconciled ? "RECONCILED" : "OPEN"} tone={j.reconciled ? "success" : "warning"} /> },
            { key: "at", header: "Posted", cell: (j) => <span className="text-xs">{fmtDateTime(j.at)}</span>, sort: (j) => j.at, hideOnMobile: true },
          ]} />
        </TabsContent>
        <TabsContent value="entries" className="mt-4">
          <DataTable rows={lines} pageSize={15} searchText={(e) => `${e.journalRef} ${e.transactionRef} ${e.accountNumber ?? ""}`}
            toolbar={<>
              <Select value={gl} onValueChange={setGl}><SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All ledger accounts</SelectItem>{gls.map((g) => <SelectItem key={g.id} value={g.id}>{g.code} · {g.name}</SelectItem>)}</SelectContent></Select>
              <Select value={rec} onValueChange={setRec}><SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All</SelectItem><SelectItem value="true">Reconciled</SelectItem><SelectItem value="false">Unreconciled</SelectItem></SelectContent></Select>
            </>}
            columns={[
              { key: "j", header: "Journal", cell: (e) => <span className="num text-xs">{e.journalRef}</span> },
              { key: "gl", header: "Ledger account", cell: (e) => glName(e.ledgerAccountId) },
              { key: "a", header: "Sub-account", cell: (e) => <span className="num text-xs">{e.accountNumber ? mask(e.accountNumber) : "—"}</span>, hideOnMobile: true },
              { key: "dr", header: "Debit", cell: (e) => <span className="num">{e.debit ? inr(e.debit) : ""}</span>, sort: (e) => e.debit, className: "text-right" },
              { key: "cr", header: "Credit", cell: (e) => <span className="num">{e.credit ? inr(e.credit) : ""}</span>, sort: (e) => e.credit, className: "text-right" },
              { key: "s", header: "Status", cell: (e) => <StatusBadge status={e.postingStatus} />, hideOnMobile: true },
            ]} />
        </TabsContent>
        <TabsContent value="tb" className="mt-4">
          <Panel title="Trial balance" bodyClassName="p-0 overflow-x-auto">
            <table className="w-full text-sm"><thead className="bg-muted/60"><tr>{["Code", "Account", "Type", "Debit", "Credit"].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>{tb.map((r) => <tr key={r.id} className="border-t border-border"><td className="num px-4 py-2.5">{r.code}</td><td className="px-4">{r.name}</td><td className="px-4 text-xs text-muted-foreground">{r.type}</td><td className="num px-4">{inr(r.d)}</td><td className="num px-4">{inr(r.c)}</td></tr>)}
                <tr className="border-t-2 border-border bg-muted/40 font-semibold"><td className="px-4 py-2.5" colSpan={3}>Total</td><td className="num px-4">{inr(totD)}</td><td className="num px-4">{inr(totC)}</td></tr></tbody></table>
          </Panel>
        </TabsContent>
      </Tabs>
    </>
  );
}
