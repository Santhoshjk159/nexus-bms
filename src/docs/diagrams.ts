import type { Diagram } from "./types";

export const diagrams: Diagram[] = [
  { id: "UML-01", title: "Use Case Diagram", kind: "Use case", group: "USE_CASE", requirements: ["FR-01", "FR-05", "FR-07", "FR-08", "FR-09", "FR-14", "FR-20", "FR-22"],
    explanation: "Actors and their primary use cases across the three portals. Mermaid has no native use-case notation, so actors are drawn as nodes and use cases as rounded ellipses grouped by system boundary.",
    source: `flowchart LR
  C([Customer]):::actor
  E([Employee]):::actor
  A([Administrator]):::actor
  subgraph NEXUS["NEXUS BMS"]
    UC1((Sign in))
    UC2((View dashboard & accounts))
    UC3((Transfer funds))
    UC4((Manage beneficiaries))
    UC5((Apply for loan))
    UC6((Manage cards))
    UC7((Review KYC))
    UC8((Monitor transactions))
    UC9((Investigate fraud))
    UC10((Underwrite loans))
    UC11((Handle support tickets))
    UC12((Manage employees & roles))
    UC13((Reconcile ledger))
    UC14((View audit & compliance))
  end
  C --- UC1 & UC2 & UC3 & UC4 & UC5 & UC6
  E --- UC1 & UC7 & UC8 & UC9 & UC10 & UC11
  A --- UC1 & UC12 & UC13 & UC14
  A -. inherits .- E
  UC3 -. include .-> UC9
  classDef actor fill:#e8eef8,stroke:#1e3a6e,color:#0f1f3d` },
  { id: "UML-02", title: "Class Diagram", kind: "Class", group: "CLASS", requirements: ["FR-06", "FR-09", "FR-23", "FR-24"],
    explanation: "Core domain types from src/types/index.ts and their associations. Attributes are abbreviated to the identifying and business-critical fields.",
    source: `classDiagram
  class Customer { +id +customerNumber +firstName +lastName +kycStatus +riskRating +status }
  class BankAccount { +id +accountNumber +type +balance +status +interestRate }
  class Transaction { +id +reference +type +amount +status +flagged }
  class LedgerEntry { +journalRef +transactionRef +debit +credit +postingStatus +reconciled }
  class LedgerAccount { +id +code +name +type }
  class Beneficiary { +id +accountNumber +ifsc +verification +transferLimit }
  class Loan { +loanNumber +product +principal +rate +tenureMonths +emi +status }
  class BankCard { +cardNumber +status +dailyLimit +onlineLimit }
  class KYCApplication { +id +status +documents }
  class FraudAlert { +rule +severity +score +status +notes }
  class Employee { +employeeCode +name +roleId +branchId }
  class RoleDef { +name +permissions }
  class Branch { +code +ifsc +status }
  Customer "1" --> "*" BankAccount : owns
  Customer "1" --> "*" Beneficiary : saves
  Customer "1" --> "*" Loan : borrows
  Customer "1" --> "0..*" KYCApplication : submits
  BankAccount "1" --> "*" Transaction : records
  BankAccount "1" --> "*" BankCard : linked
  Transaction "1" --> "2..*" LedgerEntry : posts
  LedgerEntry "*" --> "1" LedgerAccount : to
  Transaction "1" --> "0..*" FraudAlert : raises
  Employee "*" --> "1" RoleDef : has
  Employee "*" --> "1" Branch : works at
  Customer "*" --> "1" Branch : home` },
  { id: "UML-03", title: "Authentication Sequence", kind: "Sequence", group: "SEQUENCE", requirements: ["FR-01", "FR-02", "NFR-02"],
    explanation: "Demo sign-in validates input with zod, matches demo credentials, stores a session in localStorage and relies on the portal layout's beforeLoad guard for every protected navigation.",
    source: `sequenceDiagram
  actor U as User
  participant L as Login page
  participant Auth as lib/auth
  participant LS as localStorage
  participant G as Portal guard
  U->>L: Enter email + password
  L->>L: zod schema validation
  alt invalid input
    L-->>U: Field errors
  else valid
    L->>Auth: login(email, password)
    Auth->>Auth: match DEMO_USERS
    alt no match
      Auth-->>L: null
      L-->>U: Invalid credentials
    else match
      Auth->>LS: save session (role, token)
      Auth-->>L: Session
      L->>G: navigate to HOME[role]
      G->>LS: getSession()
      G->>G: canAccess(role, path)
      G-->>U: Render portal
    end
  end` },
  { id: "UML-04", title: "Fund Transfer Sequence", kind: "Sequence", group: "SEQUENCE", requirements: ["FR-07", "BR-01", "BR-02", "BR-07"],
    explanation: "actions.transfer validates the source, screens the debit with the fraud rule engine, updates balances, posts a balanced journal (destination GL or interbank clearing) and writes the audit log in one state update.",
    source: `sequenceDiagram
  actor C as Customer
  participant UI as Transfers page
  participant S as store.actions
  participant R as banking.screenTransaction
  participant LG as Ledger
  participant FA as Fraud alerts
  participant AU as Audit log
  C->>UI: Fill form + Review
  UI->>UI: Validate amount, balance, limits
  C->>UI: Confirm & transfer
  UI->>S: transfer(input)
  S->>S: Check account active, balance, daily limit
  alt rule violated
    S->>AU: TRANSFER_FAILED
    S-->>UI: ok=false, error
  else valid
    S->>R: screen(amount, recent, settings)
    R-->>S: hits[]
    S->>S: Debit source / credit destination
    S->>LG: Dr deposit GL, Cr destination GL or clearing
    opt HIGH or CRITICAL hit
      S->>FA: Create OPEN alert, status UNDER_REVIEW
    end
    S->>AU: TRANSFER_INITIATED
    S-->>UI: ok=true, reference, flagged
  end
  UI-->>C: Result screen with reference` },
  { id: "UML-05", title: "Loan Processing Sequence", kind: "Sequence", group: "SEQUENCE", requirements: ["FR-10", "FR-11", "FR-19", "BR-05"],
    explanation: "From eligibility simulation through application, underwriting and disbursal. Notifications are delivered to the in-app notification center.",
    source: `sequenceDiagram
  actor C as Customer
  participant LP as Loans page
  participant B as banking.ts
  participant S as store.actions
  actor O as Loan officer
  C->>LP: Choose product, amount, tenure
  LP->>B: calcEmi() + loanEligibility()
  B-->>LP: EMI, maxPrincipal, eligible
  C->>LP: Submit application + purpose
  LP->>S: applyLoan()
  S-->>O: Notification "New loan application"
  O->>S: setLoanStatus(UNDER_REVIEW)
  O->>S: decideLoan(approve?)
  alt approved
    S-->>C: Notification "Loan approved"
    O->>S: setLoanStatus(ACTIVE)
  else rejected
    S-->>C: Notification "Loan rejected"
  end` },
  { id: "UML-06", title: "KYC Verification Sequence", kind: "Sequence", group: "SEQUENCE", requirements: ["FR-13", "FR-15", "BR-06"],
    explanation: "Customers submit or re-submit documents; an employee reviews and decides. Rejection requires remarks; approval verifies all documents and unlocks account opening.",
    source: `sequenceDiagram
  actor C as Customer
  participant P as Profile page
  participant S as store.actions
  actor E as Employee
  participant K as KYC review page
  C->>P: Re-submit documents
  P->>S: submitKyc(customerId)
  S->>S: Create PENDING application
  E->>K: Open application
  K->>K: Inspect PAN, Aadhaar, address proof
  alt approve
    K->>S: reviewKyc(id, true, remarks)
    S->>S: customer.kycStatus = VERIFIED
  else reject
    K->>K: Require remarks ≥ 5 chars
    K->>S: reviewKyc(id, false, remarks)
    S->>S: customer.kycStatus = REJECTED
  end
  S->>S: Audit KYC_APPROVED / KYC_REJECTED` },
  { id: "UML-07", title: "Fraud Detection Sequence", kind: "Sequence", group: "SEQUENCE", requirements: ["FR-17", "FR-18", "BR-03", "BR-04"],
    explanation: "Alerts originate from the rule engine during transfers or from manual escalation; resolution propagates to the transaction and ledger postings.",
    source: `sequenceDiagram
  participant T as Transfer
  participant R as Rule engine
  participant A as Fraud alert
  actor F as Fraud analyst
  participant TX as Transaction
  participant L as Ledger
  T->>R: screenTransaction()
  R-->>A: OPEN (severity, score)
  F->>A: Start investigation / add note
  opt needs senior review
    F->>A: ESCALATED
  end
  alt false positive
    F->>A: CLEARED
    A->>TX: status COMPLETED
    A->>L: postingStatus POSTED
  else fraud confirmed
    F->>A: CONFIRMED
    A->>TX: status FAILED
    A->>L: postingStatus REVERSED
  end` },
  { id: "UML-08", title: "Activity Diagram — Fund Transfer", kind: "Activity", group: "ACTIVITY", requirements: ["FR-07", "FR-16"],
    explanation: "Decision flow of a transfer from form entry to posting, including validation and fraud hold branches.",
    source: `flowchart TD
  S([Start]) --> T{Transfer type}
  T -->|Own| O[Select own account]
  T -->|Within NEXUS| I[Enter 12-digit account]
  T -->|Beneficiary| B[Select beneficiary]
  O & I & B --> AM[Enter amount]
  AM --> V{Valid?}
  V -->|No| E[Show field errors] --> AM
  V -->|Yes| CF[Confirmation screen]
  CF --> X[Execute transfer]
  X --> F{Fraud hit HIGH+?}
  F -->|Yes| H[Hold UNDER_REVIEW + alert]
  F -->|No| P[Post journal + COMPLETED]
  H & P --> R[Show reference]
  R --> Z([End])` },
  { id: "UML-09", title: "Component Diagram", kind: "Component", group: "COMPONENT", requirements: ["FR-02", "FR-25", "FR-27", "NFR-05"],
    explanation: "Current front-end components and the proposed Spring Boot backend (dashed). Pages depend on hooks and the store; the API client is prepared but not yet used by pages.",
    source: `flowchart TB
  subgraph Presentation
    CP[Customer portal routes]
    EP[Employee portal routes]
    AP[Admin portal routes + SE Hub]
    UI[Shared UI: AppShell, DataTable, charts]
  end
  subgraph Application
    RT[TanStack Router + guards]
    HK[Hooks: useCustomer, useLookup]
    ST[Mock store: services/store.ts]
    BL[Banking rules: lib/banking.ts]
    AU[Auth: lib/auth.ts]
    API[API client: services/api.ts]
  end
  subgraph Future["Proposed backend"]
    SB[Spring Boot REST]
    DB[(MySQL)]
  end
  CP & EP & AP --> UI
  CP & EP & AP --> RT --> AU
  CP & EP & AP --> HK --> ST
  ST --> BL
  API -.-> SB -.-> DB
  ST -. replace with .-> API` },
  { id: "UML-10", title: "Deployment Diagram", kind: "Deployment", group: "DEPLOYMENT", requirements: ["NFR-05", "NFR-06"],
    explanation: "Current: the app is served from an edge worker and runs entirely in the browser with localStorage. Proposed nodes are dashed.",
    source: `flowchart LR
  subgraph Browser["Client device: browser"]
    SPA[React app bundle]
    LS[(localStorage: state + session)]
  end
  subgraph Edge["Edge runtime (Cloudflare Worker)"]
    SSR[TanStack Start server: HTML + assets]
  end
  subgraph Proposed["Proposed data centre"]
    APIS[Spring Boot API + Spring Security JWT]
    MY[(MySQL 8)]
  end
  SSR -->|HTTPS| SPA
  SPA <--> LS
  SPA -.->|REST / JWT| APIS -.-> MY` },
  { id: "UML-11", title: "State Diagram — Transaction, Loan and Card", kind: "State", group: "STATE", requirements: ["FR-07", "FR-11", "FR-12", "FR-15", "FR-16", "FR-18", "FR-19", "BR-08"],
    explanation: "Lifecycle states exactly as defined by the TxnStatus, Loan.status and BankCard.status types.",
    source: `stateDiagram-v2
  state Transaction {
    [*] --> COMPLETED: posted
    [*] --> FAILED: validation failed
    [*] --> UNDER_REVIEW: fraud hold / manual review
    UNDER_REVIEW --> COMPLETED: cleared
    UNDER_REVIEW --> FAILED: fraud confirmed
    COMPLETED --> UNDER_REVIEW: placed under review
  }
  state Loan {
    [*] --> APPLIED
    APPLIED --> UNDER_REVIEW
    APPLIED --> APPROVED
    UNDER_REVIEW --> APPROVED
    APPLIED --> REJECTED
    UNDER_REVIEW --> REJECTED
    APPROVED --> ACTIVE: disbursed
    ACTIVE --> CLOSED
  }
  state Card {
    [*] --> ACTIVE
    ACTIVE --> FROZEN: freeze
    FROZEN --> ACTIVE: unfreeze
    ACTIVE --> BLOCKED: block
    FROZEN --> BLOCKED: block
  }` },
  { id: "UML-12", title: "ER Diagram", kind: "Entity relationship", group: "ER", requirements: ["FR-06", "FR-24", "NFR-03"],
    explanation: "Conceptual data model derived from the TypeScript entities. Keys are conceptual identifiers; no SQL schema exists yet.",
    source: `erDiagram
  CUSTOMER ||--o{ BANK_ACCOUNT : owns
  CUSTOMER ||--o{ BENEFICIARY : saves
  CUSTOMER ||--o{ LOAN : borrows
  CUSTOMER ||--o{ KYC_APPLICATION : submits
  CUSTOMER ||--o{ SUPPORT_TICKET : raises
  CUSTOMER }o--|| BRANCH : "home branch"
  BANK_ACCOUNT ||--o{ TRANSACTION : records
  BANK_ACCOUNT ||--o{ BANK_CARD : "linked to"
  TRANSACTION ||--|{ LEDGER_ENTRY : "posts by reference"
  LEDGER_ACCOUNT ||--o{ LEDGER_ENTRY : classifies
  TRANSACTION ||--o{ FRAUD_ALERT : raises
  LOAN ||--o{ LOAN_REPAYMENT : schedules
  EMPLOYEE }o--|| ROLE_DEF : has
  EMPLOYEE }o--|| BRANCH : "works at"
  ROLE_DEF }o--o{ PERMISSION : grants
  CUSTOMER { string id PK }
  BANK_ACCOUNT { string id PK string customerId FK string accountNumber }
  TRANSACTION { string id PK string accountId FK string reference }
  LEDGER_ENTRY { string id PK string ledgerAccountId FK string transactionRef }
  LOAN { string id PK string customerId FK }
  EMPLOYEE { string id PK string roleId FK string branchId FK }` },
];
