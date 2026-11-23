import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { firstValueSetDisplay } from "tests/helper/valueSet";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Allergy in Encounter", () => {
  test("should add allergy in encounter and verify it appears in patient overview", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    const allergyName = await firstValueSetDisplay(
      "system-allergy-code",
      facilityId,
    );
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );
    await page.getByRole("link", { name: "Add Allergy", exact: true }).click();

    const combobox = page
      .getByRole("combobox")
      .filter({ hasText: /Add Allergy|Add another Allergy/i });
    await combobox.scrollIntoViewIfNeeded();
    await combobox.click();

    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill(allergyName);

    const option = page
      .getByTestId("valueset-search-results")
      .getByRole("option", { name: allergyName, exact: true });
    await option.scrollIntoViewIfNeeded();
    await option.click();

    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire submitted successfully"),
    ).toBeVisible({ timeout: 10000 });

    await expect(page.getByText(allergyName).first()).toBeVisible();
  });
});
