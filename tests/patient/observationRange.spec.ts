import { expect, test } from "@playwright/test";

import {
  formatRangeBounds,
  observationInterpretation,
} from "../../src/Utils/observationRange";

test("empty range bounds are omitted", () => {
  expect(formatRangeBounds("", 20)).toBe("< 20");
  expect(formatRangeBounds(0, "")).toBe("> 0");
});

test("overlapping or unbounded reference bands do not infer an interpretation", () => {
  expect(
    observationInterpretation({
      value: { value: "20" },
      reference_range: [
        { min: 12, max: 20, interpretation: { display: "Normal" } },
        { min: 20, max: 30, interpretation: { display: "High" } },
      ],
    }),
  ).toBeUndefined();
  expect(
    observationInterpretation({
      value: { value: "20" },
      reference_range: [{ interpretation: { display: "Normal" } }],
    }),
  ).toBeUndefined();
});
