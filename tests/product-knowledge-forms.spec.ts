import { expect, test } from "@playwright/test";

// This test now includes self-contained login logic.

test.describe("Product Knowledge Form Redirects", () => {
  function generateUniqueName() {
    return `Test PK ${Date.now()}`;
  }

  let facilityId: string;
  // FIX: Renamed to start with underscore to suppress unused variable warning
  const _categorySlug = "default-category-slug";

  test.beforeEach(async ({ page }) => {
    // --- 1. SELF-CONTAINED LOGIN ---
    await test.step("Login", async () => {
      await page.goto("/login");

      // Fill in credentials
      await page.getByRole("textbox", { name: /username/i }).fill("admin");
      await page.getByLabel(/password/i).fill("admin");

      // Click login button
      await page.getByRole("button", { name: /login/i }).click();

      // Wait for successful login and dashboard load (URL changes away from /login)
      await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

      // Verify dashboard load using a robust, general selector
      await expect(
        page.getByRole("link", { name: /settings/i }).first(),
      ).toBeVisible({ timeout: 10000 });
    });
    // --- END LOGIN ---

    // Navigate to a facility page (user is now authenticated)
    await page.goto("/");
    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();

    // Capture the Facility ID from the URL (required for final assertion)
    const url = page.url();
    const match = url.match(/\/facility\/([a-f0-9-]+)/i);
    facilityId = match && match[1] ? match[1] : "unknown-id";

    // Navigate to Product Knowledge Settings
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("link", { name: /settings/i }).click();
    await page.getByRole("link", { name: /product knowledge/i }).click();
  });

  // CRITICAL test case to verify your fix for Product Knowledge
  test("should redirect to PK details page after successful edit", async ({
    page,
  }) => {
    const originalName = generateUniqueName();
    const updatedName = `Updated ${originalName}`;
    let productSlug: string;

    // --- 1. Create a Product Knowledge Item to Edit ---
    await test.step("Create Initial Product Knowledge Item", async () => {
      await page.getByRole("button", { name: "Add Product Knowledge" }).click();

      // Fill required fields
      await page.getByRole("textbox", { name: "Name" }).fill(originalName);
      await page.getByLabel("Slug").waitFor();

      // Select category
      await page.getByRole("button", { name: /select category/i }).click();
      await page.getByRole("option").first().click();

      await page.getByRole("button", { name: "Create" }).click();

      await expect(
        page.getByText(/product knowledge created successfully/i),
      ).toBeVisible();

      // Navigate to the details page to capture the slug before editing
      await page
        .getByRole("row", { name: originalName })
        .getByRole("button", { name: "See Details" })
        .click();

      // Capture the slug from the details URL
      const urlDetails = page.url();
      const slugMatch = urlDetails.match(/\/product_knowledge\/([^/]+)$/i);
      productSlug = slugMatch && slugMatch[1] ? slugMatch[1] : "unknown-slug";

      // Return to list to find the item again and start the edit flow
      await page.getByRole("link", { name: /Product Knowledge/i }).click();
    });

    // --- 2. Edit the Product Knowledge Item ---
    await test.step("Edit Product Knowledge Item and Save", async () => {
      // Navigate back to details from the list (simulating user flow)
      await page
        .getByRole("row", { name: originalName })
        .getByRole("button", { name: "See Details" })
        .click();

      // Click 'Edit' button on the details page
      await page.getByRole("button", { name: "Edit" }).click();

      // Update the product name
      const nameInput = page.getByRole("textbox", { name: "Name" });
      await nameInput.clear();
      await nameInput.fill(updatedName);

      // Submit the form
      await page.getByRole("button", { name: "Update" }).click();
    });

    // --- 3. Verify the Redirect (Asserting the Fix) ---
    await test.step("Verify Redirect to Details Page", async () => {
      // 1. Wait for the success toast
      await expect(
        page.getByText(/product knowledge updated successfully/i),
      ).toBeVisible();

      // 2. Assert that the final URL is the Details page for the updated item
      // FIX: Removed unnecessary escape characters
      const expectedDetailsUrlRegex = new RegExp(
        `/facility/${facilityId}/settings/product_knowledge/${productSlug}$`,
      );

      // CRITICAL ASSERTION: Check that the URL is the correct details page
      await expect(page).toHaveURL(expectedDetailsUrlRegex, { timeout: 10000 });

      // 3. Assert that the updated name is visible on the details page
      await expect(
        page.getByRole("heading", { name: updatedName }),
      ).toBeVisible();
    });
  });
});
