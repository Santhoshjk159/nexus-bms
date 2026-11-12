// API layer. VITE_API_MODE=http + VITE_API_BASE_URL point the app at the Spring Boot backend;
// default "mock" uses the in-browser store. Pages call these services, never fetch directly.
import { getSession } from "@/lib/auth";
export const API_MODE = (import.meta.env.VITE_API_MODE as string | undefined) ?? "mock";
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080/api/v1";

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getSession()?.token;
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}
/** Spring Boot endpoint map — mirrors the mock actions in services/store.ts. */
export const endpoints = {
  login: "/auth/login", accounts: "/accounts", transactions: "/transactions", transfers: "/transfers", beneficiaries: "/beneficiaries",
  loans: "/loans", cards: "/cards", kyc: "/kyc-applications", fraudAlerts: "/fraud-alerts", ledger: "/ledger/entries", audit: "/audit-logs",
  employees: "/admin/employees", roles: "/admin/roles", branches: "/admin/branches", settings: "/admin/settings", tickets: "/support/tickets",
} as const;
