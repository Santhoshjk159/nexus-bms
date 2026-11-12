import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, Eye, EyeOff, Lock, ShieldCheck, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { DEMO_USERS, HOME, login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/finance/ui";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — NEXUS BANK" }, { name: "description", content: "Sign in to the NEXUS BANK customer, operations or administrator portal." }, { property: "og:title", content: "Sign in — NEXUS BANK" }, { property: "og:description", content: "Secure sign-in to NEXUS BANK." }] }),
  component: LoginPage,
});

const schema = z.object({ email: z.string().trim().email("Enter a valid email address"), password: z.string().min(6, "Password must be at least 6 characters") });
const ROLES: { role: Role; icon: typeof UserRound }[] = [{ role: "CUSTOMER", icon: UserRound }, { role: "EMPLOYEE", icon: Users }, { role: "ADMIN", icon: ShieldCheck }];

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [email, setEmail] = useState(DEMO_USERS.CUSTOMER.email);
  const [password, setPassword] = useState(DEMO_USERS.CUSTOMER.password);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const pickRole = (r: Role) => { setRole(r); setEmail(DEMO_USERS[r].email); setPassword(DEMO_USERS[r].password); setErrors({}); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse({ email, password });
    if (!p.success) { setErrors(Object.fromEntries(p.error.issues.map((i) => [i.path[0], i.message]))); return; }
    setErrors({}); setLoading(true);
    setTimeout(() => {
      const s = login(email, password); setLoading(false);
      if (!s) { setErrors({ password: "Invalid credentials. Use one of the demo accounts." }); return; }
      toast.success(`Welcome back, ${s.name.split(" ")[0]}`);
      navigate({ to: HOME[s.role] });
    }, 500);
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="bank-card-bg relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-md bg-primary-foreground/15 text-lg font-bold">N</span><div><p className="font-semibold tracking-wide">NEXUS BANK</p><p className="text-xs uppercase tracking-widest opacity-70">Enterprise Core Banking</p></div></div>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">One core for customers, operations and governance.</h1>
          <p className="mt-4 text-sm leading-relaxed opacity-80">Accounts, payments, double-entry ledger, lending, cards, fraud monitoring and audit — in a single, role-aware platform.</p>
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-primary-foreground/20 pt-6 text-sm">
            <div><p className="num text-xl font-semibold">99.98%</p><p className="opacity-70">Ledger uptime</p></div>
            <div><p className="num text-xl font-semibold">6</p><p className="opacity-70">Branches</p></div>
            <div><p className="num text-xl font-semibold">T+0</p><p className="opacity-70">Reconciliation</p></div>
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs opacity-70"><Building2 className="size-3.5" />Academic simulation. No real customers, credentials or funds.</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose a demo role or enter credentials.</p>
          <div className="mt-6 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Demo role">
            {ROLES.map(({ role: r, icon: Icon }) => (
              <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => pickRole(r)} className={cn("flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors", role === r ? "border-teal bg-accent text-accent-foreground" : "border-border hover:bg-muted")}>
                <Icon className="size-4" />{r === "ADMIN" ? "Admin" : r === "EMPLOYEE" ? "Employee" : "Customer"}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label="Email" error={errors.email}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Field>
            <Field label="Password" error={errors.password}>
              <div className="relative">
                <Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="pr-9" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
              </div>
            </Field>
            <div className="flex justify-end"><Link to="/forgot-password" className="text-xs font-medium text-accent-foreground hover:underline">Forgot password?</Link></div>
            <Button type="submit" className="w-full" disabled={loading}><Lock className="size-4" />{loading ? "Authenticating…" : "Sign in securely"}</Button>
          </form>
          <div className="mt-6 rounded-md bg-muted p-3 text-xs text-muted-foreground"><p className="font-medium text-foreground">{DEMO_USERS[role].name} · {DEMO_USERS[role].title}</p><p className="num mt-1">{DEMO_USERS[role].email} / {DEMO_USERS[role].password}</p></div>
        </div>
      </div>
    </div>
  );
}
