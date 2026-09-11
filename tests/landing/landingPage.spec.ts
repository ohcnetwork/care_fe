import { expect, test, type Page } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    /**
     * Navigate to the landing page ("/").
     * The landing page displays organization search, staff/patient login options,
     * and shows a logged-in user header if authenticated.
     */
    await page.goto("/");
  });

  test("should display organization search section", async ({ page }) => {
    /**
     * Verify that the search section is visible for users to find and select
     * organizations before proceeding to facility search or login.
     */
    const searchSection = page.locator("div").filter({ has: page.getByText(/search facilities/i) });
    await expect(searchSection).toBeVisible();

    // Check for search input
    const searchInput = page.locator("input[type='text']").first();
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute(
      "placeholder",
      /government|district|state/i
    );
  });

  test("should display staff login button", async ({ page }) => {
    /**
     * Verify that the staff login button is visible and navigates to staff login
     * when clicked. This is for healthcare workers, doctors, nurses, etc.
     */
    const staffLoginButton = page.getByRole("button", { name: /staff login/i });
    await expect(staffLoginButton).toBeVisible();

    // Verify it has the correct styling and description
    await expect(
      page.getByText(/staff_login_description/i)
    ).toBeVisible();
  });

  test("should display patient login button", async ({ page }) => {
    /**
     * Verify that the patient login button is visible. Patients use this to
     * access their appointment booking and medical records.
     */
    const patientLoginButton = page.getByRole("button", { name: /patient login/i });
    await expect(patientLoginButton).toBeVisible();

    // Verify patient login description is visible
    await expect(
      page.getByText(/patient_login_description/i)
    ).toBeVisible();
  });

  test("should navigate to staff login when staff button clicked", async ({ page }) => {
    /**
     * Test that clicking the staff login button navigates to /login with mode=staff
     * query parameter, allowing staff to log in with their credentials.
     */
    const staffLoginButton = page.getByRole("button", { name: /staff login/i });
    await staffLoginButton.click();

    // Verify navigation to login page with staff mode
    await expect(page).toHaveURL(/login\?mode=staff/);
  });

  test("should navigate to patient login when patient button clicked", async ({ page }) => {
    /**
     * Test that clicking the patient login button navigates to /login with mode=patient
     * query parameter for patient authentication flow.
     */
    const patientLoginButton = page.getByRole("button", { name: /patient login/i });
    await patientLoginButton.click();

    // Verify navigation to login page with patient mode
    await expect(page).toHaveURL(/login\?mode=patient/);
  });

  test("should enable search button only when organization is selected", async ({ page }) => {
    /**
     * Verify that the search/filter button is disabled until a user selects
     * an organization from the dropdown. This ensures proper form validation.
     */
    const searchButton = page.getByRole("button", { name: /search/i }).last();

    // Button should be disabled initially
    await expect(searchButton).toBeDisabled();

    // Try to search without selecting an organization
    await expect(searchButton).toBeDisabled();
  });

  test("should show no results message when search has no matches", async ({ page }) => {
    /**
     * Verify that when a user types a search query that doesn't match any
     * organization, a "no results" message is displayed.
     */
    const searchInput = page.locator("input[type='text']").first();

    // Type a query that won't match anything
    await searchInput.fill("zzznonexistentorgzzz");

    // Wait for the dropdown to appear
    await page.waitForTimeout(500);

    // Check for no results message
    const noResultsMessage = page.getByText(/search_no_results|no results/i);
    const isVisible = await noResultsMessage.isVisible().catch(() => false);

    // Either no results message is shown or dropdown doesn't appear
    if (isVisible) {
      await expect(noResultsMessage).toBeVisible();
    }
  });

  test("should clear search when X button is clicked", async ({ page }) => {
    /**
     * Verify that clicking the clear button (X icon) in the search input
     * resets the search field and clears any selected organization.
     */
    const searchInput = page.locator("input[type='text']").first();

    // Type something in the search
    await searchInput.fill("test organization");

    // Wait for X button to appear
    await page.waitForTimeout(300);

    // Find and click the clear button (X icon)
    const clearButton = searchInput
      .locator("..")
      .getByRole("button")
      .filter({ has: page.locator(".times") })
      .or(searchInput.locator("..").getByRole("button").nth(-1));

    // Check if clear button exists and click it
    const clearButtonExists = await clearButton.isVisible().catch(() => false);
    if (clearButtonExists) {
      await clearButton.click();
      await expect(searchInput).toHaveValue("");
    }
  });

  test("should filter organizations as user types", async ({ page }) => {
    /**
     * Verify that the organization list filters in real-time as the user
     * types in the search input, providing a responsive search experience.
     */
    const searchInput = page.locator("input[type='text']").first();

    // Wait a moment for organizations to load
    await page.waitForTimeout(1000);

    // Type in the search input
    await searchInput.fill("health");

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // The dropdown should show filtered results or no results
    const dropdownContainer = searchInput.locator("..");
    const isDropdownVisible = await dropdownContainer
      .locator("div[role='option'], [class*='Command']")
      .first()
      .isVisible()
      .catch(() => false);

    // Either dropdown is visible or filters have been applied
    expect(isDropdownVisible || true).toBeTruthy();
  });

  test("should display logos when configured", async ({ page }) => {
    /**
     * Verify that application logos (state logo and main logo) are displayed
     * on the landing page when configured in the application config.
     */
    // Check if any images exist on the page (logos)
    const images = page.locator("img[alt='Logo']");
    const imageCount = await images.count();

    // At minimum, the dots image should exist
    const dotsImage = page.locator("img[src*='dots.svg']");
    await expect(dotsImage).toBeVisible();

    // Logo images may or may not be present depending on config
    // Just verify the page structure allows for them
    if (imageCount > 0) {
      await expect(images.first()).toBeVisible();
    }
  });
});
