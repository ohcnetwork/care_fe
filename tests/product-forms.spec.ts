import { expect, test } from "@playwright/test";

// This test includes self-contained login logic to bypass environment conflicts.

test.describe("Product Form Redirects", () => {
  function generateUniqueProductName() {
    return `Test Product ${Date.now()}`;
  }

  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    // --- 1. SELF-CONTAINED LOGIN ---
    await test.step("Login", async () => {
      await page.goto("/login");

      // Fill in credentials
      await page.getByRole("textbox", { name: /username/i }).fill("admin");
      await page.getByLabel(/password/i).fill("admin");

      // Click login button
      await page.getByRole("button", { name: /login/i }).click();

      // Wait for successful login (URL changes away from /login)
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

    // Navigate to Product Settings
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("link", { name: /settings/i }).click();
    await page.getByRole("link", { name: /products/i }).click();
  });

  test("should redirect to product details page after successful edit", async ({
    page,
  }) => {
    const originalName = generateUniqueProductName();
    const updatedName = `Updated ${originalName}`;
    let productId: string;

    // --- 1. Create a Product to Edit ---
    await test.step("Create Initial Product", async () => {
      await page.getByRole("button", { name: "Add Product" }).click();
      await page
        .getByRole("textbox", { name: "Product Name" })
        .fill(originalName);

      await page.getByRole("button", { name: "Create" }).click();
      await expect(
        page.getByText(/product created successfully/i),
      ).toBeVisible();

      // Navigate to the details page to capture the ID
      await page
        .getByRole("row", { name: originalName })
        .getByRole("button", { name: "See Details" })
        .click();

      const urlDetails = page.url();
      const idMatch = urlDetails.match(/\/product\/([^/]+)$/i);
      productId = idMatch && idMatch[1] ? idMatch[1] : "unknown-product";

      // Return to list to simulate starting the edit flow from the list/details page
      await page.getByRole("link", { name: /products list/i }).click();
    });

    // --- 2. Edit the Product and Save ---
    await test.step("Edit Product and Save", async () => {
      // Find the row and click See Details, then click Edit
      await page
        .getByRole("row", { name: originalName })
        .getByRole("button", { name: "See Details" })
        .click();

      await page.getByRole("button", { name: "Edit" }).click();

      // Update the product name
      const nameInput = page.getByRole("textbox", { name: "Product Name" });
      await nameInput.clear();
      await nameInput.fill(updatedName);

      // Submit the form
      await page.getByRole("button", { name: "Update" }).click();
    });

    // --- 3. Verify the Redirect (Asserting the Fix) ---
    await test.step("Verify Redirect to Details Page", async () => {
      // 1. Wait for the success toast
      await expect(
        page.getByText(/product updated successfully/i),
      ).toBeVisible();

      // 2. Assert that the final URL is the Details page for the updated product
      // FIX: Removed unnecessary escape characters
      const expectedDetailsUrlRegex = new RegExp(
        `/facility/${facilityId}/settings/product/${productId}$`,
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
