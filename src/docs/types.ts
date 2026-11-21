// Typed documentation model for the Software Engineering Hub. IDs are shared across all docs.
export type ReqType = "FUNCTIONAL" | "NON_FUNCTIONAL" | "BUSINESS_RULE";
export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type ImplStatus = "IMPLEMENTED" | "PARTIALLY_IMPLEMENTED" | "PROPOSED" | "NEEDS_VERIFICATION";
export interface Requirement {
  id: string; type: ReqType; section: string; title: string; description: string; priority: Priority; status: ImplStatus;
  actor: string; preconditions: string[]; mainFlow: string[]; alternativeFlow: string[]; expectedOutcome: string;
  modules: string[]; diagrams: string[]; sources: string[];
}
export interface DesignModule { id: string; name: string; portal: "CUSTOMER" | "EMPLOYEE" | "ADMIN" | "SHARED"; description: string; routes: string[]; files: string[] }
export interface Diagram { id: string; title: string; kind: string; group: "USE_CASE" | "CLASS" | "SEQUENCE" | "ACTIVITY" | "STATE" | "COMPONENT" | "DEPLOYMENT" | "ER"; source: string; explanation: string; requirements: string[] }
export interface TestCase { id: string; module: string; scenario: string; preconditions: string; input: string; expected: string; priority: Priority; requirements: string[] }
export type TestStatus = "NOT_RUN" | "PASS" | "FAIL" | "BLOCKED";
export interface TestRun { status: TestStatus; actual: string; remarks: string; updatedAt: string; updatedBy: string }
export interface ArchComponent { id: string; name: string; layer: "PRESENTATION" | "ROUTING" | "STATE" | "SERVICE" | "DOMAIN" | "BACKEND"; state: "CURRENT" | "PROPOSED"; responsibility: string; modules: string[]; files: string[]; dependsOn: string[] }
export interface EntityAttr { name: string; type: string; key?: "PK" | "FK"; ref?: string; note?: string }
export interface Entity { name: string; description: string; attrs: EntityAttr[] }
export interface DocSection { id: string; title: string; body: string[]; bullets?: string[]; table?: { head: string[]; rows: string[][] } }
export interface Doc { id: string; title: string; summary: string; sections: DocSection[] }
