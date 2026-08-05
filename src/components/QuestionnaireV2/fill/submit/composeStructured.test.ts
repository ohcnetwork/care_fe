import assert from "node:assert/strict";
import { describe, it, test } from "node:test";

import {
  getPluginStructuredType,
  registerPluginStructuredType,
  type PluginStructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/pluginRegistry";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { StructuredEditRecord } from "@/types/questionnaire/structured";

import {
  composeStructuredV2Requests,
  structuredEditsOf,
  type StructuredV2Compiler,
} from "./composeStructured";

/**
 * This file is the reason `composeStructuredV2Requests` and
 * `structuredEditsOf` exist as a standalone module rather than living
 * inline in `composeBatch.ts`: `composeBatch.ts` imports
 * `structured/registry.ts`, which transitively imports every core
 * structured definition's real component tree (CSS, UI libraries) and is
 * unrunnable under this plain `node --test` harness — confirmed by hand
 * (importing `registry.ts` here throws on `react-day-picker`'s stylesheet
 * before a single assertion runs). This module deliberately imports
 * NEITHER `registry.ts` NOR `composeBatch.ts`.
 */

const context: StructuredRequestContext = {
  questionId: "q1",
  patientId: "patient-1",
  encounterId: "encounter-1",
};

function responseWithEdits(
  edits: unknown[] | undefined,
): QuestionnaireResponse {
  return {
    question_id: "q1",
    structured_type: "symptom",
    link_id: "q1",
    values: [],
    edits: edits as StructuredEditRecord[] | undefined,
  };
}

describe("structuredEditsOf — the hardened edit-log reader", () => {
  it("undefined edits reads as an empty log", () => {
    assert.deepEqual(structuredEditsOf(responseWithEdits(undefined)), []);
  });

  it("undefined response reads as an empty log", () => {
    assert.deepEqual(structuredEditsOf(undefined), []);
  });

  it("a malformed entry (missing op) is dropped, valid ones survive", () => {
    const valid: StructuredEditRecord = { rowId: "r1", op: "add", patch: {} };
    const malformed = { rowId: "r2" };
    assert.deepEqual(structuredEditsOf(responseWithEdits([valid, malformed])), [
      valid,
    ]);
  });

  it("a malformed entry (empty rowId) is dropped", () => {
    const valid: StructuredEditRecord = { rowId: "r1", op: "add", patch: {} };
    const malformed = { rowId: "", op: "add", patch: {} };
    assert.deepEqual(structuredEditsOf(responseWithEdits([valid, malformed])), [
      valid,
    ]);
  });

  it("a malformed entry (unrecognized op) is dropped", () => {
    const valid: StructuredEditRecord = { rowId: "r1", op: "add", patch: {} };
    const malformed = { rowId: "r2", op: "archive", patch: {} };
    assert.deepEqual(structuredEditsOf(responseWithEdits([valid, malformed])), [
      valid,
    ]);
  });

  it("duplicate rowIds collapse to the LAST entry — the at-most-one-edit-per-rowId invariant", () => {
    const first: StructuredEditRecord = {
      rowId: "dup",
      op: "add",
      patch: { v: 1 },
    };
    const second: StructuredEditRecord = {
      rowId: "dup",
      op: "update",
      patch: { v: 2 },
    };
    assert.deepEqual(structuredEditsOf(responseWithEdits([first, second])), [
      second,
    ]);
  });
});

describe("composeStructuredV2Requests — the v2 compose leg, extracted so it is unit-testable", () => {
  it("an empty edit log produces ZERO batch entries, and toRequests is never even called", async () => {
    let called = false;
    const definition: StructuredV2Compiler = {
      toRequests: async () => {
        called = true;
        return [
          {
            url: "/should-not-happen",
            method: "POST",
            reference_id: "x",
            body: {},
          },
        ];
      },
    };

    const result = await composeStructuredV2Requests(
      definition,
      responseWithEdits([]),
      context,
    );

    assert.deepEqual(result, []);
    assert.equal(
      called,
      false,
      "toRequests must not run at all for an empty log — the guarantee must hold even for a type whose own toRequests is not itself empty-safe",
    );
  });

  it("a response with no `edits` field at all is the same as an empty log", async () => {
    let called = false;
    const definition: StructuredV2Compiler = {
      toRequests: async () => {
        called = true;
        return [];
      },
    };

    const result = await composeStructuredV2Requests(
      definition,
      responseWithEdits(undefined),
      context,
    );

    assert.deepEqual(result, []);
    assert.equal(called, false);
  });

  it("adds, updates and removes in the log reach toRequests verbatim (deduped/validated by structuredEditsOf), and its returned entries pass through unchanged", async () => {
    const edits: StructuredEditRecord[] = [
      { rowId: "r1", op: "add", patch: { note: "new" } },
      { rowId: "r2", op: "update", patch: { note: "changed" } },
      { rowId: "r3", op: "remove", patch: { note: "gone" } },
    ];
    const expectedEntries: StructuredBatchEntry[] = [
      {
        url: "/api/v1/symptom/upsert/",
        method: "POST",
        reference_id: structuredReferenceId("symptom", "q1"),
        body: { ops: 3 },
      },
    ];
    let received: readonly StructuredEditRecord[] | undefined;
    const definition: StructuredV2Compiler = {
      toRequests: async (e) => {
        received = e;
        return expectedEntries;
      },
    };

    const result = await composeStructuredV2Requests(
      definition,
      responseWithEdits(edits),
      context,
    );

    assert.deepEqual(received, edits);
    assert.equal(result, expectedEntries, "entries pass through unchanged");
  });

  it("a malformed edit record in the log is dropped before it reaches toRequests", async () => {
    const valid: StructuredEditRecord = { rowId: "r1", op: "add", patch: {} };
    const malformed = { rowId: "r2" }; // no `op` — isStructuredEditRecord rejects it
    let received: readonly StructuredEditRecord[] | undefined;
    const definition: StructuredV2Compiler = {
      toRequests: async (e) => {
        received = e;
        return [];
      },
    };

    await composeStructuredV2Requests(
      definition,
      responseWithEdits([valid, malformed]),
      context,
    );

    assert.deepEqual(received, [valid]);
  });

  it("the reference-id stays structured:{type}:{questionId} — load-bearing, mapBatchErrors.ts parses it", async () => {
    const referenceId = structuredReferenceId("symptom", "q42");
    assert.equal(referenceId, "structured:symptom:q42");

    const definition: StructuredV2Compiler = {
      toRequests: async () => [
        {
          url: "/api/v1/symptom/upsert/",
          method: "POST",
          reference_id: referenceId,
          body: {},
        },
      ],
    };

    const result = await composeStructuredV2Requests(
      definition,
      responseWithEdits([{ rowId: "r1", op: "add", patch: {} }]),
      { ...context, questionId: "q42" },
    );

    assert.equal(result[0].reference_id, "structured:symptom:q42");
  });
});

test("a registered plugin definition's toRequests reaches the batch end-to-end", async () => {
  const questionId = "q-plugin-1";
  const patch = { note: "clinician entered this" };
  let receivedEdits: readonly StructuredEditRecord[] | undefined;
  let receivedContext: StructuredRequestContext | undefined;

  const definition: PluginStructuredTypeDefinition = {
    type: "plugin_task8.widget",
    component: (() => null) as PluginStructuredTypeDefinition["component"],
    requires: [],
    subjects: ["encounter"],
    draftPolicy: "serialize",
    label: "Widget",
    contract: 2,
    toRequests: async (edits, ctx) => {
      receivedEdits = edits;
      receivedContext = ctx;
      return [
        {
          url: "/api/v1/plugin_task8/widget/",
          method: "POST",
          reference_id: `structured:${definition.type}:${ctx.questionId}`,
          body: edits[0]?.patch,
        },
      ];
    },
  };

  // The real registration path, not a hand-built definition.
  registerPluginStructuredType(definition, "plugin_task8");
  const registered = getPluginStructuredType("plugin_task8.widget");
  assert.ok(registered, "the registration must not be refused");
  assert.equal(
    registered.contract,
    2,
    "the registered definition carries the contract literal",
  );

  const response: QuestionnaireResponse = {
    question_id: questionId,
    structured_type: "plugin_task8.widget",
    link_id: questionId,
    values: [],
    edits: [{ rowId: "row-1", op: "add", patch }],
  };

  // The real pure differ — the same function `composeBatch.ts`'s
  // `buildStructuredRequests` calls for every contract-v2 definition,
  // core or plugin alike.
  const entries = await composeStructuredV2Requests(registered, response, {
    ...context,
    questionId,
  });

  assert.deepEqual(
    receivedEdits,
    [{ rowId: "row-1", op: "add", patch }],
    "the plugin's toRequests must receive exactly the clinician's edit",
  );
  assert.equal(receivedContext?.questionId, questionId);
  assert.deepEqual(entries, [
    {
      url: "/api/v1/plugin_task8/widget/",
      method: "POST",
      reference_id: `structured:plugin_task8.widget:${questionId}`,
      body: patch,
    },
  ]);
});
