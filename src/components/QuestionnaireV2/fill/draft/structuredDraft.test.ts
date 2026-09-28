import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

import { draftResponseHasContent, mergeDraftResponses } from "./draftMerge";
import { fillDraftScopeKey } from "./fillDraftCore";
import {
  draftIntentResponse,
  initializeStructuredResponse,
} from "./structuredDraft";

function values(
  rows: Record<string, unknown>[],
  type = "diagnosis",
): ResponseValue[] {
  return [{ type, value: rows }] as ResponseValue[];
}

function response(): QuestionnaireResponse {
  return {
    question_id: "diagnosis",
    link_id: "diagnosis",
    structured_type: "diagnosis",
    values: [],
  };
}

function rows(answer: QuestionnaireResponse): unknown {
  return answer.values[0]?.value;
}

describe("structured local draft recovery", () => {
  it("isolates prescription and discharge contexts while retaining existing keys for ordinary fills", () => {
    const scope = {
      userId: "clinician",
      subjectKey: "encounter:visit",
      entryQuestionnaireId: "medication_request",
    };
    const ordinaryKey = fillDraftScopeKey(scope);
    assert.equal(ordinaryKey, "clinician--encounter:visit--medication_request");
    const contextualKeys = [
      "prescription=A",
      "prescription=B",
      "toDischarge=true",
      "prescription=A&toDischarge=true",
    ].map((contextKey) => fillDraftScopeKey({ ...scope, contextKey }));
    assert.equal(new Set([ordinaryKey, ...contextualKeys]).size, 5);
    assert.equal(fillDraftScopeKey({ ...scope, contextKey: "" }), ordinaryKey);
  });

  it("server prefill has the same edit signature as an untouched form and does not create a draft", () => {
    const empty = response();
    const initialized = initializeStructuredResponse(
      empty,
      values([{ id: "a", note: "From server" }]),
    );
    assert.deepEqual(
      draftIntentResponse(initialized),
      draftIntentResponse(empty),
    );
    assert.equal(draftResponseHasContent(initialized), false);
    assert.deepEqual(rows(initialized), [{ id: "a", note: "From server" }]);
  });

  it("persists edits to a server row and rebases only those fields onto fresh records after JSON reload", () => {
    const initial = initializeStructuredResponse(
      response(),
      values([{ id: "a", note: "Old note", severity: "mild" }]),
    );
    const edited = {
      ...initial,
      values: values([{ id: "a", note: "Draft note", severity: "mild" }]),
    };
    assert.equal(draftResponseHasContent(edited), true);

    const draft = JSON.parse(JSON.stringify(edited)) as QuestionnaireResponse;
    const restored = mergeDraftResponses(
      [
        {
          id: "diagnosis",
          link_id: "diagnosis",
          text: "Diagnoses",
          type: "structured",
          structured_type: "diagnosis",
        },
      ],
      { diagnosis: draft },
    ).responses.diagnosis;
    const refreshed = initializeStructuredResponse(
      restored,
      values([{ id: "a", note: "Old note", severity: "severe" }]),
    );
    assert.deepEqual(rows(refreshed), [
      { id: "a", note: "Draft note", severity: "severe" },
    ]);
    assert.equal(draftResponseHasContent(refreshed), true);
  });

  it("preserves draft-added rows alongside newly arrived server rows without duplicating existing rows", () => {
    const initial = initializeStructuredResponse(
      response(),
      values([{ id: "a", note: "Existing" }]),
    );
    const edited = {
      ...initial,
      values: values([
        { id: "a", note: "Existing" },
        { note: "New draft row" },
      ]),
    };
    const fresh = values([
      { id: "a", note: "Updated remotely" },
      { id: "b", note: "New server row" },
    ]);
    const restored = initializeStructuredResponse(edited, fresh);
    assert.deepEqual(rows(restored), [
      { id: "a", note: "Updated remotely" },
      { id: "b", note: "New server row" },
      { note: "New draft row" },
    ]);
    assert.deepEqual(initializeStructuredResponse(restored, fresh), restored);
  });

  it("keeps explicit removals and empty-list clears while retaining records created after the draft", () => {
    const initial = initializeStructuredResponse(
      response(),
      values([{ id: "a" }, { id: "b" }]),
    );
    const removed = { ...initial, values: values([{ id: "b" }]) };
    assert.deepEqual(
      rows(
        initializeStructuredResponse(
          removed,
          values([{ id: "a" }, { id: "b" }, { id: "c" }]),
        ),
      ),
      [{ id: "b" }, { id: "c" }],
    );
    const cleared = { ...initial, values: values([]) };
    assert.equal(draftResponseHasContent(cleared), true);
    assert.deepEqual(
      rows(initializeStructuredResponse(cleared, initial.values)),
      [],
    );
  });

  it("does not resurrect untouched records deleted remotely", () => {
    const initial = initializeStructuredResponse(
      response(),
      values([{ id: "a" }, { id: "b" }]),
    );
    const edited = {
      ...initial,
      values: values([{ id: "a" }, { id: "b" }, { note: "New" }]),
    };
    assert.deepEqual(
      rows(initializeStructuredResponse(edited, values([{ id: "b" }]))),
      [{ id: "b" }, { note: "New" }],
    );
  });

  it("retains input made before the initial fetch resolves", () => {
    const edited = {
      ...response(),
      values: values([{ note: "Typed while loading" }]),
    };
    assert.deepEqual(
      rows(
        initializeStructuredResponse(
          edited,
          values([{ id: "a", note: "From server" }]),
        ),
      ),
      [{ id: "a", note: "From server" }, { note: "Typed while loading" }],
    );
  });

  it("reconciles nested encounter fields without reverting unrelated fresh server values", () => {
    const initial = initializeStructuredResponse(
      { ...response(), structured_type: "encounter" },
      values(
        [
          {
            status: "in_progress",
            hospitalization: { diet_preference: "none", admit_source: "other" },
          },
        ],
        "encounter",
      ),
    );
    const edited = {
      ...initial,
      values: values(
        [
          {
            status: "in_progress",
            hospitalization: {
              diet_preference: "vegetarian",
              admit_source: "other",
            },
          },
        ],
        "encounter",
      ),
    };
    const fresh = values(
      [
        {
          status: "on_hold",
          hospitalization: {
            diet_preference: "none",
            admit_source: "emergency",
          },
        },
      ],
      "encounter",
    );
    assert.deepEqual(rows(initializeStructuredResponse(edited, fresh)), [
      {
        status: "on_hold",
        hospitalization: {
          diet_preference: "vegetarian",
          admit_source: "emergency",
        },
      },
    ]);
  });

  it("preserves a note on an otherwise untouched structured response", () => {
    const initial = initializeStructuredResponse(
      response(),
      values([{ id: "a" }]),
    );
    const noted = { ...initial, note: "Clinician annotation" };
    assert.equal(draftResponseHasContent(noted), true);
    assert.equal(
      initializeStructuredResponse(noted, values([{ id: "a" }, { id: "b" }]))
        .note,
      noted.note,
    );
  });
});
