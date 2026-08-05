import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deepEqualJson } from "@/components/QuestionnaireV2/structured/core/deepEqual";
import { applyEditToLog } from "@/components/QuestionnaireV2/structured/core/editLog";
import { projectRows } from "@/components/QuestionnaireV2/structured/core/projectRows";
import { mergePatch } from "@/components/QuestionnaireV2/structured/core/rowMutations";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import type { StructuredBatchEntry } from "@/components/QuestionnaireV2/structured/types";
import {
  ENCOUNTER_CLASS,
  EncounterStatus,
  type EncounterClass,
  type EncounterRead,
} from "@/types/emr/encounter/encounter";
import type { StructuredEdit } from "@/types/questionnaire/structured";

import type { EncounterRow } from "./model";
import {
  blocksSaveForMissingDischargeDisposition,
  isHospitalizedClass,
  makeNormalizePatch,
  projectValues,
  requiresDischargeDisposition,
  rowSchema,
  toBaselineRows,
  toEncounterRow,
  toRequests,
} from "./model";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ENCOUNTER_ID = "enc-1";
const CTX = {
  encounterId: ENCOUNTER_ID,
  facilityId: "fac-1",
  questionId: "q-1",
} as const;

/** The fixed clock every period assertion below is written against, so
 *  `now()` is a value the test can name rather than a moving target. */
const NOW = "2026-08-04T10:00:00.000Z";
const normalize = makeNormalizePatch({
  dischargeDisposition: "home",
  now: () => NOW,
});

const ALL_STATUSES = Object.values(EncounterStatus);
const TERMINAL = [
  EncounterStatus.DISCHARGED,
  EncounterStatus.COMPLETED,
  EncounterStatus.CANCELLED,
  EncounterStatus.DISCONTINUED,
  EncounterStatus.ENTERED_IN_ERROR,
];
const NON_TERMINAL = ALL_STATUSES.filter((s) => !TERMINAL.includes(s));
const AMBULATORY: EncounterClass[] = ["amb", "vr", "hh"];
const HOSPITALIZED: EncounterClass[] = ["imp", "obsenc", "emer"];

function fixtureRow(overrides: Partial<EncounterRow> = {}): EncounterRow {
  return {
    status: EncounterStatus.IN_PROGRESS,
    encounter_class: "imp",
    period: { start: "2026-08-01T00:00:00.000Z" },
    hospitalization: {
      re_admission: false,
      admit_source: "other",
      diet_preference: "none",
    },
    priority: "routine",
    external_identifier: "IP-1",
    discharge_summary_advice: null,
    ...overrides,
  };
}

/** A minimal, cast-through-`unknown` server read — the same shortcut
 *  `chargeItem/model.test.ts` and `changes.test.ts` use. The junk keys are
 *  load-bearing: `toEncounterRow` must DROP every one of them. */
function fixtureRead(overrides: Partial<EncounterRow> = {}): EncounterRead {
  return {
    id: ENCOUNTER_ID,
    ...fixtureRow(overrides),
    patient: { id: "pat-1" },
    facility: { id: "fac-1" },
    status_history: { history: [] },
    encounter_class_history: { history: [] },
    created_date: "2026-08-01T00:00:00.000Z",
    modified_date: "2026-08-02T00:00:00.000Z",
    tags: [],
    current_location: null,
    location_history: [],
    care_team: [],
    organizations: [],
    appointment: null,
    created_by: { id: "usr-1" },
    updated_by: { id: "usr-1" },
  } as unknown as EncounterRead;
}

const EDITABLE_FIELDS = [
  "status",
  "encounter_class",
  "period",
  "hospitalization",
  "priority",
  "external_identifier",
  "discharge_summary_advice",
];

/** The exact PUT body `toRequests` must send — the SAME allowlist
 *  `definitions/encounter.tsx:52-60` sends today, restated here so a
 *  widening of the body fails a test rather than sliding through review. */
function putBody(row: EncounterRow) {
  return {
    status: row.status,
    encounter_class: row.encounter_class,
    period: row.period,
    hospitalization: row.hospitalization,
    priority: row.priority,
    external_identifier: row.external_identifier,
    discharge_summary_advice: row.discharge_summary_advice,
  };
}

const update = (
  patch: EncounterRow,
  rowId: string = ENCOUNTER_ID,
): StructuredEdit<EncounterRow> => ({ rowId, op: "update", patch });
const add = (
  patch: EncounterRow,
  rowId: string = ENCOUNTER_ID,
): StructuredEdit<EncounterRow> => ({ rowId, op: "add", patch });

// ---------------------------------------------------------------------------
// Converter
// ---------------------------------------------------------------------------

describe("encounter model — toEncounterRow / toBaselineRows", () => {
  it("keeps exactly the seven editable fields and drops the rest of EncounterRead", () => {
    const row = toEncounterRow(fixtureRead());
    assert.deepEqual(Object.keys(row).sort(), [...EDITABLE_FIELDS].sort());
    assert.deepEqual(row, fixtureRow());
  });

  it("preserves the nullable fields verbatim — null is not coerced to ''", () => {
    const row = toEncounterRow(
      fixtureRead({
        external_identifier: null,
        discharge_summary_advice: null,
        hospitalization: null,
      }),
    );
    assert.equal(row.external_identifier, null);
    assert.equal(row.discharge_summary_advice, null);
    assert.equal(row.hospitalization, null);
  });

  it("keys the single baseline row by the ENCOUNTER id, not SINGLETON_ROW_ID", () => {
    // `EncounterEdit = EncounterBase` has no `id` of its own
    // (`types/emr/encounter/encounter.ts:211-219,259`), so the singleton's
    // identity comes from the route, not the payload — and it must be the
    // SAME id `toRequests` builds the PUT url from.
    assert.deepEqual(toBaselineRows(fixtureRead(), ENCOUNTER_ID), [
      { rowId: ENCOUNTER_ID, row: fixtureRow() },
    ]);
  });
});

// ---------------------------------------------------------------------------
// normalizePatch — status ⇒ period.end
// ---------------------------------------------------------------------------

describe("encounter normalizePatch — status ⇒ period.end", () => {
  for (const status of TERMINAL) {
    it(`${status} with no end sets period.end to now()`, () => {
      const row = fixtureRow({ period: { start: "2026-08-01T00:00:00.000Z" } });
      const out = normalize(row, { status });
      assert.deepEqual(out.period, {
        start: "2026-08-01T00:00:00.000Z",
        end: NOW,
      });
      assert.equal(out.status, status);
    });
  }

  for (const status of TERMINAL) {
    it(`${status} with an existing end LEAVES it alone`, () => {
      const row = fixtureRow({
        period: {
          start: "2026-08-01T00:00:00.000Z",
          end: "2026-08-03T00:00:00.000Z",
        },
      });
      const out = normalize(row, { status });
      assert.equal(out.period, undefined, "no period write at all");
    });
  }

  for (const status of NON_TERMINAL) {
    it(`${status} with an end clears it`, () => {
      const row = fixtureRow({
        period: {
          start: "2026-08-01T00:00:00.000Z",
          end: "2026-08-03T00:00:00.000Z",
        },
      });
      const out = normalize(row, { status });
      assert.deepEqual(out.period, {
        start: "2026-08-01T00:00:00.000Z",
        end: undefined,
      });
    });
  }

  for (const status of NON_TERMINAL) {
    it(`${status} with no end writes no period at all`, () => {
      const row = fixtureRow({ period: { start: "2026-08-01T00:00:00.000Z" } });
      const out = normalize(row, { status });
      assert.equal(out.period, undefined);
    });
  }

  it("an unrelated patch on a live encounter touches neither period nor hospitalization", () => {
    const row = fixtureRow(); // in_progress, imp, no period.end
    const out = normalize(row, { external_identifier: "IP-2" });
    assert.deepEqual(out, { external_identifier: "IP-2" });
  });

  it("the patch's OWN period.end survives on a terminal status — the date picker still works", () => {
    const row = fixtureRow({
      status: EncounterStatus.DISCHARGED,
      period: {
        start: "2026-08-01T00:00:00.000Z",
        end: "2026-08-03T00:00:00.000Z",
      },
    });
    const out = normalize(row, {
      period: {
        start: "2026-08-01T00:00:00.000Z",
        end: "2026-08-05T12:00:00.000Z",
      },
    });
    assert.deepEqual(out.period, {
      start: "2026-08-01T00:00:00.000Z",
      end: "2026-08-05T12:00:00.000Z",
    });
  });

  it("the cleared end deepEqualJson-collapses back to a baseline that never had one", () => {
    // `{start, end: undefined}` must read as EQUAL to `{start}` so a live
    // encounter's unrelated edit cannot manufacture a diff — that is what
    // `deepEqualJson`'s undefined-as-absent rule buys, and what keeps
    // `applyEditToLog` annihilating a no-op update.
    assert.equal(
      deepEqualJson(
        { start: "2026-08-01T00:00:00.000Z", end: undefined },
        { start: "2026-08-01T00:00:00.000Z" },
      ),
      true,
    );
  });

  it("uses a real ISO instant when no clock is injected", () => {
    const out = makeNormalizePatch({ dischargeDisposition: "home" })(
      fixtureRow(),
      { status: EncounterStatus.DISCHARGED },
    );
    assert.match(
      out.period?.end ?? "",
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });
});

// ---------------------------------------------------------------------------
// normalizePatch — class/status ⇒ hospitalization
// ---------------------------------------------------------------------------

describe("encounter normalizePatch — class/status ⇒ hospitalization", () => {
  for (const encounter_class of AMBULATORY) {
    it(`class ${encounter_class} clears a populated hospitalization to {}`, () => {
      const out = normalize(fixtureRow(), { encounter_class });
      assert.deepEqual(out.hospitalization, {});
    });
  }

  it("an ambulatory class with an already-absent hospitalization writes nothing", () => {
    // Rewriting a server `null` to `{}` would be a change the clinician
    // never made, riding along in the PUT body of an unrelated edit.
    const nulled = normalize(fixtureRow({ hospitalization: null }), {
      encounter_class: "amb",
    });
    assert.equal("hospitalization" in nulled, false);

    const empty = normalize(fixtureRow({ hospitalization: {} }), {
      encounter_class: "amb",
    });
    assert.equal("hospitalization" in empty, false);

    const missing = normalize(fixtureRow({ hospitalization: undefined }), {
      encounter_class: "amb",
    });
    assert.equal("hospitalization" in missing, false);
  });

  for (const encounter_class of HOSPITALIZED) {
    it(`class ${encounter_class} + discharged with no disposition fills the default`, () => {
      const row = fixtureRow({ encounter_class, hospitalization: {} });
      const out = normalize(row, { status: EncounterStatus.DISCHARGED });
      assert.deepEqual(out.hospitalization, { discharge_disposition: "home" });
    });
  }

  it("a hospitalized + discharged row keeps a disposition the clinician already set", () => {
    const row = fixtureRow({
      hospitalization: { re_admission: true, discharge_disposition: "rehab" },
    });
    const out = normalize(row, { status: EncounterStatus.DISCHARGED });
    assert.deepEqual(out.hospitalization, {
      re_admission: true,
      discharge_disposition: "rehab",
    });
  });

  it("fills the disposition through a null hospitalization", () => {
    const row = fixtureRow({ hospitalization: null });
    const out = normalize(row, { status: EncounterStatus.DISCHARGED });
    assert.deepEqual(out.hospitalization, { discharge_disposition: "home" });
  });

  it("REGRESSION: class → imp AND status → discharged in ONE patch fills the disposition", () => {
    // The legacy rule read `encounter.encounter_class` — the PREVIOUS class
    // (`EncounterQuestion.tsx:205`) — so a combined edit slipped through
    // and left a discharged inpatient with no disposition at all.
    const row = fixtureRow({
      encounter_class: "amb",
      status: EncounterStatus.IN_PROGRESS,
      hospitalization: {},
    });
    const out = normalize(row, {
      encounter_class: "imp",
      status: EncounterStatus.DISCHARGED,
    });
    assert.deepEqual(out.hospitalization, { discharge_disposition: "home" });
  });

  it("REGRESSION: an imp encounter that is NOT discharged keeps a clinician-set disposition", () => {
    // The legacy `else if` branch (`EncounterQuestion.tsx:214-220`) re-pinned
    // the field to the SERVER's value on every unrelated edit, so the
    // clinician's pick snapped back mid-form. Deliberate behaviour change
    // under D5.
    const row = fixtureRow({
      hospitalization: { discharge_disposition: "rehab", re_admission: true },
    });
    const out = normalize(row, { external_identifier: "IP-9" });
    assert.equal("hospitalization" in out, false);
    assert.deepEqual(out, { external_identifier: "IP-9" });
  });

  it("a hospitalized class that is not discharged writes no hospitalization at all", () => {
    for (const encounter_class of HOSPITALIZED) {
      for (const status of ALL_STATUSES.filter(
        (s) => s !== EncounterStatus.DISCHARGED,
      )) {
        const out = normalize(fixtureRow({ encounter_class, status }), {
          priority: "urgent",
        });
        assert.equal(
          "hospitalization" in out,
          false,
          `${encounter_class}/${status} must not touch hospitalization`,
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// normalizePatch — pure, total, cannot loop
// ---------------------------------------------------------------------------

describe("encounter normalizePatch — pure, total, cannot loop", () => {
  it("mutates neither the row nor the patch", () => {
    const row = fixtureRow();
    const patch = { status: EncounterStatus.DISCHARGED };
    const rowBefore = structuredClone(row);
    const patchBefore = structuredClone(patch);
    normalize(row, patch);
    assert.deepEqual(row, rowBefore);
    assert.deepEqual(patch, patchBefore);
  });

  it("is total AND reaches a fixpoint in one pass for every status × class", () => {
    // The whole point of the port: the legacy derivation lived in effects
    // that wrote the field they watched. A second pass over the merged row
    // must produce NOTHING new — that is what "cannot loop" means at the
    // value level, and it is checked for all 9 × 6 combinations.
    for (const status of ALL_STATUSES) {
      for (const encounter_class of ENCOUNTER_CLASS) {
        for (const hospitalization of [
          null,
          {},
          { re_admission: true, discharge_disposition: "rehab" as const },
        ]) {
          for (const end of [undefined, "2026-08-03T00:00:00.000Z"]) {
            const row = fixtureRow({
              hospitalization,
              period: { start: "2026-08-01T00:00:00.000Z", end },
            });
            const label = `${status}/${encounter_class}/${JSON.stringify(hospitalization)}/${end}`;
            const first = mergePatch(
              row,
              { status, encounter_class },
              normalize,
            );
            const second = mergePatch(first, {}, normalize);
            assert.equal(
              deepEqualJson(first, second),
              true,
              `not a fixpoint: ${label}`,
            );
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// requiresDischargeDisposition / isHospitalizedClass
// ---------------------------------------------------------------------------

describe("encounter requiresDischargeDisposition", () => {
  for (const encounter_class of HOSPITALIZED) {
    it(`discharged + ${encounter_class} + no disposition => true`, () => {
      assert.equal(
        requiresDischargeDisposition(
          fixtureRow({
            encounter_class,
            status: EncounterStatus.DISCHARGED,
            hospitalization: {},
          }),
        ),
        true,
      );
    });
  }

  it("discharged + a hospitalized class with NO hospitalization object => true", () => {
    assert.equal(
      requiresDischargeDisposition(
        fixtureRow({
          status: EncounterStatus.DISCHARGED,
          hospitalization: null,
        }),
      ),
      true,
    );
  });

  it("discharged + amb => false", () => {
    assert.equal(
      requiresDischargeDisposition(
        fixtureRow({
          encounter_class: "amb",
          status: EncounterStatus.DISCHARGED,
          hospitalization: {},
        }),
      ),
      false,
    );
  });

  it("in_progress + imp => false", () => {
    assert.equal(
      requiresDischargeDisposition(fixtureRow({ hospitalization: {} })),
      false,
    );
  });

  it("discharged + imp + a disposition already set => false", () => {
    assert.equal(
      requiresDischargeDisposition(
        fixtureRow({
          status: EncounterStatus.DISCHARGED,
          hospitalization: { discharge_disposition: "home" },
        }),
      ),
      false,
    );
  });

  it("an undefined row => false", () => {
    assert.equal(requiresDischargeDisposition(undefined), false);
  });

  it("is unreachable for any row normalizePatch has just produced", () => {
    // normalizePatch fills the default the moment a row becomes
    // hospitalized+discharged, so the validator can only ever fire on a
    // row nobody has edited (an untouched server row, or a restored
    // draft) — see the model's doc comment and Task 8's report.
    for (const encounter_class of ENCOUNTER_CLASS) {
      const merged = mergePatch(
        fixtureRow({ hospitalization: {} }),
        { encounter_class, status: EncounterStatus.DISCHARGED },
        normalize,
      );
      assert.equal(requiresDischargeDisposition(merged), false);
    }
  });
});

describe("encounter blocksSaveForMissingDischargeDisposition — Task 8's product decision", () => {
  const brokenRow = fixtureRow({
    status: EncounterStatus.DISCHARGED,
    hospitalization: {},
  });

  it("an UNTOUCHED broken row (empty edit log) does NOT block Save", () => {
    // The decision itself: P1-14 already guarantees zero requests for an
    // untouched section; this extends the same guarantee to validation.
    assert.equal(
      blocksSaveForMissingDischargeDisposition(brokenRow, []),
      false,
    );
  });

  it("the SAME broken row, once touched (any edit at all), DOES block Save", () => {
    assert.equal(
      blocksSaveForMissingDischargeDisposition(brokenRow, [update(brokenRow)]),
      true,
    );
  });

  it("touched but not actually broken (a disposition is set) => false", () => {
    const fine = fixtureRow({
      status: EncounterStatus.DISCHARGED,
      hospitalization: { discharge_disposition: "home" },
    });
    assert.equal(
      blocksSaveForMissingDischargeDisposition(fine, [update(fine)]),
      false,
    );
  });

  it("touched but the row is undefined (no baseline, no edits resolved to a row) => false", () => {
    assert.equal(
      blocksSaveForMissingDischargeDisposition(undefined, [update(brokenRow)]),
      false,
    );
  });

  it('an edit touching a DIFFERENT rowId still counts as "touched" here — this predicate does not filter by identity, unlike toRequests', () => {
    // Documented rather than hidden: this function only asks "is the log
    // non-empty", the same coarse question `needsSlot` asks of
    // `appointment`. A corrupted foreign-rowId edit is an existing,
    // separately-documented anomaly (toRequests' own identity filter); it
    // is not this predicate's job to re-solve it.
    assert.equal(
      blocksSaveForMissingDischargeDisposition(brokenRow, [
        update(brokenRow, "enc-OTHER"),
      ]),
      true,
    );
  });
});

describe("encounter — the undefined-default deployment (this repo's own .env.local)", () => {
  // Every other `makeNormalizePatch` call in this file (the module-level
  // `normalize` above, and the truth-table describe blocks) is built with
  // a CONCRETE `dischargeDisposition: "home"`. That is the config only
  // when `REACT_DEFAULT_DISCHARGE_DISPOSITION` is actually set — this
  // repo's `.env.local` does not set it, so `careConfig.
  // defaultDischargeDisposition` is `undefined` there, and the type was
  // widened (model.ts) to `| undefined` to match. That branch was
  // previously untested; these two cases close the gap (found by review).
  const normalizeNoDefault = makeNormalizePatch({
    dischargeDisposition: undefined,
    now: () => NOW,
  });

  it("makeNormalizePatch({ dischargeDisposition: undefined }) leaves a hospitalized DISCHARGED row's disposition UNSET, not defaulted", () => {
    const row = fixtureRow({
      encounter_class: "imp",
      status: EncounterStatus.IN_PROGRESS,
      hospitalization: {},
    });
    const patch = normalizeNoDefault(row, {
      status: EncounterStatus.DISCHARGED,
    });
    assert.equal(
      (patch.hospitalization as { discharge_disposition?: unknown })
        .discharge_disposition,
      undefined,
    );
  });

  it("the discharge SEED itself — mergePatch(row, { status: DISCHARGED }, normalizeNoDefault) — reaches requiresDischargeDisposition/blocksSaveForMissingDischargeDisposition as TRUE, not merely a hand-built broken row", () => {
    // This is the real path: EncounterEditorBody's `?toDischarge` seed is
    // exactly `mergePatch(toEncounterRow(encounter), { status: DISCHARGED
    // }, normalizePatch)`. On a deployment with no configured default,
    // that seed produces a row this SESSION'S EDITOR built — not an
    // untouched server row — that still fails the disposition predicate,
    // and the seed is itself a non-empty edit, so the "untouched section"
    // exemption does not apply: Save blocks on the primary discharge
    // entry point, exact legacy parity.
    const baselineRow = fixtureRow({
      encounter_class: "imp",
      status: EncounterStatus.IN_PROGRESS,
      hospitalization: {},
    });
    const seedRow = mergePatch(
      baselineRow,
      { status: EncounterStatus.DISCHARGED },
      normalizeNoDefault,
    );
    const seedEdit: StructuredEdit<EncounterRow> = update(seedRow);
    assert.equal(
      requiresDischargeDisposition(seedRow),
      true,
      "the seeded row itself is missing a disposition",
    );
    assert.equal(
      blocksSaveForMissingDischargeDisposition(seedRow, [seedEdit]),
      true,
      "and the seed is a real, non-empty edit, so Save blocks",
    );
  });
});

describe("encounter isHospitalizedClass", () => {
  it("splits the six classes the way the hospitalization panel does", () => {
    for (const encounter_class of HOSPITALIZED) {
      assert.equal(isHospitalizedClass(encounter_class), true);
    }
    for (const encounter_class of AMBULATORY) {
      assert.equal(isHospitalizedClass(encounter_class), false);
    }
  });
});

// ---------------------------------------------------------------------------
// projectValues
// ---------------------------------------------------------------------------

describe("encounter projectValues", () => {
  it("projects an empty row set to NO values", () => {
    assert.deepEqual(projectValues([]), []);
  });

  it("projects the single row as one encounter entry", () => {
    const row = fixtureRow();
    assert.deepEqual(projectValues([row]), [
      { type: "encounter", value: [row] },
    ]);
  });

  it("SINGLETON COLLAPSE: a corrupted two-row projection still yields ONE entry — the first", () => {
    // `SingleRowController.row` is `rows[0]`; the projection and the differ
    // must name the same row, or the clinician sees one encounter and
    // submits another.
    const first = fixtureRow({ external_identifier: "IP-1" });
    const second = fixtureRow({ external_identifier: "IP-2" });
    assert.deepEqual(projectValues([first, second]), [
      { type: "encounter", value: [first] },
    ]);
  });
});

// ---------------------------------------------------------------------------
// toRequests
// ---------------------------------------------------------------------------

describe("encounter toRequests", () => {
  it("P1-14: an empty edit log produces ZERO requests", async () => {
    // TODAY `definitions/encounter.tsx:49-62` maps over the PROJECTION
    // unconditionally, so submitting any form carrying an encounter
    // question PUT the whole encounter back — including a section the
    // clinician never opened, over whatever another user changed
    // meanwhile.
    assert.deepEqual(await toRequests([], CTX), []);
  });

  it("compiles ONE PUT carrying exactly the seven fields", async () => {
    const row = fixtureRow({ external_identifier: "IP-2" });
    const requests = await toRequests([update(row)], CTX);
    assert.deepEqual(requests, [
      {
        url: "/api/v1/encounter/enc-1/",
        method: "PUT",
        body: putBody(row),
        reference_id: "structured:encounter:q-1",
      },
    ]);
    assert.deepEqual(
      Object.keys(requests[0].body as object).sort(),
      [...EDITABLE_FIELDS].sort(),
    );
  });

  it("compiles the same PUT from an `add` recorded before the baseline resolved", async () => {
    const row = fixtureRow({ external_identifier: "IP-3" });
    const requests = await toRequests([add(row)], CTX);
    assert.equal(requests.length, 1);
    assert.deepEqual(requests[0].body, putBody(row));
  });

  it("sends nothing without an encounterId", async () => {
    assert.deepEqual(
      await toRequests([update(fixtureRow())], {
        facilityId: "fac-1",
        questionId: "q-1",
      }),
      [],
    );
  });

  it("THROWS without a facilityId, matching the legacy contract", async () => {
    await assert.rejects(
      () =>
        toRequests([update(fixtureRow())], {
          encounterId: ENCOUNTER_ID,
          questionId: "q-1",
        }),
      /Cannot update an encounter without a facility/,
    );
  });

  it("does NOT throw on a missing facilityId when nothing was edited", async () => {
    // P1-14 outranks the mount-precondition guard: an untouched section
    // must be silent, not an exception that fails the whole submit.
    assert.deepEqual(
      await toRequests([], { encounterId: ENCOUNTER_ID, questionId: "q-1" }),
      [],
    );
  });

  it("a `remove` against the singleton produces no request", async () => {
    assert.deepEqual(
      await toRequests(
        [{ rowId: ENCOUNTER_ID, op: "remove", patch: fixtureRow() }],
        CTX,
      ),
      [],
    );
  });

  it("a duplicate-rowId log collapses to ONE PUT carrying the LAST content", async () => {
    const stale = fixtureRow({ external_identifier: "STALE" });
    const fresh = fixtureRow({ external_identifier: "FRESH" });
    const requests = await toRequests([update(stale), update(fresh)], CTX);
    assert.equal(requests.length, 1);
    assert.deepEqual(requests[0].body, putBody(fresh));
  });

  it("ignores a foreign rowId's content — a PUT to this encounter carries THIS encounter's row", async () => {
    const mine = fixtureRow({ external_identifier: "MINE" });
    const foreign = fixtureRow({ external_identifier: "FOREIGN" });
    const requests = await toRequests(
      [add(foreign, "bogus"), update(mine)],
      CTX,
    );
    assert.equal(requests.length, 1);
    assert.deepEqual(requests[0].body, putBody(mine));
  });

  it("a log carrying ONLY a foreign rowId produces ZERO requests", async () => {
    assert.deepEqual(
      await toRequests(
        [add(fixtureRow({ external_identifier: "X" }), "bogus")],
        CTX,
      ),
      [],
    );
  });
});

// ---------------------------------------------------------------------------
// PROJECTION AND SUBMIT MUST AGREE
// ---------------------------------------------------------------------------

/** Runs the projection path and the submit path over the SAME (baseline,
 *  log) inputs, exactly as the reviewers' instruction demands: verify by
 *  RUNNING both modules, not by reading them. */
async function agreement(
  baseline: readonly BaselineRow<EncounterRow>[] | undefined,
  edits: readonly StructuredEdit<EncounterRow>[],
) {
  const rows = projectRows(baseline, edits).map((entry) => entry.row);
  const values = projectValues(rows);
  const shown = (values[0]?.value as EncounterRow[] | undefined)?.[0];
  const requests: StructuredBatchEntry[] = await toRequests(edits, CTX);
  return { shown, requests };
}

describe("encounter — PROJECTION AND SUBMIT MUST AGREE", () => {
  const BASELINE: BaselineRow<EncounterRow>[] = [
    { rowId: ENCOUNTER_ID, row: fixtureRow() },
  ];
  const edited = fixtureRow({ external_identifier: "EDITED" });
  const foreign = fixtureRow({ external_identifier: "FOREIGN" });

  const shapes: Array<{
    name: string;
    edits: StructuredEdit<EncounterRow>[];
    submits: boolean;
  }> = [
    { name: "an untouched section", edits: [], submits: false },
    { name: "one ordinary update", edits: [update(edited)], submits: true },
    {
      name: "an update alongside a corrupted foreign add",
      edits: [update(edited), add(foreign, "bogus")],
      submits: true,
    },
    {
      name: "a corrupted foreign add BEFORE the real update",
      edits: [add(foreign, "bogus"), update(edited)],
      submits: true,
    },
    {
      name: "ONLY a corrupted foreign add",
      edits: [add(foreign, "bogus")],
      submits: false,
    },
    {
      name: "ONLY an orphaned update for a vanished row",
      edits: [update(foreign, "ghost")],
      submits: false,
    },
    {
      name: "a duplicate-rowId log",
      edits: [
        update(fixtureRow({ external_identifier: "STALE" })),
        update(edited),
      ],
      submits: true,
    },
    {
      name: "a doubly-corrupted log — a foreign rowId BETWEEN two entries for this one",
      edits: [
        update(fixtureRow({ external_identifier: "STALE" })),
        add(foreign, "bogus"),
        update(edited),
      ],
      submits: true,
    },
    {
      name: "a remove against the singleton",
      edits: [{ rowId: ENCOUNTER_ID, op: "remove", patch: edited }],
      submits: false,
    },
  ];

  for (const shape of shapes) {
    it(`agrees for ${shape.name}`, async () => {
      const { shown, requests } = await agreement(BASELINE, shape.edits);
      // Lesson 5: a singleton differ never emits two writes to one URL.
      assert.ok(requests.length <= 1, "at most one request");
      if (shape.submits) {
        assert.equal(requests.length, 1);
        assert.deepEqual(
          requests[0].body,
          putBody(shown as EncounterRow),
          "the PUT body must be the row the clinician is looking at",
        );
      } else {
        assert.deepEqual(requests, []);
        // Nothing submitted ⇒ nothing may DIFFER from the server row
        // either: what is shown is the untouched baseline, or nothing.
        assert.ok(
          shown === undefined || deepEqualJson(shown, fixtureRow()),
          "a silent submit may only ever show the untouched server row",
        );
      }
    });
  }

  it("KNOWN GAP: the agreement holds only while the baseline rowId IS the context's encounterId", async () => {
    // Structurally prevented rather than defended against: Task 8 builds
    // both from the same `props.encounterId` — `toBaselineRows(encounter,
    // encounterId)` and `StructuredRequestContext.encounterId`. If they
    // ever diverge, the differ (which keys off the URL identity) goes
    // silent while the projection still shows the edit. Pinned here so the
    // precondition is executed, not merely asserted in a comment.
    const { shown, requests } = await agreement(
      [{ rowId: "enc-OTHER", row: fixtureRow() }],
      [update(edited, "enc-OTHER")],
    );
    assert.deepEqual(requests, [], "the differ declines a foreign identity");
    assert.deepEqual(shown, edited, "but the projection still shows the edit");
  });
});

// ---------------------------------------------------------------------------
// The reducer path — an untouched encounter sends nothing
// ---------------------------------------------------------------------------

describe("encounter — the untouched section, through the real reducer", () => {
  const baselineRow = fixtureRow();
  const applyOpts = {
    baseline: new Map([[ENCOUNTER_ID, baselineRow]]),
  };

  it("a patch that changes nothing leaves the log EMPTY and sends no PUT", async () => {
    const merged = mergePatch(
      baselineRow,
      { external_identifier: baselineRow.external_identifier },
      normalize,
    );
    const log = applyEditToLog(
      [],
      { rowId: ENCOUNTER_ID, op: "update", patch: merged },
      applyOpts,
    );
    assert.deepEqual(log, [], "no edit recorded");
    assert.deepEqual(await toRequests(log, CTX), []);
  });

  it("a real edit records ONE update and compiles ONE PUT", async () => {
    const merged = mergePatch(
      baselineRow,
      { external_identifier: "IP-CHANGED" },
      normalize,
    );
    const log = applyEditToLog(
      [],
      { rowId: ENCOUNTER_ID, op: "update", patch: merged },
      applyOpts,
    );
    assert.equal(log.length, 1);
    const requests = await toRequests(log, CTX);
    assert.equal(requests.length, 1);
    assert.deepEqual(requests[0].body, putBody(merged));
  });

  it("marking a live encounter for discharge records the derived period AND disposition in one edit", async () => {
    const merged = mergePatch(
      baselineRow,
      { status: EncounterStatus.DISCHARGED },
      normalize,
    );
    const log = applyEditToLog(
      [],
      { rowId: ENCOUNTER_ID, op: "update", patch: merged },
      applyOpts,
    );
    assert.equal(log.length, 1);
    assert.deepEqual(merged.period, {
      start: "2026-08-01T00:00:00.000Z",
      end: NOW,
    });
    assert.equal(merged.hospitalization?.discharge_disposition, "home");
    assert.deepEqual((await toRequests(log, CTX))[0].body, putBody(merged));
  });
});

describe("rowSchema — the assistant write guard (spec A2)", () => {
  it("accepts a real row", () => {
    assert.equal(rowSchema.safeParse(fixtureRow()).success, true);
  });

  it("accepts a null hospitalization (an ambulatory encounter's cleared record)", () => {
    assert.equal(
      rowSchema.safeParse(fixtureRow({ hospitalization: null })).success,
      true,
    );
  });

  it("accepts null external_identifier/discharge_summary_advice", () => {
    assert.equal(
      rowSchema.safeParse(
        fixtureRow({
          external_identifier: null,
          discharge_summary_advice: null,
        }),
      ).success,
      true,
    );
  });

  it("rejects an unknown top-level field", () => {
    assert.equal(
      rowSchema.safeParse({ ...fixtureRow(), extra_field: "hallucinated" })
        .success,
      false,
    );
  });

  it("rejects an invalid status enum value", () => {
    assert.equal(
      rowSchema.safeParse({ ...fixtureRow(), status: "not_a_real_status" })
        .success,
      false,
    );
  });

  it("rejects an invalid encounter_class enum value", () => {
    assert.equal(
      rowSchema.safeParse({ ...fixtureRow(), encounter_class: "made_up" })
        .success,
      false,
    );
  });

  it("rejects an unknown key inside hospitalization", () => {
    assert.equal(
      rowSchema.safeParse({
        ...fixtureRow(),
        hospitalization: { made_up: true },
      }).success,
      false,
    );
  });

  it("rejects a missing period", () => {
    const { period: _drop, ...withoutPeriod } = fixtureRow();
    assert.equal(rowSchema.safeParse(withoutPeriod).success, false);
  });

  it("rejects a number where external_identifier expects string | null", () => {
    assert.equal(
      rowSchema.safeParse({ ...fixtureRow(), external_identifier: 123 })
        .success,
      false,
    );
  });
});
