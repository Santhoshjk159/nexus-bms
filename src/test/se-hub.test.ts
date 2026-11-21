import { describe, expect, it } from "vitest";
import { diagrams, hubMetrics, modules, requirements, testCases } from "@/docs";
import { canAccess } from "@/lib/auth";

describe("Software Engineering Hub data", () => {
  it("derives metrics from documentation", () => {
    const m = hubMetrics({});
    expect(m.functional).toBe(requirements.filter((r) => r.type === "FUNCTIONAL").length);
    expect(m.diagrams).toBe(12);
    expect(m.tests).toBe(testCases.length);
  });
  it("starts every test case as Not Run", () => { expect(hubMetrics({}).exec.NOT_RUN).toBe(testCases.length); });
  it("traceability links point at existing IDs", () => {
    const req = new Set(requirements.map((r) => r.id)), dia = new Set(diagrams.map((d) => d.id)), mod = new Set(modules.map((m) => m.id));
    requirements.forEach((r) => { r.diagrams.forEach((d) => expect(dia.has(d), `${r.id}→${d}`).toBe(true)); r.modules.forEach((m) => expect(mod.has(m), `${r.id}→${m}`).toBe(true)); });
    testCases.forEach((t) => { expect(mod.has(t.module), t.id).toBe(true); t.requirements.forEach((r) => expect(req.has(r), `${t.id}→${r}`).toBe(true)); });
    diagrams.forEach((d) => d.requirements.forEach((r) => expect(req.has(r), `${d.id}→${r}`).toBe(true)));
  });
  it("hub is admin-only", () => {
    expect(canAccess("CUSTOMER", "/admin/se-hub")).toBe(false);
    expect(canAccess("EMPLOYEE", "/admin/se-hub/srs")).toBe(false);
    expect(canAccess("ADMIN", "/admin/se-hub/srs")).toBe(true);
  });
});
