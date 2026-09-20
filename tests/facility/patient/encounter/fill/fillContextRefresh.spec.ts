import { expect, test } from "@playwright/test";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const REFRESH_FAILED =
  "Couldn't refresh this form's context. Your answers are still here. Try again before saving.";
const flagRequested = process.env.REACT_ENABLE_QUESTIONNAIRE_DRAFT === "true";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

for (const target of [
  "questionnaire",
  "encounter",
  "patient",
  "server draft",
] as const) {
  test(`${target} background failure preserves edited answers through retry`, async ({
    page,
    context,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const patientId = getPatientId();
    const encounterId = getEncounterId();
    const draftId = crypto.randomUUID();
    const patientUrl = `/facility/${getFacilityId()}/patient/${patientId}`;
    const fillUrl = `${patientUrl}${target === "patient" ? "" : `/encounter/${encounterId}`}/questionnaire/${questionnaireId}${target === "server draft" ? `?continue_draft=${draftId}` : ""}`;
    const draftEndpoint = `/api/v1/form_submission/${draftId}/`;
    if (target === "server draft") {
      await page.route(
        (url) => url.pathname === draftEndpoint,
        (route) =>
          route.fulfill({
            json: {
              id: draftId,
              status: "draft",
              response_dump: {
                questionnaireResponses: {
                  questionnaire: { id: questionnaireId },
                  responses: [],
                },
              },
            },
          }),
      );
    }

    await page.goto(fillUrl);
    const note = questionBlock(page, "Note on Bilateral Air Entry").getByRole(
      "textbox",
    );
    await expect(note).toBeVisible();
    await page.waitForLoadState("networkidle");
    await note.fill("Edited before the refresh");
    const originalInput = await note.elementHandle();
    expect(originalInput).not.toBeNull();
    const save = page.getByRole("button", {
      name: "Save Changes",
      exact: true,
    });
    const saveDraft = page.getByRole("button", {
      name: "Save as Draft",
      exact: true,
    });
    const hasDraftSave = await saveDraft.isVisible();
    if (flagRequested && target !== "patient") {
      expect(hasDraftSave, "the built app must enable server drafts").toBe(
        true,
      );
    }

    const endpoint = {
      questionnaire: `/api/v1/questionnaire/${questionnaireId}/`,
      encounter: `/api/v1/encounter/${encounterId}/`,
      patient: `/api/v1/patient/${patientId}/`,
      "server draft": draftEndpoint,
    }[target];
    const matchesEndpoint = (url: URL) => url.pathname === endpoint;
    const refreshStarted = deferred();
    const releaseFailure = deferred();
    const retryStarted = deferred();
    const releaseRetry = deferred();
    let failRefresh = true;
    await page.route(matchesEndpoint, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      if (failRefresh) {
        refreshStarted.resolve();
        await releaseFailure.promise;
        return route.fulfill({
          status: 503,
          json: { detail: "Temporary test refresh failure" },
        });
      }
      retryStarted.resolve();
      await releaseRetry.promise;
      return route.fallback();
    });

    try {
      // Reconnect triggers the normal stale-query refetch without navigating
      // away from the form or exposing QueryClient through a test-only API.
      await context.setOffline(true);
      await expect
        .poll(() => page.evaluate(() => navigator.onLine))
        .toBe(false);
      await context.setOffline(false);
      await refreshStarted.promise;

      // Ordinary background loading must neither remount nor freeze editing.
      await expect(save).toBeEnabled();
      await expect(note).toBeEnabled();
      await note.fill("Edited during the refresh");
      releaseFailure.resolve();

      const alert = page.getByRole("alert").filter({ hasText: REFRESH_FAILED });
      await expect(alert).toBeVisible();
      await expect(note).toHaveValue("Edited during the refresh");
      expect(await originalInput!.evaluate((input) => input.isConnected)).toBe(
        true,
      );
      await expect(save).toBeDisabled();
      if (hasDraftSave) await expect(saveDraft).toBeDisabled();
      await expect(note).toBeEnabled();
      await note.fill("Edited after the failed refresh");

      failRefresh = false;
      const retry = alert.getByRole("button", {
        name: "Try Again",
        exact: true,
      });
      await retry.click();
      await retryStarted.promise;
      await expect(retry).toBeDisabled();
      await expect(save).toBeDisabled();
      if (hasDraftSave) await expect(saveDraft).toBeDisabled();
      await note.fill("Edited during retry");
      releaseRetry.resolve();

      await expect(alert).toHaveCount(0);
      await expect(save).toBeEnabled();
      if (hasDraftSave) await expect(saveDraft).toBeEnabled();
      await expect(note).toHaveValue("Edited during retry");
      expect(await originalInput!.evaluate((input) => input.isConnected)).toBe(
        true,
      );
      // History owns a separate lazy panel; switching must keep these same
      // stores alive after query recovery too.
      await page.getByRole("tab", { name: "Patient Clinical History" }).click();
      await page.getByRole("tab", { name: /^Questionnaire/ }).click();
      await expect(note).toHaveValue("Edited during retry");
      expect(await originalInput!.evaluate((input) => input.isConnected)).toBe(
        true,
      );
    } finally {
      releaseFailure.resolve();
      releaseRetry.resolve();
      await context.setOffline(false);
      await page.unroute(matchesEndpoint);
    }
  });
}
