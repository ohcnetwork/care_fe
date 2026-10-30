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

    test.beforeEach(async ({ page }) => {
      await page.goto(`/facility/${facilityId}/settings/token_category`);

      // Wait for page heading to be visible instead of networkidle
      await expect(
        page.getByRole("heading", { name: "Token Categories" }),
      ).toBeVisible({ timeout: 10000 });
    });

    test("Admin can view Add Token Category trigger for each resource type", async ({
      page,
    }) => {
      // Verify each resource type group has its own Add Token Category trigger
      for (const label of resourceTypes) {
        await expect(
          page.getByRole("button", { name: `Add ${label} Token Category` }),
        ).toBeVisible();
      }
    });

    test("Admin can create a token category inline", async ({ page }) => {
      // Open the inline create form for the resource type group
      await page
        .getByRole("button", { name: `Add ${resourceType} Token Category` })
        .click();
      const popover = page.getByRole("dialog", {
        name: `Add ${resourceType} Token Category`,
      });
      await expect(popover).toBeVisible();

      // Resource type is derived from the group and is not selectable
      await expect(
        popover.getByRole("combobox", { name: "Resource Type" }),
      ).toHaveCount(0);

      // Fill all mandatory fields and submit
      await popover
        .getByRole("textbox", { name: "Name" })
        .fill(tokenCategoryName);
      await popover.getByRole("textbox", { name: "Shorthand" }).fill(shorthand);
      await popover.getByRole("button", { name: "Create" }).click();

      // Popover closes and we stay on the list page
      await expect(popover).not.toBeVisible();
      await expect(page).toHaveURL(
        /\/facility\/[^/]+\/settings\/token_category$/,
      );

      // Verify the created token category appears under its resource type group
      const groupBody = page
        .getByRole("region", { name: resourceType, exact: true })
        .locator("tbody");
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(tokenCategoryName);
      await expect(groupBody).toContainText(tokenCategoryName);
      await expect(groupBody).toContainText(shorthand);
    });

    test("Admin sees no results when searching for non-existent token category", async ({
      page,
    }) => {
      const nonExistentName = "NonExistentTokenCategory12345";

      // Search for non-existent item
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(nonExistentName);

      // Verify no results found message is displayed in every group
      await expect(page.getByText("No token categories found")).toHaveCount(
        resourceTypes.length,
      );
    });

    test("Admin sees validation errors when submitting empty form", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: `Add ${resourceType} Token Category` })
        .click();
      const popover = page.getByRole("dialog", {
        name: `Add ${resourceType} Token Category`,
      });
      await expect(popover).toBeVisible();

      // Click Create button without filling any fields
      await popover.getByRole("button", { name: "Create" }).click();

      // Verify error message for Name field
      const nameError = popover
        .locator('[data-slot="form-item"]')
        .filter({ has: popover.getByLabel("Name") })
        .getByText("This field is required");
      await expect(nameError).toBeVisible();

      // Verify error message for Shorthand field
      const shorthandError = popover
        .locator('[data-slot="form-item"]')
        .filter({ has: popover.getByLabel("Shorthand") })
        .getByText("This field is required");
      await expect(shorthandError).toBeVisible();

      // Cancelling closes the inline form
      await popover.getByRole("button", { name: "Cancel" }).click();
      await expect(popover).not.toBeVisible();
    });
  });

  test.describe("Nurse Access", () => {
    test.beforeEach(async ({ page }) => {
      // Login as nurse
      await page.goto("/login");
      await page.getByRole("textbox", { name: /username/i }).fill("care-nurse");
      await page.getByLabel(/password/i).fill("Ohcn@123");
      await page.getByRole("button", { name: /login/i }).click();
      await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

      // Verify we're logged in as nurse
      await expect(
        page.getByRole("heading", { name: /^Hey .+/ }),
      ).toBeVisible();
    });

    test("Nurse cannot see Add Token Category button", async ({ page }) => {
      // Step 1: Navigate directly to token category page
      await page.goto(`/facility/${facilityId}/settings/token_category`);

      // Wait for page to load by checking for either access denied message or page heading
      await Promise.race([
        page
          .getByText("Access Denied to Token Category")
          .waitFor({ timeout: 5000 })
          .catch(() => null),
        page
          .getByRole("heading", { name: "Token Categories" })
          .waitFor({ timeout: 5000 })
          .catch(() => null),
      ]);

      // Step 2: Check if we have access to the page
      // If nurse has access to the page, verify Add Token Category button is NOT visible
      const pageAccessible = await page
        .getByText(/Token Category|token_category/i)
        .isVisible()
        .catch(() => false);

      if (pageAccessible) {
        // Verify we're on the token category list page
        await expect(page).toHaveURL(
          /\/facility\/[^/]+\/settings\/token_category/,
        );

        // Verify Add Token Category triggers are NOT visible
        await expect(
          page.getByRole("button", { name: /Add .* Token Category/ }),
        ).toHaveCount(0);
      }
      // If page is not accessible, that's also valid for nurses (access denied)
    });
  });
});
