import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Observations Tab", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
  });

  test("should display the observations tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Observations" }).click();
    await expect(page).toHaveURL(/\/observations$/);

    await expect(
      page.getByRole("tabpanel", { name: "Observations" }),
    ).toBeVisible();
  });

  test("should add a symptom via the encounter actions command palette", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /encounter actions/i })
      .first()
      .click();

    const palette = page.getByRole("dialog", { name: "Command Palette" });
    await expect(palette).toBeVisible();
    await palette.getByRole("option", { name: /add symptom/i }).click();

    await page.waitForURL(/\/questionnaire/);

    const combobox = page
      .getByRole("combobox")
      .filter({ hasText: /add symptom|add another symptom/i });
    await combobox.scrollIntoViewIfNeeded();
    await combobox.click();

    const search = page.locator("[cmdk-input]");
    await search.waitFor({ state: "visible" });
    await search.fill("Headache");
    await page
      .getByRole("option", { name: /headache/i })
      .first()
      .click();

    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire submitted successfully"),
    ).toBeVisible();
  });

  test("should navigate between encounter tabs without errors", async ({
    page,
  }) => {
    const tabs: [string, RegExp][] = [
      ["Observations", /\/observations$/],
      ["Medicines", /\/medicines$/],
      ["Service Requests", /\/service_requests$/],
      ["Files", /\/files$/],
      ["Notes", /\/notes$/],
      ["Overview", /\/updates$/],
    ];
    for (const [tabName, url] of tabs) {
      await page.getByRole("tab", { name: tabName }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByText(/something went wrong/i)).toBeHidden();
    }
  });
});
