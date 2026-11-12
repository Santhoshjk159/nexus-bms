// Simulated authentication. Swap for Spring Security JWT via services/api.ts.
import type { Role } from "@/types";
export interface Session { role: Role; userId: string; name: string; email: string; token: string }
const KEY = "nexus-session";
export const DEMO_USERS: Record<Role, Omit<Session, "token"> & { password: string; title: string }> = {
  CUSTOMER: { role: "CUSTOMER", userId: "C0001", name: "Aarav Mehta", email: "aarav.mehta@mail.demo", password: "Customer@123", title: "Retail customer" },
  EMPLOYEE: { role: "EMPLOYEE", userId: "E002", name: "Kabir Malhotra", email: "kabir.malhotra@nexusbank.demo", password: "Employee@123", title: "Relationship officer" },
  ADMIN: { role: "ADMIN", userId: "E001", name: "Devika Raman", email: "devika.raman@nexusbank.demo", password: "Admin@123", title: "Super administrator" },
};
export const HOME: Record<Role, "/customer/dashboard" | "/employee/dashboard" | "/admin/dashboard"> = { CUSTOMER: "/customer/dashboard", EMPLOYEE: "/employee/dashboard", ADMIN: "/admin/dashboard" };
/** Which portal prefixes each role may open. Customers never see staff screens. */
export const PORTAL_ACCESS: Record<Role, string[]> = { CUSTOMER: ["/customer"], EMPLOYEE: ["/employee"], ADMIN: ["/admin", "/employee"] };
export const canAccess = (role: Role | undefined, path: string) => !!role && PORTAL_ACCESS[role].some((p) => path === p || path.startsWith(p + "/"));

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}
export function login(email: string, password: string): Session | null {
  const u = Object.values(DEMO_USERS).find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
  if (!u) return null;
  const { password: _p, title: _t, ...rest } = u;
  const s: Session = { ...rest, token: `demo.${btoa(u.userId)}.${Date.now()}` };
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}
export const logout = () => localStorage.removeItem(KEY);
