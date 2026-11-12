import { redirect } from "@tanstack/react-router";
import { canAccess, getSession, HOME } from "@/lib/auth";

/** beforeLoad guard shared by the three portal layouts. */
export function guard(path: string) {
  const s = getSession();
  if (!s) throw redirect({ to: "/login" });
  if (!canAccess(s.role, path)) throw redirect({ to: HOME[s.role] });
}
