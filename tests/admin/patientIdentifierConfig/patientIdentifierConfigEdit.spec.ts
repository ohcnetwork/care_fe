import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createPatientIdentifierConfigViaUi } from "tests/helper/admin";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

const useOptions = ["usual", "official", "temp", "secondary", "old"];
const statusOptions = ["Draft", "Active", "Inactive"];

test.describe("Patient Identifier Config - Edit", () => {
  let use: string;
  let displayName: string;
  let description: string;
  let systemUrl: string;
  let status: string;

  test.beforeEach(async ({ page }) => {
    use = faker.helpers.arrayElement(useOptions);
    displayName = faker.lorem.words(2);
    description = faker.lorem.sentence();
    systemUrl = faker.internet.url();
    status = faker.helpers.arrayElement(statusOptions);

    const targetUrl = `/admin/patient_identifier_config`;
    await page.goto(targetUrl);
  });

  test(
    "should edit a patient identifier config",
    { tag: ["@atomic", "@cap:admin.patient-identifier-config.edit"] },
    async ({ page }) => {
      await createPatientIdentifierConfigViaUi(page, {
        use,
        display: displayName,
        description,
        system: systemUrl,
        status,
      });

      await page.getByRole("button", { name: /^Status/ }).click();
      await page
        .getByRole("menuitemradio", { name: status, exact: true })
        .click();

      // Verify that the new config appears in the list
      await page
        .getByRole("textbox", { name: "Search configs" })
        .fill(displayName);

      // Now edit the created config
      await page.getByRole("button", { name: "Edit" }).first().click();

      await page
        .getByRole("textbox", { name: "Display" })
        .fill(`${displayName}-edited`);
      await page
        .getByRole("textbox", { name: "Description" })
        .fill(`${description}-edited`);
      await page.getByRole("button", { name: "Update" }).click();

      await page.getByRole("button", { name: /^Status/ }).click();
      await page
        .getByRole("menuitemradio", { name: status, exact: true })
        .click();

      // Verify that the edited config appears in the list
      await page
        .getByRole("textbox", { name: "Search configs" })
        .fill(`${displayName}-edited`);

      const tableBody = page.locator('[data-slot="table-body"]');
      await expect(tableBody).toContainText(`${displayName}-edited`);
      await expect(tableBody).toContainText(systemUrl);
      await expect(tableBody).toContainText(use);
      await expect(tableBody).toContainText(status);
    },
  );
});
