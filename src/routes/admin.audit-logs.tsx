import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useBank } from "@/services/store";
import { PageHeader, StatusBadge } from "@/components/finance/ui";
import { DataTable } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadCsv, fmtDateTime, humanize } from "@/lib/format";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({ meta: [{ title: "Audit logs — NEXUS BANK Admin" }, { name: "description", content: "Immutable trail of user and system actions." }] }),
  component: Audit,
});

function Audit() {
  const logs = useBank((s) => s.auditLogs); const [role, setRole] = useState("ALL"); const [outcome, setOutcome] = useState("ALL");
  const rows = logs.filter((l) => (role === "ALL" || l.actorRole === role) && (outcome === "ALL" || l.outcome === outcome));
  return (
    <>
      <PageHeader title="Audit logs" description="Every significant action across portals, with actor and timestamp." actions={<Button variant="outline" onClick={() => { downloadCsv("audit-log.csv", rows.map(({ id: _i, ...r }) => r)); toast.success("Audit log exported"); }}><Download className="size-4" />Export</Button>} />
      <DataTable rows={rows} pageSize={15} searchText={(l) => `${l.actor} ${l.action} ${l.entity} ${l.entityId}`} searchPlaceholder="Actor, action or entity" defaultSort={{ key: "at", dir: "desc" }}
        toolbar={<>
          <Select value={role} onValueChange={setRole}><SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All actors</SelectItem>{["CUSTOMER", "EMPLOYEE", "ADMIN"].map((r) => <SelectItem key={r} value={r}>{humanize(r)}</SelectItem>)}</SelectContent></Select>
          <Select value={outcome} onValueChange={setOutcome}><SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All outcomes</SelectItem><SelectItem value="SUCCESS">Success</SelectItem><SelectItem value="FAILURE">Failure</SelectItem></SelectContent></Select>
        </>}
        columns={[
          { key: "at", header: "Timestamp", cell: (l) => <span className="num text-xs">{fmtDateTime(l.at)}</span>, sort: (l) => l.at },
          { key: "actor", header: "Actor", cell: (l) => <div><p className="font-medium">{l.actor}</p><p className="text-xs text-muted-foreground">{humanize(l.actorRole)}</p></div>, sort: (l) => l.actor },
          { key: "action", header: "Action", cell: (l) => <span className="num text-xs font-medium">{l.action}</span>, sort: (l) => l.action },
          { key: "e", header: "Entity", cell: (l) => <div className="text-xs"><p>{humanize(l.entity)}</p><p className="num text-muted-foreground">{l.entityId}</p></div>, hideOnMobile: true },
          { key: "ip", header: "IP", cell: (l) => <span className="num text-xs">{l.ip}</span>, hideOnMobile: true },
          { key: "o", header: "Outcome", cell: (l) => <StatusBadge status={l.outcome} /> },
        ]} />
    </>
  );
}
