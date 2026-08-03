import { expect, test } from "@playwright/test";

/**
 * Guards the auth-boundary lifecycle of local questionnaire fill drafts
 * (`src/components/QuestionnaireV2/fill/draft/fillDraftCache.ts`):
 *
 * - A draft sitting at the login form (e.g. left behind by a session
 *   expiry) must survive a mistyped password — it is recoverable work,
 *   not something a failed login attempt should destroy.
 * - It is only cleared once credentials are ACCEPTED (the JWT sign-in
 *   success branch in `AuthUserProvider.tsx`), never before.
 * - The boot-time sweep (`sweepExpiredFillDrafts`) only removes EXPIRED
 *   drafts, so a fresh draft seeded right before the app mounts must
 *   still be there after boot — the eventual disappearance in this test
 *   is attributable to the post-auth clear, not the sweep.
 *
 * Matches the shape `fillDraftStore.ts` writes to localStorage — see
 * `draftKey()` and `StoredFillDraft` there.
 */
const FILL_DRAFT_PREFIX = "care_qn_fill_draft--";
// The scope's userId is arbitrary and unrelated to the account that logs
// in below: the post-auth clear is a prefix sweep over every
// `care_qn_fill_draft--*` key, not a per-user lookup.
const DRAFT_KEY = `${FILL_DRAFT_PREFIX}some-other-user--some-patient--some-questionnaire`;

function buildSeededDraft() {
  return {
    schemaVersion: 2,
    // Fresh timestamp — well inside the 24h TTL — so the boot sweep must
    // not treat this as expired.
    savedAt: new Date().toISOString(),
    userId: "some-other-user",
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
  test("survives a failed login and is cleared only after a successful one", async ({
    page,
  }) => {
    const draft = buildSeededDraft();

    // Seed the draft before any app script runs, so the boot-time sweep
    // effect in AuthUserProvider actually runs over this key.
    await page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      { key: DRAFT_KEY, value: draft },
    );

    await page.goto("/login");

    // Sanity: the boot sweep ran (AuthUserProvider mounts on every route)
    // and left the fresh draft alone.
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), DRAFT_KEY))
      .not.toBeNull();

    // Attempt login with a mistyped password.
    await page.getByRole("textbox", { name: /username/i }).fill("admin");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page.getByText(/no active account found/i)).toBeVisible({
      timeout: 10000,
    });

    // The failed attempt must not have touched the draft.
    expect(
      await page.evaluate((key) => localStorage.getItem(key), DRAFT_KEY),
    ).not.toBeNull();

    // Now sign in with the correct password.
    await page.getByLabel(/password/i).fill("admin");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL(/(?!.*login)/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /^Hey .+/ })).toBeVisible();

    // Credentials were accepted — the post-auth clear removed the draft.
    expect(
      await page.evaluate((key) => localStorage.getItem(key), DRAFT_KEY),
    ).toBeNull();
  });
});
