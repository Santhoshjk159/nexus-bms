import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { actions, useBank } from "@/services/store";
import { API_BASE_URL, API_MODE } from "@/services/api";
import { Confirm, Field, KV, PageHeader, Panel } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "System settings — NEXUS BANK Admin" }, { name: "description", content: "Transfer limits, fraud thresholds and security policy." }] }),
  component: Settings,
});

function Settings() {
  const s = useBank((x) => x.settings);
  const [f, setF] = useState({ maxDailyTransfer: String(s.maxDailyTransfer), largeTransferThreshold: String(s.largeTransferThreshold), velocityLimit: String(s.velocityLimit), sessionTimeoutMin: String(s.sessionTimeoutMin) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = () => {
    const n = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, Number(v)])) as Record<keyof typeof f, number>; const e: Record<string, string> = {};
    if (n.maxDailyTransfer < 10000) e.maxDailyTransfer = "Minimum ₹10,000";
    if (n.largeTransferThreshold < 1000 || n.largeTransferThreshold > n.maxDailyTransfer) e.largeTransferThreshold = "Must be between ₹1,000 and the daily limit";
    if (n.velocityLimit < 1 || n.velocityLimit > 50) e.velocityLimit = "1–50 transactions";
    if (n.sessionTimeoutMin < 1 || n.sessionTimeoutMin > 120) e.sessionTimeoutMin = "1–120 minutes";
    setErrors(e); if (Object.keys(e).length) return;
    actions.updateSettings(n); toast.success("Configuration saved");
  };
  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value.replace(/\D/g, "") });
  return (
    <>
      <PageHeader title="System configuration" actions={<Button onClick={save}><Save className="size-4" />Save changes</Button>} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Transaction limits">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Max daily transfer (₹)" error={errors.maxDailyTransfer} hint={inr(Number(f.maxDailyTransfer))}><Input className="num" value={f.maxDailyTransfer} onChange={num("maxDailyTransfer")} /></Field>
          </div>
        </Panel>
        <Panel title="Fraud rule engine">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Large transfer threshold (₹)" error={errors.largeTransferThreshold} hint="HIGH at threshold, CRITICAL at 2×"><Input className="num" value={f.largeTransferThreshold} onChange={num("largeTransferThreshold")} /></Field>
            <Field label="Velocity limit (debits / hour)" error={errors.velocityLimit}><Input className="num" value={f.velocityLimit} onChange={num("velocityLimit")} /></Field>
          </div>
        </Panel>
        <Panel title="Security policy">
          <Field label="Session timeout (minutes)" error={errors.sessionTimeoutMin}><Input className="num w-40" value={f.sessionTimeoutMin} onChange={num("sessionTimeoutMin")} /></Field>
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <label className="flex items-center justify-between text-sm"><span>Require two-factor authentication</span><Switch checked={s.twoFactorRequired} onCheckedChange={(v) => { actions.updateSettings({ twoFactorRequired: v }); toast.success(`2FA ${v ? "enforced" : "optional"}`); }} /></label>
            <label className="flex items-center justify-between text-sm"><span>Maintenance mode (banner only)</span><Switch checked={s.maintenanceMode} onCheckedChange={(v) => { actions.updateSettings({ maintenanceMode: v }); toast.success(`Maintenance mode ${v ? "on" : "off"}`); }} /></label>
          </div>
        </Panel>
        <Panel title="Integration">
          <KV items={[["API mode", API_MODE === "mock" ? "Mock services (in-browser)" : "Spring Boot REST"], ["API base URL", <span key="u" className="num text-xs">{API_BASE_URL}</span>], ["Auth", "JWT bearer (Spring Security)"], ["Database target", "MySQL 8"]]} />
          <Confirm destructive title="Reset all demo data?" description="Restores every customer, account, transaction and setting to the original seed." confirmLabel="Reset" onConfirm={() => { actions.reset(); toast.success("Demo data reset"); setTimeout(() => location.reload(), 300); }} trigger={<Button variant="outline" className="mt-5"><RotateCcw className="size-4" />Reset demo data</Button>} />
        </Panel>
      </div>
    </>
  );
}
