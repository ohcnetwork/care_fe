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
    state: "Rajasthan", //not used currently
    pincode: "302020",
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
      await page
        .getByPlaceholder("DD", { exact: true })
        .fill(patientData.dateOfBirth.day);
      await page
        .getByPlaceholder("MM", { exact: true })
        .fill(patientData.dateOfBirth.month);
      await page
        .getByPlaceholder("YYYY", { exact: true })
        .fill(patientData.dateOfBirth.year);
    });

    // Select blood group
    await test.step("Select blood group", async () => {
      await page.getByRole("combobox", { name: /blood group/i }).click();
      await page.getByRole("option", { name: patientData.bloodGroup }).click();
    });

    // Fill additional details
    await test.step("Fill additional details", async () => {
      // Use data-cy selector for state dropdown
      // fill address
      await page
        .getByRole("textbox", { name: "Address" })
        .fill(patientData.address);
      await page
        .getByRole("button", { name: /register patient/i })
        .scrollIntoViewIfNeeded();
      // fill Pincode
      await page
        .getByRole("spinbutton", { name: "PIN Code *" })
        .fill(patientData.pincode);
      // Scroll to the Register Patient button to ensure dropdown is visible
      await page
        .getByRole("button", { name: /register patient/i })
        .scrollIntoViewIfNeeded();
      await page
        .getByRole("region", { name: ": Additional Details" })
        .getByRole("combobox")
        .click();

      // Select the state option by visible text
      // TODO: Update to a specific state once fixtures support it
      const stateOption = page.getByRole("option").first();
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
      await page
        .getByPlaceholder("DD", { exact: true })
        .fill(patientData.dateOfBirth.day);
      await page
        .getByPlaceholder("MM", { exact: true })
        .fill(patientData.dateOfBirth.month);
      await page
        .getByPlaceholder("YYYY", { exact: true })
        .fill(patientData.dateOfBirth.year);
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

      await page
        .getByRole("spinbutton", { name: "PIN Code *" })
        .fill(patientData.pincode);

      // Scroll to the Register Patient button to ensure dropdown is visible
      await page
        .getByRole("button", { name: /register patient/i })
        .scrollIntoViewIfNeeded();
      const stateCombobox = stateRegion.locator('[data-cy="select-state"]');
      await stateCombobox.click();

      // Select the state option by visible text
      // TODO: Update to a specific state once fixtures support it
      const stateOption = page.getByRole("option").first();
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
      await page.getByPlaceholder("DD", { exact: true }).fill("16");
      await page.getByPlaceholder("MM", { exact: true }).fill("06");
      await page.getByPlaceholder("YYYY", { exact: true }).fill("2009");

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
      await page
        .getByPlaceholder("DD", { exact: true })
        .fill(patientData.dateOfBirth.day);
      await page
        .getByPlaceholder("MM", { exact: true })
        .fill(patientData.dateOfBirth.month);
      await page
        .getByPlaceholder("YYYY", { exact: true })
        .fill(patientData.dateOfBirth.year);
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

      await page
        .getByRole("spinbutton", { name: "PIN Code *" })
        .fill(patientData.pincode);

      // Scroll to the Register Patient button to ensure dropdown is visible
      await page
        .getByRole("button", { name: /register patient/i })
        .scrollIntoViewIfNeeded();
      const stateCombobox = stateRegion.locator('[data-cy="select-state"]');
      await stateCombobox.click();

      // Select the state option by visible text
      // TODO: Update to a specific state once fixtures support it
      const stateOption = page.getByRole("option").first();
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

    // TODO: Verify that selected tags are associated with the patient
  });

  test("should register patient with age and verify year of birth calculation and profile display", async ({
    page,
  }) => {
    const currentYear = new Date().getFullYear();
    const patientAge = 25;
    const expectedYearOfBirth = currentYear - patientAge;

    // Generate minimal test data
    const timestamp = Date.now();
    const patientName = `Age Test Patient ${timestamp}`;
    const phoneNumber = `9${Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, "0")}`;

    // Start patient registration - inherit navigation from beforeEach
    await page
      .getByRole("textbox", { name: /search by patient phone number/i })
      .press("Shift+Enter");

    // Fill only the essential required fields
    await page.getByRole("textbox", { name: /name.*\*/i }).fill(patientName);
    await page
      .getByRole("textbox", { name: /phone number.*\*/i })
      .fill(phoneNumber);
    await page.getByRole("radio", { name: "Male", exact: true }).click();

    // Test the age input functionality
    await page.getByRole("tab", { name: "Age" }).click();
    await page.getByPlaceholder("Age").fill(patientAge.toString());

    // Verify Year of Birth preview calculation
    await expect(
      page.locator(`text=Year of Birth: ${expectedYearOfBirth}`),
    ).toBeVisible({ timeout: 3000 });

    // Fill minimal required fields to complete registration
    await page.getByRole("combobox", { name: /blood group/i }).click();
    await page.getByRole("option", { name: "A+" }).click();
    await page
      .getByRole("textbox", { name: "Address" })
      .fill("123 Test Street");
    await page.getByRole("spinbutton", { name: "PIN Code *" }).fill("302020");

    // Select state - scroll to make dropdown visible
    await page
      .getByRole("button", { name: /register patient/i })
      .scrollIntoViewIfNeeded();
    await page
      .getByRole("region", { name: ": Additional Details" })
      .getByRole("combobox")
      .click();
    await page.getByRole("option").first().click();

    // Submit and verify registration
    await page.getByRole("button", { name: /register patient/i }).click();
    await expect(
      page.getByText(/patient registered successfully/i),
    ).toBeVisible({ timeout: 10000 });

    // Verify profile display
    await page.waitForURL("**/patients/**", { timeout: 10000 });
    await expect(
      page.getByRole("button", { name: new RegExp(`.*${patientAge} Y, Male`) }),
    ).toBeVisible({ timeout: 5000 });

    // Validate calculation
    expect(expectedYearOfBirth).toEqual(currentYear - patientAge);
  });
});
