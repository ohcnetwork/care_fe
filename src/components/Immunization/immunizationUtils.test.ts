import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ImmunizationRecommendationRead } from "@/types/emr/immunizationRecommendation/immunizationRecommendation";

import {
  flattenRecommendations,
  forecastDisplayStatus,
  materializePolicyTemplate,
} from "./immunizationUtils";

function due(
  dates: Partial<ImmunizationRecommendationRead>,
): ImmunizationRecommendationRead {
  return { id: "1", forecast_status: "due", is_group: false, ...dates };
}

describe("forecastDisplayStatus", () => {
  const today = "2026-03-10";

  it("keeps settled statuses as stored", () => {
    for (const status of ["complete", "immune", "contraindicated"] as const) {
      assert.equal(
        forecastDisplayStatus(
          { ...due({ due_date: "2020-01-01" }), forecast_status: status },
          today,
        ),
        status,
      );
    }
  });

  it("is upcoming before the earliest date", () => {
    assert.equal(
      forecastDisplayStatus(
        due({ earliest_date: "2026-03-11", due_date: "2026-04-01" }),
        today,
      ),
      "upcoming",
    );
  });

  it("becomes overdue on the overdue date, not the day after the due date", () => {
    const item = due({ due_date: "2026-03-01", overdue_date: "2026-03-10" });
    assert.equal(forecastDisplayStatus(item, today), "overdue");
    assert.equal(forecastDisplayStatus(item, "2026-03-09"), "due");
  });

  it("falls back to the due date when no overdue date is set", () => {
    assert.equal(
      forecastDisplayStatus(due({ due_date: "2026-03-10" }), today),
      "due",
    );
    assert.equal(
      forecastDisplayStatus(due({ due_date: "2026-03-09" }), today),
      "overdue",
    );
    assert.equal(forecastDisplayStatus(due({}), today), "due");
  });
});

describe("materializePolicyTemplate", () => {
  const vaccine = { system: "http://hl7.org/fhir/sid/cvx", code: "08" };

  it("resolves day offsets and omits empty fields", () => {
    const result = materializePolicyTemplate(
      {
        is_group: true,
        codes: [],
        children: [
          {
            is_group: false,
            codes: [{ ...vaccine, version: "2024" }],
            children: [],
            earliest_date: -1,
            due_date: 0,
            overdue_date: 31,
            series: "  ",
            dose_number: "1",
          },
        ],
      },
      new Date(2026, 0, 31),
    );

    assert.equal(result.codes, undefined);
    assert.equal(result.due_date, undefined);
    const [child] = result.children;
    assert.deepEqual(child.codes, [{ ...vaccine, version: "2024" }]);
    assert.equal(child.earliest_date, "2026-01-30");
    assert.equal(child.due_date, "2026-01-31");
    assert.equal(child.overdue_date, "2026-03-03");
    assert.equal(child.series, undefined);
    assert.equal(child.dose_number, "1");
  });

  it("lists only recommendations, keyed by template position", () => {
    const tree = materializePolicyTemplate(
      {
        is_group: true,
        codes: [],
        children: [
          { is_group: false, codes: [vaccine], children: [] },
          {
            is_group: true,
            codes: [],
            children: [{ is_group: false, codes: [vaccine], children: [] }],
          },
        ],
      },
      new Date(2026, 0, 1),
    );
    assert.deepEqual(
      flattenRecommendations(tree).map(({ path }) => path),
      ["0.0", "0.1.0"],
    );
  });
});
