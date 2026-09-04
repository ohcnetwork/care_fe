import { describe, expect, it } from "vitest";

import { add, divide, multiply, round, roundUp } from "@/Utils/decimal";

describe("decimal helpers (backend-matching money math)", () => {
  it("adds without binary float error", () => {
    expect(add("0.1", "0.2").toString()).toBe("0.3");
  });

  it("multiplies without binary float error", () => {
    expect(multiply("3", "0.1").toString()).toBe("0.3");
  });

  it("rounds to accounting precision with ROUND_HALF_UP", () => {
    expect(round("10.005")).toBe("10.01");
    expect(round("10.004")).toBe("10.00");
  });

  it("roundUp always rounds away from zero to whole units", () => {
    expect(roundUp("10.01")).toBe("11");
    expect(roundUp("-10.01")).toBe("-11");
  });

  it("divides at configured precision and rounds for display", () => {
    expect(round(divide("1", "3"))).toBe("0.33");
  });
});
