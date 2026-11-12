# NEXUS BANK — Enterprise Core Banking Prototype

A complete frontend banking platform with three role-based portals, realistic mock data, and a service layer ready to swap to Spring Boot APIs. No real money or credentials.

## Design system
- Deep navy primary, slate/muted blue secondary, teal accent, cool-grey background, white cards with refined borders.
- Font: IBM Plex Sans (body) + IBM Plex Mono (account numbers, amounts, references) — professional, avoids generic Inter look.
- Shell: persistent collapsible sidebar, top bar with breadcrumbs, notification center, profile menu. Responsive down to mobile.

## Stages
1. Design tokens, app shell, login (demo role picker: Customer / Employee / Admin), forgot-password, role-guarded route groups.
2. Customer portal: dashboard, accounts, transfers (own/internal/beneficiary, confirm, reference, success/failure), transactions (search, filters, detail drawer, statement download as CSV), beneficiaries (CRUD), loans (catalogue, eligibility, EMI calculator, application, schedule), cards (virtual card, freeze, limits), profile & KYC.
3. Employee portal: dashboard, customers, KYC review, account operations, transaction monitoring, fraud monitoring (severity, status, analyst notes), loan ops, support tickets, reports.
4. Admin portal: KPI dashboard and analytics, employees, roles & permissions matrix, branches, double-entry ledger (balanced journal entries, reconciliation), audit logs, compliance, settings.
5. Shared interactions: sortable/filterable/paginated tables, dialogs, confirmations, toasts, loading/empty/error states, form validation (zod).
6. Review pass: every route, link and button works; titles per page.

## Key behaviour
- A transfer debits/credits balances, writes two balanced ledger entries, an audit log entry, and may raise a fraud alert (large amount, rapid frequency).
- Employee actions (approve KYC, suspend account, approve loan, escalate alert) update shared state and audit log.
- State lives in an in-memory mock store persisted to browser storage, with a "Reset demo data" action.

## Technical details
- TanStack Start/Router file routes (template's router; replaces React Router per platform), React Query over services, shadcn/ui, Lucide, Recharts.
- Routes: `/login`, `/forgot-password`, `/customer/*`, `/employee/*`, `/admin/*` exactly as specified; `/` redirects to login or the role's dashboard. Layout routes `customer.tsx`, `employee.tsx`, `admin.tsx` enforce role.
- Structure: `src/types` (all 18 entities, MySQL-friendly ids/fields), `src/mocks` (seed data), `src/services` (interfaces + mock impl + `http` impl selected by `VITE_API_MODE` / `VITE_API_BASE_URL`, JWT header ready), `src/hooks`, `src/components/{layout,data,charts,finance}`, `src/lib/auth`.
- Unit tests for EMI calculation, ledger balancing, fraud rules, and role access.
- Auth is simulated (demo); real Spring Security + JWT plugs into the http service.
