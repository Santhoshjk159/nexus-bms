import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight, BadgeCheck, BarChart3, BookOpenCheck, Building2, CreditCard, FileClock, Gauge, Headphones, Landmark,
  LayoutDashboard, ListChecks, Receipt, Settings, ShieldAlert, ShieldCheck, UserCircle, Users, UsersRound, Wallet, KeyRound, Scale,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem { to: string; label: string; icon: LucideIcon }
export interface NavGroup { label: string; items: NavItem[] }
export const NAV: Record<Role, NavGroup[]> = {
  CUSTOMER: [
    { label: "Banking", items: [
      { to: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard }, { to: "/customer/accounts", label: "Accounts", icon: Wallet },
      { to: "/customer/transfers", label: "Fund transfers", icon: ArrowLeftRight }, { to: "/customer/transactions", label: "Transactions", icon: Receipt },
      { to: "/customer/beneficiaries", label: "Beneficiaries", icon: UsersRound } ] },
    { label: "Products", items: [ { to: "/customer/loans", label: "Loans", icon: Landmark }, { to: "/customer/cards", label: "Cards", icon: CreditCard } ] },
    { label: "Account", items: [ { to: "/customer/profile", label: "Profile & KYC", icon: UserCircle } ] },
  ],
  EMPLOYEE: [
    { label: "Operations", items: [
      { to: "/employee/dashboard", label: "Dashboard", icon: Gauge }, { to: "/employee/customers", label: "Customers", icon: Users },
      { to: "/employee/kyc", label: "KYC review", icon: BadgeCheck }, { to: "/employee/accounts", label: "Account operations", icon: Wallet } ] },
    { label: "Risk", items: [ { to: "/employee/transactions", label: "Transaction monitoring", icon: ListChecks }, { to: "/employee/fraud-monitoring", label: "Fraud monitoring", icon: ShieldAlert } ] },
    { label: "Services", items: [ { to: "/employee/loans", label: "Loan operations", icon: Landmark }, { to: "/employee/support", label: "Customer support", icon: Headphones }, { to: "/employee/reports", label: "Reports", icon: BarChart3 } ] },
  ],
  ADMIN: [
    { label: "Overview", items: [ { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard } ] },
    { label: "Administration", items: [ { to: "/admin/employees", label: "Employees", icon: Users }, { to: "/admin/roles", label: "Roles & permissions", icon: KeyRound }, { to: "/admin/branches", label: "Branches", icon: Building2 } ] },
    { label: "Finance & Risk", items: [ { to: "/admin/ledger", label: "General ledger", icon: BookOpenCheck }, { to: "/admin/audit-logs", label: "Audit logs", icon: FileClock }, { to: "/admin/compliance", label: "Compliance", icon: Scale } ] },
    { label: "System", items: [ { to: "/admin/settings", label: "Settings", icon: Settings }, { to: "/employee/dashboard", label: "Operations portal", icon: ShieldCheck } ] },
  ],
};
