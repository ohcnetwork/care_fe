import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  FILL_DRAFT_PREFIX,
  clearOtherUsersFillDrafts,
  clearQuestionnaireFillDrafts,
  isFillDraftExpired,
  sweepExpiredFillDrafts,
} from "./fillDraftCache";

const TTL_MS = 24 * 60 * 60 * 1000;

/** Map-backed `localStorage`: the sweeps enumerate it with
 *  `Object.keys(localStorage)`, so the stored entries must be the object's
 *  own enumerable keys — the API methods live behind a proxy instead. */
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

function draftKey(userId: string, rest = "subject--questionnaire"): string {
  return `${FILL_DRAFT_PREFIX}${userId}--${rest}`;
}

function savedAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

describe("isFillDraftExpired — the TTL boundary drafts live or die on", () => {
  it("a draft saved just INSIDE the 24h window is alive", () => {
    assert.equal(isFillDraftExpired(savedAgo(TTL_MS - 60_000)), false);
  });

  it("a draft saved just PAST the 24h window is expired", () => {
    assert.equal(isFillDraftExpired(savedAgo(TTL_MS + 60_000)), true);
  });

  it("an unparseable timestamp counts as expired — an entry we cannot date is not one we may keep", () => {
    assert.equal(isFillDraftExpired("not-a-date"), true);
    assert.equal(isFillDraftExpired(""), true);
  });

  it("a FUTURE timestamp (clock skew) is not expired", () => {
    assert.equal(
      isFillDraftExpired(new Date(Date.now() + 60_000).toISOString()),
      false,
    );
  });
});

describe("sweepExpiredFillDrafts — boot-time housekeeping", () => {
  it("removes expired and corrupt entries, keeps fresh ones and never touches unrelated keys", () => {
    store[draftKey("u1", "fresh")] = JSON.stringify({
      savedAt: savedAgo(60_000),
    });
    store[draftKey("u1", "stale")] = JSON.stringify({
      savedAt: savedAgo(TTL_MS + 60_000),
    });
    store[draftKey("u2", "corrupt")] = "{not json";
    store[draftKey("u2", "undated")] = JSON.stringify({ forms: [] });
    store["care_access_token"] = "keep-me";

    sweepExpiredFillDrafts();

    assert.deepEqual(Object.keys(store).sort(), [
      "care_access_token",
      draftKey("u1", "fresh"),
    ]);
  });
});

describe("clearOtherUsersFillDrafts — shared-device protection at login", () => {
  it("keeps the just-authenticated user's drafts and drops every other user's", () => {
    store[draftKey("me", "a")] = JSON.stringify({ savedAt: savedAgo(1000) });
    store[draftKey("me", "b")] = JSON.stringify({ savedAt: savedAgo(1000) });
    store[draftKey("someone-else", "a")] = JSON.stringify({
      savedAt: savedAgo(1000),
    });
    store["care_access_token"] = "keep-me";

    clearOtherUsersFillDrafts("me");

    assert.deepEqual(Object.keys(store).sort(), [
      "care_access_token",
      draftKey("me", "a"),
      draftKey("me", "b"),
    ]);
  });

  it("a key whose userId segment is missing is untrusted and removed", () => {
    store[`${FILL_DRAFT_PREFIX}--subject--questionnaire`] = "{}";
    store[FILL_DRAFT_PREFIX] = "{}";

    clearOtherUsersFillDrafts("me");

    assert.deepEqual(Object.keys(store), []);
  });
});

describe("clearQuestionnaireFillDrafts — deliberate sign-out and app update", () => {
  it("removes every fill draft and nothing else", () => {
    store[draftKey("me")] = "{}";
    store[draftKey("other")] = "{}";
    store["care_access_token"] = "keep-me";
    store["filters--patients"] = "keep-me";

    clearQuestionnaireFillDrafts();

    assert.deepEqual(Object.keys(store).sort(), [
      "care_access_token",
      "filters--patients",
    ]);
  });
});
