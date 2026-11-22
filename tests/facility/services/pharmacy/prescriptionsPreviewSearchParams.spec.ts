import { expect, test, type Page } from "@playwright/test";
import { openServiceLocation } from "tests/facility/services/helpers";
import {
  createQuestionnaireEncounter,
  submitAndExpectSuccess,
} from "tests/helper/questionnaire";
import { filterSelectButton } from "tests/helper/searchParams";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The prescriptions preview reads its medication search and dispense status
// with a typed search schema (`src/lib/router/search/pharmacy.ts`).

test.describe("Prescriptions preview search params", () => {
  let previewUrl: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    const facilityId = getFacilityId();
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/medication_request`,
    );
    await page
      .getByRole("combobox")
      .filter({ hasText: /Add Medication/i })
      .click();
    await page.getByRole("tab", { name: "Medication" }).click();
    await page
      .getByPlaceholder(/Search Medications/i)
      .fill("Senna 15 mg oral tablet");
    await page
      .getByRole("option", { name: "Senna 15 mg oral tablet", exact: true })
      .click();
    await page
      .locator('input[placeholder="Enter a number..."]:not([disabled])')
      .fill("1");
    await page.getByRole("option", { name: "1 tablets", exact: true }).click();
    await page
      .locator('button[role="combobox"]:not([disabled])')
      .filter({ hasText: "eg. 1-0-1" })
      .click();
    await page.getByPlaceholder("Type eg. 1-0-1").fill("1-0-1");
    await page.getByRole("option", { name: "1-0-1 (Twice a day)" }).click();
    const duration = page.getByRole("textbox", { name: "Duration" });
    await duration.click();
    await duration.fill("2 days");
    await page
      .locator('[data-slot="popover-content"]')
      .getByRole("button", { name: "2 days", exact: true })
      .click();
    await submitAndExpectSuccess(page);

    const pharmacyPath = await openServiceLocation(
      page,
      facilityId,
      "Main Pharmacy",
      "Pharmacy",
    );
    const queueResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        response.request().method() === "GET" &&
        url.pathname.endsWith("/medication_prescription/summary/") &&
        url.searchParams.get("patient_external_id") === patientId
      );
    });
    await page.goto(
      `${pharmacyPath}/medication_requests?patient_external_id=${patientId}`,
    );
    const response = await queueResponse;
    expect(response.ok()).toBe(true);
    const queue = (await response.json()) as {
      results: { id: string; encounter: { id: string } }[];
    };
    expect(queue.results).toHaveLength(1);
    expect(queue.results[0].encounter.id).toBe(encounterId);
    await expect(
      page.getByRole("tab", { name: "Billing Pending", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.locator('[data-slot="table-body"] [data-slot="table-row"]'),
    ).toHaveCount(1);
    const preview = page.getByRole("link", { name: "Preview Selected Rx" });
    await expect(preview).toBeVisible();
    previewUrl = (await preview.getAttribute("href"))!;
    expect(previewUrl).toContain(
      `${pharmacyPath}/medication_requests/patient/${patientId}/prescriptions/${queue.results[0].id}`,
    );
    await context.close();
  });

  const searchBox = (page: Page) => page.getByPlaceholder("Search Medications");
  const statusSelect = (page: Page) =>
    filterSelectButton(page, "Dispense Status");

  test("writes the medication search and the status to the URL", async ({
    page,
  }) => {
    await page.goto(previewUrl);
    await expect(statusSelect(page)).toContainText("All");

    await searchBox(page).fill("para");
    await expect(page).toHaveURL(/[?&]search=para(&|$)/);

    await statusSelect(page).click();
    await page
      .getByRole("menuitemradio", { name: "Partial", exact: true })
      .click();
    await expect(page).toHaveURL(/[?&]status=partial(&|$)/);
    await expect(statusSelect(page)).toContainText("Partial");
  });

  test("restores the search and the status from a bookmarked URL", async ({
    page,
  }) => {
    await page.goto(`${previewUrl}?search=para&status=complete`);

    await expect(searchBox(page)).toHaveValue("para");
    await expect(statusSelect(page)).toContainText("Complete");
  });

  test("ignores an invalid status", async ({ page }) => {
    await page.goto(`${previewUrl}?status=bogus`);

    await expect(statusSelect(page)).toContainText("All");
    await expect(page).not.toHaveURL(/status=/);
  });
});
