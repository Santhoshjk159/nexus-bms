import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, LogOut, Menu, RotateCcw, Search, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";
import { getSession, logout } from "@/lib/auth";
import { actions, useBank } from "@/services/store";
import { fmtDateTime, humanize } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Role } from "@/types";

const PORTAL: Record<Role, string> = { CUSTOMER: "Personal Banking", EMPLOYEE: "Operations", ADMIN: "Administration" };

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-5">
      <span className="grid size-8 place-items-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">N</span>
      <div className="leading-tight"><p className="text-sm font-semibold tracking-wide text-sidebar-accent-foreground">NEXUS BANK</p><p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/70">Core Banking</p></div>
    </div>
  );
}

function SideNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <Logo />
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV[role].map((g) => (
          <div key={g.label}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">{g.label}</p>
            {g.items.map((it) => {
              const active = pathname === it.to;
              return (
                <Link key={it.to} to={it.to} onClick={onNavigate} className={cn("mb-0.5 flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors", active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
                  <it.icon className={cn("size-4", active && "text-sidebar-primary")} />{it.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-sidebar-border p-3 text-[11px] text-sidebar-foreground/60">Simulated environment · No real funds</div>
    </nav>
  );
}

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const session = getSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const notes = useBank((s) => s.notifications.filter((n) => n.audience === role));
  const unread = notes.filter((n) => !n.read).length;
  const allItems = Object.values(NAV).flat().flatMap((g) => g.items);
  const current = allItems.find((i) => i.to === pathname);
  const segs = pathname.split("/").filter(Boolean);
  const signOut = () => { logout(); navigate({ to: "/login", replace: true }); toast.success("Signed out securely"); };
  const [q, setQ] = useState("");
  const items = NAV[role].flatMap((g) => g.items);
  const go = (e: React.FormEvent) => { e.preventDefault(); const m = items.find((i) => i.label.toLowerCase().includes(q.toLowerCase())); if (m) { navigate({ to: m.to }); setQ(""); } else toast.error(`No page matches “${q}”`); };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block"><SideNav role={role} /></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-none p-0"><SheetTitle className="sr-only">Navigation</SheetTitle><SideNav role={role} onNavigate={() => setOpen(false)} /></SheetContent>
      </Sheet>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></Button>
          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-sm text-muted-foreground sm:flex">
            <span>{PORTAL[role]}</span>
            {segs.slice(1).map((s, i) => (<span key={i} className="flex items-center gap-1"><ChevronRight className="size-3.5" /><span className={i === segs.length - 2 ? "font-medium text-foreground" : ""}>{i === segs.length - 2 && current ? current.label : humanize(s)}</span></span>))}
          </nav>
          <form onSubmit={go} className="relative ml-auto hidden md:block">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to page…" className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </form>
          <Popover onOpenChange={(o) => { if (!o && unread) actions.markNotificationsRead(role); }}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative ml-auto md:ml-0" aria-label="Notifications">
                <Bell className="size-5" />{unread > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-teal text-[9px] font-bold text-teal-foreground">{unread}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</div>
              <div className="max-h-80 overflow-y-auto">
                {notes.length ? notes.slice(0, 8).map((n) => (
                  <div key={n.id} className="flex gap-3 border-b border-border px-4 py-3 last:border-0">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-muted" : "bg-teal")} />
                    <div><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{n.body}</p><p className="mt-1 text-[10px] text-muted-foreground">{fmtDateTime(n.at)}</p></div>
                  </div>
                )) : <p className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</p>}
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted" aria-label="Profile menu">
                <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{session?.name.split(" ").map((x) => x[0]).join("")}</span>
                <span className="hidden text-left leading-tight sm:block"><span className="block text-sm font-medium">{session?.name}</span><span className="block text-[11px] text-muted-foreground">{humanize(role)}</span></span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal"><p className="text-sm font-medium">{session?.name}</p><p className="text-xs text-muted-foreground">{session?.email}</p></DropdownMenuLabel>
              <DropdownMenuSeparator />
              {role === "CUSTOMER" && <DropdownMenuItem onClick={() => navigate({ to: "/customer/profile" })}><UserCircle className="size-4" />Profile & KYC</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => { actions.reset(); toast.success("Demo data restored to its original state"); }}><RotateCcw className="size-4" />Reset demo data</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive"><LogOut className="size-4" />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
