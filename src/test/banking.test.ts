import { describe, expect, it } from "vitest";
import { calcEmi, isBalanced, loanEligibility, screenTransaction } from "@/lib/banking";
import { canAccess } from "@/lib/auth";

describe("banking rules", () => {
  it("computes standard EMI", () => { expect(calcEmi(1000000, 10, 120)).toBeCloseTo(13215.07, 1); });
  it("requires credit score of 650", () => { expect(loanEligibility(200000, 0, 640, 10, 60).eligible).toBe(false); expect(loanEligibility(200000, 0, 700, 10, 60).eligible).toBe(true); });
  it("detects unbalanced journals", () => { expect(isBalanced([{ debit: 100, credit: 0 }, { debit: 0, credit: 100 }])).toBe(true); expect(isBalanced([{ debit: 100, credit: 0 }])).toBe(false); });
  it("flags large transfers as HIGH and 2x as CRITICAL", () => {
    const cfg = { largeTransferThreshold: 200000, velocityLimit: 6 };
    expect(screenTransaction(250000, [], cfg)[0].severity).toBe("HIGH");
    expect(screenTransaction(400000, [], cfg)[0].severity).toBe("CRITICAL");
    expect(screenTransaction(5000, [], cfg)).toHaveLength(0);
  });
  it("keeps customers out of staff portals", () => {
    expect(canAccess("CUSTOMER", "/employee/kyc")).toBe(false);
    expect(canAccess("CUSTOMER", "/admin/dashboard")).toBe(false);
    expect(canAccess("EMPLOYEE", "/admin/ledger")).toBe(false);
    expect(canAccess("ADMIN", "/employee/kyc")).toBe(true);
  });
});
