import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";

import type { StructuredRowAddressing } from "./rowAddressing";
import {
  checkStructuredEditTarget,
  isStructuredEditOp,
  MAX_STRUCTURED_PATCH_CHARS,
  rowSchemaOf,
  validateStructuredPatch,
} from "./structuredEditValidation";

// A synthetic row schema — deliberately not borrowed from a real type's
// `model.ts`, so these tests pin the choke point's own behavior rather
// than any one type's schema.
const testRowSchema = z
  .object({
    severity: z.enum(["mild", "moderate", "severe"]),
    onset_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    count: z.number().int(),
  })
  // `.strict()` is what actually rejects an unknown field — a plain
  // `z.object()` silently STRIPS extras instead of failing. A real type's
  // published row schema needs the same `.strict()` to get the "unknown
  // fields rejected" guarantee this choke point is documented to give.
  .strict();

describe("validateStructuredPatch — the structured-write choke point", () => {
  it("rejects outright when no schema is published (fail-closed, not fail-open)", () => {
    const result = validateStructuredPatch(undefined, { anything: "goes" });
    assert.equal(result.ok, false);
  });

  it("accepts a well-formed row", () => {
    const result = validateStructuredPatch(testRowSchema, {
      severity: "mild",
      onset_date: "2024-06-15",
      count: 2,
    });
    assert.equal(result.ok, true);
  });

  it("rejects an unknown field", () => {
    const result = validateStructuredPatch(testRowSchema, {
      severity: "mild",
      onset_date: "2024-06-15",
      count: 2,
      not_a_real_field: "surprise",
    });
    assert.equal(result.ok, false);
  });

  it("rejects a bad enum value", () => {
    const result = validateStructuredPatch(testRowSchema, {
      severity: "catastrophic",
      onset_date: "2024-06-15",
      count: 2,
    });
    assert.equal(result.ok, false);
  });

  it("rejects a non-integral count (the same integer rule as the plain-value choke point)", () => {
    const result = validateStructuredPatch(testRowSchema, {
      severity: "mild",
      onset_date: "2024-06-15",
      count: 2.5,
    });
    assert.equal(result.ok, false);
  });

  it("rejects a malformed date field", () => {
    const result = validateStructuredPatch(testRowSchema, {
      severity: "mild",
      onset_date: "06/15/2024",
      count: 2,
    });
    assert.equal(result.ok, false);
  });

  it("rejects a missing required field", () => {
    const result = validateStructuredPatch(testRowSchema, {
      severity: "mild",
      count: 2,
    });
    assert.equal(result.ok, false);
  });

  it("rejects a patch past the serialized-size ceiling", () => {
    const oversized = z.object({ note: z.string() }).strict();
    const result = validateStructuredPatch(oversized, {
      note: "x".repeat(MAX_STRUCTURED_PATCH_CHARS + 1),
    });
    assert.equal(result.ok, false);
  });

  it("accepts a large-but-bounded patch", () => {
    const bounded = z.object({ note: z.string() }).strict();
    const result = validateStructuredPatch(bounded, {
      note: "x".repeat(1_000),
    });
    assert.equal(result.ok, true);
  });

  it("rejects a patch that cannot be serialized at all (a cycle)", () => {
    const loose = z.custom<object>(() => true);
    const cyclic: Record<string, unknown> = { severity: "mild" };
    cyclic.self = cyclic;
    assert.equal(validateStructuredPatch(loose, cyclic).ok, false);
  });

  it("detaches the accepted value from the caller's object", () => {
    // A schema that passes its input through untouched (what a plugin's
    // loose schema does) would otherwise hand the caller's own object
    // into the edit log, mutable after validation.
    const passthrough = z.custom<Record<string, unknown>>(() => true);
    const patch = { severity: "mild", tags: ["a"] };
    const result = validateStructuredPatch(passthrough, patch);
    assert.equal(result.ok, true);
    patch.severity = "severe";
    patch.tags.push("b");
    assert.deepEqual(result.ok && result.value, {
      severity: "mild",
      tags: ["a"],
    });
  });
});

describe("isStructuredEditOp — the shipped vocabulary, checked at runtime", () => {
  it("accepts every shipped op", () => {
    assert.equal(isStructuredEditOp("add"), true);
    assert.equal(isStructuredEditOp("update"), true);
    assert.equal(isStructuredEditOp("remove"), true);
  });

  it("rejects an off-vocabulary op", () => {
    assert.equal(isStructuredEditOp("upsert"), false);
    assert.equal(isStructuredEditOp(""), false);
  });
});

describe("checkStructuredEditTarget — what an edit may address", () => {
  const nothing: StructuredRowAddressing = { rowIds: [] };
  /** Every op carries the complete row; content is irrelevant to this
   *  gate except where a row claims an identity of its own. */
  const row = { dose: "250mg" };

  it("accepts an add with no rowId (one is minted for it)", () => {
    assert.equal(
      checkStructuredEditTarget({ op: "add", patch: row }, nothing).ok,
      true,
    );
  });

  it("accepts an add under a rowId nothing has recorded yet — including the singleton convention", () => {
    assert.equal(
      checkStructuredEditTarget(
        { op: "add", rowId: "singleton", patch: row },
        nothing,
      ).ok,
      true,
    );
  });

  it("rejects an add whose row content names an existing record", () => {
    // The id would ride into the upsert datapoint verbatim and rewrite
    // whichever record already holds it — the same reason the medication
    // editor strips the id off a historical row it re-adds — and would
    // make the id look baseline-derived in the projection.
    const result = checkStructuredEditTarget(
      { op: "add", patch: { id: "med-1", dose: "250mg" } },
      nothing,
    );
    assert.equal(result.ok, false);
    assert.match(result.ok === false ? result.error : "", /med-1/);
  });

  it("still accepts an update whose row content carries its own id", () => {
    // An update's patch is the complete server row, id included — that is
    // what the upsert endpoint keys on.
    const result = checkStructuredEditTarget(
      { op: "update", rowId: "med-1", patch: { id: "med-1", dose: "500mg" } },
      { rowIds: ["med-1"] },
    );
    assert.equal(result.ok, true);
  });

  it("rejects an update for a rowId that is neither a row of this question nor a pending edit", () => {
    // The editor's orphan prune would excise this the render it lands,
    // behind a "rows were dropped" notice — after the caller was told the
    // write succeeded.
    const result = checkStructuredEditTarget(
      { op: "update", rowId: "singleton", patch: row },
      nothing,
    );
    assert.equal(result.ok, false);
  });

  it("accepts an update once that rowId is in the pending log", () => {
    const result = checkStructuredEditTarget(
      { op: "update", rowId: "singleton", patch: row },
      { rowIds: ["singleton"] },
    );
    assert.equal(result.ok, true);
  });

  it("accepts update and remove for a row that came from the SERVER", () => {
    // The assistant's primary case: raise an existing order's dose, or
    // retract an existing record. The baseline holds that rowId, so
    // nothing prunes the edit — and `remove` is the only route to
    // `resolveChanges`' soft-delete path.
    const baseline: StructuredRowAddressing = { rowIds: ["med-1"] };
    assert.equal(
      checkStructuredEditTarget(
        { op: "update", rowId: "med-1", patch: row },
        baseline,
      ).ok,
      true,
    );
    assert.equal(
      checkStructuredEditTarget(
        { op: "remove", rowId: "med-1", patch: row },
        baseline,
      ).ok,
      true,
    );
  });

  it("rejects a remove for an unknown rowId", () => {
    assert.equal(
      checkStructuredEditTarget(
        { op: "remove", rowId: "row-9", patch: row },
        nothing,
      ).ok,
      false,
    );
  });

  it("names the rows that are addressable, so the caller can correct itself", () => {
    const result = checkStructuredEditTarget(
      { op: "update", rowId: "row-9", patch: row },
      { rowIds: ["med-1", "med-2"] },
    );
    assert.equal(result.ok, false);
    assert.match(result.ok === false ? result.error : "", /med-1, med-2/);
  });

  it("still rejects update/remove with no rowId at all", () => {
    assert.equal(
      checkStructuredEditTarget({ op: "update", patch: row }, nothing).ok,
      false,
    );
    assert.equal(
      checkStructuredEditTarget(
        { op: "remove", rowId: "", patch: row },
        { rowIds: ["row-1"] },
      ).ok,
      false,
    );
  });

  it("rejects an off-vocabulary op before any rowId is minted for it", () => {
    // Fail-closed: an "upsert" would otherwise be appended as an entry
    // nothing projects and `resolveChanges` drops — a phantom dirty edit.
    assert.equal(
      checkStructuredEditTarget({ op: "upsert", patch: row }, nothing).ok,
      false,
    );
  });

  describe("a type that compiles exactly one rowId", () => {
    const encounter: StructuredRowAddressing = {
      rowIds: ["enc-1"],
      ops: ["add", "update"],
      requiredRowId: "enc-1",
    };

    it("rejects an add under any other rowId instead of accepting a write nothing submits", () => {
      // `encounter`'s `toRequests` keeps only `rowId === encounterId`, so
      // an accepted "singleton" add would paint on screen, dirty the
      // form, ride into the draft — and submit nothing, silently.
      const result = checkStructuredEditTarget(
        { op: "add", rowId: "singleton", patch: row },
        encounter,
      );
      assert.equal(result.ok, false);
      assert.match(result.ok === false ? result.error : "", /enc-1/);
    });

    it("rejects an add with no rowId at all (a minted uuid is no better)", () => {
      assert.equal(
        checkStructuredEditTarget({ op: "add", patch: row }, encounter).ok,
        false,
      );
    });

    it("accepts add and update under the one rowId it compiles", () => {
      assert.equal(
        checkStructuredEditTarget(
          { op: "add", rowId: "enc-1", patch: row },
          encounter,
        ).ok,
        true,
      );
      assert.equal(
        checkStructuredEditTarget(
          { op: "update", rowId: "enc-1", patch: row },
          encounter,
        ).ok,
        true,
      );
    });

    it("rejects the one op it does NOT compile, under that same rowId", () => {
      // `remove` passes every rowId check — it names the required row —
      // but `toRequests` reads `updates[0] ?? creates[0]` and never the
      // removes set, while `projectRows` hides the baseline row: the
      // section stops rendering and nothing is submitted.
      const result = checkStructuredEditTarget(
        { op: "remove", rowId: "enc-1", patch: row },
        encounter,
      );
      assert.equal(result.ok, false);
      assert.match(result.ok === false ? result.error : "", /remove/);
    });

    it("rejects every op once the type compiles none in this context", () => {
      const noContext: StructuredRowAddressing = { rowIds: [], ops: [] };
      assert.equal(
        checkStructuredEditTarget({ op: "add", patch: row }, noContext).ok,
        false,
      );
    });
  });
});

describe("rowSchemaOf — duck-typed lookup", () => {
  it("returns undefined for a definition with no rowSchema", () => {
    assert.equal(rowSchemaOf({ type: "allergy_intolerance" }), undefined);
  });

  it("returns undefined for a non-object", () => {
    assert.equal(rowSchemaOf(undefined), undefined);
    assert.equal(rowSchemaOf(null), undefined);
  });

  it("picks up a rowSchema the moment a definition carries one", () => {
    const definition = { type: "acme.thing", rowSchema: testRowSchema };
    assert.equal(rowSchemaOf(definition), testRowSchema);
  });
});
