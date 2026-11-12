// In-memory banking core (mock backend). Persisted to localStorage so demo actions survive reloads.
import { useSyncExternalStore } from "react";
import * as seed from "@/mocks/seed";
import { isBalanced, screenTransaction } from "@/lib/banking";
import { ref } from "@/lib/format";
import type * as T from "@/types";
import { getSession } from "@/lib/auth";

export interface BankState {
  customers: T.Customer[]; employees: T.Employee[]; accounts: T.BankAccount[]; transactions: T.Transaction[];
  ledgerAccounts: T.LedgerAccount[]; ledgerEntries: T.LedgerEntry[]; beneficiaries: T.Beneficiary[]; loans: T.Loan[];
  cards: T.BankCard[]; kycApplications: T.KYCApplication[]; fraudAlerts: T.FraudAlert[]; auditLogs: T.AuditLog[];
  tickets: T.SupportTicket[]; branches: T.Branch[]; roles: T.RoleDef[]; permissions: T.Permission[];
  notifications: T.Notification[]; accountApplications: T.AccountApplication[]; settings: T.SystemSettings;
}
const KEY = "nexus-bank-state-v1";
const fresh = (): BankState => structuredClone({
  customers: seed.customers, employees: seed.employees, accounts: seed.accounts, transactions: seed.transactions,
  ledgerAccounts: seed.ledgerAccounts, ledgerEntries: seed.ledgerEntries, beneficiaries: seed.beneficiaries, loans: seed.loans,
  cards: seed.cards, kycApplications: seed.kycApplications, fraudAlerts: seed.fraudAlerts, auditLogs: seed.auditLogs,
  tickets: seed.tickets, branches: seed.branches, roles: seed.roles, permissions: seed.permissions,
  notifications: seed.notifications, accountApplications: seed.accountApplications, settings: seed.settings,
});
const serverState = fresh();
let state: BankState = serverState;
if (typeof window !== "undefined") {
  try { const raw = localStorage.getItem(KEY); state = raw ? JSON.parse(raw) : fresh(); } catch { state = fresh(); }
}
const listeners = new Set<() => void>();
function set(fn: (d: BankState) => void) {
  const next = structuredClone(state); fn(next); state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota */ }
  listeners.forEach((l) => l());
}
export const getState = () => state;
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function useBank<R>(sel: (s: BankState) => R): R {
  // Subscribe to the immutable root snapshot, derive in render: selectors may return fresh arrays.
  const snap = useSyncExternalStore(subscribe, () => state, () => serverState);
  return sel(snap);
}
const now = () => new Date().toISOString();
function audit(d: BankState, action: string, entity: string, entityId: string, outcome: T.AuditLog["outcome"] = "SUCCESS") {
  const s = getSession();
  d.auditLogs.unshift({ id: ref("AU"), at: now(), actor: s?.name ?? "System", actorRole: s?.role ?? "EMPLOYEE", action, entity, entityId, ip: "10.0.4.21", outcome });
}
const notify = (d: BankState, audience: T.Role, title: string, body: string) => d.notifications.unshift({ id: ref("N"), at: now(), title, body, read: false, audience });

export interface TransferInput { fromAccountId: string; toAccountNumber: string; toName: string; amount: number; mode: "OWN" | "INTERNAL" | "BENEFICIARY"; remarks?: string }
export type TransferResult = { ok: true; reference: string; flagged: boolean } | { ok: false; reference: string; error: string };

export const actions = {
  reset() { set((d) => Object.assign(d, fresh())); },
  markNotificationsRead(role: T.Role) { set((d) => d.notifications.forEach((n) => { if (n.audience === role) n.read = true; })); },

  transfer(inp: TransferInput): TransferResult {
    const reference = ref("NXT");
    const from = state.accounts.find((a) => a.id === inp.fromAccountId);
    let error = "";
    if (!from) error = "Source account not found";
    else if (from.status !== "ACTIVE") error = "Source account is not active";
    else if (inp.amount <= 0) error = "Amount must be greater than zero";
    else if (inp.amount > from.balance) error = "Insufficient balance";
    else if (inp.amount > state.settings.maxDailyTransfer) error = "Exceeds daily transfer limit";
    if (error || !from) {
      set((d) => {
        if (from) d.transactions.unshift({ id: ref("T"), reference, accountId: from.id, type: "DEBIT", amount: inp.amount, balanceAfter: from.balance, description: `Transfer to ${inp.toName}`, category: "TRANSFER", status: "FAILED", createdAt: now(), counterparty: inp.toName, channel: "NETBANKING" });
        audit(d, "TRANSFER_FAILED", "TRANSFER", reference, "FAILURE");
      });
      return { ok: false, reference, error };
    }
    const hits = screenTransaction(inp.amount, state.transactions.filter((t) => t.accountId === from.id), state.settings);
    const flagged = hits.length > 0 && hits.some((h) => h.severity === "HIGH" || h.severity === "CRITICAL");
    set((d) => {
      const src = d.accounts.find((a) => a.id === from.id)!;
      const dst = d.accounts.find((a) => a.accountNumber === inp.toAccountNumber);
      src.balance = Math.round((src.balance - inp.amount) * 100) / 100;
      const status: T.TxnStatus = flagged ? "UNDER_REVIEW" : "COMPLETED";
      d.transactions.unshift({ id: ref("T"), reference, accountId: src.id, type: "DEBIT", amount: inp.amount, balanceAfter: src.balance, description: `Transfer to ${inp.toName}${inp.remarks ? " · " + inp.remarks : ""}`, category: "TRANSFER", status, createdAt: now(), counterparty: inp.toName, channel: "NETBANKING", flagged });
      const jv = ref("JV");
      const base = { journalRef: jv, transactionRef: reference, postedAt: now(), postingStatus: (flagged ? "PENDING" : "POSTED") as T.LedgerEntry["postingStatus"], reconciled: false, narration: `Fund transfer ${inp.mode.toLowerCase()}` };
      d.ledgerEntries.unshift({ id: ref("L"), ledgerAccountId: seed.depositGl(src.type), accountNumber: src.accountNumber, debit: inp.amount, credit: 0, ...base });
      if (dst) {
        dst.balance = Math.round((dst.balance + inp.amount) * 100) / 100;
        const srcCust = d.customers.find((c) => c.id === src.customerId);
        d.transactions.unshift({ id: ref("T"), reference, accountId: dst.id, type: "CREDIT", amount: inp.amount, balanceAfter: dst.balance, description: `Transfer from ${srcCust ? srcCust.firstName + " " + srcCust.lastName : "account"}`, category: "TRANSFER", status, createdAt: now(), counterparty: srcCust?.firstName ?? "", channel: "NETBANKING" });
        d.ledgerEntries.unshift({ id: ref("L"), ledgerAccountId: seed.depositGl(dst.type), accountNumber: dst.accountNumber, debit: 0, credit: inp.amount, ...base });
      } else d.ledgerEntries.unshift({ id: ref("L"), ledgerAccountId: "GL1200", debit: 0, credit: inp.amount, ...base });
      hits.forEach((h) => d.fraudAlerts.unshift({ id: ref("FA"), transactionRef: reference, accountNumber: src.accountNumber, customerId: src.customerId, rule: h.rule, severity: h.severity, score: h.score, status: "OPEN", createdAt: now(), notes: [], amount: inp.amount }));
      if (hits.length) notify(d, "EMPLOYEE", "New fraud alert", `${hits[0].rule} on ${reference}`);
      audit(d, "TRANSFER_INITIATED", "TRANSFER", reference);
    });
    return { ok: true, reference, flagged };
  },

  saveBeneficiary(b: Omit<T.Beneficiary, "id" | "addedAt" | "verification"> & { id?: string }) {
    set((d) => {
      if (b.id) Object.assign(d.beneficiaries.find((x) => x.id === b.id)!, b);
      else d.beneficiaries.push({ ...b, id: ref("B"), addedAt: now(), verification: b.ifsc.startsWith("NXBK") ? "VERIFIED" : "PENDING" });
      audit(d, b.id ? "BENEFICIARY_UPDATED" : "BENEFICIARY_ADDED", "BENEFICIARY", b.accountNumber);
    });
  },
  removeBeneficiary(id: string) { set((d) => { d.beneficiaries = d.beneficiaries.filter((b) => b.id !== id); audit(d, "BENEFICIARY_REMOVED", "BENEFICIARY", id); }); },

  setCardStatus(id: string, status: T.BankCard["status"]) { set((d) => { d.cards.find((c) => c.id === id)!.status = status; audit(d, `CARD_${status}`, "CARD", id); }); },
  updateCard(id: string, patch: Partial<T.BankCard>) { set((d) => { Object.assign(d.cards.find((c) => c.id === id)!, patch); audit(d, "CARD_LIMITS_UPDATED", "CARD", id); }); },

  applyLoan(l: Pick<T.Loan, "customerId" | "product" | "principal" | "rate" | "tenureMonths" | "emi" | "monthlyIncome" | "purpose" | "creditScore">) {
    const loanNumber = ref("NXL");
    set((d) => { d.loans.unshift({ ...l, id: ref("LN"), loanNumber, outstanding: l.principal, status: "APPLIED", appliedAt: now() }); notify(d, "EMPLOYEE", "New loan application", loanNumber); audit(d, "LOAN_APPLIED", "LOAN", loanNumber); });
    return loanNumber;
  },
  decideLoan(id: string, approve: boolean) {
    set((d) => { const l = d.loans.find((x) => x.id === id)!; l.status = approve ? "APPROVED" : "REJECTED"; audit(d, approve ? "LOAN_APPROVED" : "LOAN_REJECTED", "LOAN", l.loanNumber); notify(d, "CUSTOMER", `Loan ${approve ? "approved" : "rejected"}`, l.loanNumber); });
  },
  setLoanStatus(id: string, status: T.Loan["status"]) { set((d) => { const l = d.loans.find((x) => x.id === id)!; l.status = status; audit(d, `LOAN_${status}`, "LOAN", l.loanNumber); }); },

  createTicket(t: Pick<T.SupportTicket, "customerId" | "subject" | "category" | "priority" | "description">) {
    const n = `SR-${Math.floor(100000 + Math.random() * 899999)}`;
    set((d) => { d.tickets.unshift({ ...t, id: ref("TK"), ticketNumber: n, status: "OPEN", createdAt: now() }); audit(d, "TICKET_CREATED", "TICKET", n); });
    return n;
  },
  updateTicket(id: string, patch: Partial<T.SupportTicket>) { set((d) => { const t = d.tickets.find((x) => x.id === id)!; Object.assign(t, patch); audit(d, "TICKET_UPDATED", "TICKET", t.ticketNumber); }); },
  submitKyc(customerId: string) {
    set((d) => { const c = d.customers.find((x) => x.id === customerId)!; c.kycStatus = "PENDING";
      d.kycApplications.unshift({ id: ref("KYC"), customerId, submittedAt: now(), status: "PENDING", documents: (["PAN", "AADHAAR", "ADDRESS_PROOF"] as const).map((type) => ({ type, status: "PENDING" })) }); audit(d, "KYC_SUBMITTED", "KYC", customerId); });
  },

  reviewKyc(id: string, approve: boolean, remarks: string) {
    set((d) => {
      const k = d.kycApplications.find((x) => x.id === id)!; k.status = approve ? "APPROVED" : "REJECTED"; k.remarks = remarks; k.reviewer = getSession()?.name;
      k.documents.forEach((doc) => (doc.status = approve ? "VERIFIED" : doc.status === "VERIFIED" ? "VERIFIED" : "REJECTED"));
      d.customers.find((c) => c.id === k.customerId)!.kycStatus = approve ? "VERIFIED" : "REJECTED";
      audit(d, approve ? "KYC_APPROVED" : "KYC_REJECTED", "KYC", k.id);
    });
  },
  setCustomerStatus(id: string, status: T.Customer["status"]) { set((d) => { d.customers.find((c) => c.id === id)!.status = status; audit(d, `CUSTOMER_${status}`, "CUSTOMER", id); }); },
  setAccountStatus(id: string, status: T.AccountStatus, reason: string) {
    set((d) => { const a = d.accounts.find((x) => x.id === id)!; a.status = status; audit(d, `ACCOUNT_${status}`, "ACCOUNT", `${a.accountNumber} · ${reason}`); });
  },
  openAccount(customerId: string, type: T.AccountType, deposit: number) {
    const accountNumber = `${type === "SAVINGS" ? "5010" : type === "CURRENT" ? "5020" : "5030"}${Math.floor(10000000 + Math.random() * 89999999)}`;
    set((d) => {
      const c = d.customers.find((x) => x.id === customerId)!; const id = ref("A");
      d.accounts.push({ id, accountNumber, customerId, type, balance: deposit, currency: "INR", status: "ACTIVE", openedAt: now(), interestRate: type === "SAVINGS" ? 3.5 : type === "FIXED_DEPOSIT" ? 7.1 : 0, branchId: c.branchId, nickname: type === "SAVINGS" ? "Savings" : type === "CURRENT" ? "Current" : "Fixed Deposit", maturityDate: type === "FIXED_DEPOSIT" ? new Date(Date.now() + 3 * 365 * 864e5).toISOString() : undefined });
      if (deposit > 0) {
        const r = ref("NXT");
        d.transactions.unshift({ id: ref("T"), reference: r, accountId: id, type: "CREDIT", amount: deposit, balanceAfter: deposit, description: "Initial deposit", category: "DEPOSIT", status: "COMPLETED", createdAt: now(), counterparty: "Branch cash", channel: "BRANCH" });
        const jv = ref("JV"), base = { journalRef: jv, transactionRef: r, postedAt: now(), postingStatus: "POSTED" as const, reconciled: false, narration: "Initial deposit" };
        d.ledgerEntries.unshift({ id: ref("L"), ledgerAccountId: "GL1001", debit: deposit, credit: 0, ...base }, { id: ref("L"), ledgerAccountId: seed.depositGl(type), accountNumber, debit: 0, credit: deposit, ...base });
      }
      audit(d, "ACCOUNT_OPENED", "ACCOUNT", accountNumber);
    });
    return accountNumber;
  },
  reviewApplication(id: string, approve: boolean) {
    const app = state.accountApplications.find((a) => a.id === id)!;
    if (approve) actions.openAccount(app.customerId, app.type, app.initialDeposit);
    set((d) => { d.accountApplications.find((a) => a.id === id)!.status = approve ? "APPROVED" : "REJECTED"; audit(d, approve ? "APPLICATION_APPROVED" : "APPLICATION_REJECTED", "ACCOUNT_APPLICATION", id); });
  },
  setTxnStatus(id: string, status: T.TxnStatus) { set((d) => { const t = d.transactions.find((x) => x.id === id)!; t.status = status; t.flagged = status === "UNDER_REVIEW" || t.flagged; audit(d, `TXN_${status}`, "TRANSACTION", t.reference); }); },
  escalateTxn(id: string) {
    set((d) => { const t = d.transactions.find((x) => x.id === id)!; const a = d.accounts.find((x) => x.id === t.accountId)!; t.status = "UNDER_REVIEW"; t.flagged = true;
      d.fraudAlerts.unshift({ id: ref("FA"), transactionRef: t.reference, accountNumber: a.accountNumber, customerId: a.customerId, rule: "Manual escalation by operations", severity: "HIGH", score: 80, status: "ESCALATED", createdAt: now(), notes: [{ by: getSession()?.name ?? "", at: now(), text: "Escalated from transaction monitoring." }], amount: t.amount });
      audit(d, "FRAUD_ESCALATED", "TRANSACTION", t.reference); });
  },
  updateAlert(id: string, status: T.FraudAlert["status"], note?: string) {
    set((d) => { const a = d.fraudAlerts.find((x) => x.id === id)!; a.status = status; if (note) a.notes.push({ by: getSession()?.name ?? "Analyst", at: now(), text: note });
      if (status === "CLEARED" || status === "CONFIRMED") { const t = d.transactions.filter((x) => x.reference === a.transactionRef); t.forEach((x) => (x.status = status === "CLEARED" ? "COMPLETED" : "FAILED")); d.ledgerEntries.filter((l) => l.transactionRef === a.transactionRef).forEach((l) => (l.postingStatus = status === "CLEARED" ? "POSTED" : "REVERSED")); }
      audit(d, `FRAUD_${status}`, "FRAUD_ALERT", id); });
  },

  saveEmployee(e: Omit<T.Employee, "id" | "employeeCode" | "joinedAt"> & { id?: string }) {
    set((d) => { if (e.id) Object.assign(d.employees.find((x) => x.id === e.id)!, e); else d.employees.push({ ...e, id: ref("E"), employeeCode: `NXE${Math.floor(10000 + Math.random() * 89999)}`, joinedAt: now() }); audit(d, e.id ? "EMPLOYEE_UPDATED" : "EMPLOYEE_CREATED", "EMPLOYEE", e.email); });
  },
  togglePermission(roleId: string, perm: string) {
    set((d) => { const r = d.roles.find((x) => x.id === roleId)!; r.permissions = r.permissions.includes(perm) ? r.permissions.filter((p) => p !== perm) : [...r.permissions, perm]; audit(d, "ROLE_UPDATED", "ROLE", `${r.name}:${perm}`); });
  },
  addRole(name: string, description: string) { set((d) => { d.roles.push({ id: ref("R"), name, description, permissions: ["customers.read"], system: false }); audit(d, "ROLE_CREATED", "ROLE", name); }); },
  deleteRole(id: string) { set((d) => { d.roles = d.roles.filter((r) => r.id !== id); audit(d, "ROLE_DELETED", "ROLE", id); }); },
  saveBranch(b: Omit<T.Branch, "id" | "customers" | "deposits"> & { id?: string }) {
    set((d) => { if (b.id) Object.assign(d.branches.find((x) => x.id === b.id)!, b); else d.branches.push({ ...b, id: ref("BR"), customers: 0, deposits: 0 }); audit(d, b.id ? "BRANCH_UPDATED" : "BRANCH_CREATED", "BRANCH", b.code); });
  },
  reconcile(journalRefs: string[]) {
    let done = 0;
    set((d) => { journalRefs.forEach((j) => { const es = d.ledgerEntries.filter((e) => e.journalRef === j); if (isBalanced(es) && es.every((e) => e.postingStatus === "POSTED")) { es.forEach((e) => (e.reconciled = true)); done++; } }); audit(d, "LEDGER_RECONCILED", "LEDGER", `${done} journals`); });
    return done;
  },
  updateSettings(p: Partial<T.SystemSettings>) { set((d) => { Object.assign(d.settings, p); audit(d, "SETTINGS_CHANGED", "SETTINGS", Object.keys(p).join(",")); }); },
  logEvent(action: string, entity: string, entityId: string, outcome: T.AuditLog["outcome"] = "SUCCESS") { set((d) => audit(d, action, entity, entityId, outcome)); },
};
