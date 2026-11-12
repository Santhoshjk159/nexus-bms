// Domain entities — shaped to map 1:1 onto MySQL tables / Spring Boot DTOs.
export type Role = "CUSTOMER" | "EMPLOYEE" | "ADMIN";
export type AccountType = "SAVINGS" | "CURRENT" | "FIXED_DEPOSIT";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "PENDING" | "CLOSED";
export type KycStatus = "VERIFIED" | "PENDING" | "REJECTED" | "NOT_SUBMITTED";
export type TxnType = "CREDIT" | "DEBIT";
export type TxnStatus = "COMPLETED" | "PENDING" | "FAILED" | "UNDER_REVIEW";
export type TxnCategory = "TRANSFER" | "SALARY" | "BILLS" | "SHOPPING" | "FOOD" | "TRAVEL" | "CARD" | "INTEREST" | "LOAN_EMI" | "DEPOSIT" | "WITHDRAWAL";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Customer {
  id: string; customerNumber: string; firstName: string; lastName: string; email: string; phone: string;
  dateOfBirth: string; address: { line1: string; city: string; state: string; postalCode: string; country: string };
  kycStatus: KycStatus; riskRating: "LOW" | "MEDIUM" | "HIGH"; branchId: string; createdAt: string; status: "ACTIVE" | "BLOCKED";
}
export interface Employee {
  id: string; employeeCode: string; name: string; email: string; roleId: string; branchId: string;
  designation: string; status: "ACTIVE" | "INACTIVE"; joinedAt: string;
}
export interface BankAccount {
  id: string; accountNumber: string; customerId: string; type: AccountType; balance: number; currency: "INR";
  status: AccountStatus; openedAt: string; interestRate: number; branchId: string; maturityDate?: string; nickname: string;
}
export interface Transaction {
  id: string; reference: string; accountId: string; type: TxnType; amount: number; balanceAfter: number;
  description: string; category: TxnCategory; status: TxnStatus; createdAt: string; counterparty: string; channel: "NETBANKING" | "CARD" | "BRANCH" | "UPI" | "SYSTEM"; flagged?: boolean;
}
export interface LedgerAccount { id: string; code: string; name: string; type: "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE" | "EQUITY" }
export interface LedgerEntry {
  id: string; journalRef: string; transactionRef: string; ledgerAccountId: string; accountNumber?: string;
  debit: number; credit: number; postedAt: string; postingStatus: "POSTED" | "PENDING" | "REVERSED"; reconciled: boolean; narration: string;
}
export interface Beneficiary {
  id: string; customerId: string; name: string; accountNumber: string; bankName: string; ifsc: string; nickname: string;
  verification: "VERIFIED" | "PENDING" | "FAILED"; transferLimit: number; addedAt: string;
}
export type LoanProduct = "PERSONAL" | "EDUCATION" | "HOME";
export interface Loan {
  id: string; loanNumber: string; customerId: string; product: LoanProduct; principal: number; rate: number; tenureMonths: number;
  emi: number; outstanding: number; status: "APPLIED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | "CLOSED";
  appliedAt: string; monthlyIncome: number; purpose: string; creditScore: number;
}
export interface LoanRepayment { id: string; loanId: string; installment: number; dueDate: string; emi: number; principal: number; interest: number; balance: number; status: "PAID" | "DUE" | "OVERDUE" }
export interface BankCard {
  id: string; customerId: string; accountId: string; cardNumber: string; holder: string; expiry: string; network: "VISA" | "RUPAY" | "MASTERCARD";
  status: "ACTIVE" | "FROZEN" | "BLOCKED"; dailyLimit: number; onlineLimit: number; onlineEnabled: boolean; internationalEnabled: boolean;
}
export interface KYCApplication {
  id: string; customerId: string; submittedAt: string; documents: { type: "PAN" | "AADHAAR" | "PASSPORT" | "ADDRESS_PROOF"; status: "VERIFIED" | "PENDING" | "REJECTED" }[];
  status: "PENDING" | "APPROVED" | "REJECTED"; reviewer?: string; remarks?: string;
}
export interface FraudAlert {
  id: string; transactionRef: string; accountNumber: string; customerId: string; rule: string; severity: Severity; score: number;
  status: "OPEN" | "INVESTIGATING" | "ESCALATED" | "CLEARED" | "CONFIRMED"; createdAt: string; notes: { by: string; at: string; text: string }[]; amount: number;
}
export interface AuditLog { id: string; at: string; actor: string; actorRole: Role; action: string; entity: string; entityId: string; ip: string; outcome: "SUCCESS" | "FAILURE" }
export interface SupportTicket {
  id: string; ticketNumber: string; customerId: string; subject: string; category: "ACCOUNT" | "CARD" | "TRANSFER" | "LOAN" | "COMPLAINT";
  priority: "LOW" | "MEDIUM" | "HIGH"; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"; assignedTo?: string; createdAt: string; description: string;
}
export interface Branch { id: string; code: string; name: string; city: string; ifsc: string; manager: string; status: "ACTIVE" | "INACTIVE"; customers: number; deposits: number }
export interface Permission { key: string; module: string; description: string }
export interface RoleDef { id: string; name: string; description: string; permissions: string[]; system: boolean }
export interface Notification { id: string; at: string; title: string; body: string; read: boolean; audience: Role }
export interface AccountApplication { id: string; customerId: string; type: AccountType; initialDeposit: number; submittedAt: string; status: "PENDING" | "APPROVED" | "REJECTED" }
export interface SystemSettings { maxDailyTransfer: number; largeTransferThreshold: number; velocityLimit: number; sessionTimeoutMin: number; maintenanceMode: boolean; twoFactorRequired: boolean }
