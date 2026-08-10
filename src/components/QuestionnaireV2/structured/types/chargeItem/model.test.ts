import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyEditToLog } from "@/components/QuestionnaireV2/structured/core/editLog";
import type { ChargeItemDefinitionRead } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import type { StructuredEdit } from "@/types/questionnaire/structured";

import type { ChargeItemRow } from "./model";
import {
  invalidQuantityRowIds,
  newChargeItemRow,
  projectValues,
  stripDisplay,
  toRequests,
} from "./model";

const CTX = { facilityId: "fac-1", questionId: "q-1" } as const;

/** A minimal, cast-through-`unknown` fixture — the model's own functions
 *  only ever read `.slug` off this, so the rest of `ChargeItemDefinitionRead`
 *  (category, slug_config, tags, ...) is irrelevant noise for these tests,
 *  matching the `as unknown as X` shortcut this test harness already uses
 *  elsewhere (`changes.test.ts`, `rowMutations.test.ts`). */
function fixtureDefinition(
  overrides: Partial<ChargeItemDefinitionRead> = {},
): ChargeItemDefinitionRead {
  return {
    id: "def-1",
    slug: "consultation-fee",
    title: "Consultation Fee",
    status: "active",
    price_components: [],
    category: {},
    slug_config: { slug_value: "consultation-fee" },
    tags: [],
    can_edit_charge_item: true,
    ...overrides,
  } as unknown as ChargeItemDefinitionRead;
}

function row(overrides: Partial<ChargeItemRow> = {}): ChargeItemRow {
  return { ...newChargeItemRow(fixtureDefinition(), "enc-1"), ...overrides };
}

function add(
  rowId: string,
  patch: ChargeItemRow,
): StructuredEdit<ChargeItemRow> {
  return { rowId, op: "add", patch };
}

describe("charge_item model", () => {
  describe("newChargeItemRow", () => {
    it("seeds quantity '1', the encounter, the definition slug, and carries the definition object for display", () => {
      const definition = fixtureDefinition({ slug: "xray", title: "X-Ray" });
      assert.deepEqual(newChargeItemRow(definition, "enc-42"), {
        quantity: "1",
        encounter: "enc-42",
        charge_item_definition: "xray",
        charge_item_definition_object: definition,
      });
    });
  });

  describe("stripDisplay", () => {
    it("removes BOTH display objects and nothing else", () => {
      // A "full" row carries every optional wire field PLUS both display
      // objects, so the assertion is on the exact remaining key set, not
      // just "the two known keys are gone."
      const full: ChargeItemRow = {
        ...newChargeItemRow(fixtureDefinition(), "enc-1"),
        patient: "pat-1",
        service_resource_id: "sr-1",
        performer_actor: "user-1",
        account: "acct-1",
        performer_actor_object: {
          id: "user-1",
        } as unknown as ChargeItemRow["performer_actor_object"],
      };

      const stripped = stripDisplay(full);

      assert.deepEqual(
        Object.keys(stripped).sort(),
        [
          "account",
          "charge_item_definition",
          "encounter",
          "patient",
          "performer_actor",
          "quantity",
          "service_resource_id",
        ].sort(),
      );
      assert.deepEqual(stripped, {
        quantity: full.quantity,
        encounter: full.encounter,
        charge_item_definition: full.charge_item_definition,
        patient: full.patient,
        service_resource_id: full.service_resource_id,
        performer_actor: full.performer_actor,
        account: full.account,
      });
    });
  });

  describe("projectValues", () => {
    it("projects an empty row set to NO values, so the section reads unanswered", () => {
      assert.deepEqual(projectValues([]), []);
    });

    it("projects rows as one charge_item entry, in order, without aliasing the input array", () => {
      const rowA = newChargeItemRow(fixtureDefinition({ slug: "a" }), "enc-1");
      const rowB = newChargeItemRow(fixtureDefinition({ slug: "b" }), "enc-1");
      const rows = [rowA, rowB];

      const projected = projectValues(rows);

      assert.deepEqual(projected, [
        { type: "charge_item", value: [rowA, rowB] },
      ]);
      assert.notEqual(
        (projected[0] as { type: "charge_item"; value: ChargeItemRow[] }).value,
        rows,
      );
    });
  });

  describe("toRequests", () => {
    it("an empty edit log produces ZERO requests", async () => {
      assert.deepEqual(await toRequests([], CTX), []);
    });

    it("two adds compile ONE POST whose body is { requests: [stripped, stripped] } in log order", async () => {
      const rowA = newChargeItemRow(
        fixtureDefinition({ slug: "consult" }),
        "enc-1",
      );
      const rowB = newChargeItemRow(
        fixtureDefinition({ slug: "xray" }),
        "enc-1",
      );
      const edits = [add("row-a", rowA), add("row-b", rowB)];

      assert.deepEqual(await toRequests(edits, CTX), [
        {
          url: "/api/v1/facility/fac-1/charge_item/apply_charge_item_defs/",
          method: "POST",
          body: { requests: [stripDisplay(rowA), stripDisplay(rowB)] },
          reference_id: "structured:charge_item:q-1",
        },
      ]);
    });

    it("sends nothing without a facility in context", async () => {
      const created = newChargeItemRow(fixtureDefinition(), "enc-1");
      assert.deepEqual(
        await toRequests([add("row-a", created)], { questionId: "q-1" }),
        [],
      );
    });

    it("a removed row does not reach requests — built through the REAL reducer, not a hand-written log", async () => {
      const created = newChargeItemRow(fixtureDefinition(), "enc-1");
      let log = applyEditToLog<ChargeItemRow>([], {
        rowId: "row-a",
        op: "add",
        patch: created,
      });
      assert.equal(log.length, 1);

      log = applyEditToLog<ChargeItemRow>(log, {
        rowId: "row-a",
        op: "remove",
        patch: created,
      });
      // add -> remove for the same rowId annihilates: the row never
      // reached the server, so the log returns to pristine.
      assert.deepEqual(log, []);
      assert.deepEqual(await toRequests(log, CTX), []);
    });

    it("ignores a stray remove op with no matching add — there is no delete endpoint and no baseline row to remove", async () => {
      const stray: StructuredEdit<ChargeItemRow> = {
        rowId: "row-a",
        op: "remove",
        patch: newChargeItemRow(fixtureDefinition(), "enc-1"),
      };
      assert.deepEqual(await toRequests([stray], CTX), []);
    });

    it("a corrupted 'update' op — never a legitimate op for this create-only type — never reaches the request body", async () => {
      // A well-formed log never produces "update" for charge_item: the
      // reducer only emits "add" here (there is no baseline row to update
      // against). Reachable only via a hand-edited/restored draft.
      const corrupted: StructuredEdit<ChargeItemRow> = {
        rowId: "row-a",
        op: "update",
        patch: newChargeItemRow(fixtureDefinition(), "enc-1"),
      };
      assert.deepEqual(await toRequests([corrupted], CTX), []);
    });
  });

  describe("invalidQuantityRowIds", () => {
    for (const quantity of ["0", "-1", "", "1.5", "abc"]) {
      it(`flags quantity ${JSON.stringify(quantity)} as invalid`, () => {
        assert.deepEqual(
          invalidQuantityRowIds([add("row-a", row({ quantity }))]),
          ["row-a"],
        );
      });
    }

    for (const quantity of ["1", "2", "10"]) {
      it(`accepts quantity ${JSON.stringify(quantity)}`, () => {
        assert.deepEqual(
          invalidQuantityRowIds([add("row-a", row({ quantity }))]),
          [],
        );
      });
    }

    it("never reports a remove edit, regardless of its quantity", () => {
      const removed: StructuredEdit<ChargeItemRow> = {
        rowId: "row-a",
        op: "remove",
        patch: row({ quantity: "abc" }),
      };
      assert.deepEqual(invalidQuantityRowIds([removed]), []);
    });

    it("returns rowIds in log order", () => {
      const edits = [
        add("row-a", row({ quantity: "abc" })),
        add("row-b", row({ quantity: "2" })),
        add("row-c", row({ quantity: "" })),
      ];
      assert.deepEqual(invalidQuantityRowIds(edits), ["row-a", "row-c"]);
    });
  });

  describe("the quantity decision — validate() gates the submit, toRequests does not re-check it", () => {
    it("toRequests still compiles a request for an invalid-quantity row: the differ trusts that a blocking validate() error already stopped the submit before toRequests could ever run", async () => {
      const bad = row({ quantity: "abc" });
      const edits = [add("row-a", bad)];

      assert.deepEqual(invalidQuantityRowIds(edits), ["row-a"]);

      const requests = await toRequests(edits, CTX);
      assert.equal(requests.length, 1);
      assert.deepEqual((requests[0].body as { requests: unknown[] }).requests, [
        stripDisplay(bad),
      ]);
    });

    it("projectValues shows the very same invalid-quantity row toRequests would submit — the two agree even here", () => {
      const bad = row({ quantity: "abc" });
      assert.deepEqual(projectValues([bad]), [
        { type: "charge_item", value: [bad] },
      ]);
    });
  });
});
