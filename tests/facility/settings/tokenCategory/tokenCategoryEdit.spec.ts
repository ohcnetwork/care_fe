import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import {
  createTokenCategoryViaUi,
  getDefaultTokenCategoryId,
  setDefaultTokenCategoryViaApi,
  tokenCategoryResourceTypeValue,
} from "tests/helper/facilitySettings";
import { getFacilityId } from "tests/support/facilityId";

test.describe("Token Category Edit - Permission Tests", () => {
  // Test data generators
  let tokenCategoryName: string;
  let shorthand: string;
  let resourceType: string;
  let updatedName: string;
  let updatedShorthand: string;
  let facilityId: string;

  // Resource types available for token categories
  const resourceTypes = ["Practitioner", "Location", "Healthcare Service"];

  test.beforeEach(async () => {
    // Generate fresh test data for creation
    tokenCategoryName = faker.company.name();
    shorthand = faker.string.alphanumeric(5).toUpperCase();
    resourceType = faker.helpers.arrayElement(resourceTypes);

    // Generate data for updates
    updatedName = faker.company.name();
    updatedShorthand = faker.string.alphanumeric(4).toUpperCase();
    facilityId = getFacilityId();
  });

  test.describe("Admin Access", () => {
    // Use admin authenticated state
    test.use({ storageState: "tests/.auth/user.json" });

    test.beforeEach(async ({ page }) => {
      // Create a token category to edit / view
      await page.goto(`/facility/${facilityId}/settings/token_category`);
      await createTokenCategoryViaUi(page, {
        facilityId,
        resourceType,
        name: tokenCategoryName,
        shorthand,
      });

      await page
        .getByRole("searchbox", { name: "Search Token Categories" })
        .fill(tokenCategoryName);
    });

    test(
      "Admin can edit a token category but not its resource type",
      {
        tag: ["@atomic", "@cap:queue.token-category.edit"],
      },
      async ({ page }) => {
        const section = page.getByRole("region", {
          name: resourceType,
          exact: true,
        });
        await section
          .getByRole("listitem")
          .filter({ hasText: tokenCategoryName })
          .getByRole("button", { name: `Edit ${tokenCategoryName}` })
          .click();

        const sheet = page.getByRole("dialog", { name: "Edit Token Category" });
        await expect(sheet).toBeVisible();

        // The resource type is shown read-only: the backend's update spec
        // doesn't accept it.
        const resourceTypeField = sheet.locator(
          '[data-cy="token-category-resource-type"]',
        );
        await expect(resourceTypeField).toContainText(resourceType);
        await expect(resourceTypeField).toContainText(
          "Resource type cannot be changed once the token category is created.",
        );
        await expect(
          sheet.getByRole("combobox", { name: "Resource Type" }),
        ).toHaveCount(0);

        await expect(sheet.getByRole("textbox", { name: "Name" })).toHaveValue(
          tokenCategoryName,
        );
        await sheet.getByRole("textbox", { name: "Name" }).fill(updatedName);
        await sheet
          .getByRole("textbox", { name: "Shorthand" })
          .fill(updatedShorthand);
        await sheet.getByRole("button", { name: "Save Changes" }).click();
        await expect(sheet).toBeHidden();

        // The edited category stays in its original section
        await page
          .getByRole("searchbox", { name: "Search Token Categories" })
          .fill(updatedName);
        const updatedItem = section
          .getByRole("listitem")
          .filter({ hasText: updatedName });
        await expect(updatedItem).toBeVisible();
        await expect(updatedItem).toContainText(updatedShorthand);
      },
    );

    test(
      "Admin can make a token category the default from the edit sheet",
      {
        tag: ["@atomic", "@cap:queue.token-category.default.set"],
      },
      async ({ page }) => {
        // The default is facility-wide; put the previous one back afterwards.
        const previousDefaultId = await getDefaultTokenCategoryId({
          facilityId,
          resourceType: tokenCategoryResourceTypeValue(resourceType),
        });
        try {
          const section = page.getByRole("region", {
            name: resourceType,
            exact: true,
          });
          const item = () =>
            section
              .getByRole("listitem")
              .filter({ hasText: tokenCategoryName });
          const openEditSheet = async () => {
            await item()
              .getByRole("button", { name: `Edit ${tokenCategoryName}` })
              .click();
            const sheet = page.getByRole("dialog", {
              name: "Edit Token Category",
            });
            await expect(sheet).toBeVisible();
            return sheet;
          };

          await expect(
            item().getByText("Default", { exact: true }),
          ).toHaveCount(0);

          let sheet = await openEditSheet();
          const defaultFrame = sheet.locator(
            '[data-cy="token-category-default"]',
          );
          // Applies immediately, without saving the form
          await defaultFrame
            .getByRole("button", { name: "Set as default" })
            .click();
          await expect(
            defaultFrame.getByRole("button", { name: "Set as default" }),
          ).toHaveCount(0);
          await expect(
            defaultFrame.getByText("Default", { exact: true }),
          ).toBeVisible();
          await sheet.getByRole("button", { name: "Close" }).click();
          await expect(sheet).toBeHidden();

          // The new default is badged and listed first in its section
          await expect(
            item().getByText("Default", { exact: true }),
          ).toBeVisible();
          await page
            .getByRole("searchbox", { name: "Search Token Categories" })
            .clear();
          await expect(section.getByRole("listitem").first()).toContainText(
            tokenCategoryName,
          );

          // A default can't be unset, only replaced by another category
          await page
            .getByRole("searchbox", { name: "Search Token Categories" })
            .fill(tokenCategoryName);
          sheet = await openEditSheet();
          await expect(
            sheet
              .locator('[data-cy="token-category-default"]')
              .getByRole("button", { name: "Set as default" }),
          ).toHaveCount(0);
        } finally {
          if (previousDefaultId) {
            await setDefaultTokenCategoryViaApi({
              facilityId,
              tokenCategoryId: previousDefaultId,
            });
          }
        }
      },
    );
  });
});
