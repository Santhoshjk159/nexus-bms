import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { HUB_NAV } from "@/components/sehub/nav";

export const Route = createFileRoute("/admin/se-hub")({
  head: () => ({ meta: [{ title: "Software Engineering Hub — NEXUS BMS" }, { name: "description", content: "Engineering documentation, UML, requirements and quality assurance for NEXUS BMS." }] }),
  component: HubLayout,
});

function HubLayout() {
  const { pathname } = useLocation();
  const item = (to: string, active: boolean) => cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors", active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground");
  return (
    <div className="-m-4 flex min-h-[calc(100vh-3.5rem)] flex-col sm:-m-6 lg:flex-row">
      <aside className="border-b border-border bg-card lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r print:hidden" aria-label="Documentation navigation">
        <div className="px-4 pb-2 pt-4"><p className="text-xs font-semibold tracking-wide text-foreground">SE HUB</p><p className="text-[11px] text-muted-foreground">Engineering documentation</p></div>
        <nav className="flex gap-4 overflow-x-auto px-3 pb-4 lg:block lg:space-y-4 lg:overflow-visible">
          <div className="shrink-0"><p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Overview</p>
            <Link to="/admin/se-hub" className={item("/admin/se-hub", pathname === "/admin/se-hub")}><LayoutDashboard className="size-3.5" />Documentation Dashboard</Link></div>
          {HUB_NAV.map((g) => (
            <div key={g.label} className="shrink-0">
              {g.label !== "Overview" && <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{g.label}</p>}
              {g.items.map((s) => <Link key={s.slug} to="/admin/se-hub/$section" params={{ section: s.slug }} className={item(s.slug, pathname === `/admin/se-hub/${s.slug}`)}><s.icon className="size-3.5 shrink-0" /><span className="whitespace-nowrap">{s.label}</span></Link>)}
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 p-4 sm:p-6"><Outlet /></div>
    </div>
  );
}
