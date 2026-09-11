import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  clearOtherUsersFillDrafts,
  clearQuestionnaireFillDrafts,
  FILL_DRAFT_TTL_MS,
  fillDraftStorageKey,
  getFillDraftsVersion,
  subscribeToFillDrafts,
  sweepExpiredFillDrafts,
  writeFillDraftCache,
} from "./fillDraftCache";
import type { FillDraftScope } from "./fillDraftCore";
import { discardLocalFillDraft, listLocalFillDrafts } from "./fillDraftList";

let storage: Record<string, string>;
let events: EventTarget;

beforeEach(() => {
  storage = {};
  const api: Record<string, unknown> = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: new Proxy(storage, {
      get: (target, property) =>
        typeof property === "string" && property in api
          ? api[property]
          : Reflect.get(target, property),
    }),
  });
  events = new EventTarget();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: events,
  });
});

function scope(overrides: Partial<FillDraftScope> = {}): FillDraftScope {
  return {
    userId: "me",
    subjectKey: "encounter:e1",
    entryQuestionnaireId: "form1",
    ...overrides,
  };
}

function form(id = "form1") {
  return {
    questionnaireId: id,
    questionnaireVersion: "1",
    title: "Clinical note",
    structuredSkipped: false,
    responses: {
      q1: {
        question_id: "q1",
        link_id: "note",
        structured_type: null,
        values: [{ type: "string", value: "Private answer" }],
      },
    },
  };
}

function draft(target = scope(), overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 2,
    ...target,
    savedAt: new Date().toISOString(),
    forms: [form(target.entryQuestionnaireId)],
    ...overrides,
  };
}

function put(target = scope(), overrides: Record<string, unknown> = {}) {
  storage[fillDraftStorageKey(target)] = JSON.stringify(
    draft(target, overrides),
  );
}

describe("local draft summaries", () => {
  it("lists only this user's exact encounter, newest first, with metadata and the primary form title", () => {
    put(scope({ userId: "another-user" }));
    put(scope({ subjectKey: "encounter:e2" }));
    put(scope({ subjectKey: "patient:e1" }));
    put(scope(), {
      savedAt: new Date(Date.now() - 1000).toISOString(),
      forms: [form("added"), form()],
    });
    put(scope({ entryQuestionnaireId: "form2" }), {
      forms: [{ ...form("form2"), title: undefined }],
    });
    const summaries = listLocalFillDrafts("me", "encounter:e1");
    assert.equal(summaries.length, 2);
    assert.deepEqual(
      summaries.map((item) => item.scope.entryQuestionnaireId),
      ["form2", "form1"],
    );
    assert.equal(summaries[0].title, undefined);
    assert.equal(summaries[1].title, "Clinical note");
    assert.equal(summaries[1].formCount, 2);
    assert.equal(JSON.stringify(summaries).includes("Private answer"), false);
    assert.equal("forms" in summaries[1], false);
  });

  it("keeps context-specific drafts distinct and preserves their resume scopes", () => {
    put();
    const contextual = scope({
      contextKey: "medicationRequest=rx1&toDischarge=true",
    });
    put(contextual);
    const summaries = listLocalFillDrafts("me", "encounter:e1");
    assert.equal(summaries.length, 2);
    assert.deepEqual(
      summaries.find((item) => item.scope.contextKey)?.scope,
      contextual,
    );
    assert.notEqual(summaries[0].key, summaries[1].key);
  });

  it("ignores expired, unsupported and malformed entries without mutating storage", () => {
    const invalid: Record<string, unknown>[] = [
      { schemaVersion: 1 },
      { schemaVersion: 999 },
      { savedAt: "invalid" },
      {
        savedAt: new Date(Date.now() - FILL_DRAFT_TTL_MS - 1000).toISOString(),
      },
      { forms: null },
      { forms: [] },
      { forms: [null] },
      { forms: [form("other-primary")] },
      { forms: [form(), form()] },
      { forms: [{ ...form(), responses: null }] },
      { forms: [{ ...form(), responses: { q1: null } }] },
      {
        forms: [
          {
            ...form(),
            responses: { q1: { ...form().responses.q1, question_id: "wrong" } },
          },
        ],
      },
      {
        forms: [
          {
            ...form(),
            responses: { q1: { ...form().responses.q1, values: [null] } },
          },
        ],
      },
      {
        forms: [
          {
            ...form(),
            responses: {
              q1: { ...form().responses.q1, draft_context: "invalid" },
            },
          },
        ],
      },
      { forms: [{ ...form(), questionnaireVersion: 1 }] },
    ];
    for (const overrides of invalid) {
      put(scope(), overrides);
      const before = { ...storage };
      assert.deepEqual(
        listLocalFillDrafts("me", "encounter:e1"),
        [],
        JSON.stringify(overrides),
      );
      assert.deepEqual(storage, before);
    }
    storage[fillDraftStorageKey(scope())] = "{broken";
    assert.deepEqual(listLocalFillDrafts("me", "encounter:e1"), []);
  });

  it("rejects envelopes whose user, subject, questionnaire or context disagree with their key", () => {
    const targets = [
      scope({ userId: "other" }),
      scope({ subjectKey: "encounter:other" }),
      scope({ entryQuestionnaireId: "other" }),
      scope({ contextKey: "toDischarge=true" }),
    ];
    for (const target of targets) {
      for (const key of Object.keys(localStorage)) localStorage.removeItem(key);
      localStorage.setItem(
        fillDraftStorageKey(target),
        JSON.stringify(draft(scope())),
      );
      assert.deepEqual(listLocalFillDrafts("me", "encounter:e1"), []);
    }
  });

  it("returns no drafts when browser storage is unavailable", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("Storage disabled");
      },
    });
    assert.deepEqual(listLocalFillDrafts("me", "encounter:e1"), []);
    assert.equal(discardLocalFillDraft(scope()), false);
    assert.doesNotThrow(clearQuestionnaireFillDrafts);
  });
});

describe("draft cache notifications", () => {
  it("notifies on successful same-tab save and exact scoped discard, preserving other contexts/users", () => {
    const contextual = scope({ contextKey: "toDischarge=true" });
    put(contextual);
    put(scope({ userId: "other" }));
    let updates = 0;
    const initialVersion = getFillDraftsVersion();
    const stop = subscribeToFillDrafts(() => {
      updates++;
    });
    try {
      assert.equal(writeFillDraftCache(scope(), JSON.stringify(draft())), true);
      assert.equal(updates, 1);
      assert.equal(discardLocalFillDraft(scope()), true);
      assert.equal(updates, 2);
      assert.equal(discardLocalFillDraft(scope()), true);
      assert.equal(updates, 2);
      assert.equal(getFillDraftsVersion(), initialVersion + 2);
      assert.ok(storage[fillDraftStorageKey(contextual)]);
      assert.ok(storage[fillDraftStorageKey(scope({ userId: "other" }))]);
    } finally {
      stop();
    }
  });

  it("notifies once per sweep only when a matching entry is removed", () => {
    put();
    put(scope({ userId: "other" }));
    put(scope({ entryQuestionnaireId: "expired" }), { savedAt: "invalid" });
    let updates = 0;
    const stop = subscribeToFillDrafts(() => {
      updates++;
    });
    try {
      sweepExpiredFillDrafts();
      assert.equal(updates, 1);
      sweepExpiredFillDrafts();
      assert.equal(updates, 1);
      clearOtherUsersFillDrafts("me");
      assert.equal(updates, 2);
      clearQuestionnaireFillDrafts();
      assert.equal(updates, 3);
      clearQuestionnaireFillDrafts();
      assert.equal(updates, 3);
    } finally {
      stop();
    }
  });

  it("reacts to cross-tab draft writes/clear and ignores unrelated storage changes", () => {
    let updates = 0;
    const stop = subscribeToFillDrafts(() => {
      updates++;
    });
    const dispatch = (key: string | null) => {
      const event = new Event("storage");
      Object.defineProperty(event, "key", { value: key });
      events.dispatchEvent(event);
    };
    dispatch("filters--patients");
    assert.equal(updates, 0);
    dispatch(fillDraftStorageKey(scope()));
    dispatch(null);
    assert.equal(updates, 2);
    stop();
    dispatch(fillDraftStorageKey(scope()));
    assert.equal(updates, 2);
  });

  it("does not announce a failed write", () => {
    let updates = 0;
    const stop = subscribeToFillDrafts(() => {
      updates++;
    });
    try {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        get: () => {
          throw new Error("Storage disabled");
        },
      });
      assert.equal(
        writeFillDraftCache(scope(), JSON.stringify(draft())),
        false,
      );
      assert.equal(updates, 0);
    } finally {
      stop();
    }
  });
});
