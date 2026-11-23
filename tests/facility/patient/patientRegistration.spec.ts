import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  fillPatientAdditionalDetails,
  fillPatientBasicInfo,
  fillPatientDateOfBirth,
  generatePatientRegistrationData,
  registerPatientViaUi,
  selectPatientBloodGroup,
  startPatientRegistration,
  submitPatientRegistration,
} from "tests/helper/patient";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Registration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/facility/${getFacilityId()}/patients`);
  });

  test(
    "should successfully register a new patient with all required fields",
    { tag: ["@atomic", "@cap:patient.register"] },
    async ({ page }) => {
      const { patientId } = await registerPatientViaUi(page, {
        facilityId: getFacilityId(),
      });
      expect(patientId).toBeTruthy();
    },
  );

  test(
    "should handle emergency contact information",
    { tag: ["@atomic", "@cap:patient.register"] },
    async ({ page }) => {
      const patientData = generatePatientRegistrationData();
      await startPatientRegistration(page);
      await fillPatientBasicInfo(page, patientData);
      await fillPatientDateOfBirth(page, patientData.dateOfBirth);

      await test.step("Configure emergency contact", async () => {
        const emergencyCheckbox = page.getByRole("checkbox", {
          name: /use a different emergency/i,
        });
        if (await emergencyCheckbox.isVisible()) {
          await emergencyCheckbox.check();
        }
      });

      await selectPatientBloodGroup(page, patientData.bloodGroup);
      await fillPatientAdditionalDetails(page, patientData);
      await submitPatientRegistration(page);
    },
  );

  test(
    "should validate phone number format",
    { tag: ["@atomic", "@cap:patient.register"] },
    async ({ page }) => {
      await startPatientRegistration(page);

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
        ).toBeVisible();
      });
    },
  );

  test(
    "should show validation error when only first geo org level is selected",
    { tag: ["@atomic", "@cap:patient.register"] },
    async ({ page }) => {
      const patientData = generatePatientRegistrationData();
      await startPatientRegistration(page);
      await fillPatientBasicInfo(page, patientData);
      await fillPatientDateOfBirth(page, patientData.dateOfBirth);
      await selectPatientBloodGroup(page, patientData.bloodGroup);

      await test.step("Open additional details and fill only first state", async () => {
        const additionalDetailsSection = page.getByRole("button", {
          name: "Additional Details",
        });
        const additionalDetailsSectionText =
          await additionalDetailsSection.textContent();

        if (additionalDetailsSectionText?.toLowerCase().includes("optional")) {
          await additionalDetailsSection.click();
        }

        await page
          .getByRole("textbox", { name: "Address" })
          .fill(patientData.address);
        await page
          .getByRole("spinbutton", { name: "PIN Code" })
          .fill(patientData.pincode);

        await page
          .getByRole("button", { name: /register patient/i })
          .scrollIntoViewIfNeeded();

        // Select only the first geo org level
        const geoRegion = page.getByRole("region", {
          name: "Additional Details",
        });
        const firstCombobox = geoRegion.getByRole("combobox").first();
        await firstCombobox.waitFor({ state: "visible" });
        await firstCombobox.click();

        const option = page.getByRole("option").first();
        await option.waitFor({ state: "visible" });
        await option.click();
      });

      await test.step("Submit and verify validation error", async () => {
        await page.getByRole("button", { name: /register patient/i }).click();

        await expect(
          page
            .getByText(
              /geo organization is required when nationality is india/i,
            )
            .first(),
        ).toBeVisible();

        // Should NOT show success toast
        await expect(
          page
            .locator("li[data-sonner-toast]")
            .getByText(/patient registered successfully/i),
        ).toBeHidden();
      });
    },
  );

  test(
    "should register patient with age and verify year of birth calculation and profile display",
    { tag: ["@atomic", "@cap:patient.register"] },
    async ({ page }) => {
      const currentYear = new Date().getFullYear();
      const patientAge = 25;
      const expectedYearOfBirth = currentYear - patientAge;

      const timestamp = Date.now();
      const patientName = `Age Test Patient ${timestamp}`;
      const phoneNumber = `9${faker.string.numeric(9)}`;

      await startPatientRegistration(page);

      await page.getByRole("textbox", { name: /name.*\*/i }).fill(patientName);
      await page
        .getByRole("textbox", { name: /phone number.*\*/i })
        .fill(phoneNumber);
      await page.getByRole("radio", { name: "Male", exact: true }).click();

      await page.getByRole("tab", { name: "Age" }).click();
      await page.getByPlaceholder("Age").fill(patientAge.toString());

      await expect(
        page.locator(`text=Year of Birth: ${expectedYearOfBirth}`),
      ).toBeVisible();

      await selectPatientBloodGroup(page, "A+");
      await fillPatientAdditionalDetails(page, {
        address: "123 Test Street",
        pincode: "302020",
      });

      await submitPatientRegistration(page);

      await page.waitForURL("**/patients/**");

      const selector = page.getByRole("button", { name: patientName });
      await expect(selector).toContainText(
        `${expectedYearOfBirth} (${patientAge}y), Male`,
      );
    },
  );
});

test.describe("DOB timezone validation", () => {
  test.use({ timezoneId: "Asia/Kolkata" });

  // 2024-06-15T19:10:00Z == 2024-06-16 00:40:00 IST
  const FROZEN_INSTANT = new Date("2024-06-15T19:10:00Z");
  const TODAY_IST = { day: "16", month: "06", year: "2024" };
  const TOMORROW_IST = { day: "17", month: "06", year: "2024" };

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();

    // Must be installed before any navigation so the app's Date.now() is
    // overridden from first render.
    await page.clock.install({ time: FROZEN_INSTANT });
    await page.clock.setFixedTime(FROZEN_INSTANT);

    await page.goto(`/facility/${facilityId}/patient/create`);
  });

  test(
    "allows registering a newborn with today's DOB in the IST early-morning window",
    { tag: ["@atomic", "@cap:patient.register"] },
    async ({ page }) => {
      const patientData = generatePatientRegistrationData();
      await fillPatientBasicInfo(page, patientData);
      await fillPatientDateOfBirth(page, TODAY_IST);
      await selectPatientBloodGroup(page, patientData.bloodGroup);
      await fillPatientAdditionalDetails(page, patientData);
      // Resume clock before submit so API calls and toast timers work normally
      await page.clock.resume();
      await submitPatientRegistration(page);
    },
  );

  test(
    "rejects a DOB that is in the future in local time",
    { tag: ["@atomic", "@cap:patient.register"] },
    async ({ page }) => {
      const patientData = generatePatientRegistrationData();
      await fillPatientBasicInfo(page, patientData);
      await fillPatientDateOfBirth(page, TOMORROW_IST);
      await selectPatientBloodGroup(page, patientData.bloodGroup);
      await fillPatientAdditionalDetails(page, patientData);
      // Resume clock before submit so form submission and toast work
      await page.clock.resume();

      await page.getByRole("button", { name: /register patient/i }).click();

      await expect(
        page.getByText(/date cannot be in the future/i).first(),
      ).toBeVisible();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText(/patient registered successfully/i),
      ).toBeHidden();
    },
  );
});
