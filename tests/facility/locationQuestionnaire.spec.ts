import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/** Backend E2E fixture: subject_type "location", one string question. */
const LOCATION_QUESTIONNAIRE_SLUG = "e2e-subject-location";
const LOCATION_QUESTIONNAIRE_TITLE = "E2E Location Questionnaire";
/** An encounter-subject fixture — must NOT be offered on a location fill. */
const ENCOUNTER_QUESTIONNAIRE_TITLE = "Respiratory Status";

/**
 * Creates a location through the settings UI and opens its view page.
 * Returns the location's id (read back off the URL) so the spec can assert
 * what the submission was recorded against.
 */
async function createAndOpenLocation(
  page: Page,
  facilityId: string,
): Promise<{ id: string; name: string }> {
  const name = `Fill-${faker.string.alphanumeric(8)}`;
  await page.goto(`/facility/${facilityId}/settings/locations`);
  await page.getByRole("button", { name: "Add Location" }).click();
  await page.getByRole("combobox", { name: "Location Form" }).click();
  await page.getByRole("option", { name: "Ward" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("button", { name: "Create" }).click();

  await page.getByRole("textbox", { name: "Search by name" }).fill(name);
  const row = page
    .locator('[data-slot="table-body"] tr')
    .filter({ hasText: name })
    .first();
  await expect(row).toBeVisible();
  await row.click();

  await page.waitForURL(/\/settings\/locations\/[0-9a-f-]+$/);
  const id = page.url().split("/").pop() as string;
  return { id, name };
}

test.describe("Location questionnaire fill", () => {
  let facilityId: string;
  let questionnaireId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
    // Resolve the fixture BEFORE driving any UI: a missing fixture then
    // fails with the helper's "reload backend E2E fixtures" error instead
    // of an inscrutable empty picker.
    questionnaireId = await getQuestionnaireIdBySlug(
      LOCATION_QUESTIONNAIRE_SLUG,
    );
  });

  test("fills and submits a location-subject questionnaire via submit_resource", async ({
    page,
  }) => {
    const answer = `Loc-${faker.string.alphanumeric(10)}`;
    const location = await createAndOpenLocation(page, facilityId);

    await test.step("the location view offers the fill entry point", async () => {
      await page.getByRole("button", { name: "Fill questionnaire" }).click();
      await page.waitForURL(
        `**/facility/${facilityId}/locations/${location.id}/questionnaire`,
      );
      await expect(
        page.getByRole("heading", { name: "Select a questionnaire to fill" }),
      ).toBeVisible();
    });

    await test.step("the picker is scoped to location-subject questionnaires", async () => {
      await page.getByRole("combobox").click();
      const search = page.getByPlaceholder("Search Forms");

      // Positive control FIRST: this picker session can find things, and
      // the location-subject fixture is one of them.
      await search.fill(LOCATION_QUESTIONNAIRE_TITLE);
      await expect(
        page.getByRole("option", { name: LOCATION_QUESTIONNAIRE_TITLE }),
      ).toBeVisible();

      // Only now is an empty result meaningful: an encounter-subject
      // questionnaire is filtered out by subject_type, not by a dead picker.
      await search.fill(ENCOUNTER_QUESTIONNAIRE_TITLE);
      await expect(
        page.getByRole("option", { name: ENCOUNTER_QUESTIONNAIRE_TITLE }),
      ).toHaveCount(0);
      await expect(page.getByText("No Results Found")).toBeVisible();

      await search.fill(LOCATION_QUESTIONNAIRE_TITLE);
      await page
        .getByRole("option", { name: LOCATION_QUESTIONNAIRE_TITLE })
        .click();
      await page.waitForURL(
        `**/facility/${facilityId}/locations/${location.id}/questionnaire/${questionnaireId}`,
      );
    });

    await test.step("a resource subject gets the lean shell — no patient context", async () => {
      // Fill routes opt out of the app sidebar for every subject.
      await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
      // No patient means no clinical-history tab and no blood-group strip.
      await expect(
        page.getByRole("tab", { name: "Patient Clinical History" }),
      ).toHaveCount(0);
      await expect(page.getByText("Blood Group:")).toHaveCount(0);
    });

    await test.step("answering and submitting posts to submit_resource", async () => {
      await questionBlock(page, "Notes").getByRole("textbox").fill(answer);

      const batchRequest = page.waitForRequest(
        (request) =>
          request.url().includes("/api/v1/batch_requests/") &&
          request.method() === "POST",
      );
      await page.getByRole("button", { name: "Save Changes" }).click();

      const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
        requests: { url: string; body: { resource_id: string } }[];
      };
      expect(body.requests).toHaveLength(1);
      expect(body.requests[0].url).toContain(
        `/api/v1/questionnaire/${questionnaireId}/submit_resource/`,
      );
      expect(body.requests[0].body.resource_id).toBe(location.id);
      // Resource subjects carry no patient/encounter on the submission.
      expect(body.requests[0].body).not.toHaveProperty("patient");
      expect(body.requests[0].body).not.toHaveProperty("encounter");

      await expectToast(page, "Questionnaire submitted successfully");
      // Submission returns to the location it was filled for.
      await page.waitForURL(
        `**/facility/${facilityId}/settings/locations/${location.id}`,
      );
    });
  });

  test("an unanswered location fill never reaches the network", async ({
    page,
  }) => {
    const location = await createAndOpenLocation(page, facilityId);
    await page.goto(
      `/facility/${facilityId}/locations/${location.id}/questionnaire/${questionnaireId}`,
    );
    await expect(questionBlock(page, "Notes")).toBeVisible();

    // Counted from before the click, so nothing can slip past unobserved.
    let batchCalls = 0;
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/batch_requests/")) batchCalls += 1;
    });
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, /Nothing to submit yet/);

    // A negative assertion read at toast time proves nothing — let the page
    // go quiet first, so a late request would still be counted.
    await page.waitForLoadState("networkidle");
    expect(batchCalls).toBe(0);
    expect(page.url()).toContain(`/questionnaire/${questionnaireId}`);
  });
});
