import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { HUB_NAV } from "@/components/sehub/nav";

export const Route = createFileRoute("/admin/se-hub")({
  head: () => ({ meta: [{ title: "Software Engineering Hub — NEXUS BMS" }, { name: "description", content: "Engineering documentation, UML, requirements and quality assurance for NEXUS BMS." }] }),
  component: HubLayout,
});

function HubLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const current = pathname.replace(/^\/admin\/se-hub\/?/, "") || "__home";
  const item = (to: string, active: boolean) => cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors", active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground");
  return (
    <div className="-m-4 flex min-h-[calc(100vh-3.5rem)] flex-col sm:-m-6 lg:flex-row">
      <div className="sticky top-14 z-10 flex items-center gap-2 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur lg:hidden print:hidden">
        <Select value={current} onValueChange={(v) => v === "__home" ? navigate({ to: "/admin/se-hub" }) : navigate({ to: "/admin/se-hub/$section", params: { section: v } })}>
          <SelectTrigger className="h-9 flex-1" aria-label="Choose documentation section"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-[70vh]">
            <SelectItem value="__home">Documentation Dashboard</SelectItem>
            {HUB_NAV.map((g) => <SelectGroup key={g.label}><SelectLabel className="text-[10px] uppercase tracking-widest">{g.label}</SelectLabel>{g.items.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.label}</SelectItem>)}</SelectGroup>)}
          </SelectContent>
        </Select>
      </div>
      <aside className="hidden border-b border-border bg-card lg:block lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r print:hidden" aria-label="Documentation navigation">
        <Link to="/admin/dashboard" className="mx-3 mt-3 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"><ArrowLeft className="size-3.5" />Back to Admin Panel</Link>
        <div className="px-4 pb-2 pt-3"><p className="text-xs font-semibold tracking-wide text-foreground">SE HUB</p><p className="text-[11px] text-muted-foreground">Engineering documentation</p></div>
        <nav className="space-y-4 px-3 pb-6">
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
      <div className="mx-auto w-full min-w-0 max-w-[1500px] flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></div>
    </div>
  );
}
