import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import { FILL_DRAFT_PREFIX } from "./fillDraftCache";
import type {
  DraftFormSnapshot,
  FillDraftScope,
  FillSessionFormState,
  StructuredDraftResolver,
} from "./fillDraftCore";
import {
  loadFillDraft,
  reviveDraftResponses,
  saveFillDraft,
  sessionEditSignature,
} from "./fillDraftCore";

/** Map-backed `localStorage` — see `fillDraftCache.test.ts`. */
function installLocalStorage(): Record<string, string> {
  const data: Record<string, string> = {};
  const api: Record<string, unknown> = {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = String(value);
    },
    removeItem: (key: string) => {
      delete data[key];
    },
    clear: () => {
      for (const key of Object.keys(data)) delete data[key];
    },
    key: (index: number) => Object.keys(data)[index] ?? null,
  };
  const shim = new Proxy(data, {
    get: (target, property) =>
      typeof property === "string" && property in api
        ? api[property]
        : Reflect.get(target, property),
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: shim,
    configurable: true,
    writable: true,
  });
  return data;
}

let store: Record<string, string>;

beforeEach(() => {
  store = installLocalStorage();
});

const SCOPE: FillDraftScope = {
  userId: "user-1",
  subjectKey: "encounter-1",
  entryQuestionnaireId: "qn-1",
};

const KEY = `${FILL_DRAFT_PREFIX}user-1--encounter-1--qn-1`;

/** Every structured type resolves as draftable unless a test says otherwise. */
const resolveSerialize: StructuredDraftResolver = () => ({
  draftPolicy: "serialize",
});
const resolveExclude: StructuredDraftResolver = () => ({
  draftPolicy: "exclude",
});

function questionnaire(
  over: Partial<QuestionnaireRead> = {},
): QuestionnaireRead {
  return {
    id: "qn-1",
    slug: "qn-1",
    title: "Vitals",
    status: "active",
    subject_type: "encounter",
    version: "1",
    questions: [],
    ...over,
  };
}

function response(
  over: Partial<QuestionnaireResponse> &
    Pick<QuestionnaireResponse, "question_id">,
): QuestionnaireResponse {
  return {
    structured_type: null,
    link_id: over.question_id,
    values: [],
    ...over,
  };
}

function answered(id: string, value = "hello"): QuestionnaireResponse {
  return response({
    question_id: id,
    values: [{ type: "string", value }],
  });
}

function form(
  responses: Record<string, QuestionnaireResponse>,
  over: Partial<QuestionnaireRead> = {},
): FillSessionFormState {
  return { questionnaire: questionnaire(over), responses };
}

function storedDraft(over: Record<string, unknown> = {}): string {
  return JSON.stringify({
    schemaVersion: 2,
    savedAt: new Date().toISOString(),
    userId: SCOPE.userId,
    subjectKey: SCOPE.subjectKey,
    entryQuestionnaireId: SCOPE.entryQuestionnaireId,
    forms: [
      {
        questionnaireId: "qn-1",
        questionnaireVersion: "1",
        title: "Vitals",
        responses: { q1: answered("q1") },
        structuredSkipped: false,
      },
    ],
    ...over,
  });
}

const QUESTIONS: Question[] = [
  { id: "q1", link_id: "q1", text: "Q1", type: "string" },
];

describe("loadFillDraft — the discard gates", () => {
  it("loads a draft that matches the scope, and merges the primary form against the live questions", () => {
    store[KEY] = storedDraft();

    const loaded = loadFillDraft(SCOPE, QUESTIONS);

    assert.equal(loaded?.forms.length, 1);
    // The snapshots are returned as stored — `mergeDraftIntoSeed` overlays
    // them onto each form's fresh seed at mount; the merge here only
    // computes the drop list the restore bar needs BEFORE that.
    assert.deepEqual(loaded?.forms[0].responses.q1.values, [
      { type: "string", value: "hello" },
    ]);
    assert.deepEqual(loaded?.dropped, []);
    assert.equal(store[KEY] !== undefined, true);
  });

  it("names answers the CURRENT questionnaire can no longer carry instead of dropping them silently", () => {
    store[KEY] = storedDraft();

    const loaded = loadFillDraft(SCOPE, []); // q1 no longer exists

    assert.deepEqual(loaded?.dropped, [
      { questionId: "q1", label: "q1", reason: "question_removed" },
    ]);
  });

  it("a schemaVersion from another release is discarded and the key removed", () => {
    store[KEY] = storedDraft({ schemaVersion: 1 });

    assert.equal(loadFillDraft(SCOPE, QUESTIONS), undefined);
    assert.equal(KEY in store, false);
  });

  it("a draft written by a different user is discarded", () => {
    store[KEY] = storedDraft({ userId: "someone-else" });

    assert.equal(loadFillDraft(SCOPE, QUESTIONS), undefined);
    assert.equal(KEY in store, false);
  });

  it("a draft for a different subject is discarded", () => {
    store[KEY] = storedDraft({ subjectKey: "encounter-2" });

    assert.equal(loadFillDraft(SCOPE, QUESTIONS), undefined);
    assert.equal(KEY in store, false);
  });

  it("a draft for a different entry questionnaire is discarded", () => {
    store[KEY] = storedDraft({ entryQuestionnaireId: "qn-2" });

    assert.equal(loadFillDraft(SCOPE, QUESTIONS), undefined);
    assert.equal(KEY in store, false);
  });

  it("an expired draft is discarded", () => {
    store[KEY] = storedDraft({
      savedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    });

    assert.equal(loadFillDraft(SCOPE, QUESTIONS), undefined);
    assert.equal(KEY in store, false);
  });

  it("a draft with no snapshot for the entry questionnaire is discarded — there is no session to restore", () => {
    store[KEY] = storedDraft({
      forms: [
        {
          questionnaireId: "qn-added",
          questionnaireVersion: "1",
          responses: { q1: answered("q1") },
          structuredSkipped: false,
        },
      ],
    });

    assert.equal(loadFillDraft(SCOPE, QUESTIONS), undefined);
    assert.equal(KEY in store, false);
  });

  it("a corrupt entry is discarded", () => {
    store[KEY] = "{not json";

    assert.equal(loadFillDraft(SCOPE, QUESTIONS), undefined);
    assert.equal(KEY in store, false);
  });

  it("no entry at all is simply no draft", () => {
    assert.equal(loadFillDraft(SCOPE, QUESTIONS), undefined);
  });
});

describe("saveFillDraft — what earns a stored draft", () => {
  it("stores the session when a form has draft-safe content", () => {
    saveFillDraft(SCOPE, [form({ q1: answered("q1") })], resolveSerialize);

    const stored = JSON.parse(store[KEY]) as { forms: DraftFormSnapshot[] };
    assert.equal(stored.forms.length, 1);
    assert.equal(stored.forms[0].questionnaireId, "qn-1");
  });

  it("an empty session CLEARS the key instead of storing an empty draft", () => {
    store[KEY] = storedDraft();

    saveFillDraft(
      SCOPE,
      [form({ q1: response({ question_id: "q1" }) })],
      resolveSerialize,
    );

    assert.equal(KEY in store, false);
  });

  it("a retained snapshot alone keeps the draft alive — a failed re-fetch must not delete its answers", () => {
    saveFillDraft(
      SCOPE,
      [form({ q1: response({ question_id: "q1" }) })],
      resolveSerialize,
      [
        {
          questionnaireId: "qn-added",
          questionnaireVersion: "1",
          title: "Added",
          responses: { q9: answered("q9") },
          structuredSkipped: false,
        },
      ],
    );

    const stored = JSON.parse(store[KEY]) as { forms: DraftFormSnapshot[] };
    assert.deepEqual(
      stored.forms.map((snapshot) => snapshot.questionnaireId),
      ["qn-1", "qn-added"],
    );
  });

  it("a retained snapshot for a form that IS live again is not stored twice", () => {
    saveFillDraft(SCOPE, [form({ q1: answered("q1") })], resolveSerialize, [
      {
        questionnaireId: "qn-1",
        questionnaireVersion: "1",
        responses: { q1: answered("q1", "stale") },
        structuredSkipped: false,
      },
    ]);

    const stored = JSON.parse(store[KEY]) as { forms: DraftFormSnapshot[] };
    assert.equal(stored.forms.length, 1);
    assert.equal(stored.forms[0].responses.q1.values[0].value, "hello");
  });

  it("reports whether a draft is stored under the scope afterwards", () => {
    assert.equal(
      saveFillDraft(SCOPE, [form({ q1: answered("q1") })], resolveSerialize),
      true,
    );
    assert.equal(
      saveFillDraft(
        SCOPE,
        [form({ q1: response({ question_id: "q1" }) })],
        resolveSerialize,
      ),
      false,
    );
  });

  it("draft-EXCLUDED structured content alone is an annotation, never a reason to store a draft", () => {
    saveFillDraft(
      SCOPE,
      [
        form({
          files: response({
            question_id: "files",
            structured_type: "files",
            values: [{ type: "files", value: [] }],
            edits: [{ op: "add", rowId: "r1", patch: {} }],
          }),
        }),
      ],
      resolveExclude,
    );

    assert.equal(KEY in store, false);
  });
});

describe("saveFillDraft — who may delete a stored draft", () => {
  /** A files question after the clinician attaches one: the row lives in the
   *  edit log, and `values` is where the widget parks prefetched rows. */
  function filesResponse(edits: number): QuestionnaireResponse {
    return response({
      question_id: "files",
      structured_type: "files",
      values: [{ type: "files", value: [] }],
      edits: Array.from({ length: edits }, (_unused, index) => ({
        op: "add" as const,
        rowId: `r${index}`,
        patch: {},
      })),
    });
  }

  /** How `useFillSessionAutosave` drives saves: each result becomes the next
   *  call's `mayClear`, so only a session that stored a draft may delete one. */
  function fillSession(resolve: StructuredDraftResolver) {
    let stored = false;
    return (forms: FillSessionFormState[]) => {
      if (saveFillDraft(SCOPE, forms, resolve, [], stored)) stored = true;
    };
  }

  it("an attached file is the clinician's work — it flips the edit signature even though the draft cannot carry it", () => {
    assert.notEqual(
      sessionEditSignature([form({ files: filesResponse(0) })], resolveExclude),
      sessionEditSignature([form({ files: filesResponse(1) })], resolveExclude),
    );
  });

  it("the save that attached edit drives leaves a draft stored by an earlier session alone", () => {
    store[KEY] = storedDraft();
    const persist = fillSession(resolveExclude);

    persist([form({ files: filesResponse(1) })]);

    assert.equal(KEY in store, true);
  });

  it("once the session has stored a draft of its own, emptying the session deletes it", () => {
    const persist = fillSession(resolveSerialize);

    persist([form({ q1: answered("q1") })]);
    persist([form({ q1: response({ question_id: "q1" }) })]);

    assert.equal(KEY in store, false);
  });
});

describe("reviveDraftResponses — JSON flattened the Dates", () => {
  it("turns a stored ISO string back into a Date", () => {
    const stored = {
      q1: response({
        question_id: "q1",
        values: [
          {
            type: "date",
            value: "2026-01-02T00:00:00.000Z" as unknown as Date,
          },
        ],
      }),
    };

    const revived = reviveDraftResponses(stored);

    const value = revived.q1.values[0].value;
    assert.equal(value instanceof Date, true);
    assert.equal(
      (value as Date).toISOString(),
      "2026-01-02T00:00:00.000Z",
      "the stored instant, not a re-read of it through the local clock",
    );
    // In place, on the caller's own entries: `parseServerDraft` clones the
    // query-cache dump before handing it here precisely because of this.
    assert.equal(revived, stored);
    assert.equal(stored.q1.values[0].value, value);
  });

  it("maps an unparseable date string to undefined rather than an Invalid Date", () => {
    const revived = reviveDraftResponses({
      q1: response({
        question_id: "q1",
        values: [{ type: "dateTime", value: "not-a-date" as unknown as Date }],
      }),
    });

    assert.equal(revived.q1.values[0].value, undefined);
  });

  it("a values-less entry (an untyped server dump) does not throw", () => {
    const responses = {
      q1: {
        question_id: "q1",
        link_id: "q1",
        structured_type: null,
      } as unknown as QuestionnaireResponse,
    };

    assert.doesNotThrow(() => reviveDraftResponses(responses));
  });
});

describe("sessionEditSignature — what counts as an edit", () => {
  it("an edit to a draft-EXCLUDED question changes the signature — those answers never reach the draft, but abandoning them is still losing work", () => {
    const before = form({
      files: response({
        question_id: "files",
        structured_type: "files",
        values: [{ type: "files", value: [] }],
      }),
    });
    const after = form({
      files: response({
        question_id: "files",
        structured_type: "files",
        values: [{ type: "files", value: [] }],
        edits: [{ op: "add", rowId: "r1", patch: {} }],
      }),
    });

    assert.notEqual(
      sessionEditSignature([before], resolveExclude),
      sessionEditSignature([after], resolveExclude),
    );
  });

  it("a baseline prefetch into an excluded question's VALUES does not — that is the widget seeding server rows, not the clinician typing", () => {
    const before = form({
      files: response({
        question_id: "files",
        structured_type: "files",
        values: [],
      }),
    });
    const after = form({
      files: response({
        question_id: "files",
        structured_type: "files",
        values: [{ type: "files", value: [{ id: "f1" } as never] }],
      }),
    });

    assert.equal(
      sessionEditSignature([before], resolveExclude),
      sessionEditSignature([after], resolveExclude),
    );
  });

  it("a plain answer change flips it", () => {
    assert.notEqual(
      sessionEditSignature(
        [form({ q1: answered("q1", "a") })],
        resolveSerialize,
      ),
      sessionEditSignature(
        [form({ q1: answered("q1", "b") })],
        resolveSerialize,
      ),
    );
  });

  it("a note on an excluded question flips it", () => {
    const before = form({
      files: response({ question_id: "files", structured_type: "files" }),
    });
    const after = form({
      files: response({
        question_id: "files",
        structured_type: "files",
        note: "see attachment",
      }),
    });

    assert.notEqual(
      sessionEditSignature([before], resolveExclude),
      sessionEditSignature([after], resolveExclude),
    );
  });
});
