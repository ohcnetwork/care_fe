import { expect, test } from "@playwright/test";

/**
 * Guards the auth-boundary lifecycle of local questionnaire fill drafts
 * (`src/components/QuestionnaireV2/fill/draft/fillDraftCache.ts`):
 *
 * - A draft sitting at the login form (e.g. left behind by a session
 *   expiry) must survive a mistyped password — it is recoverable work,
 *   not something a failed login attempt should destroy.
 * - Credentials being ACCEPTED clears every OTHER user's draft
 *   (`clearOtherUsersFillDrafts`, wired into the JWT sign-in success branch
 *   in `AuthUserProvider.tsx`) — a shared machine gets a clean slate for a
 *   different account — but the just-authenticated user's OWN draft
 *   survives: that is the crash/session-expiry recovery this feature
 *   exists for, not something re-login should destroy.
 * - The boot-time sweep (`sweepExpiredFillDrafts`) only removes EXPIRED
 *   drafts, so fresh drafts seeded right before the app mounts must still
 *   be there after boot — the eventual disappearance of the OTHER-user
 *   draft is attributable to the post-auth clear, not the sweep.
 *
 * Matches the shape `fillDraftStore.ts` writes to localStorage — see
 * `draftKey()` / `StoredFillDraft` there — and the userId-prefix parsing
 * `clearOtherUsersFillDrafts` does in `fillDraftCache.ts`.
 */
const FILL_DRAFT_PREFIX = "care_qn_fill_draft--";
// src/common/constants.tsx LocalStorageKeys — tests can't import "@/*"
// (tests/tsconfig.json's "paths" only maps "tests/*", it doesn't inherit
// the app's aliases), so the raw key strings are duplicated here.
const ACCESS_TOKEN_KEY = "care_access_token";
const REFRESH_TOKEN_KEY = "care_refresh_token";

const OTHER_USER_DRAFT_KEY = `${FILL_DRAFT_PREFIX}some-other-user--some-patient--some-questionnaire`;

/**
 * Post-login landing: any URL that is no longer the login page. A
 * predicate, not a regex — the negative-lookahead idiom (`/(?!.*login)/`)
 * matches EVERY url (the lookahead succeeds at the end of the string), so
 * it waits for nothing at all, and this test strips the tokens the moment
 * the wait returns.
 */
function loggedInUrl(url: URL): boolean {
  return !url.pathname.startsWith("/login");
}

function draftKeyFor(userId: string): string {
  return `${FILL_DRAFT_PREFIX}${userId}--some-patient--some-questionnaire`;
}

function buildSeededDraft(userId: string) {
  return {
    schemaVersion: 2,
    // Fresh timestamp — well inside the 24h TTL — so the boot sweep must
    // not treat this as expired.
    savedAt: new Date().toISOString(),
    userId,
    subjectKey: "some-patient",
    entryQuestionnaireId: "some-questionnaire",
    forms: [
      {
        questionnaireId: "some-questionnaire",
        questionnaireVersion: "1",
        title: "Seeded draft for auth-boundary spec",
        responses: {},
        structuredSkipped: false,
      },
    ],
  };
}

test.describe("Fill draft lifecycle at the login form", () => {
  // One test, deliberately sequential: discovering the real admin user id
  // (needed to seed a same-user draft correctly) requires an ordinary
  // login first, so id discovery and the actual scenario cannot be split
  // into independent `test()` blocks without either re-authenticating twice
  // or hardcoding a backend-specific id. A single test keeps that dependency
  // explicit instead of hiding it behind Playwright's test-level parallelism.
  test("an other-user draft is cleared on successful login; a failed login and the same user's own draft both survive", async ({
    page,
  }) => {
    // Discover the real authenticated user id.
    // `clearOtherUsersFillDrafts` is keyed off `CurrentUserRead.id` (the
    // same value `QuestionnaireFillPage` uses as `FillDraftScope.userId`),
    // not the JWT's own `user_id` claim — the two are not guaranteed to be
    // the same value, so this test reads it straight from the app's own
    // `getcurrentuser` response rather than assume a token-decoding shortcut.
    await page.goto("/login");
    const currentUserResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/getcurrentuser/") && res.ok(),
    );
    await page.getByRole("textbox", { name: /username/i }).fill("admin");
    await page.getByLabel(/password/i).fill("admin");
    await page.getByRole("button", { name: /login/i }).click();
    const currentUserResponse = await currentUserResponsePromise;
    const { id: adminUserId } = (await currentUserResponse.json()) as {
      id: string;
    };
    expect(adminUserId).toBeTruthy();
    await page.waitForURL(loggedInUrl, { timeout: 15000 });

    // Drop back to a logged-out /login without going through the sign-out
    // UI: signOut() does a full, unconditional draft clear (unchanged by
    // this feature and not what this test is about), and this test hasn't
    // seeded anything yet for it to destroy. Directly clearing the tokens
    // is equivalent from the boot sweep's/clear's perspective — both only
    // ever read localStorage, never React/query state.
    await page.evaluate(
      ({ accessKey, refreshKey }) => {
        localStorage.removeItem(accessKey);
        localStorage.removeItem(refreshKey);
      },
      { accessKey: ACCESS_TOKEN_KEY, refreshKey: REFRESH_TOKEN_KEY },
    );

    // Seed one other-user draft and one same-user draft.
    const sameUserDraftKey = draftKeyFor(adminUserId);
    await page.addInitScript(
      ({ otherKey, otherValue, sameKey, sameValue }) => {
        localStorage.setItem(otherKey, JSON.stringify(otherValue));
        localStorage.setItem(sameKey, JSON.stringify(sameValue));
      },
      {
        otherKey: OTHER_USER_DRAFT_KEY,
        otherValue: buildSeededDraft("some-other-user"),
        sameKey: sameUserDraftKey,
        sameValue: buildSeededDraft(adminUserId),
      },
    );

    await page.goto("/login");

    // Sanity: the boot sweep ran (AuthUserProvider mounts on every route)
    // and left both fresh drafts alone.
    await expect
      .poll(() =>
        page.evaluate((key) => localStorage.getItem(key), OTHER_USER_DRAFT_KEY),
      )
      .not.toBeNull();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), sameUserDraftKey),
    ).not.toBeNull();

    // A mistyped password must not touch either draft.
    await page.getByRole("textbox", { name: /username/i }).fill("admin");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page.getByText(/no active account found/i)).toBeVisible({
      timeout: 10000,
    });

    expect(
      await page.evaluate(
        (key) => localStorage.getItem(key),
        OTHER_USER_DRAFT_KEY,
      ),
    ).not.toBeNull();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), sameUserDraftKey),
    ).not.toBeNull();

    // Sign in correctly as the same user.
    await page.getByLabel(/password/i).fill("admin");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL(loggedInUrl, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /^Hey .+/ })).toBeVisible();

    // The OTHER user's draft is gone — cleared as soon as credentials were
    // accepted.
    await expect
      .poll(() =>
        page.evaluate((key) => localStorage.getItem(key), OTHER_USER_DRAFT_KEY),
      )
      .toBeNull();

    // The SAME user's own draft survived re-login — recovering it is the
    // whole point of the local draft layer.
    expect(
      await page.evaluate((key) => localStorage.getItem(key), sameUserDraftKey),
    ).not.toBeNull();
  });
});
