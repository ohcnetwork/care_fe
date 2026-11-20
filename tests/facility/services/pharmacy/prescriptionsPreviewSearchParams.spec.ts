import { expect, test, type Page } from "@playwright/test";
import { openServiceLocation } from "tests/facility/services/helpers";
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
    const pharmacyPath = await openServiceLocation(
      page,
      getFacilityId(),
      "Main Pharmacy",
      "Pharmacy",
    );
    await expect(
      page.getByRole("tab", { name: "Billing Pending", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    // The queue lists prescriptions to bill. Filter it by the first patient
    // to select their prescriptions.
    await page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first()
      .getByRole("cell")
      .first()
      .click();
    await expect(page).toHaveURL(/[?&]patient_external_id=/);
    const preview = page.getByRole("link", { name: "Preview Selected Rx" });
    await expect(preview).toBeVisible();
    previewUrl = (await preview.getAttribute("href"))!;
    expect(previewUrl).toContain(`${pharmacyPath}/medication_requests/`);
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
