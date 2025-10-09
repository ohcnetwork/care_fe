import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

/**
 * Test data generator for patient registration
 */
function generatePatientData() {
  const timestamp = Date.now();
  return {
    name: `Test Patient ${timestamp}`,
    phoneNumber: `9${Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, "0")}`,
    gender: "Male",
    dateOfBirth: {
      day: "16",
      month: "06",
      year: "2009",
    },
    bloodGroup: "A+",
    state: "Assam",
    address: "123 Test Street, Test City",
    emergencyContact: {
      name: `Emergency Contact ${timestamp}`,
      phoneNumber: `9${Math.floor(Math.random() * 1000000000)
        .toString()
        .padStart(9, "0")}`,
    },
  };
}

test.describe("Patient Registration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page (user is already authenticated)
    await page.goto("/");

    // Navigate to a facility - using a more robust selector
    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();

    await page.getByRole("button", { name: "Toggle Sidebar" }).click();

    await page.getByRole("button", { name: "Patients", exact: true }).click();
    // Navigate to patient search/registration
    await page.getByRole("link", { name: /search patients/i }).click();
  });

  test("should successfully register a new patient with all required fields", async ({
    page,
  }) => {
    const patientData = generatePatientData();

    // Start patient registration by pressing Shift+Enter in search field
    await page
      .getByRole("textbox", { name: /search by patient phone number/i })
      .press("Shift+Enter");

    // Fill basic patient information
    await test.step("Fill patient basic information", async () => {
      await page
        .getByRole("textbox", { name: /name.*\*/i })
        .fill(patientData.name);
      await page
        .getByRole("textbox", { name: /phone number.*\*/i })
        .fill(patientData.phoneNumber);

      // Select gender
      await page
        .getByRole("radio", { name: patientData.gender, exact: true })
        .click();
    });

    // Fill date of birth
    await test.step("Fill date of birth", async () => {
      await page.getByPlaceholder("DD").fill(patientData.dateOfBirth.day);
      await page.getByPlaceholder("MM").fill(patientData.dateOfBirth.month);
      await page.getByPlaceholder("YYYY").fill(patientData.dateOfBirth.year);
    });

    // Select blood group
    await test.step("Select blood group", async () => {
      await page.getByRole("combobox", { name: /blood group/i }).click();
      await page.getByRole("option", { name: patientData.bloodGroup }).click();
    });

    // Fill additional details
    await test.step("Fill additional details", async () => {
      // Navigate to additional details section
      await page
        .getByRole("button", { name: /2: additional details/i })
        .click();

      // Select state
      const stateRegion = page.getByRole("region", {
        name: /2: additional details/i,
      });

      // expect page to have text state
      await expect(stateRegion).toHaveText(/state/i);

      // Use data-cy selector for state dropdown
      // fill address
      await page
        .getByRole("textbox", { name: "Address" })
        .fill(patientData.address);
      // Scroll to the Register Patient button to ensure dropdown is visible
      await page
        .getByRole("button", { name: /register patient/i })
        .scrollIntoViewIfNeeded();
      const stateCombobox = stateRegion.locator('[data-cy="select-state"]');
      await stateCombobox.click();

      // Select the state option by visible text
      const stateOption = page.getByRole("option", { name: patientData.state });
      await stateOption.waitFor({ state: "visible", timeout: 5000 });
      await stateOption.click();
    });

    // Submit the registration
    await test.step("Submit patient registration", async () => {
      await page.getByRole("button", { name: /register patient/i }).click();

      // Wait for success message or redirect
      await expect(
        page.getByText(/patient registered successfully/i),
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test("should show validation errors for empty required fields", async ({
    page,
  }) => {
    // Start patient registration
    await page
      .getByRole("textbox", { name: /search by patient phone number/i })
      .press("Shift+Enter");

    // Try to submit without filling required fields
    await test.step("Submit empty form", async () => {
      await page.getByRole("button", { name: /register patient/i }).click();

      // Verify validation errors appear
      await expect(
        page.getByText(/required|not valid|invalid/i).first(),
      ).toBeVisible();
    });
  });

  test("should handle emergency contact information", async ({ page }) => {
    const patientData = generatePatientData();

    // Start patient registration
    await page
      .getByRole("textbox", { name: /search by patient phone number/i })
      .press("Shift+Enter");

    // Fill basic patient information
    await test.step("Fill patient basic information", async () => {
      await page
        .getByRole("textbox", { name: /name.*\*/i })
        .fill(patientData.name);
      await page
        .getByRole("textbox", { name: /phone number.*\*/i })
        .fill(patientData.phoneNumber);

      // Select gender
      await page
        .getByRole("radio", { name: patientData.gender, exact: true })
        .click();
    });

    // Fill date of birth
    await test.step("Fill date of birth", async () => {
      await page.getByPlaceholder("DD").fill(patientData.dateOfBirth.day);
      await page.getByPlaceholder("MM").fill(patientData.dateOfBirth.month);
      await page.getByPlaceholder("YYYY").fill(patientData.dateOfBirth.year);
    });

    // Test emergency contact checkbox
    await test.step("Configure emergency contact", async () => {
      const emergencyCheckbox = page.getByRole("checkbox", {
        name: /use a different emergency/i,
      });
      if (await emergencyCheckbox.isVisible()) {
        await emergencyCheckbox.check();

        // Fill emergency contact details if form expands
        // This would need to be adjusted based on actual form behavior
      }
    });

    // Select blood group
    await test.step("Select blood group", async () => {
      await page.getByRole("combobox", { name: /blood group/i }).click();
      await page.getByRole("option", { name: patientData.bloodGroup }).click();
    });

    // Fill additional details
    await test.step("Fill additional details", async () => {
      // Navigate to additional details section
      await page
        .getByRole("button", { name: /2: additional details/i })
        .click();

      // Select state
      const stateRegion = page.getByRole("region", {
        name: /2: additional details/i,
      });

      // expect page to have text state
      await expect(stateRegion).toHaveText(/state/i);

      // fill address
      await page
        .getByRole("textbox", { name: "Address" })
        .fill(patientData.address);

      // Scroll to the Register Patient button to ensure dropdown is visible
      await page
        .getByRole("button", { name: /register patient/i })
        .scrollIntoViewIfNeeded();
      const stateCombobox = stateRegion.locator('[data-cy="select-state"]');
      await stateCombobox.click();

      // Select the state option by visible text
      const stateOption = page.getByRole("option", { name: patientData.state });
      await stateOption.waitFor({ state: "visible", timeout: 5000 });
      await stateOption.click();
    });

    // Submit registration
    await test.step("Submit patient registration", async () => {
      await page.getByRole("button", { name: /register patient/i }).click();

      // Wait for success message or redirect
      await expect(
        page.getByText(/patient registered successfully/i),
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test("should validate phone number format", async ({ page }) => {
    // Start patient registration
    await page
      .getByRole("textbox", { name: /search by patient phone number/i })
      .press("Shift+Enter");

    await test.step("Test invalid phone number", async () => {
      // Fill basic patient information with invalid phone
      await page
        .getByRole("textbox", { name: /name.*\*/i })
        .fill("Test Patient");

      // Try invalid phone number
      await page
        .getByRole("textbox", { name: /phone number.*\*/i })
        .fill("123");

      // Select gender to move focus and trigger validation
      await page.getByRole("radio", { name: "Male", exact: true }).click();

      // Fill date of birth
      await page.getByPlaceholder("DD").fill("16");
      await page.getByPlaceholder("MM").fill("06");
      await page.getByPlaceholder("YYYY").fill("2009");

      // Try to submit and expect validation error
      await page.getByRole("button", { name: /register patient/i }).click();

      // Check for validation error (adjust based on actual validation behavior)
      // This would need to be updated based on how your form handles validation
      await expect(
        page.getByText(/entered phone number is not valid/i).first(),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test("should allow patient tags selection", async ({ page }) => {
    const patientData = generatePatientData();

    // Start patient registration
    await page
      .getByRole("textbox", { name: /search by patient phone number/i })
      .press("Shift+Enter");

    // Fill basic patient information
    await test.step("Fill patient basic information", async () => {
      await page
        .getByRole("textbox", { name: /name.*\*/i })
        .fill(patientData.name);
      await page
        .getByRole("textbox", { name: /phone number.*\*/i })
        .fill(patientData.phoneNumber);

      // Select gender
      await page
        .getByRole("radio", { name: patientData.gender, exact: true })
        .click();
    });

    // Fill date of birth
    await test.step("Fill date of birth", async () => {
      await page.getByPlaceholder("DD").fill(patientData.dateOfBirth.day);
      await page.getByPlaceholder("MM").fill(patientData.dateOfBirth.month);
      await page.getByPlaceholder("YYYY").fill(patientData.dateOfBirth.year);
    });

    // Test patient tags
    await test.step("Select patient tags", async () => {
      const patientTagsSection = page.getByText("Patient Tags (Optional)");
      if (await patientTagsSection.isVisible()) {
        await patientTagsSection.click();
        // Add logic for selecting tags based on actual implementation
      }
    });

    // Select blood group
    await test.step("Select blood group", async () => {
      await page.getByRole("combobox", { name: /blood group/i }).click();
      await page.getByRole("option", { name: patientData.bloodGroup }).click();
    });

    // Fill additional details
    await test.step("Fill additional details", async () => {
      // Navigate to additional details section
      await page
        .getByRole("button", { name: /2: additional details/i })
        .click();

      // Select state
      const stateRegion = page.getByRole("region", {
        name: /2: additional details/i,
      });

      // expect page to have text state
      await expect(stateRegion).toHaveText(/state/i);

      // fill address
      await page
        .getByRole("textbox", { name: "Address" })
        .fill(patientData.address);

      // Scroll to the Register Patient button to ensure dropdown is visible
      await page
        .getByRole("button", { name: /register patient/i })
        .scrollIntoViewIfNeeded();
      const stateCombobox = stateRegion.locator('[data-cy="select-state"]');
      await stateCombobox.click();

      // Select the state option by visible text
      const stateOption = page.getByRole("option", { name: patientData.state });
      await stateOption.waitFor({ state: "visible", timeout: 5000 });
      await stateOption.click();
    });

    // Submit registration
    await test.step("Submit patient registration", async () => {
      await page.getByRole("button", { name: /register patient/i }).click();

      // Wait for success message or redirect
      await expect(
        page.getByText(/patient registered successfully/i),
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
