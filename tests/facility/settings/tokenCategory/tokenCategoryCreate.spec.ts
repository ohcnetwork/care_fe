import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test.describe("Token Category Create - Permission Tests", () => {
  // Test data generators
  let tokenCategoryName: string;
  let shorthand: string;
  let resourceType: string;
  let facilityId: string;

  // Resource types available for token categories
  const resourceTypes = ["Practitioner", "Location", "Healthcare Service"];

  test.beforeEach(async () => {
    // Generate fresh test data
    tokenCategoryName = faker.company.name();
    shorthand = faker.string.alphanumeric(5).toUpperCase();
    resourceType = faker.helpers.arrayElement(resourceTypes);
    facilityId = getFacilityId();
  });

  test.describe("Admin Access", () => {
    // Use admin authenticated state
    test.use({ storageState: "tests/.auth/user.json" });

    test("Admin can see an Add button for every resource type", async ({
      page,
    }) => {
      await page.goto(`/facility/${facilityId}/settings/token_category`);
      await expect(
        page.getByRole("heading", { name: "Token Categories" }),
      ).toBeVisible({ timeout: 10000 });

      for (const type of resourceTypes) {
        await expect(
          page
            .getByRole("region", { name: type, exact: true })
            .getByRole("button", { name: `Add ${type} Token Category` }),
        ).toBeVisible();
      }
    });

    test("Admin can create a token category from its resource type section", async ({
      page,
    }) => {
      await page.goto(`/facility/${facilityId}/settings/token_category`);
      await expect(
        page.getByRole("heading", { name: "Token Categories" }),
      ).toBeVisible({ timeout: 10000 });

      const section = page.getByRole("region", {
        name: resourceType,
        exact: true,
      });
      await section
        .getByRole("button", { name: `Add ${resourceType} Token Category` })
        .click();

      // The sheet is preset to the section's resource type and has no
      // resource type picker.
      const sheet = page.getByRole("dialog", {
        name: "Create Token Category",
      });
      await expect(sheet).toBeVisible();
      await expect(
        sheet.locator('[data-cy="token-category-resource-type"]'),
      ).toContainText(resourceType);
      await expect(
        sheet.getByRole("combobox", { name: "Resource Type" }),
      ).toHaveCount(0);

      await sheet
        .getByRole("textbox", { name: "Name" })
        .fill(tokenCategoryName);
      await sheet.getByRole("textbox", { name: "Shorthand" }).fill(shorthand);
      await expect(sheet).toContainText(
        `Tokens will be issued as ${shorthand}-001`,
      );
      await sheet.getByRole("button", { name: "Create" }).click();

      await expect(sheet).not.toBeVisible();
      await expect(page).toHaveURL(
        /\/facility\/[^/]+\/settings\/token_category$/,
      );

      // The new category is listed under the section it was created from
      await page
        .getByRole("searchbox", { name: "Search Token Categories" })
        .fill(tokenCategoryName);
      const createdItem = section
        .getByRole("listitem")
        .filter({ hasText: tokenCategoryName });
      await expect(createdItem).toBeVisible();
      await expect(createdItem).toContainText(shorthand);
    });

    test("Admin sees no results when searching for non-existent token category", async ({
      page,
    }) => {
      await page.goto(`/facility/${facilityId}/settings/token_category`);
      await expect(
        page.getByRole("heading", { name: "Token Categories" }),
      ).toBeVisible({ timeout: 10000 });

      await page
        .getByRole("searchbox", { name: "Search Token Categories" })
        .fill("NonExistentTokenCategory12345");

      await expect(page.getByText("No token categories found")).toBeVisible();
      await expect(
        page.locator('[data-cy^="token-category-group-"]'),
      ).toHaveCount(0);
    });

    test("Admin sees validation errors when submitting empty form", async ({
      page,
    }) => {
      await page.goto(`/facility/${facilityId}/settings/token_category`);
      await expect(
        page.getByRole("heading", { name: "Token Categories" }),
      ).toBeVisible({ timeout: 10000 });

      await page
        .getByRole("region", { name: resourceType, exact: true })
        .getByRole("button", { name: `Add ${resourceType} Token Category` })
        .click();

      const sheet = page.getByRole("dialog", {
        name: "Create Token Category",
      });
      await sheet.getByRole("button", { name: "Create" }).click();

      for (const field of ["Name", "Shorthand"]) {
        await expect(
          sheet
            .locator('[data-slot="form-item"]')
            .filter({ has: page.getByLabel(field, { exact: true }) })
            .getByText("This field is required"),
        ).toBeVisible();
      }
    });
  });

  test.describe("Nurse Access", () => {
    test.beforeEach(async ({ page }) => {
      // Login as nurse
      await page.goto("/login");
      await page.getByRole("textbox", { name: /username/i }).fill("care-nurse");
      await page.getByLabel(/^password$/i).fill("Ohcn@123");
      await page.getByRole("button", { name: /^sign in$/i }).click();
      await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

      // Verify we're logged in as nurse
      await expect(
        page.getByRole("heading", {
          name: /^Good (Morning|Afternoon|Evening), .+/,
        }),
      ).toBeVisible();
    });

    test("Nurse cannot see Add Token Category button", async ({ page }) => {
      // Step 1: Navigate directly to token category page
      await page.goto(`/facility/${facilityId}/settings/token_category`);

      await expect(
        page
          .getByRole("heading", { name: "Token Categories" })
          .or(
            page.getByText("Access Denied to Token Category", { exact: true }),
          ),
      ).toBeVisible();
      await expect(page).toHaveURL(
        /\/facility\/[^/]+\/settings\/token_category/,
      );
      await expect(
        page.getByRole("button", { name: /^Add .* Token Category$/ }),
      ).toHaveCount(0);
    });
  });
});
