import { requirements } from "./requirements";
import { diagrams } from "./diagrams";
import { testCases } from "./tests";
import { modules } from "./modules";
import type { TestRun, TestStatus } from "./types";
export * from "./types";
export { requirements, diagrams, testCases, modules };
export { archComponents } from "./architecture";
export { entities, relationships } from "./entities";
export { documents } from "./documents";

export const reqById = (id: string) => requirements.find((r) => r.id === id);
export const diagramById = (id: string) => diagrams.find((d) => d.id === id);
export const moduleById = (id: string) => modules.find((m) => m.id === id);
export const testsForReq = (id: string) => testCases.filter((t) => t.requirements.includes(id));

/** Metrics derived from documentation data and recorded runs. */
export function hubMetrics(runs: Record<string, TestRun>) {
  const count = (s: TestStatus) => testCases.filter((t) => (runs[t.id]?.status ?? "NOT_RUN") === s).length;
  return {
    functional: requirements.filter((r) => r.type === "FUNCTIONAL").length,
    nonFunctional: requirements.filter((r) => r.type === "NON_FUNCTIONAL").length,
    businessRules: requirements.filter((r) => r.type === "BUSINESS_RULE").length,
    diagrams: diagrams.length, modules: modules.length, tests: testCases.length,
    exec: { NOT_RUN: count("NOT_RUN"), PASS: count("PASS"), FAIL: count("FAIL"), BLOCKED: count("BLOCKED") },
  };
}
