// Deterministic seed data so every demo run looks the same.
import { amortization, calcEmi } from "@/lib/banking";
import type * as T from "@/types";

let s = 42;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const pick = <X,>(a: X[]) => a[Math.floor(rnd() * a.length)];
const int = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
const NOW = new Date("2026-11-12T10:00:00Z").getTime();
const daysAgo = (d: number, h = int(8, 20)) => new Date(NOW - d * 86400_000 + h * 3600_000 - 12 * 3600_000).toISOString();
const pad = (n: number, l: number) => String(n).padStart(l, "0");

const FIRST = ["Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Meera", "Arjun", "Kavya", "Siddharth", "Ishita", "Karan", "Nisha", "Rahul", "Sneha", "Aditya", "Pooja", "Nikhil", "Divya", "Manish", "Riya", "Varun", "Tanvi", "Harsh", "Aisha"];
const LAST = ["Mehta", "Sharma", "Iyer", "Reddy", "Nair", "Kapoor", "Gupta", "Menon", "Rao", "Joshi", "Verma", "Pillai", "Bose", "Desai", "Chopra", "Singh"];
const CITIES: [string, string][] = [["Mumbai", "Maharashtra"], ["Bengaluru", "Karnataka"], ["Chennai", "Tamil Nadu"], ["Hyderabad", "Telangana"], ["Pune", "Maharashtra"], ["New Delhi", "Delhi"]];

export const branches: T.Branch[] = CITIES.map(([city], i) => ({
  id: `BR${i + 1}`, code: `NXB${pad(i + 1, 3)}`, name: `${city} Main`, city, ifsc: `NXBK000${pad(i + 1, 4)}`,
  manager: `${pick(FIRST)} ${pick(LAST)}`, status: i === 5 ? "INACTIVE" : "ACTIVE", customers: 0, deposits: 0,
}));

export const permissions: T.Permission[] = [
  ["customers.read", "Customers", "View customer profiles"], ["customers.write", "Customers", "Edit customer records"],
  ["kyc.review", "KYC", "Approve or reject KYC"], ["accounts.open", "Accounts", "Open new accounts"],
  ["accounts.status", "Accounts", "Suspend / activate accounts"], ["transactions.monitor", "Transactions", "Monitor all transactions"],
  ["fraud.investigate", "Fraud", "Investigate fraud alerts"], ["loans.approve", "Loans", "Approve loan applications"],
  ["support.manage", "Support", "Manage support tickets"], ["reports.view", "Reports", "View operational reports"],
  ["employees.manage", "Administration", "Manage employees"], ["roles.manage", "Administration", "Manage roles & permissions"],
  ["ledger.view", "Finance", "View general ledger"], ["settings.manage", "Administration", "Change system configuration"],
].map(([key, module, description]) => ({ key, module, description }));

export const roles: T.RoleDef[] = [
  { id: "R1", name: "Super Administrator", description: "Full platform access", permissions: permissions.map((p) => p.key), system: true },
  { id: "R2", name: "Branch Manager", description: "Branch operations and approvals", permissions: ["customers.read", "customers.write", "kyc.review", "accounts.open", "accounts.status", "transactions.monitor", "loans.approve", "reports.view"], system: false },
  { id: "R3", name: "Relationship Officer", description: "Customer servicing and KYC", permissions: ["customers.read", "kyc.review", "accounts.open", "support.manage"], system: false },
  { id: "R4", name: "Fraud Analyst", description: "Transaction and fraud monitoring", permissions: ["customers.read", "transactions.monitor", "fraud.investigate", "reports.view"], system: false },
  { id: "R5", name: "Loan Officer", description: "Loan origination", permissions: ["customers.read", "loans.approve", "reports.view"], system: false },
];

const DESIG: Record<string, string> = { R1: "Head of Platform", R2: "Branch Manager", R3: "Relationship Officer", R4: "Fraud Analyst", R5: "Loan Officer" };
export const employees: T.Employee[] = Array.from({ length: 14 }, (_, i) => {
  const roleId = i === 0 ? "R1" : i === 1 ? "R3" : pick(["R2", "R3", "R4", "R5"]);
  const name = i === 0 ? "Devika Raman" : i === 1 ? "Kabir Malhotra" : `${pick(FIRST)} ${pick(LAST)}`;
  return { id: `E${pad(i + 1, 3)}`, employeeCode: `NXE${pad(1001 + i, 5)}`, name, email: `${name.split(" ")[0].toLowerCase()}.${name.split(" ")[1].toLowerCase()}@nexusbank.demo`, roleId, branchId: branches[i % 5].id, designation: DESIG[roleId], status: i === 12 ? "INACTIVE" : "ACTIVE", joinedAt: daysAgo(int(200, 2400)) };
});

export const customers: T.Customer[] = Array.from({ length: 28 }, (_, i) => {
  const fn = i === 0 ? "Aarav" : FIRST[(i * 7) % FIRST.length], ln = i === 0 ? "Mehta" : LAST[(i * 5) % LAST.length];
  const [city, state] = CITIES[i % 5];
  return {
    id: `C${pad(i + 1, 4)}`, customerNumber: `CIF${pad(880100 + i * 13, 8)}`, firstName: fn, lastName: ln, email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i || ""}@mail.demo`,
    phone: `+91 98${pad(int(10000000, 99999999), 8)}`, dateOfBirth: new Date(1970 + int(0, 32), int(0, 11), int(1, 28)).toISOString(),
    address: { line1: `${int(1, 220)}, ${pick(["MG Road", "Linking Road", "Residency Rd", "Anna Salai", "Banjara Hills", "FC Road"])}`, city, state, postalCode: String(int(400001, 600099)), country: "India" },
    kycStatus: i === 0 ? "VERIFIED" : i % 6 === 3 ? "PENDING" : i % 11 === 5 ? "REJECTED" : "VERIFIED",
    riskRating: i % 9 === 4 ? "HIGH" : i % 4 === 1 ? "MEDIUM" : "LOW", branchId: branches[i % 5].id,
    createdAt: daysAgo(i === 0 ? 1100 : int(5, 900)), status: i === 17 ? "BLOCKED" : "ACTIVE",
  };
});

export const accounts: T.BankAccount[] = [];
customers.forEach((c, i) => {
  const types: T.AccountType[] = i === 0 ? ["SAVINGS", "CURRENT", "FIXED_DEPOSIT"] : i % 3 === 0 ? ["SAVINGS", "CURRENT"] : i % 4 === 2 ? ["SAVINGS", "FIXED_DEPOSIT"] : ["SAVINGS"];
  types.forEach((type, j) => {
    const balance = i === 0 ? [284650.75, 512300.4, 500000][j] : int(15000, type === "FIXED_DEPOSIT" ? 1500000 : 900000) + rnd();
    const openedAt = daysAgo(int(60, 1000));
    accounts.push({
      id: `A${pad(accounts.length + 1, 4)}`, accountNumber: `${type === "SAVINGS" ? "5010" : type === "CURRENT" ? "5020" : "5030"}${pad(int(10000000, 99999999), 8)}`,
      customerId: c.id, type, balance: Math.round(balance * 100) / 100, currency: "INR",
      status: i === 17 ? "SUSPENDED" : "ACTIVE", openedAt, interestRate: type === "SAVINGS" ? 3.5 : type === "FIXED_DEPOSIT" ? 7.1 : 0, branchId: c.branchId,
      maturityDate: type === "FIXED_DEPOSIT" ? new Date(new Date(openedAt).getTime() + 3 * 365 * 86400_000).toISOString() : undefined,
      nickname: type === "SAVINGS" ? "Primary Savings" : type === "CURRENT" ? "Business Current" : "Tax Saver FD",
    });
  });
});

const MERCH: [T.TxnCategory, string, number, number][] = [
  ["SHOPPING", "Amazon India", 800, 9000], ["FOOD", "Swiggy", 250, 1800], ["FOOD", "Zomato", 300, 1600], ["BILLS", "Tata Power", 1500, 4800], ["BILLS", "Airtel Postpaid", 599, 1499],
  ["TRAVEL", "IndiGo Airlines", 4500, 18000], ["TRAVEL", "Uber India", 180, 900], ["SHOPPING", "Reliance Digital", 2000, 35000], ["CARD", "Starbucks", 320, 950], ["WITHDRAWAL", "ATM Withdrawal", 2000, 10000],
];
export const transactions: T.Transaction[] = [];
let tseq = 0;
const tx = (a: T.BankAccount, d: number, type: T.TxnType, amount: number, description: string, category: T.TxnCategory, counterparty: string, status: T.TxnStatus = "COMPLETED", channel: T.Transaction["channel"] = "NETBANKING") => {
  tseq++;
  transactions.push({ id: `T${pad(tseq, 6)}`, reference: `NXT${pad(26000000 + tseq * 7, 9)}`, accountId: a.id, type, amount: Math.round(amount * 100) / 100, balanceAfter: 0, description, category, status, createdAt: daysAgo(d), counterparty, channel });
};
accounts.forEach((a, ai) => {
  const mine = a.customerId === "C0001";
  if (a.type === "FIXED_DEPOSIT") { tx(a, 300, "CREDIT", a.balance, "Fixed deposit booking", "DEPOSIT", "Self", "COMPLETED", "SYSTEM"); return; }
  const months = mine ? 6 : 3;
  for (let m = months; m >= 0; m--) {
    if (a.type === "SAVINGS") tx(a, m * 30 + 1, "CREDIT", mine ? 145000 : int(40000, 180000), "Salary credit", "SALARY", pick(["Infosys Ltd", "TCS Ltd", "Wipro Ltd", "HDFC Life"]));
    else tx(a, m * 30 + 4, "CREDIT", int(60000, 240000), "Client payment received", "TRANSFER", pick(["Acme Exports", "Zenith Traders", "Orbit Labs"]));
    const n = mine ? int(12, 18) : int(2, 5);
    for (let k = 0; k < n; k++) {
      const [cat, name, lo, hi] = pick(MERCH);
      const st: T.TxnStatus = rnd() < 0.04 ? "FAILED" : rnd() < 0.03 ? "PENDING" : "COMPLETED";
      tx(a, m * 30 + int(0, 28), "DEBIT", int(lo, hi), cat === "WITHDRAWAL" ? "Cash withdrawal" : `${name} purchase`, cat, name, st, cat === "WITHDRAWAL" ? "BRANCH" : cat === "CARD" || cat === "SHOPPING" ? "CARD" : "UPI");
    }
    if (a.type === "SAVINGS" && m % 3 === 0) tx(a, m * 30 + 2, "CREDIT", Math.round(a.balance * 0.0087), "Quarterly interest", "INTEREST", "Nexus Bank", "COMPLETED", "SYSTEM");
  }
  if (ai % 7 === 3) { const t = transactions[transactions.length - 2]; t.flagged = true; t.status = "UNDER_REVIEW"; t.amount = int(250000, 900000); t.description = "High value transfer"; t.category = "TRANSFER"; }
});
transactions.sort((x, y) => y.createdAt.localeCompare(x.createdAt));
// Compute running balanceAfter backwards from current balance.
accounts.forEach((a) => {
  let bal = a.balance;
  transactions.filter((t) => t.accountId === a.id).forEach((t) => {
    t.balanceAfter = Math.round(bal * 100) / 100;
    if (t.status === "COMPLETED" || t.status === "UNDER_REVIEW") bal = t.type === "CREDIT" ? bal - t.amount : bal + t.amount;
  });
});

export const ledgerAccounts: T.LedgerAccount[] = [
  { id: "GL1001", code: "1001", name: "Cash & Equivalents", type: "ASSET" }, { id: "GL1200", code: "1200", name: "Interbank Clearing", type: "ASSET" },
  { id: "GL1400", code: "1400", name: "Loans & Advances", type: "ASSET" }, { id: "GL2001", code: "2001", name: "Customer Savings Deposits", type: "LIABILITY" },
  { id: "GL2002", code: "2002", name: "Customer Current Deposits", type: "LIABILITY" }, { id: "GL2003", code: "2003", name: "Term Deposits", type: "LIABILITY" },
  { id: "GL4001", code: "4001", name: "Interest Income", type: "INCOME" }, { id: "GL5001", code: "5001", name: "Interest Expense", type: "EXPENSE" },
];
export const depositGl = (t: T.AccountType) => (t === "SAVINGS" ? "GL2001" : t === "CURRENT" ? "GL2002" : "GL2003");
export const ledgerEntries: T.LedgerEntry[] = [];
transactions.slice(0, 160).filter((t) => t.status !== "FAILED").forEach((t, i) => {
  const a = accounts.find((x) => x.id === t.accountId)!;
  const dep = depositGl(a.type), other = t.category === "INTEREST" ? "GL5001" : t.category === "WITHDRAWAL" ? "GL1001" : "GL1200";
  const j = `JV${pad(70000 + i, 7)}`, posted: T.LedgerEntry["postingStatus"] = t.status === "COMPLETED" ? "POSTED" : "PENDING";
  const base = { journalRef: j, transactionRef: t.reference, postedAt: t.createdAt, postingStatus: posted, reconciled: posted === "POSTED" && i > 12, narration: t.description };
  const [dr, cr] = t.type === "DEBIT" ? [dep, other] : [other, dep];
  ledgerEntries.push({ id: `L${i}a`, ledgerAccountId: dr, accountNumber: dr === dep ? a.accountNumber : undefined, debit: t.amount, credit: 0, ...base });
  ledgerEntries.push({ id: `L${i}b`, ledgerAccountId: cr, accountNumber: cr === dep ? a.accountNumber : undefined, debit: 0, credit: t.amount, ...base });
});

export const beneficiaries: T.Beneficiary[] = [
  ["Priya Sharma", "HDFC Bank", "HDFC0001234", "Sister", "VERIFIED", 200000], ["Rohan Iyer", "Nexus Bank", "NXBK0000002", "Rohan", "VERIFIED", 100000],
  ["Greenleaf Apartments", "ICICI Bank", "ICIC0004421", "Rent", "VERIFIED", 75000], ["Kavya Menon", "Axis Bank", "UTIB0000981", "Kavya", "PENDING", 50000],
].map(([name, bankName, ifsc, nickname, verification, transferLimit], i) => ({
  id: `B${i + 1}`, customerId: "C0001", name: name as string, bankName: bankName as string, ifsc: ifsc as string, nickname: nickname as string,
  verification: verification as T.Beneficiary["verification"], transferLimit: transferLimit as number, accountNumber: `${pad(int(100000000000, 999999999999), 12)}`, addedAt: daysAgo(int(30, 400)),
}));

const RATES: Record<T.LoanProduct, number> = { PERSONAL: 11.25, EDUCATION: 8.9, HOME: 8.4 };
export const loanRates = RATES;
export const loans: T.Loan[] = Array.from({ length: 16 }, (_, i) => {
  const product: T.LoanProduct = i === 0 ? "HOME" : i === 1 ? "PERSONAL" : pick(["PERSONAL", "EDUCATION", "HOME"]);
  const principal = product === "HOME" ? int(25, 90) * 100000 : product === "EDUCATION" ? int(4, 20) * 100000 : int(2, 10) * 100000;
  const tenure = product === "HOME" ? 240 : product === "EDUCATION" ? 84 : 48;
  const status: T.Loan["status"] = i === 0 ? "ACTIVE" : i === 1 ? "UNDER_REVIEW" : pick(["ACTIVE", "ACTIVE", "APPLIED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CLOSED"]);
  const emi = calcEmi(principal, RATES[product], tenure);
  return { id: `LN${i + 1}`, loanNumber: `NXL${pad(550000 + i * 31, 8)}`, customerId: i < 2 ? "C0001" : customers[2 + (i % 24)].id, product, principal, rate: RATES[product], tenureMonths: tenure, emi,
    outstanding: status === "ACTIVE" ? Math.round(principal * (0.55 + rnd() * 0.4)) : status === "CLOSED" ? 0 : principal, status, appliedAt: daysAgo(i === 0 ? 700 : int(2, 500)),
    monthlyIncome: int(60, 400) * 1000, purpose: product === "HOME" ? "Purchase of residential flat" : product === "EDUCATION" ? "Postgraduate studies" : "Home renovation", creditScore: int(610, 830) };
});
loans[0].outstanding = 4120000; loans[0].principal = 5000000; loans[0].emi = calcEmi(5000000, 8.4, 240); loans[0].monthlyIncome = 260000; loans[0].creditScore = 792;
export const repaymentsFor = (l: T.Loan): T.LoanRepayment[] => {
  const paidCount = l.status === "ACTIVE" ? Math.max(1, Math.round(((l.principal - l.outstanding) / l.principal) * l.tenureMonths * 0.9)) : 0;
  return amortization(l.principal, l.rate, l.tenureMonths, new Date(l.appliedAt)).map((r) => ({ id: `${l.id}-${r.installment}`, loanId: l.id, ...r, status: r.installment <= paidCount ? "PAID" : r.installment === paidCount + 1 && l.status === "ACTIVE" ? "DUE" : "DUE" }));
};

export const cards: T.BankCard[] = accounts.filter((a) => a.type !== "FIXED_DEPOSIT").slice(0, 30).map((a, i) => {
  const c = customers.find((x) => x.id === a.customerId)!;
  return { id: `CD${i + 1}`, customerId: c.id, accountId: a.id, cardNumber: `4${pad(int(100, 999), 3)}${pad(int(10000000, 99999999), 8)}${pad(int(1000, 9999), 4)}`, holder: `${c.firstName} ${c.lastName}`.toUpperCase(),
    expiry: `${pad(int(1, 12), 2)}/${int(27, 31)}`, network: a.type === "CURRENT" ? "MASTERCARD" : i % 3 === 0 ? "RUPAY" : "VISA", status: "ACTIVE", dailyLimit: 100000, onlineLimit: 50000, onlineEnabled: true, internationalEnabled: a.type === "CURRENT" };
});

export const kycApplications: T.KYCApplication[] = customers.filter((c) => c.kycStatus !== "VERIFIED" || c.id === "C0001" || Number(c.id.slice(1)) % 5 === 0).map((c, i) => ({
  id: `KYC${pad(i + 1, 4)}`, customerId: c.id, submittedAt: daysAgo(int(1, 40)),
  documents: (["PAN", "AADHAAR", "ADDRESS_PROOF"] as const).map((type, k) => ({ type, status: c.kycStatus === "VERIFIED" ? "VERIFIED" : c.kycStatus === "REJECTED" && k === 2 ? "REJECTED" : k === 0 ? "VERIFIED" : "PENDING" })),
  status: c.kycStatus === "VERIFIED" ? "APPROVED" : c.kycStatus === "REJECTED" ? "REJECTED" : "PENDING", reviewer: c.kycStatus === "PENDING" ? undefined : "Kabir Malhotra",
  remarks: c.kycStatus === "REJECTED" ? "Address proof illegible" : undefined,
}));

const RULES: [string, T.Severity][] = [["Unusually large transfer", "HIGH"], ["Repeated failed transactions", "MEDIUM"], ["Unusual transaction frequency", "MEDIUM"], ["Suspicious account activity", "CRITICAL"], ["High-risk beneficiary country", "HIGH"], ["Login from new device + transfer", "LOW"]];
export const fraudAlerts: T.FraudAlert[] = transactions.filter((t) => t.flagged).concat(transactions.filter((t) => t.type === "DEBIT" && t.amount > 15000).slice(0, 10)).map((t, i) => {
  const a = accounts.find((x) => x.id === t.accountId)!; const [rule, severity] = t.flagged ? RULES[i % 2 === 0 ? 0 : 3] : pick(RULES);
  return { id: `FA${pad(i + 1, 4)}`, transactionRef: t.reference, accountNumber: a.accountNumber, customerId: a.customerId, rule, severity, score: severity === "CRITICAL" ? int(88, 98) : severity === "HIGH" ? int(70, 87) : severity === "MEDIUM" ? int(50, 69) : int(25, 49),
    status: i < 5 ? "OPEN" : pick(["OPEN", "INVESTIGATING", "ESCALATED", "CLEARED", "CONFIRMED"]), createdAt: t.createdAt, amount: t.amount,
    notes: i % 3 === 0 ? [{ by: "Kabir Malhotra", at: t.createdAt, text: "Auto-flagged by rule engine. Awaiting customer callback." }] : [] };
});

const SUBJ: [T.SupportTicket["category"], string][] = [["CARD", "Card declined at merchant"], ["TRANSFER", "Transfer not credited to beneficiary"], ["ACCOUNT", "Update registered mobile number"], ["LOAN", "Request for loan foreclosure statement"], ["COMPLAINT", "Unauthorised charge on statement"], ["ACCOUNT", "Cheque book not received"]];
export const tickets: T.SupportTicket[] = Array.from({ length: 18 }, (_, i) => {
  const [category, subject] = SUBJ[i % SUBJ.length];
  return { id: `TK${i + 1}`, ticketNumber: `SR-${pad(30410 + i, 6)}`, customerId: i < 2 ? "C0001" : customers[i % 28].id, subject, category, priority: pick(["LOW", "MEDIUM", "HIGH"]),
    status: i < 6 ? "OPEN" : pick(["IN_PROGRESS", "RESOLVED", "CLOSED", "OPEN"]), assignedTo: i < 3 ? undefined : pick(employees.slice(1, 8)).name, createdAt: daysAgo(int(0, 30)), description: `${subject}. Customer requested resolution at the earliest.` };
});

export const accountApplications: T.AccountApplication[] = customers.slice(3, 9).map((c, i) => ({ id: `AP${i + 1}`, customerId: c.id, type: (["SAVINGS", "CURRENT", "FIXED_DEPOSIT"] as const)[i % 3], initialDeposit: int(5, 200) * 1000, submittedAt: daysAgo(int(0, 10)), status: i < 4 ? "PENDING" : "APPROVED" }));

const ACT = ["LOGIN", "KYC_APPROVED", "ACCOUNT_SUSPENDED", "TRANSFER_INITIATED", "LOAN_APPROVED", "ROLE_UPDATED", "SETTINGS_CHANGED", "FRAUD_ESCALATED", "LOGIN_FAILED", "BENEFICIARY_ADDED"];
export const auditLogs: T.AuditLog[] = Array.from({ length: 60 }, (_, i) => {
  const action = ACT[i % ACT.length]; const role: T.Role = ["TRANSFER_INITIATED", "BENEFICIARY_ADDED"].includes(action) ? "CUSTOMER" : ["ROLE_UPDATED", "SETTINGS_CHANGED"].includes(action) ? "ADMIN" : "EMPLOYEE";
  return { id: `AU${pad(i + 1, 5)}`, at: daysAgo(i * 0.4), actor: role === "CUSTOMER" ? `${pick(customers).firstName} (customer)` : role === "ADMIN" ? "Devika Raman" : pick(employees).name, actorRole: role, action,
    entity: action.split("_")[0], entityId: `${action.slice(0, 2)}-${int(1000, 9999)}`, ip: `10.${int(0, 255)}.${int(0, 255)}.${int(1, 254)}`, outcome: action === "LOGIN_FAILED" ? "FAILURE" : "SUCCESS" };
}).sort((a, b) => b.at.localeCompare(a.at));

export const notifications: T.Notification[] = [
  { id: "N1", at: daysAgo(0, 9), title: "Salary credited", body: "₹1,45,000 credited to Primary Savings.", read: false, audience: "CUSTOMER" },
  { id: "N2", at: daysAgo(2), title: "EMI due in 5 days", body: "Home loan EMI auto-debit scheduled.", read: false, audience: "CUSTOMER" },
  { id: "N3", at: daysAgo(6), title: "New device login", body: "Signed in from Chrome on Windows.", read: true, audience: "CUSTOMER" },
  { id: "N4", at: daysAgo(0, 8), title: "5 KYC applications pending", body: "Applications awaiting your review.", read: false, audience: "EMPLOYEE" },
  { id: "N5", at: daysAgo(0, 7), title: "Critical fraud alert", body: "Suspicious account activity flagged.", read: false, audience: "EMPLOYEE" },
  { id: "N6", at: daysAgo(1), title: "Reconciliation exceptions", body: "Unreconciled ledger entries found.", read: false, audience: "ADMIN" },
  { id: "N7", at: daysAgo(3), title: "Branch deactivated", body: "New Delhi Main marked inactive.", read: true, audience: "ADMIN" },
];

export const settings: T.SystemSettings = { maxDailyTransfer: 1000000, largeTransferThreshold: 200000, velocityLimit: 6, sessionTimeoutMin: 15, maintenanceMode: false, twoFactorRequired: true };
