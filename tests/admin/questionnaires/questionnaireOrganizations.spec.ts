import { expect, test } from "@playwright/test";
import { createQuestionnaire } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 organizations field", () => {
  test("instance variant adds and removes a role organization", async ({
    page,
  }) => {
    const title = `QV2 Orgs Instance ${Date.now()}`;
    let detailUrl = "";

    await test.step("Create an instance questionnaire", async () => {
      detailUrl = await createQuestionnaire(page, {
        basePath: "/admin/questionnaires",
        title,
      });
      await expect(
        page.getByText("Organizations", { exact: true }),
      ).toBeVisible();
    });

    // The selected chip renders as a badge; the (still open) suggestion
    // popover repeats the name, so scope every assertion to the badge.
    const chip = page.locator('[data-slot="badge"]', {
      hasText: "Health Department",
    });

    await test.step("Add the Health Department role organization", async () => {
      await page.getByRole("button", { name: "Search Organizations" }).click();
      await page.getByRole("option", { name: "Health Department" }).click();
      await expectToast(page, "Organizations updated");
      await expect(chip).toBeVisible();
    });

    await test.step("The link persists across a reload", async () => {
      await page.goto(detailUrl);
      await expect(chip).toBeVisible();
    });

    await test.step("Removing the chip unlinks it again", async () => {
      await chip.getByRole("button", { name: "Remove organization" }).click();
      await expectToast(page, "Organizations updated");
      await page.goto(detailUrl);
      await expect(chip).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Search Organizations" }),
      ).toBeVisible();
    });
  });

  test("facility variant links a facility organization", async ({ page }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Orgs Facility ${Date.now()}`;
    let detailUrl = "";

    await test.step("Create a facility questionnaire", async () => {
      detailUrl = await createQuestionnaire(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title,
      });
      await expect(
        page.getByText("Organizations", { exact: true }),
      ).toBeVisible();
      // The label and the combobox placeholder share the same text.
      await expect(
        page.locator("label").filter({ hasText: "Select Department" }),
      ).toBeVisible();
    });

    await test.step("Pick a department from the All Organizations tab", async () => {
      await page.getByRole("tab", { name: "All Organizations" }).click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Department" })
        .click();
      await page.getByRole("option", { name: "Pulmonology" }).click();
      await expectToast(page, "Organizations updated");
    });

    await test.step("The department persists across a reload", async () => {
      await page.goto(detailUrl);
      await expect(page.getByText("Pulmonology")).toBeVisible();
    });
  });
});
