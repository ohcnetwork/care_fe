import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import {
  applyCareConfig,
  isCareConfigOverrideActive,
} from "tests/helper/careConfig";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

/**
 * Test data generator for patient registration
 */
function generatePatientData() {
  return {
    name: faker.person.fullName(),
    phoneNumber: `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`,
    gender: faker.helpers.arrayElement([
      "Male",
      "Female",
      "Transgender",
      "Non-binary",
    ]),
    dateOfBirth: {
      day: faker.number.int({ min: 1, max: 28 }).toString().padStart(2, "0"),
      month: faker.number.int({ min: 1, max: 12 }).toString().padStart(2, "0"),
      year: faker.number.int({ min: 1950, max: 2009 }).toString(),
    },
    bloodGroup: faker.helpers.arrayElement([
      "A+",
      "A-",
      "B+",
      "B-",
      "O+",
      "O-",
      "AB+",
      "AB-",
    ]),
    pincode: `${faker.number.int({ min: 1, max: 9 })}${faker.string.numeric(5)}`,
    address: faker.location.streetAddress({ useFullAddress: true }),
    emergencyContact: {
      name: faker.person.fullName(),
      phoneNumber: `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`,
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
    await page.getByRole("option", { name: bloodGroup, exact: true }).click();
  });
}

/**
 * Expands the "Additional Details" accordion section if it is collapsed.
 * Keys off the trigger's `aria-expanded` state — in minimal mode the
 * "(Optional)" suffix is a permanent part of the label, not a collapsed-state
 * indicator, so it is not a reliable signal. Idempotent.
 */
async function openAdditionalDetails(page: Page) {
  const section = page.getByRole("button", { name: "Additional Details" });
  if ((await section.getAttribute("aria-expanded")) !== "true") {
    await section.click();
  }
}

/**
 * Selects geo-organization levels from the cascading comboboxes inside the
 * "Additional Details" section. Each combobox only appears after the previous
 * level is chosen. Stops after `maxLevels` selections, or when no further level
 * appears.
 */
async function selectGeoOrganizationLevels(page: Page, maxLevels = Infinity) {
  await page
    .getByRole("button", { name: /register patient/i })
    .scrollIntoViewIfNeeded();

  const geoRegion = page.getByRole("region", { name: "Additional Details" });
  let previousCount = 0;

  while (previousCount < maxLevels) {
    const comboboxes = geoRegion.getByRole("combobox");
    const count = await comboboxes.count();
    if (count === previousCount) break;

    const combobox = comboboxes.nth(count - 1);
    await combobox.waitFor({ state: "visible" });
    await combobox.click();

    // Scope to the listbox just opened rather than page-wide options, so a
    // stray combobox elsewhere on the page can't be selected by mistake.
    const option = page.getByRole("listbox").getByRole("option").first();
    await option.waitFor({ state: "visible" });
    await option.click();

    previousCount = count;
    if (count >= maxLevels) break;

    // Wait for either a new combobox to appear (more levels) or timeout (no more levels)
    try {
      await geoRegion
        .getByRole("combobox")
        .nth(count)
        .waitFor({ state: "visible", timeout: 3000 });
    } catch {
      // No new combobox appeared — we've filled all required levels
      break;
    }
  }
}

/**
 * Fills the "Additional Details" section: address, PIN code, and all
 * cascading geo-organization levels.
 * TODO: Update state selection to a specific state once fixtures support it.
 */
async function fillAdditionalDetails(
  page: Page,
  data: { address: string; pincode: string },
) {
  await test.step("Fill additional details", async () => {
    await openAdditionalDetails(page);

    await page.getByRole("textbox", { name: "Address" }).fill(data.address);
    await page.getByRole("spinbutton", { name: "PIN Code" }).fill(data.pincode);

    await selectGeoOrganizationLevels(page);
  });
}

async function submitRegistration(page: Page) {
  await test.step("Submit patient registration", async () => {
    await page.getByRole("button", { name: /register patient/i }).click();
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText(/patient registered successfully/i),
    ).toBeVisible({ timeout: 15000 });
  });
}

/**
 * Verifies the newly registered patient is shown on the patient's home card.
 * After registration, the app navigates to `/patients/home`, where
 * `PatientInfoCard` renders `PatientHoverCard` — showing the patient name
 * (heading) and an "{age}, {gender}" line.
 */
async function verifyPatientCard(
  page: Page,
  data: { name: string; gender: string },
) {
  await test.step("Verify patient details in the card", async () => {
    await page.waitForURL("**/patients/home**");
    // Scope to the specific patient's visible card so the age/gender assertion
    // cannot match another patient's line elsewhere on the page. `PatientHoverCard`
    // renders both a hidden mobile trigger and a desktop one with the same
    // data-slot, so `:visible` selects only the active copy before filtering by
    // the name heading.
    const patientCard = page
      .locator('[data-slot="patient-info-hover-card-trigger"]:visible')
      .filter({ has: page.getByRole("heading", { name: data.name }) });
    await expect(
      patientCard.getByRole("heading", { name: data.name }),
    ).toBeVisible();
    // Match the "<age>, <gender>" line by its gender only. Scoping to this
    // patient's card (via the name heading) keeps it deterministic, and
    // avoiding the age text decouples the assertion from `formatPatientAge`'s
    // unit format, which varies with the generated date of birth.
    await expect(
      patientCard.getByText(new RegExp(`,\\s*${data.gender}\\b`, "i")),
    ).toBeVisible();
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
      ).toBeVisible();
    });
  });

  test("should show validation error when only first geo org level is selected", async ({
    page,
  }) => {
    const patientData = generatePatientData();
    await startRegistration(page);
    await fillBasicInfo(page, patientData);
    await fillDateOfBirth(page, patientData.dateOfBirth);
    await selectBloodGroup(page, patientData.bloodGroup);

    await test.step("Open additional details and fill only first state", async () => {
      await openAdditionalDetails(page);

      await page
        .getByRole("textbox", { name: "Address" })
        .fill(patientData.address);
      await page
        .getByRole("spinbutton", { name: "PIN Code" })
        .fill(patientData.pincode);

      // Select only the first geo org level
      await selectGeoOrganizationLevels(page, 1);
    });

    await test.step("Submit and verify validation error", async () => {
      await page.getByRole("button", { name: /register patient/i }).click();

      await expect(
        page
          .getByText(/geo organization is required when nationality is india/i)
          .first(),
      ).toBeVisible();

      // Should NOT show success toast
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText(/patient registered successfully/i),
      ).not.toBeVisible();
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
    ).toBeVisible();

    await selectBloodGroup(page, "A+");
    await fillAdditionalDetails(page, {
      address: "123 Test Street",
      pincode: "302020",
    });

    await submitRegistration(page);

    await page.waitForURL("**/patients/**");

    const selector = page.getByRole("button", { name: patientName });
    await expect(selector).toContainText(
      `${expectedYearOfBirth} (${patientAge}y), Male`,
    );
  });
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

  test("allows registering a newborn with today's DOB in the IST early-morning window", async ({
    page,
  }) => {
    const patientData = generatePatientData();
    await fillBasicInfo(page, patientData);
    await fillDateOfBirth(page, TODAY_IST);
    await selectBloodGroup(page, patientData.bloodGroup);
    await fillAdditionalDetails(page, patientData);
    // Resume clock before submit so API calls and toast timers work normally
    await page.clock.resume();
    await submitRegistration(page);
  });

  test("rejects a DOB that is in the future in local time", async ({
    page,
  }) => {
    const patientData = generatePatientData();
    await fillBasicInfo(page, patientData);
    await fillDateOfBirth(page, TOMORROW_IST);
    await selectBloodGroup(page, patientData.bloodGroup);
    await fillAdditionalDetails(page, patientData);
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
    ).not.toBeVisible();
  });
});

/**
 * Demonstrates controlling patient-registration config flags per test file,
 * without editing `.env.local`.
 *
 * `applyCareConfig` uses `page.addInitScript`, which runs before any app script
 * loads, so `care.config.ts` picks up the values for this spec only (see the
 * E2E override seam in that file).
 *
 * Requires the preview build to be built with `REACT_ENABLE_E2E_CONFIG_OVERRIDES=true`
 * so the seam is active — e.g. `npm run build:e2e`.
 */
test.describe("Patient Registration config overrides (per-file)", () => {
  // The override is set on each test's own isolated browser context, so it
  // applies to that test only and Playwright discards it automatically when the
  // context is torn down — no manual teardown needed.
  test("minimal registration lets a patient be registered without an address", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    await applyCareConfig(page, { minimalPatientRegistration: true });
    await page.goto(`/facility/${facilityId}/patient/create`);

    test.skip(
      !(await isCareConfigOverrideActive(page)),
      "E2E config override seam not enabled; build with `npm run build:e2e`",
    );

    const patientData = generatePatientData();
    await fillBasicInfo(page, patientData);
    await fillDateOfBirth(page, patientData.dateOfBirth);
    await selectBloodGroup(page, patientData.bloodGroup);

    // Minimal mode makes the address optional (geo organization stays
    // required), so select geo levels but leave the address/PIN blank.
    await test.step("Select geo organization without an address", async () => {
      await openAdditionalDetails(page);
      await selectGeoOrganizationLevels(page);
    });

    await submitRegistration(page);
    await verifyPatientCard(page, patientData);
  });

  test("lowering required geo org levels to 1 accepts a single selected level", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    await applyCareConfig(page, { minGeoOrganizationLevelsRequired: 1 });
    await page.goto(`/facility/${facilityId}/patient/create`);

    test.skip(
      !(await isCareConfigOverrideActive(page)),
      "E2E config override seam not enabled; build with `npm run build:e2e`",
    );

    const patientData = generatePatientData();
    await fillBasicInfo(page, patientData);
    await fillDateOfBirth(page, patientData.dateOfBirth);
    await selectBloodGroup(page, patientData.bloodGroup);

    await test.step("Open additional details and select only the first geo org level", async () => {
      await openAdditionalDetails(page);

      await page
        .getByRole("textbox", { name: "Address" })
        .fill(patientData.address);
      await page
        .getByRole("spinbutton", { name: "PIN Code" })
        .fill(patientData.pincode);

      await selectGeoOrganizationLevels(page, 1);
    });

    // With only 1 level required, a single selection must NOT raise the
    // geo-org validation error and registration should succeed.
    await submitRegistration(page);
    await verifyPatientCard(page, patientData);
  });
});
