import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Snowflake, Unlock, Wifi } from "lucide-react";
import { toast } from "sonner";
import { useCustomer } from "@/hooks/use-customer";
import { actions, useBank } from "@/services/store";
import { Amount, Confirm, EmptyState, Field, PageHeader, Panel, StatusBadge } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { fmtDate, inr } from "@/lib/format";

export const Route = createFileRoute("/customer/cards")({
  head: () => ({ meta: [{ title: "Cards — NEXUS BANK" }, { name: "description", content: "Manage your virtual debit cards and limits." }] }),
  component: Cards,
});

function Cards() {
  const { id, txns } = useCustomer();
  const cards = useBank((s) => s.cards.filter((c) => c.customerId === id));
  const [selId, setSelId] = useState(cards[0]?.id);
  const card = cards.find((c) => c.id === selId) ?? cards[0];
  const [reveal, setReveal] = useState(false);
  const [daily, setDaily] = useState(String(card?.dailyLimit ?? "")); const [online, setOnline] = useState(String(card?.onlineLimit ?? "")); const [err, setErr] = useState("");
  if (!card) return <div className="card-surface"><EmptyState title="No cards" description="You don't have any debit cards yet." /></div>;
  const cardTxns = txns.filter((t) => t.accountId === card.accountId && t.channel === "CARD").slice(0, 8);
  const saveLimits = () => {
    const d = Number(daily), o = Number(online);
    if (!d || d < 1000 || d > 500000) return setErr("Daily limit must be between ₹1,000 and ₹5,00,000");
    if (o > d) return setErr("Online limit cannot exceed the daily limit");
    setErr(""); actions.updateCard(card.id, { dailyLimit: d, onlineLimit: o }); toast.success("Card limits updated");
  };
  const frozen = card.status === "FROZEN";
  return (
    <>
      <PageHeader title="Cards" description="Virtual debit cards linked to your accounts." />
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-2">
          <div className={cn("bank-card-bg relative aspect-[1.586] w-full max-w-md overflow-hidden rounded-2xl p-6 text-primary-foreground shadow-xl transition-all", frozen && "grayscale opacity-70")}>
            <div className="flex items-start justify-between"><div><p className="text-sm font-semibold tracking-wide">NEXUS BANK</p><p className="text-[10px] uppercase tracking-widest opacity-70">Debit · Virtual</p></div><Wifi className="size-5 rotate-90 opacity-80" /></div>
            <p className="num mt-10 text-lg tracking-[0.2em] sm:text-xl">{reveal ? card.cardNumber.replace(/(\d{4})/g, "$1 ").trim() : `•••• •••• •••• ${card.cardNumber.slice(-4)}`}</p>
            <div className="mt-6 flex items-end justify-between text-xs">
              <div><p className="opacity-60">Card holder</p><p className="mt-0.5 font-medium tracking-wide">{card.holder}</p></div>
              <div><p className="opacity-60">Expires</p><p className="num mt-0.5 font-medium">{card.expiry}</p></div>
              <p className="text-base font-bold italic">{card.network}</p>
            </div>
            {frozen && <div className="absolute inset-0 grid place-items-center bg-primary/40"><span className="flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground"><Snowflake className="size-3.5" />Frozen</span></div>}
          </div>
          {cards.length > 1 && <div className="flex gap-2">{cards.map((c) => <Button key={c.id} size="sm" variant={c.id === card.id ? "default" : "outline"} onClick={() => { setSelId(c.id); setDaily(String(c.dailyLimit)); setOnline(String(c.onlineLimit)); }}>•••• {c.cardNumber.slice(-4)}</Button>)}</div>}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setReveal(!reveal)}>{reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{reveal ? "Hide number" : "Show number"}</Button>
            {card.status !== "BLOCKED" && <Button variant={frozen ? "default" : "outline"} onClick={() => { actions.setCardStatus(card.id, frozen ? "ACTIVE" : "FROZEN"); toast.success(frozen ? "Card unfrozen" : "Card frozen", { description: frozen ? "Transactions are allowed again." : "All transactions are temporarily blocked." }); }}>{frozen ? <Unlock className="size-4" /> : <Snowflake className="size-4" />}{frozen ? "Unfreeze" : "Freeze card"}</Button>}
            {card.status !== "BLOCKED" && <Confirm destructive title="Block card permanently?" description="Use this if your card is lost or compromised. This can't be undone; a replacement can be requested from support." confirmLabel="Block card" onConfirm={() => { actions.setCardStatus(card.id, "BLOCKED"); toast.success("Card blocked permanently"); }} trigger={<Button variant="ghost" className="text-destructive"><Lock className="size-4" />Block</Button>} />}
          </div>
          <p className="text-xs text-muted-foreground">Status: <StatusBadge status={card.status} /></p>
        </div>
        <div className="space-y-4 xl:col-span-3">
          <Panel title="Limits & controls">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Daily limit (₹)"><Input className="num" value={daily} onChange={(e) => setDaily(e.target.value.replace(/\D/g, ""))} /></Field>
              <Field label="Online limit (₹)"><Input className="num" value={online} onChange={(e) => setOnline(e.target.value.replace(/\D/g, ""))} /></Field>
            </div>
            {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <label className="flex items-center justify-between text-sm"><span>Online transactions</span><Switch checked={card.onlineEnabled} disabled={card.status !== "ACTIVE"} onCheckedChange={(v) => { actions.updateCard(card.id, { onlineEnabled: v }); toast.success(`Online usage ${v ? "enabled" : "disabled"}`); }} /></label>
              <label className="flex items-center justify-between text-sm"><span>International usage</span><Switch checked={card.internationalEnabled} disabled={card.status !== "ACTIVE"} onCheckedChange={(v) => { actions.updateCard(card.id, { internationalEnabled: v }); toast.success(`International usage ${v ? "enabled" : "disabled"}`); }} /></label>
            </div>
            <Button className="mt-4" onClick={saveLimits} disabled={card.status === "BLOCKED"}>Save limits</Button>
          </Panel>
          <Panel title="Recent card transactions" bodyClassName="p-0">
            {cardTxns.length ? cardTxns.map((t) => (<div key={t.id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0"><div><p className="text-sm font-medium">{t.counterparty}</p><p className="text-xs text-muted-foreground">{fmtDate(t.createdAt)}</p></div><div className="text-right"><Amount value={t.amount} type={t.type} />{t.status !== "COMPLETED" && <div><StatusBadge status={t.status} /></div>}</div></div>)) : <EmptyState title="No card transactions" />}
            <p className="border-t border-border px-5 py-2 text-xs text-muted-foreground">Remaining daily limit: <span className="num">{inr(Math.max(0, card.dailyLimit - cardTxns.filter((t) => new Date(t.createdAt).toDateString() === new Date().toDateString()).reduce((s, t) => s + t.amount, 0)))}</span></p>
          </Panel>
        </div>
      </div>
    </>
  );
}
