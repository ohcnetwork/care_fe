import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const allergyOptions = [
  "Fezolinetant",
  "Anifrolumab",
  "Live attenuated Junin virus antigen",
  "Isomaltose",
  "Cetrimonium bromide",
  "Benzenesulfonic acid",
  "Inclisiran sodium",
  "Purified water",
  "Olipudase alfa",
];

test.describe("Allergy in Encounter", () => {
  let allergyName: string;

  test.beforeEach(async () => {
    allergyName = faker.helpers.arrayElement(allergyOptions);
  });

  test("should add allergy in encounter and verify it appears in patient overview", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    await page.getByRole("link", { name: "A Allergy Allergy" }).click();

    // Wait for allergy intolerance API to load
    await page.waitForResponse(
      (response) =>
        response.url().includes("/allergy_intolerance/") &&
        response.status() === 200,
    );

    const combobox = page
      .getByRole("combobox")
      .filter({ hasText: /Add Allergy|Add another Allergy/i });
    await combobox.scrollIntoViewIfNeeded();
    await combobox.click();

    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill(allergyName);

    const option = page.getByRole("option", { name: allergyName });
    await option.scrollIntoViewIfNeeded();
    await option.click();

    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire submitted successfully"),
    ).toBeVisible({ timeout: 10000 });

    await expect(page.getByText(allergyName).first()).toBeVisible();
  });
});
