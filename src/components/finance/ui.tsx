import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { humanize, inr } from "@/lib/format";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TONE: Record<string, string> = {
  success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-destructive-soft text-destructive",
  info: "bg-info-soft text-info", neutral: "bg-muted text-muted-foreground", teal: "bg-accent text-accent-foreground",
};
const STATUS_TONE: Record<string, keyof typeof TONE> = {
  ACTIVE: "success", COMPLETED: "success", VERIFIED: "success", APPROVED: "success", POSTED: "success", PAID: "success", RESOLVED: "success", CLEARED: "success", SUCCESS: "success", LOW: "neutral",
  PENDING: "warning", UNDER_REVIEW: "warning", APPLIED: "info", IN_PROGRESS: "info", INVESTIGATING: "info", DUE: "warning", OPEN: "warning", MEDIUM: "warning", FROZEN: "info",
  FAILED: "danger", REJECTED: "danger", SUSPENDED: "danger", BLOCKED: "danger", REVERSED: "danger", OVERDUE: "danger", ESCALATED: "danger", CONFIRMED: "danger", HIGH: "danger", CRITICAL: "danger", FAILURE: "danger",
  CLOSED: "neutral", INACTIVE: "neutral", NOT_SUBMITTED: "neutral",
};
export function StatusBadge({ status, tone, className }: { status: string; tone?: keyof typeof TONE; className?: string }) {
  const t = tone ?? STATUS_TONE[status] ?? "neutral";
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", TONE[t], className)}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />{humanize(status)}
    </span>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, delta, hint, tone = "primary" }: { label: string; value: ReactNode; icon: LucideIcon; delta?: number; hint?: string; tone?: "primary" | "teal" | "success" | "warning" | "danger" }) {
  const iconTone = { primary: "bg-secondary text-primary", teal: "bg-accent text-accent-foreground", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-destructive-soft text-destructive" }[tone];
  return (
    <div className="card-surface p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={cn("grid size-8 place-items-center rounded-md", iconTone)}><Icon className="size-4" /></span>
      </div>
      <p className="num mt-3 text-xl font-semibold text-foreground sm:text-2xl">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {delta !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 font-medium", delta >= 0 ? "text-success" : "text-destructive")}>
            {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint}
      </div>
    </div>
  );
}

export function Panel({ title, description, actions, children, className, bodyClassName }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("card-surface", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div><h2 className="text-sm font-semibold text-foreground">{title}</h2>{description && <p className="text-xs text-muted-foreground">{description}</p>}</div>
          {actions}
        </header>
      )}
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({ title = "Nothing here yet", description, icon: Icon = Inbox, action }: { title?: string; description?: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground"><Icon className="size-5" /></span>
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Amount({ value, type, className }: { value: number; type?: "CREDIT" | "DEBIT"; className?: string }) {
  return (
    <span className={cn("num whitespace-nowrap font-medium", type === "CREDIT" ? "text-success" : "text-foreground", className)}>
      {type === "CREDIT" ? "+" : type === "DEBIT" ? "−" : ""}{inr(value)}
    </span>
  );
}

export function Field({ label, children, error, hint }: { label: string; children: ReactNode; error?: string; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      {children}
      {error ? <span className="block text-xs text-destructive">{error}</span> : hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function Confirm({ trigger, title, description, confirmLabel = "Confirm", onConfirm, destructive }: { trigger: ReactNode; title: string; description: string; confirmLabel?: string; onConfirm: () => void; destructive?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([k, v]) => (<div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 text-sm font-medium text-foreground">{v}</dd></div>))}
    </dl>
  );
}
