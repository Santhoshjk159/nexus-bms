import type { Doc } from "./types";
import { endpoints } from "@/services/api";

export const documents: Doc[] = [
  { id: "overview", title: "Project Overview", summary: "Purpose, stakeholders and objectives of NEXUS BMS.", sections: [
    { id: "purpose", title: "1. Purpose", body: ["NEXUS BMS (Banking Management System) is a simulated enterprise core banking platform built as a final-year Software Engineering minor project. It demonstrates realistic banking workflows across three role-based portals while remaining entirely free of real customers, credentials or funds."] },
    { id: "stakeholders", title: "2. Stakeholders", body: [], table: { head: ["Stakeholder", "Interest"], rows: [["Retail customer", "Self-service banking"], ["Bank employee", "Operations, KYC, fraud, loans, support"], ["Super administrator", "Governance, configuration, ledger, audit"], ["Evaluator", "Engineering quality and documentation"]] } },
    { id: "objectives", title: "3. Objectives", body: [], bullets: ["Model customer lifecycle, accounts, transfers, loans and cards.", "Enforce double-entry accounting for every simulated transfer.", "Provide rule-based fraud monitoring with investigation workflow.", "Provide RBAC, audit trail and compliance views.", "Keep business logic separate from UI to allow a Spring Boot + MySQL backend."] },
    { id: "tech", title: "4. Technology", body: ["React 19 with TypeScript, TanStack Start/Router (file-based routes), Tailwind CSS v4 with shadcn/ui, Lucide icons, Recharts, zod validation, Vitest, Mermaid for diagrams. Target backend: Spring Boot REST with Spring Security JWT and MySQL."] },
  ] },
  { id: "scope", title: "System Scope", summary: "What is in and out of scope.", sections: [
    { id: "in", title: "1. In scope", body: [], bullets: ["Customer portal (8 pages), employee portal (9 pages), admin portal (8 pages + SE Hub).", "Simulated transfers, ledger, fraud rules, loans, cards, KYC, support, reports.", "Browser-persisted demo state with reset."] },
    { id: "out", title: "2. Out of scope", body: [], bullets: ["Real payment rails (NEFT/RTGS/UPI), real email/SMS delivery.", "Real backend and database (prepared, not connected).", "Production-grade authentication and secret management."] },
    { id: "assumptions", title: "3. Assumptions & constraints", body: ["Single currency (INR). One demo user per role. All data is deterministic seed data generated in the browser."] },
  ] },
  { id: "design", title: "System Design Document", summary: "Architecture style, layering and module design.", sections: [
    { id: "style", title: "1. Architectural style", body: ["Layered client architecture: presentation (routes + shared components) → hooks → service layer (mock store / API client) → domain (types + pure banking rules). State changes happen only through store actions, which apply business rules, post ledger journals and append audit logs atomically."] },
    { id: "routing", title: "2. Routing and access control", body: ["File-based routes under src/routes. Each portal has a layout route with ssr:false and a beforeLoad guard calling canAccess(role, path). Admins may also open /employee/*."] },
    { id: "state", title: "3. State management", body: ["BankState is an immutable object; each action clones, mutates the draft and notifies subscribers via useSyncExternalStore. The snapshot is persisted to localStorage under nexus-bank-state-v1."] },
    { id: "modules", title: "4. Module design", body: ["See the Module Design page for the 15 modules, their routes and source files."] },
  ] },
  { id: "dataflow", title: "Data Flow", summary: "How data moves through the system for key operations.", sections: [
    { id: "read", title: "1. Read path", body: ["Route component → useBank(selector) / useCustomer() → BankState snapshot → derived values computed in render (totals, charts, filters)."] },
    { id: "write", title: "2. Write path", body: ["User action → form validation (zod or inline) → actions.X() → business rule checks (lib/banking.ts) → state mutation (balances, entities) → ledger journal → audit log → notification → persist → subscribers re-render."] },
    { id: "transfer", title: "3. Transfer data flow", body: [], table: { head: ["Step", "Data produced"], rows: [["Validate", "Errors or ok"], ["Screen", "FraudHit[]"], ["Post", "2 Transactions (debit, credit if internal), 2 LedgerEntries"], ["Alert", "FraudAlert (if any hit)"], ["Audit", "AuditLog TRANSFER_INITIATED"]] } },
  ] },
  { id: "database", title: "Database Design", summary: "Conceptual relational design for the future MySQL schema.", sections: [
    { id: "approach", title: "1. Approach", body: ["The current build has no database. Entities in src/types/index.ts are designed to map one-to-one onto tables with string surrogate keys. Keys and relationships shown in the Data Model explorer are conceptual and are not enforced by any SQL constraint today."] },
    { id: "mapping", title: "2. Proposed table mapping", body: [], table: { head: ["Entity", "Proposed table", "Notes"], rows: [["Customer", "customers", "address flattened to columns"], ["BankAccount", "bank_accounts", "unique account_number"], ["Transaction", "transactions", "index on account_id, created_at"], ["LedgerEntry", "ledger_entries", "check debit XOR credit"], ["RoleDef / Permission", "roles, permissions, role_permissions", "many-to-many"], ["KYCApplication", "kyc_applications + kyc_documents", "documents normalised"], ["FraudAlert", "fraud_alerts + fraud_alert_notes", "notes normalised"]] } },
  ] },
  { id: "api", title: "API Documentation", summary: "REST endpoints prepared for the Spring Boot backend.", sections: [
    { id: "config", title: "1. Configuration", body: ["VITE_API_MODE selects 'mock' (default) or 'http'. VITE_API_BASE_URL defaults to http://localhost:8080/api/v1. The http() helper sends JSON and an Authorization: Bearer <token> header from the session. Pages currently use the mock store; these endpoints are the integration contract."] },
    { id: "endpoints", title: "2. Endpoint map", body: [], table: { head: ["Resource", "Path", "Mock action equivalent"], rows: Object.entries(endpoints).map(([k, v]) => [k, v, ({ login: "auth.login", transfers: "actions.transfer", beneficiaries: "actions.saveBeneficiary / removeBeneficiary", loans: "actions.applyLoan / decideLoan", cards: "actions.setCardStatus / updateCard", kyc: "actions.reviewKyc", fraudAlerts: "actions.updateAlert", ledger: "actions.reconcile", employees: "actions.saveEmployee", roles: "actions.togglePermission / addRole", branches: "actions.saveBranch", settings: "actions.updateSettings", tickets: "actions.createTicket / updateTicket" } as Record<string, string>)[k] ?? "read via useBank"]) } },
  ] },
  { id: "testplan", title: "Test Plan", summary: "Strategy, scope and environment for verification.", sections: [
    { id: "strategy", title: "1. Strategy", body: [], bullets: ["Unit tests (Vitest) for pure rules: EMI, eligibility, ledger balance, fraud screening, portal access.", "Routing smoke test ensures / resolves.", "Manual functional test cases TC-01…TC-37 executed in the Test Execution page.", "Browser smoke runs open every route for each role."] },
    { id: "env", title: "2. Environment", body: ["Modern Chromium/Firefox/Safari; desktop 1280px and mobile 390px viewports; demo data reset before each manual run."] },
    { id: "criteria", title: "3. Entry / exit criteria", body: ["Entry: build passes typecheck. Exit: all HIGH priority test cases Pass, no open critical defects."] },
  ] },
  { id: "defects", title: "Defect Tracking", summary: "How defects are recorded and the log of defects found during development.", sections: [
    { id: "process", title: "1. Process", body: ["A test case marked Fail in Test Execution is the defect record: its actual result and remarks describe the defect. Status Blocked marks tests that cannot run."] },
    { id: "log", title: "2. Development defect log", body: [], table: { head: ["ID", "Description", "Fix", "Status"], rows: [["DEF-01", "Infinite render loop: store selectors returned new arrays to useSyncExternalStore", "Subscribe to the immutable root snapshot and derive in render", "Fixed"], ["DEF-02", "Strict TS options conflicted with chart library typings", "Relaxed three non-core strictness flags (strict kept)", "Fixed"]] } },
  ] },
  { id: "security", title: "Security Assessment", summary: "Threats, controls and known limitations.", sections: [
    { id: "controls", title: "1. Implemented controls", body: [], bullets: ["Route-level RBAC guards before render (NFR-02).", "Input validation with zod on forms.", "Masked account and card numbers by default.", "Supervisor code for account status changes (BR-08).", "Audit trail for state-changing actions (NFR-04).", "Fraud rule engine with review holds (BR-03, BR-04)."] },
    { id: "limits", title: "2. Known limitations (demo)", body: [], bullets: ["Session and state live in localStorage and can be edited by the user — acceptable only for a simulation.", "Demo passwords are shown on the login page.", "Session timeout setting is not enforced (FR-28 Proposed).", "No server-side authorization; required once the Spring Boot backend is connected."] },
    { id: "risk", title: "3. Risk register", body: [], table: { head: ["Risk", "Likelihood", "Impact", "Mitigation (future)"], rows: [["Client-side tampering", "High", "High", "Server-side authorization + JWT"], ["XSS", "Low", "High", "React escaping, CSP"], ["Credential leakage", "Medium", "High", "Hashed passwords, no demo hints"]] } },
  ] },
  { id: "methodology", title: "Development Methodology", summary: "Process followed to build the system.", sections: [
    { id: "model", title: "1. Model", body: ["Incremental, stage-based delivery: (1) design system, layouts, login and RBAC; (2) customer portal; (3) employee portal; (4) admin portal; (5) interactions, data, validation; (6) review and fixes; (7) Software Engineering Hub."] },
    { id: "practices", title: "2. Practices", body: [], bullets: ["Typed domain model first.", "Pure, tested business rules.", "Single mutation path through store actions.", "Automated browser smoke checks per role."] },
  ] },
  { id: "report", title: "Project Report", summary: "Summary of results.", sections: [
    { id: "summary", title: "1. Summary", body: ["The delivered system contains 25 banking routes across three portals plus this hub, 18 typed entities, a deterministic seed data set, and a rule-driven core with double-entry posting, fraud screening and audit logging."] },
    { id: "results", title: "2. Results", body: ["Automated unit tests for banking rules pass. Manual functional test execution results are recorded in the Test Execution page; none are pre-filled."] },
    { id: "conclusion", title: "3. Conclusion", body: ["The architecture keeps UI and business logic separate so the mock service can be replaced by a Spring Boot backend with minimal UI changes."] },
  ] },
  { id: "roadmap", title: "Implementation Roadmap", summary: "Planned next phases.", sections: [
    { id: "phases", title: "Phases", body: [], table: { head: ["Phase", "Deliverable", "Status"], rows: [["1", "Front-end prototype with mock core", "Done"], ["2", "Software Engineering Hub", "Done"], ["3", "Spring Boot REST + JWT", "Planned"], ["4", "MySQL schema and migration of seed data", "Planned"], ["5", "Switch pages from store to API services", "Planned"], ["6", "Session timeout, 2FA enforcement", "Planned"]] } },
  ] },
  { id: "future", title: "Future Enhancements", summary: "Ideas beyond the current scope.", sections: [
    { id: "list", title: "Enhancements", body: [], bullets: ["Scheduled and recurring transfers.", "Real PDF statements.", "Machine-learning fraud scoring alongside rules.", "Maker-checker approvals for admin changes.", "Notification delivery by email/SMS.", "Formal WCAG 2.2 accessibility audit."] },
  ] },
];
