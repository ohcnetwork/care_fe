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

/** Backend E2E fixture: subject_type "device", one string question. */
const DEVICE_QUESTIONNAIRE_SLUG = "e2e-subject-device";
const DEVICE_QUESTIONNAIRE_TITLE = "E2E Device Questionnaire";

/**
 * Registers a device through the settings UI and opens its detail page.
 * Returns the device's id (read back off the URL) so the spec can assert
 * what the submission was recorded against.
 */
async function createAndOpenDevice(
  page: Page,
  facilityId: string,
): Promise<{ id: string; name: string }> {
  const name = `Fill-${faker.string.alphanumeric(8)}`;
  await page.goto(`/facility/${facilityId}/settings/devices`);
  await page.getByRole("link", { name: "Add Device" }).click();
  await page.getByRole("textbox", { name: "Registered Name *" }).fill(name);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Device registered successfully")).toBeVisible();

  await page.goto(`/facility/${facilityId}/settings/devices`);
  await page.getByRole("textbox", { name: "Search devices..." }).fill(name);
  await page.getByRole("link", { name }).click();
  await page.waitForURL(/\/settings\/devices\/[0-9a-f-]+$/);
  return { id: page.url().split("/").pop() as string, name };
}

test.describe("Device questionnaire fill", () => {
  let facilityId: string;
  let questionnaireId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
    // Resolve the fixture BEFORE driving any UI — a missing fixture fails
    // with the helper's "reload backend E2E fixtures" error.
    questionnaireId = await getQuestionnaireIdBySlug(DEVICE_QUESTIONNAIRE_SLUG);
  });

  test("fills and submits a device-subject questionnaire via submit_resource", async ({
    page,
  }) => {
    const answer = `Dev-${faker.string.alphanumeric(10)}`;
    const device = await createAndOpenDevice(page, facilityId);

    await test.step("the device page offers the fill entry point", async () => {
      await page.getByRole("button", { name: "Fill questionnaire" }).click();
      // The device fill route must win over "/devices/:id" — raviger
      // matches in registration order.
      await page.waitForURL(
        `**/facility/${facilityId}/settings/devices/${device.id}/questionnaire`,
      );
      await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "Select a questionnaire to fill" }),
      ).toBeVisible();
    });

    await test.step("the picker is scoped to device-subject questionnaires", async () => {
      await page.getByRole("combobox").click();
      await page
        .getByPlaceholder("Search Forms")
        .fill(DEVICE_QUESTIONNAIRE_TITLE);
      await page
        .getByRole("option", { name: DEVICE_QUESTIONNAIRE_TITLE })
        .click();
      await page.waitForURL(
        `**/facility/${facilityId}/settings/devices/${device.id}/questionnaire/${questionnaireId}`,
      );
      await expect(
        page.getByRole("tab", { name: "Patient Clinical History" }),
      ).toHaveCount(0);
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
      expect(body.requests[0].body.resource_id).toBe(device.id);
      expect(body.requests[0].body).not.toHaveProperty("patient");
      expect(body.requests[0].body).not.toHaveProperty("encounter");

      await expectToast(page, "Questionnaire submitted successfully");
      // Submission returns to the device it was filled for.
      await page.waitForURL(
        `**/facility/${facilityId}/settings/devices/${device.id}`,
      );
    });
  });
});
