import { useMemo, useState } from "react";
import { modules, requirements, testsForReq } from "@/docs";
import { DataTable } from "@/components/data/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { humanize } from "@/lib/format";
import { DiagramLink, ImplBadge, ModuleChip, ReqSheet, TestLink } from "./shared";

export function Traceability() {
  const [mod, setMod] = useState("ALL"); const [status, setStatus] = useState("ALL"); const [sel, setSel] = useState<string | null>(null);
  const rows = useMemo(() => requirements.filter((r) => (mod === "ALL" || r.modules.includes(mod)) && (status === "ALL" || r.status === status)), [mod, status]);
  const covered = requirements.filter((r) => testsForReq(r.id).length).length;
  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">Test coverage: <b className="num text-foreground">{covered}/{requirements.length}</b> requirements have at least one test case. Click a requirement ID to open it; diagram and test IDs open their pages.</p>
      <DataTable rows={rows} pageSize={15} searchText={(r) => `${r.id} ${r.title} ${testsForReq(r.id).map((t) => t.id).join(" ")} ${r.diagrams.join(" ")}`} searchPlaceholder="Search requirement, UML or TC ID"
        toolbar={<>
          <Select value={mod} onValueChange={setMod}><SelectTrigger className="h-9 w-64"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All modules</SelectItem>{modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.id} · {m.name}</SelectItem>)}</SelectContent></Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem>{["IMPLEMENTED", "PARTIALLY_IMPLEMENTED", "PROPOSED", "NEEDS_VERIFICATION"].map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}</SelectContent></Select>
        </>}
        columns={[
          { key: "id", header: "Requirement", sort: (r) => r.id, cell: (r) => <button onClick={() => setSel(r.id)} className="text-left"><span className="num block text-xs font-semibold text-accent-foreground hover:underline">{r.id}</span><span className="text-xs">{r.title}</span></button> },
          { key: "m", header: "Design module", cell: (r) => <div className="flex flex-wrap gap-1">{r.modules.map((m) => <ModuleChip key={m} id={m} />)}</div> },
          { key: "d", header: "UML diagram", cell: (r) => <div className="flex flex-wrap gap-1">{r.diagrams.length ? r.diagrams.map((d) => <DiagramLink key={d} id={d} />) : <span className="text-xs text-muted-foreground">—</span>}</div> },
          { key: "t", header: "Test case", cell: (r) => <div className="flex flex-wrap gap-1">{testsForReq(r.id).length ? testsForReq(r.id).map((t) => <TestLink key={t.id} id={t.id} />) : <span className="text-xs text-warning">Not covered</span>}</div> },
          { key: "s", header: "Status", cell: (r) => <ImplBadge s={r.status} /> },
        ]} />
      <ReqSheet id={sel} onClose={() => setSel(null)} />
    </>
  );
}
