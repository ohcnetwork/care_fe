import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 versions", () => {
  test("editing a question snapshots the previous version into version history", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Versions ${Date.now()}`;
    const titleA = `${faker.lorem.words(3)} ${Date.now()} A`;
    const titleB = `${faker.lorem.words(3)} ${Date.now()} B`;
    let detailUrl = "";

    await test.step("Create a questionnaire", async () => {
      await page.goto(`/facility/${facilityId}/settings/questionnaires/new`);
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(title);
      await page.getByRole("button", { name: "Save Form" }).click();
      await expectToast(page, "Questionnaire created successfully");
      await page.waitForURL(/\/settings\/questionnaires\/[0-9a-f-]+$/);
      detailUrl = page.url();
    });

    await test.step("Open builder and add a question (title A)", async () => {
      await page.getByRole("button", { name: "Edit Questions" }).click();
      await page.waitForURL(/\/edit$/);
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(titleA);
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Back to detail", async () => {
      await page.goto(detailUrl);
    });

    await test.step("Open builder again and rename the question to title B", async () => {
      await page.getByRole("button", { name: "Edit Questions" }).click();
      await page.waitForURL(/\/edit$/);
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(titleA);
      await page.getByRole("textbox", { name: "Question Title" }).fill(titleB);
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Back to detail and open the Versions tab", async () => {
      await page.goto(detailUrl);
      await page.getByRole("tab", { name: "Versions" }).click();
      await expect(
        page.getByRole("heading", { name: "Version history" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Open" }).first(),
      ).toBeVisible();
    });

    await test.step("Opening the past revision shows the old title", async () => {
      await page.getByRole("button", { name: "Open" }).first().click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(titleA)).toBeVisible();
    });
  });
});
