import type { LucideIcon } from "lucide-react";
import { Activity, BookOpen, Boxes, Bug, ClipboardCheck, ClipboardList, Component, Database, FileText, GitBranch, GitFork, ListChecks, Map, Network, Scale, Server, ShieldCheck, Sparkles, Target, Waypoints, Workflow, FlaskConical, Layers, Route, Users } from "lucide-react";

export type SectionKind =
  | { type: "doc"; doc: string } | { type: "srs"; filter?: "FUNCTIONAL" | "NON_FUNCTIONAL" | "BUSINESS_RULE" } | { type: "uml"; ids: string[] }
  | { type: "trace" } | { type: "tests"; mode: "cases" | "execution" } | { type: "testplan" } | { type: "defects" } | { type: "arch" } | { type: "modules" } | { type: "data" };
export interface HubSection { slug: string; label: string; icon: LucideIcon; kind: SectionKind }
export interface HubGroup { label: string; items: HubSection[] }

export const HUB_NAV: HubGroup[] = [
  { label: "Overview", items: [
    { slug: "overview", label: "Project Overview", icon: BookOpen, kind: { type: "doc", doc: "overview" } },
    { slug: "scope", label: "System Scope", icon: Target, kind: { type: "doc", doc: "scope" } } ] },
  { label: "Requirements Engineering", items: [
    { slug: "srs", label: "SRS", icon: FileText, kind: { type: "srs" } },
    { slug: "functional", label: "Functional Requirements", icon: ListChecks, kind: { type: "srs", filter: "FUNCTIONAL" } },
    { slug: "non-functional", label: "Non-Functional Requirements", icon: ShieldCheck, kind: { type: "srs", filter: "NON_FUNCTIONAL" } },
    { slug: "business-rules", label: "Business Rules", icon: Scale, kind: { type: "srs", filter: "BUSINESS_RULE" } },
    { slug: "traceability", label: "Requirement Traceability", icon: Waypoints, kind: { type: "trace" } } ] },
  { label: "UML & System Modelling", items: [
    { slug: "use-case", label: "Use Case Diagram", icon: Users, kind: { type: "uml", ids: ["UML-01"] } },
    { slug: "class", label: "Class Diagram", icon: Boxes, kind: { type: "uml", ids: ["UML-02"] } },
    { slug: "sequence", label: "Sequence Diagrams", icon: GitBranch, kind: { type: "uml", ids: ["UML-03", "UML-04", "UML-05", "UML-06", "UML-07"] } },
    { slug: "activity", label: "Activity Diagram", icon: Workflow, kind: { type: "uml", ids: ["UML-08"] } },
    { slug: "state", label: "State Diagram", icon: GitFork, kind: { type: "uml", ids: ["UML-11"] } },
    { slug: "component", label: "Component Diagram", icon: Component, kind: { type: "uml", ids: ["UML-09"] } },
    { slug: "deployment", label: "Deployment Diagram", icon: Server, kind: { type: "uml", ids: ["UML-10"] } },
    { slug: "er", label: "ER Diagram", icon: Database, kind: { type: "uml", ids: ["UML-12"] } } ] },
  { label: "System Design", items: [
    { slug: "architecture", label: "System Architecture", icon: Layers, kind: { type: "arch" } },
    { slug: "modules", label: "Module Design", icon: Network, kind: { type: "modules" } },
    { slug: "data-flow", label: "Data Flow", icon: Route, kind: { type: "doc", doc: "dataflow" } },
    { slug: "database", label: "Database Design", icon: Database, kind: { type: "data" } },
    { slug: "api", label: "API Documentation", icon: Activity, kind: { type: "doc", doc: "api" } } ] },
  { label: "Software Quality", items: [
    { slug: "test-plan", label: "Test Plan", icon: ClipboardList, kind: { type: "testplan" } },
    { slug: "test-cases", label: "Test Cases", icon: FlaskConical, kind: { type: "tests", mode: "cases" } },
    { slug: "test-execution", label: "Test Execution", icon: ClipboardCheck, kind: { type: "tests", mode: "execution" } },
    { slug: "defects", label: "Defect Tracking", icon: Bug, kind: { type: "defects" } },
    { slug: "security", label: "Security Assessment", icon: ShieldCheck, kind: { type: "doc", doc: "security" } } ] },
  { label: "Project Documentation", items: [
    { slug: "methodology", label: "Development Methodology", icon: Workflow, kind: { type: "doc", doc: "methodology" } },
    { slug: "report", label: "Project Report", icon: FileText, kind: { type: "doc", doc: "report" } },
    { slug: "roadmap", label: "Implementation Roadmap", icon: Map, kind: { type: "doc", doc: "roadmap" } },
    { slug: "future", label: "Future Enhancements", icon: Sparkles, kind: { type: "doc", doc: "future" } } ] },
];
export const ALL_SECTIONS = HUB_NAV.flatMap((g) => g.items);
export const sectionBySlug = (slug: string) => ALL_SECTIONS.find((s) => s.slug === slug);
/** Section slug that shows a given diagram. */
export const slugForDiagram = (id: string) => ALL_SECTIONS.find((s) => s.kind.type === "uml" && s.kind.ids.includes(id))?.slug ?? "use-case";
