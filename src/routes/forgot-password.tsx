import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MailCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/finance/ui";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — NEXUS BANK" }, { name: "description", content: "Request a password reset link for your NEXUS BANK account." }, { property: "og:title", content: "Reset password — NEXUS BANK" }, { property: "og:description", content: "Request a password reset link." }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState(""); const [err, setErr] = useState(""); const [sent, setSent] = useState(false); const [loading, setLoading] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!z.string().email().safeParse(email.trim()).success) return setErr("Enter a valid registered email address");
    setErr(""); setLoading(true); setTimeout(() => { setLoading(false); setSent(true); }, 700);
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="card-surface w-full max-w-sm p-6">
        <Link to="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />Back to sign in</Link>
        {sent ? (
          <div className="py-6 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-success-soft text-success"><MailCheck className="size-6" /></span>
            <h1 className="mt-4 text-lg font-semibold">Check your inbox</h1>
            <p className="mt-1 text-sm text-muted-foreground">If <b>{email}</b> is registered, a reset link valid for 15 minutes has been sent (simulated).</p>
            <Button asChild className="mt-6 w-full"><Link to="/login">Return to sign in</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
            <div><h1 className="text-lg font-semibold">Reset your password</h1><p className="mt-1 text-sm text-muted-foreground">We'll email you a secure reset link.</p></div>
            <Field label="Registered email" error={err}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
