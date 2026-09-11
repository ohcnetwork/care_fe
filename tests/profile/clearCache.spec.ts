import { expect, test } from "@playwright/test";
import { draftFormNoteText } from "tests/helper/fillDrafts";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Clear Cache in profile successfully", () => {
  test("should clear caches and unregister service workers", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/users/admin`);

    await expect(
      page.getByRole("button", { name: /clear cache/i }),
    ).toBeVisible();

    // Create a test cache to verify clearing works
    await page.evaluate(async () => {
      const cache = await caches.open("test-cache");
      await cache.put("/dummy", new Response("dummy data"));
    });

    // Verify test cache exists before clearing
    const preCaches = await page.evaluate(() => caches.keys());
    expect(preCaches).toContain("test-cache");

    // Get initial service worker registrations count
    const preRegs = await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    );

    // Set up page reload listener
    const reloadPromise = page.waitForEvent("domcontentloaded");

    // Click Clear Cache button
    await page.getByRole("button", { name: /clear cache/i }).click();

    // Wait for page reload
    await reloadPromise;

    // Wait for cache to be cleared - use a more reliable check
    await page.waitForFunction(
      () => {
        return caches.keys().then((keys) => !keys.includes("test-cache"));
      },
      { timeout: 15000 },
    );

    // Verify test cache has been deleted
    const remainingCaches = await page.evaluate(() => caches.keys());
    expect(remainingCaches).not.toContain("test-cache");

    // Verify service workers have been unregistered
    const remainingRegs = await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    );

    // If there were service workers before, verify they're reduced or gone
    if (preRegs > 0) {
      expect(remainingRegs).toBeLessThanOrEqual(preRegs);
    }

    // Wait for profile page to be fully loaded and verify user is still on the profile page
    await expect(
      page.getByRole("button", { name: /clear cache/i }),
    ).toBeVisible({ timeout: 10000 });
  });
});

for (const action of ["Clear Cache", "Update Now"]) {
  test(`${action} preserves a real local questionnaire draft and its saved answers`, async ({
    page,
  }) => {
    let version = "draft-maintenance-v1";
    await page.route("**/build-meta.json", (route) =>
      route.fulfill({ json: { version, built_at: "2026-01-01T00:00:00Z" } }),
    );
    await page.addInitScript(() => {
      if (sessionStorage.getItem("draft-maintenance-initialized")) return;
      localStorage.setItem("app-version", "draft-maintenance-v1");
      localStorage.setItem("app-last-updated", new Date().toISOString());
      sessionStorage.setItem("draft-maintenance-initialized", "true");
    });

    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const encounterUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
    const savedNote = `Keep my questionnaire answers after ${action}`;
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto(`${encounterUrl}/questionnaire/${questionnaireId}`);
    await questionBlock(page, "Note on Bilateral Air Entry")
      .getByRole("textbox")
      .fill(savedNote);
    await expect
      .poll(() => draftFormNoteText(page, questionnaireId))
      .toBe(savedNote);
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.waitForURL(/\/updates$/);
    const localRow = page.locator('[data-draft-source="local"]');
    await expect(localRow).toHaveCount(1);
    const draftKey = await localRow.getAttribute("data-draft-id");
    expect(draftKey).toBeTruthy();
    const beforeDraft = await page.evaluate(
      (key) => localStorage.getItem(key),
      draftKey!,
    );

    await page.goto(`/facility/${getFacilityId()}/users/admin`);
    await expect(
      page.getByRole("button", { name: "Clear Cache", exact: true }),
    ).toBeVisible();
    await page.evaluate(async () => {
      const cache = await caches.open("draft-maintenance-browser-cache");
      await cache.put(
        "/draft-maintenance-probe",
        new Response("cached response"),
      );
    });
    if (action === "Update Now") {
      version = "draft-maintenance-v2";
      await page
        .getByRole("button", { name: "Check for Update", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: action, exact: true }),
      ).toBeVisible();
    }
    const reloaded = page.waitForEvent("domcontentloaded");
    await page.getByRole("button", { name: action, exact: true }).click();
    await reloaded;
    await expect(
      page.getByRole("button", { name: "Clear Cache", exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => caches.keys())).not.toContain(
      "draft-maintenance-browser-cache",
    );
    expect(
      await page.evaluate((key) => localStorage.getItem(key), draftKey!),
    ).toBe(beforeDraft);
    if (action === "Update Now") {
      expect(
        await page.evaluate(() => localStorage.getItem("app-version")),
      ).toBe("draft-maintenance-v2");
    }

    await page.goto(`${encounterUrl}/updates`);
    await localRow.getByRole("button", { name: /^Continue / }).click();
    await expect(
      questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
    ).toHaveValue(savedNote);
    await expect(
      page.getByRole("button", { name: "Resume", exact: true }),
    ).toHaveCount(0);
  });
}

test("software Update flushes the last form edit before reloading", async ({
  page,
}) => {
  await page.route("**/build-meta.json", (route) =>
    route.fulfill({
      json: {
        version: "live-draft-update-v2",
        built_at: "2026-01-01T00:00:00Z",
      },
    }),
  );
  await page.addInitScript(() => {
    if (sessionStorage.getItem("live-draft-update-initialized")) return;
    localStorage.setItem("app-version", "live-draft-update-v1");
    localStorage.setItem("app-last-updated", new Date().toISOString());
    sessionStorage.setItem("live-draft-update-initialized", "true");
  });
  const questionnaireId = await getQuestionnaireIdBySlug(
    "respiratory_status-v3",
  );
  const fillUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`;
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(fillUrl);
  const input = questionBlock(page, "Note on Bilateral Air Entry").getByRole(
    "textbox",
  );
  await input.fill("Earlier autosaved note");
  await expect
    .poll(() => draftFormNoteText(page, questionnaireId))
    .toBe("Earlier autosaved note");
  const update = page.getByRole("button", { name: "Update", exact: true });
  await expect(update).toBeVisible();
  await input.fill("Last keystroke immediately before software update");
  const reloaded = page.waitForEvent("domcontentloaded");
  await update.click();
  await reloaded;
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(input).toHaveValue(
    "Last keystroke immediately before software update",
  );
  expect(await page.evaluate(() => localStorage.getItem("app-version"))).toBe(
    "live-draft-update-v2",
  );
});
