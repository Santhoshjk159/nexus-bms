// Pure banking rules — shared by UI and tests, independent of storage.
import type { LedgerEntry, Severity, Transaction } from "@/types";

export function calcEmi(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round((principal / months) * 100) / 100;
  const f = Math.pow(1 + r, months);
  return Math.round(((principal * r * f) / (f - 1)) * 100) / 100;
}

export function amortization(principal: number, annualRate: number, months: number, start = new Date()) {
  const emi = calcEmi(principal, annualRate, months);
  const r = annualRate / 12 / 100;
  let balance = principal;
  return Array.from({ length: months }, (_, i) => {
    const interest = Math.round(balance * r * 100) / 100;
    const princ = Math.min(balance, Math.round((emi - interest) * 100) / 100);
    balance = Math.max(0, Math.round((balance - princ) * 100) / 100);
    const d = new Date(start); d.setMonth(d.getMonth() + i + 1);
    return { installment: i + 1, dueDate: d.toISOString(), emi, principal: princ, interest, balance };
  });
}

/** Eligibility: total EMIs must stay under 50% of income and score >= 650. */
export function loanEligibility(monthlyIncome: number, existingEmi: number, creditScore: number, annualRate: number, months: number) {
  const capacity = Math.max(0, monthlyIncome * 0.5 - existingEmi);
  const r = annualRate / 12 / 100;
  const f = Math.pow(1 + r, months);
  const maxPrincipal = r === 0 ? capacity * months : (capacity * (f - 1)) / (r * f);
  const eligible = creditScore >= 650 && capacity > 0;
  return { eligible, maxEmi: Math.round(capacity), maxPrincipal: eligible ? Math.floor(maxPrincipal / 1000) * 1000 : 0 };
}

export function isBalanced(entries: Pick<LedgerEntry, "debit" | "credit">[]) {
  const d = entries.reduce((s, e) => s + e.debit, 0);
  const c = entries.reduce((s, e) => s + e.credit, 0);
  return Math.abs(d - c) < 0.005;
}

export interface FraudConfig { largeTransferThreshold: number; velocityLimit: number }
export interface FraudHit { rule: string; severity: Severity; score: number }

/** Rule-based screening of a new debit against the account's recent history. */
export function screenTransaction(amount: number, recent: Pick<Transaction, "createdAt" | "status" | "type">[], cfg: FraudConfig, now = Date.now()): FraudHit[] {
  const hits: FraudHit[] = [];
  if (amount >= cfg.largeTransferThreshold * 2) hits.push({ rule: "Unusually large transfer", severity: "CRITICAL", score: 92 });
  else if (amount >= cfg.largeTransferThreshold) hits.push({ rule: "Unusually large transfer", severity: "HIGH", score: 78 });
  const hour = recent.filter((t) => t.type === "DEBIT" && now - new Date(t.createdAt).getTime() < 3600_000);
  if (hour.length + 1 > cfg.velocityLimit) hits.push({ rule: "Unusual transaction frequency", severity: "MEDIUM", score: 61 });
  const failed = hour.filter((t) => t.status === "FAILED").length;
  if (failed >= 3) hits.push({ rule: "Repeated failed transactions", severity: "HIGH", score: 74 });
  return hits;
}
