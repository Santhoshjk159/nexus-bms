# NEXUS BMS — Software Engineering Hub

A built-in documentation workspace inside the Admin portal. All content is written to match the app as it actually exists (pages, rules, data types, files). No external ZIP.

## Navigation
- Admin sidebar gets a new "System Management" group with **Software Engineering Hub** (BookOpen icon). Existing items stay unchanged.
- The hub opens at `/admin/se-hub` with its own documentation sidebar (Overview, Requirements Engineering, UML & System Modelling, System Design, Software Quality, Project Documentation), one page per item as listed in the request.
- Every page has its own address, so deep links and the browser back button work. Admin-only: customers and employees are redirected by the existing guard.

## Pages
- **Dashboard**: title, subtitle, 7 section cards, and metrics counted from the documentation data (functional / non-functional requirements, diagrams, modules, test cases, execution status).
- **UML workspace** (12 diagrams: use case, class, 5 sequence diagrams for auth, transfer, loan, KYC and fraud, activity, component, deployment, state, ER): diagram picker, zoom, fit-to-screen, drag to pan, full screen, download SVG/PNG, view and copy source, an explanation for each diagram, and an error panel with the source if a diagram fails. All diagrams are written in Mermaid, so no external PlantUML service is needed.
- **SRS reader**: table of contents, expandable sections, search, filter by type and priority, and a details panel for each requirement (ID, actor, preconditions, main and alternative flow, expected outcome, status). Status is one of Implemented, Partially Implemented, Proposed, or Needs Verification.
- **Requirement pages** (functional, non-functional, business rules): filtered views of the same data.
- **Traceability matrix**: requirement → module → diagram → test case, with search, module and status filters, and clickable links that open the requirement, diagram or test.
- **Test management**: searchable table with all listed columns. The admin sets the status (Not Run / Pass / Fail / Blocked), actual result and remarks. Every test starts as Not Run, and manually updated rows are marked "Manually recorded" with the date. Summary cards and a chart show the results. Results are saved with the existing app data and audit log.
- **Architecture explorer**: a clickable layered diagram (portals, routing, hooks, services, mock store, domain models, banking logic, future Spring Boot/MySQL). Clicking a part shows its responsibility, related modules, source files and dependencies, with a "Current" or "Proposed" badge.
- **Data model explorer**: the 17 entities from the app's data types. Clicking one shows its fields, keys and relationships, and highlights connected entities. Keys are labelled as conceptual, since the app has no real database.
- **Document reader** (overview, scope, SRS, design, data flow, database design, API, test plan, defect tracking, security, methodology, report, roadmap, future work): table of contents, search within the page, and Print. There is no PDF download because no real PDF exists, and the page says so.

## Technical details
- Add the `mermaid` package. It is loaded only in the browser, when a diagram is shown.
- Content files live in `src/docs/` (typed): requirements, diagrams, tests, traceability, architecture, entities, documents. One ID scheme is shared everywhere (FR-xx, NFR-xx, BR-xx, UML-xx, TC-xx, MOD-xx).
- Routes: `admin.se-hub.tsx` (hub layout with its sidebar and `<Outlet/>`) plus `admin.se-hub.index.tsx` and one route per section, or a `$section` route that maps to section components. Reuses the existing Panel, DataTable, StatusBadge, Sheet and Dialog components.
- Zoom and pan are built in the diagram viewer: wheel zoom anchored at the cursor, pointer drag to pan, and the browser's full-screen mode.
- Test results are stored in the existing store as a new `testRuns` record keyed by test ID, with a new action that also writes to the audit log. Nothing is seeded, so everything starts as Not Run.
- Tests: metrics come from the data, all tests start as Not Run, every traceability link points to an existing ID, and employees and customers can't open the hub.
- Checks: typecheck, existing tests, and a browser pass that opens every hub page, confirms each diagram draws an SVG, and saves a test status and checks it after reload.
