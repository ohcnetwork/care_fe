import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SymptomRequest } from "@/types/emr/symptom/symptom";
import type { StructuredEditRecord } from "@/types/questionnaire/structured";

import { deepEqualJson } from "./deepEqual";
// Realistic row fixtures — SymptomRequest/DiagnosisRequest are the actual
// shapes `useStructuredRows` will compare (baseline vs. patched-then-
// reverted), not toy objects.
import { makeDiagnosisRow, makeSymptomRow } from "./testFixtures";
import type { EditLog, RowEdit } from "./types";

describe("deepEqualJson — realistic row shapes", () => {
  it("treats a SymptomRequest baseline row as equal to itself reconstructed field-by-field in a different key order", () => {
    const baseline = makeSymptomRow();
    // Same content, deliberately re-typed in a different key order — a
    // shallow `{...baseline, ...patch}` merge does not guarantee key
    // order survives every intermediate step (e.g. a differ that rebuilds
    // the object explicitly, `definitions/symptom.tsx`-style).
    const reconstructed: SymptomRequest = {
      category: "problem_list_item",
      encounter: "encounter-1",
      note: "worse at night",
      recorded_date: "2026-01-01",
      onset: { onset_datetime: "2026-01-01" },
      severity: "moderate",
      code: { system: "system-condition-code", code: "R05", display: "Cough" },
      verification_status: "confirmed",
      clinical_status: "active",
      id: "symptom-1",
    };
    assert.equal(deepEqualJson(baseline, reconstructed), true);
  });

  it("is false once a clinician actually changes a nested field (severity mild, not reverted)", () => {
    const baseline = makeSymptomRow();
    const edited = makeSymptomRow({ severity: "mild" });
    assert.equal(deepEqualJson(baseline, edited), false);
  });

  it("is true again once the field is edited back to the baseline value — the collapse-to-pristine case", () => {
    const baseline = makeSymptomRow();
    // moderate -> mild -> moderate: the row this function must recognize
    // as "no net edit", which is what lets an update collapse out of the
    // log entirely.
    const editedToMild = makeSymptomRow({ severity: "mild" });
    const revertedToBaseline = { ...editedToMild, severity: "moderate" };
    assert.equal(deepEqualJson(baseline, revertedToBaseline), true);
  });

  it("treats a DiagnosisRequest's entirely absent `note` key as equal to the same key set explicitly to `undefined`", () => {
    const withAbsentNote = makeDiagnosisRow();
    delete (withAbsentNote as { note?: string }).note;
    const withUndefinedNote = makeDiagnosisRow({ note: undefined });
    assert.equal(deepEqualJson(withAbsentNote, withUndefinedNote), true);
  });

  it("is false when the only difference is a real value in a nested optional object (onset.note)", () => {
    const baseline = makeDiagnosisRow();
    const withOnsetNote = makeDiagnosisRow({
      onset: { onset_datetime: "2025-06-01", note: "gradual" },
    });
    assert.equal(deepEqualJson(baseline, withOnsetNote), false);
  });
});

describe("deepEqualJson — key order and structure", () => {
  it("is order-independent for object keys", () => {
    assert.equal(
      deepEqualJson({ a: 1, b: 2, c: 3 }, { c: 3, a: 1, b: 2 }),
      true,
    );
  });

  it("recurses into nested objects and arrays", () => {
    const a = { list: [{ x: 1 }, { x: 2 }], meta: { tags: ["a", "b"] } };
    const b = { meta: { tags: ["a", "b"] }, list: [{ x: 1 }, { x: 2 }] };
    assert.equal(deepEqualJson(a, b), true);
  });

  it("is false when a nested array element differs", () => {
    const a = { list: [{ x: 1 }, { x: 2 }] };
    const b = { list: [{ x: 1 }, { x: 3 }] };
    assert.equal(deepEqualJson(a, b), false);
  });
});

describe("deepEqualJson — undefined-valued key vs. absent key (JSON.stringify parity)", () => {
  it("treats a key set to `undefined` as absent", () => {
    assert.equal(deepEqualJson({ a: 1, b: undefined }, { a: 1 }), true);
    assert.equal(deepEqualJson({ a: undefined }, {}), true);
    assert.equal(deepEqualJson({}, { a: undefined }), true);
  });

  it("does not let an undefined-valued key stand in for a real null value", () => {
    // JSON.stringify({a:null}) -> '{"a":null}'; JSON.stringify({a:undefined}) -> '{}'.
    // These must NOT compare equal even though both "look empty-ish".
    assert.equal(deepEqualJson({ a: null }, {}), false);
    assert.equal(deepEqualJson({ a: null }, { a: undefined }), false);
  });
});

describe("deepEqualJson — array order significance", () => {
  it("is false when array element order differs", () => {
    assert.equal(deepEqualJson([1, 2, 3], [3, 2, 1]), false);
  });

  it("is true for identical order", () => {
    assert.equal(deepEqualJson([1, 2, 3], [1, 2, 3]), true);
  });

  it("is false when lengths differ", () => {
    assert.equal(deepEqualJson([1, 2], [1, 2, 3]), false);
  });

  it("does not let a sparse-array hole compare as equal to a real value (Array.prototype.every silently skips holes; a plain index loop does not)", () => {
    // eslint-disable-next-line no-sparse-arrays -- deliberately constructing a hole
    const withHole = [, 1];
    assert.equal(deepEqualJson(withHole, [2, 1]), false);
    assert.equal(deepEqualJson(withHole, [undefined, 1]), true);
  });
});

describe("deepEqualJson — null vs. undefined", () => {
  it("treats bare `null` and bare `undefined` as different values", () => {
    assert.equal(deepEqualJson(null, undefined), false);
  });

  it("treats `null` as equal only to `null`", () => {
    assert.equal(deepEqualJson(null, null), true);
  });
});

describe("deepEqualJson — decided edge cases (documented, not left undefined)", () => {
  it("treats NaN as equal to NaN, unlike ===", () => {
    assert.equal(deepEqualJson(NaN, NaN), true);
    assert.equal(deepEqualJson({ n: NaN }, { n: NaN }), true);
  });

  it("does not treat NaN as equal to null, despite both serializing to the JSON literal `null`", () => {
    assert.equal(deepEqualJson(NaN, null), false);
  });

  it("treats -0 and 0 as equal, matching JSON.stringify (both print `0`)", () => {
    assert.equal(deepEqualJson(-0, 0), true);
    assert.equal(deepEqualJson({ n: -0 }, { n: 0 }), true);
  });

  it("does NOT normalize undefined array elements to null (unlike JSON.stringify's array serialization)", () => {
    assert.equal(deepEqualJson([undefined], [null]), false);
    assert.equal(deepEqualJson([undefined], [undefined]), true);
  });

  it("falls back to reference equality for Date — two instances with the same timestamp are NOT deepEqualJson", () => {
    const a = new Date("2026-01-01T00:00:00.000Z");
    const b = new Date("2026-01-01T00:00:00.000Z");
    assert.equal(deepEqualJson(a, b), false);
    assert.equal(deepEqualJson(a, a), true);
  });

  it("falls back to reference equality for Map — two maps with identical entries are NOT deepEqualJson", () => {
    const a = new Map([["k", "v"]]);
    const b = new Map([["k", "v"]]);
    assert.equal(deepEqualJson(a, b), false);
    assert.equal(deepEqualJson(a, a), true);
  });

  it("falls back to reference equality for Set — two sets with identical members are NOT deepEqualJson", () => {
    const a = new Set([1, 2, 3]);
    const b = new Set([1, 2, 3]);
    assert.equal(deepEqualJson(a, b), false);
    assert.equal(deepEqualJson(a, a), true);
  });

  it("falls back to reference equality for class instances — identical fields, different instances, are NOT deepEqualJson", () => {
    class Point {
      constructor(
        public x: number,
        public y: number,
      ) {}
    }
    const a = new Point(1, 2);
    const b = new Point(1, 2);
    assert.equal(deepEqualJson(a, b), false);
    assert.equal(deepEqualJson(a, a), true);
    // A plain object with the same fields is not the same "shape" either —
    // one is a class instance, the other a plain object, so they are not
    // deepEqualJson even though a naive field comparison would pass.
    assert.equal(deepEqualJson(a, { x: 1, y: 2 }), false);
  });

  it("falls back to reference equality for File — the one non-JSON value that reaches this function, via a `files` row's `add` patch", () => {
    const a = new File(["hello"], "note.txt", { type: "text/plain" });
    const b = new File(["hello"], "note.txt", { type: "text/plain" });
    assert.equal(deepEqualJson(a, b), false);
    assert.equal(deepEqualJson(a, a), true);
  });

  it("treats an object created with Object.create(null) as a plain object (prototype-less, still structural)", () => {
    const a = Object.create(null) as Record<string, unknown>;
    a.x = 1;
    const b = Object.create(null) as Record<string, unknown>;
    b.x = 1;
    assert.equal(deepEqualJson(a, b), true);
  });
});

describe("RowEdit / StructuredEditRecord — erasure parity with the canonical edit vocabulary (compile-time)", () => {
  // Two fields, deliberately — a single-field ExampleRow makes "the
  // complete row" and "a Partial of it" the same type, so a regression
  // back to `patch: Partial<TRow>` on `update` would type-check anyway
  // and this suite would not catch it.
  interface ExampleRow {
    a: string;
    b: number;
  }

  it("EditLog<TRow> is assignable to `readonly StructuredEditRecord[]` — StructuredEditInput is genuinely the erasure of StructuredEditInputFor<TRow>", () => {
    // Canonical shape per src/types/questionnaire/structured.ts:99-106:
    // `rowId` camelCase, `patch` is the COMPLETE row for every op,
    // including `remove`.
    const rowEdit: RowEdit<ExampleRow> = {
      rowId: "row-1",
      op: "update",
      patch: { a: "x", b: 1 },
    };
    const editLog: EditLog<ExampleRow> = [rowEdit];
    // If this assignment stops type-checking under `tsc --noEmit`,
    // `core/types.ts`'s `RowEdit<TRow>` has drifted from the canonical
    // `StructuredEdit<TRow>` — this line enforces the relationship, not
    // just the doc comment.
    const erased: readonly StructuredEditRecord[] = editLog;
    assert.equal(erased.length, 1);
    assert.equal(erased[0].rowId, "row-1");
    assert.equal(erased[0].op, "update");
  });

  it("rejects a `patch` that carries only SOME of the row's fields on `update` — patch must be the complete row, never Partial<TRow>", () => {
    // `patch` must be the COMPLETE row for every op, never `Partial<TRow>`.
    // If `RowEdit`'s `update` variant ever reverts to accepting a partial
    // patch, the `@ts-expect-error` directive right below stops matching a
    // real error, and an unused `@ts-expect-error` is itself a `tsc
    // --noEmit` error — that is what makes this test self-guarding rather
    // than merely descriptive.
    const incompletePatch: RowEdit<ExampleRow> = {
      rowId: "row-2",
      op: "update",
      // @ts-expect-error — missing required field `b`.
      patch: { a: "x" },
    };
    assert.equal(incompletePatch.op, "update");
  });
});
