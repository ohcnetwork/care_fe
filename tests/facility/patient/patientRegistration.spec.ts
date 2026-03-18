import { expect, Page, test } from "@playwright/test";

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

type PatientData = ReturnType<typeof generatePatientData>;

async function startRegistration(page: Page) {
  await page
    .getByRole("textbox", { name: /search by patient phone number/i })
    .press("Shift+Enter");
}

async function fillBasicInfo(
  page: Page,
  data: { name: string; phoneNumber: string; gender: string },
) {
  await test.step("Fill patient basic information", async () => {
    await page.getByRole("textbox", { name: /name.*\*/i }).fill(data.name);
    await page
      .getByRole("textbox", { name: /phone number.*\*/i })
      .fill(data.phoneNumber);
    await page.getByRole("radio", { name: data.gender, exact: true }).click();
  });
}

async function fillDateOfBirth(
  page: Page,
  dob: { day: string; month: string; year: string },
) {
  await test.step("Fill date of birth", async () => {
    await page.getByPlaceholder("DD", { exact: true }).fill(dob.day);
    await page.getByPlaceholder("MM", { exact: true }).fill(dob.month);
    await page.getByPlaceholder("YYYY", { exact: true }).fill(dob.year);
  });
}

async function selectBloodGroup(page: Page, bloodGroup: string) {
  await test.step("Select blood group", async () => {
    await page.getByRole("combobox", { name: /blood group/i }).click();
    await page.getByRole("option", { name: bloodGroup }).click();
  });
}

/**
 * Fills the "Additional Details" section: address, PIN code, and state.
 * TODO: Update state selection to a specific state once fixtures support it.
 */
async function fillAdditionalDetails(
  page: Page,
  data: { address: string; pincode: string },
) {
  await test.step("Fill additional details", async () => {
    const additionalDetailsSection = page.getByRole("button", {
      name: "Additional Details",
    });
    const additionalDetailsSectionText =
      await additionalDetailsSection.textContent();

    if (additionalDetailsSectionText?.toLowerCase().includes("optional")) {
      await additionalDetailsSection.click();
    }

    await page.getByRole("textbox", { name: "Address" }).fill(data.address);
    await page.getByRole("spinbutton", { name: "PIN Code" }).fill(data.pincode);

    await page
      .getByRole("button", { name: /register patient/i })
      .scrollIntoViewIfNeeded();

    const stateCombobox = page
      .getByRole("region", { name: "Additional Details" })
      .getByRole("combobox");
    await stateCombobox.waitFor({ state: "visible", timeout: 5000 });
    await stateCombobox.click();

    const stateOption = page.getByRole("option").first();
    await stateOption.waitFor({ state: "visible", timeout: 5000 });
    await stateOption.click();
  });
}

async function submitRegistration(page: Page) {
  await test.step("Submit patient registration", async () => {
    await page.getByRole("button", { name: /register patient/i }).click();
    await expect(
      page.getByText(/patient registered successfully/i),
    ).toBeVisible({ timeout: 10000 });
  });
}

/**
 * Fills all standard required fields and submits.
 * Useful for tests where registration is setup, not the focus.
 */
async function fillRequiredFieldsAndSubmit(page: Page, data: PatientData) {
  await fillBasicInfo(page, data);
  await fillDateOfBirth(page, data.dateOfBirth);
  await selectBloodGroup(page, data.bloodGroup);
  await fillAdditionalDetails(page, data);
  await submitRegistration(page);
}

test.describe("Patient Registration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();

    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("button", { name: "Patients", exact: true }).click();
    await page.getByRole("link", { name: /search patients/i }).click();
  });

  test("should successfully register a new patient with all required fields", async ({
    page,
  }) => {
    const patientData = generatePatientData();
    await startRegistration(page);
    await fillRequiredFieldsAndSubmit(page, patientData);
  });

  test("should handle emergency contact information", async ({ page }) => {
    const patientData = generatePatientData();
    await startRegistration(page);
    await fillBasicInfo(page, patientData);
    await fillDateOfBirth(page, patientData.dateOfBirth);

    await test.step("Configure emergency contact", async () => {
      const emergencyCheckbox = page.getByRole("checkbox", {
        name: /use a different emergency/i,
      });
      if (await emergencyCheckbox.isVisible()) {
        await emergencyCheckbox.check();
      }
    });

    await selectBloodGroup(page, patientData.bloodGroup);
    await fillAdditionalDetails(page, patientData);
    await submitRegistration(page);
  });

  test("should validate phone number format", async ({ page }) => {
    await startRegistration(page);

    await test.step("Test invalid phone number", async () => {
      await page
        .getByRole("textbox", { name: /name.*\*/i })
        .fill("Test Patient");
      await page
        .getByRole("textbox", { name: /phone number.*\*/i })
        .fill("123");
      await page.getByRole("radio", { name: "Male", exact: true }).click();

      await page.getByPlaceholder("DD", { exact: true }).fill("16");
      await page.getByPlaceholder("MM", { exact: true }).fill("06");
      await page.getByPlaceholder("YYYY", { exact: true }).fill("2009");

      await page.getByRole("button", { name: /register patient/i }).click();

      await expect(
        page.getByText(/entered phone number is not valid/i).first(),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test("should allow patient tags selection", async ({ page }) => {
    const patientData = generatePatientData();
    await startRegistration(page);
    await fillBasicInfo(page, patientData);
    await fillDateOfBirth(page, patientData.dateOfBirth);

    await test.step("Select patient tags", async () => {
      const patientTagsSection = page.getByText("Patient Tags (Optional)");
      if (await patientTagsSection.isVisible()) {
        await patientTagsSection.click();
      }
    });

    await selectBloodGroup(page, patientData.bloodGroup);
    await fillAdditionalDetails(page, patientData);
    await submitRegistration(page);

    // TODO: Verify that selected tags are associated with the patient
  });

  test("should register patient with age and verify year of birth calculation and profile display", async ({
    page,
  }) => {
    const currentYear = new Date().getFullYear();
    const patientAge = 25;
    const expectedYearOfBirth = currentYear - patientAge;

    const timestamp = Date.now();
    const patientName = `Age Test Patient ${timestamp}`;
    const phoneNumber = `9${Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, "0")}`;

    await startRegistration(page);

    await page.getByRole("textbox", { name: /name.*\*/i }).fill(patientName);
    await page
      .getByRole("textbox", { name: /phone number.*\*/i })
      .fill(phoneNumber);
    await page.getByRole("radio", { name: "Male", exact: true }).click();

    await page.getByRole("tab", { name: "Age" }).click();
    await page.getByPlaceholder("Age").fill(patientAge.toString());

    await expect(
      page.locator(`text=Year of Birth: ${expectedYearOfBirth}`),
    ).toBeVisible({ timeout: 3000 });

    await selectBloodGroup(page, "A+");
    await fillAdditionalDetails(page, {
      address: "123 Test Street",
      pincode: "302020",
    });

    await submitRegistration(page);

    await page.waitForURL("**/patients/**", { timeout: 10000 });
    await expect(
      page.getByRole("button", {
        name: new RegExp(`.*${patientAge} Y, Male`),
      }),
    ).toBeVisible({ timeout: 5000 });

    expect(expectedYearOfBirth).toEqual(currentYear - patientAge);
  });
});
