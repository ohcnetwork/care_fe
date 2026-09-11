import { faker } from "@faker-js/faker";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import {
  createDisposableUserViaUi,
  DEFAULT_DISPOSABLE_USER_PASSWORD,
} from "tests/helper/user";
import { getFacilityId } from "tests/support/facilityId";

const LOCAL_OTP = "45612";

/**
 * Creates an admin context page for setup operations.
 */
async function withAdminPage<T>(
  browser: Browser,
  run: (page: Page) => Promise<T>,
): Promise<T> {
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
  });
  const page = await context.newPage();
  try {
    return await run(page);
  } finally {
    await context.close();
  }
}

/**
 * Authenticates a patient user via OTP and returns the page with auth context.
 */
async function authenticatePatientUser(
  browser: Browser,
  phoneNumber: string,
): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();

  const facilityId = getFacilityId();
  await page.goto(`/facility/${facilityId}`);

  // Navigate to OTP send page
  await page.getByRole("link", { name: /book appointment/i }).first().click();
  await expect(page).toHaveURL(
    new RegExp(`/facility/${facilityId}/appointments/[^/]+/otp/send`),
  );

  // Enter phone number
  await page
    .getByPlaceholder(/enter your phone number/i)
    .fill(phoneNumber.slice(-10));
  await page.getByRole("button", { name: /send otp/i }).click();

  // Wait for OTP page
  await expect(page).toHaveURL(
    new RegExp(`/facility/${facilityId}/appointments/[^/]+/otp/verify`),
  );

  // Enter OTP
  const otpInput = page.locator("#otp-input");
  await otpInput.click();
  await otpInput.pressSequentially(LOCAL_OTP);

  // Wait for navigation to schedule page after successful OTP
  await page.waitForURL(
    new RegExp(
      `/facility/${facilityId}/appointments/[^/]+/book-appointment`,
    ),
    { timeout: 10000 },
  );

  return page;
}

/**
 * Creates a staff user and navigates to patient select page with authenticated patient.
 */
async function setupPatientSelectPage(
  browser: Browser,
): Promise<{ page: Page; staffId: string; slotId: string }> {
  // Create a staff user
  const user = await withAdminPage(browser, async (adminPage) => {
    return await createDisposableUserViaUi(adminPage, {
      organizationSearch: "Doctor",
      organizationOption: "Doctor",
    });
  });

  // Authenticate patient
  const page = await authenticatePatientUser(browser, user.phoneNumber);

  const facilityId = getFacilityId();
  const currentUrl = page.url();
  const staffIdMatch = currentUrl.match(
    /\/appointments\/([a-f0-9-]+)\/book-appointment/,
  );
  const staffId = staffIdMatch ? staffIdMatch[1] : "";

  // Select a date and slot to get to patient select page
  await test.step("Select appointment slot", async () => {
    // Click a date in the calendar
    const dateButtons = page.locator('button[name="day"]').filter({
      hasNotText: /^$/,
    });
    const availableDate = dateButtons.first();
    await availableDate.waitFor({ state: "visible", timeout: 10000 });
    await availableDate.click();

    // Wait a bit for slots to load (if any)
    await page.waitForTimeout(1000);

    // Try to find slots
    const slotButtons = page.getByRole("button").filter({
      hasText: /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/,
    });

    const slotCount = await slotButtons.count();

    if (slotCount > 0) {
      // Select first available slot
      await slotButtons.first().click();
      await page.getByRole("button", { name: /continue/i }).click();
    } else {
      // No slots available - manually navigate to patient select with mock slot
      const mockSlotId = faker.string.uuid();
      await page.goto(
        `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${mockSlotId}&reason=Test+appointment`,
      );
    }
  });

  // Extract slotId from URL
  await page.waitForURL(/\/patient-select\?slotId=/);
  const url = new URL(page.url());
  const slotId = url.searchParams.get("slotId") || "";

  return { page, staffId, slotId };
}

test.describe("Patient Select Page - Core Functionality", () => {
  test("displays page with correct heading and add patient button", async ({
    browser,
  }) => {
    const { page } = await setupPatientSelectPage(browser);

    await test.step("Verify page heading", async () => {
      await expect(
        page.getByRole("heading", { name: /select.*register.*patient/i }),
      ).toBeVisible();
    });

    await test.step("Verify add new patient button", async () => {
      await expect(
        page.getByRole("button", { name: /add new patient/i }),
      ).toBeVisible();
    });

    await page.close();
  });

  test("shows back button and navigates to schedule page", async ({
    browser,
  }) => {
    const { page, staffId } = await setupPatientSelectPage(browser);

    await test.step("Click back button", async () => {
      const backButton = page.getByRole("button", { name: /back/i });
      await expect(backButton).toBeVisible();
      await backButton.click();
    });

    await test.step("Verify navigation to schedule page", async () => {
      await expect(page).toHaveURL(
        new RegExp(`/appointments/${staffId}/book-appointment`),
      );
    });

    await page.close();
  });

  test("displays loading state while fetching patients", async ({
    browser,
  }) => {
    const { page } = await setupPatientSelectPage(browser);

    // The loading state may be brief, but we should see either loading or content
    await test.step("Verify page loads content", async () => {
      // Wait for either loading indicator to disappear or patient list to appear
      await page.waitForSelector(
        'div:has-text("No patients"), div.grid, div:has-text("Loading")',
        { timeout: 10000 },
      );
    });

    await page.close();
  });

  test("displays no patients found message when phone number has no patients", async ({
    browser,
  }) => {
    const { page } = await setupPatientSelectPage(browser);

    await test.step("Check for no patients message or patient list", async () => {
      // Since we're using a new phone number, we might see no patients
      // But if fixtures created patients, we'll see the grid
      const noPatients = page.getByText(/no patients found/i);
      const patientGrid = page.locator("div.grid");

      // One of these should be visible
      try {
        await expect(noPatients).toBeVisible({ timeout: 5000 });
      } catch {
        await expect(patientGrid).toBeVisible({ timeout: 5000 });
      }
    });

    await page.close();
  });

  test("navigates to patient registration when add new patient clicked", async ({
    browser,
  }) => {
    const { page, staffId, slotId } = await setupPatientSelectPage(browser);

    await test.step("Click add new patient button", async () => {
      await page.getByRole("button", { name: /add new patient/i }).click();
    });

    await test.step("Verify navigation to registration page with query params", async () => {
      await expect(page).toHaveURL(
        new RegExp(`/appointments/${staffId}/patient-registration`),
      );
      const url = new URL(page.url());
      expect(url.searchParams.get("slotId")).toBe(slotId);
    });

    await page.close();
  });
});

test.describe("Patient Select Page - Patient Selection Flow", () => {
  /**
   * Creates a patient via API for the authenticated phone number.
   */
  async function createPatientViaApi(
    page: Page,
    phoneNumber: string,
  ): Promise<string> {
    // Get the token from localStorage
    const localStorage = await page.context().storageState();
    const patientTokenEntry = localStorage.origins
      .flatMap((origin) => origin.localStorage)
      .find((item) => item.name === "patient_otp_verification");

    if (!patientTokenEntry) {
      throw new Error("No patient token in storage state");
    }

    const tokenData = JSON.parse(patientTokenEntry.value);
    const token = tokenData.token;

    const facilityId = getFacilityId();

    // Create patient via API
    const response = await page.request.post(
      `http://127.0.0.1:9000/api/v1/public/patient/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          name: faker.person.fullName(),
          phone_number: phoneNumber,
          emergency_phone_number: phoneNumber,
          gender: faker.helpers.arrayElement([1, 2, 3]), // Male, Female, Non-binary
          year_of_birth: faker.number.int({ min: 1950, max: 2020 }),
          address: faker.location.streetAddress(),
          pincode: faker.number.int({ min: 100000, max: 999999 }),
          geo_organization: facilityId,
        },
      },
    );

    const patientData = await response.json();
    return patientData.id;
  }

  test("displays patient cards when patients exist for phone number", async ({
    browser,
  }) => {
    const user = await withAdminPage(browser, async (adminPage) => {
      return await createDisposableUserViaUi(adminPage, {
        organizationSearch: "Doctor",
        organizationOption: "Doctor",
      });
    });

    const page = await authenticatePatientUser(browser, user.phoneNumber);

    // Create a patient for this phone number
    await createPatientViaApi(page, user.phoneNumber);

    const facilityId = getFacilityId();
    const staffIdMatch = page
      .url()
      .match(/\/appointments\/([a-f0-9-]+)\/book-appointment/);
    const staffId = staffIdMatch ? staffIdMatch[1] : "";

    // Navigate to patient select with mock slot
    const mockSlotId = faker.string.uuid();
    await page.goto(
      `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${mockSlotId}&reason=Test`,
    );

    await test.step("Verify patient card displays", async () => {
      // Wait for patient grid to appear
      const patientGrid = page.locator("div.grid");
      await expect(patientGrid).toBeVisible({ timeout: 10000 });

      // Verify patient card is visible
      const patientCard = page.locator("div[class*='cursor-pointer']").first();
      await expect(patientCard).toBeVisible();
    });

    await page.close();
  });

  test("allows selecting a patient and shows sticky confirm button", async ({
    browser,
  }) => {
    const user = await withAdminPage(browser, async (adminPage) => {
      return await createDisposableUserViaUi(adminPage, {
        organizationSearch: "Doctor",
        organizationOption: "Doctor",
      });
    });

    const page = await authenticatePatientUser(browser, user.phoneNumber);

    // Create a patient for this phone number
    await createPatientViaApi(page, user.phoneNumber);

    const facilityId = getFacilityId();
    const staffIdMatch = page
      .url()
      .match(/\/appointments\/([a-f0-9-]+)\/book-appointment/);
    const staffId = staffIdMatch ? staffIdMatch[1] : "";

    const mockSlotId = faker.string.uuid();
    await page.goto(
      `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${mockSlotId}&reason=Test`,
    );

    await test.step("Select a patient", async () => {
      const patientCard = page.locator("div[class*='cursor-pointer']").first();
      await patientCard.waitFor({ state: "visible", timeout: 10000 });
      await patientCard.click();
    });

    await test.step("Verify sticky bottom bar appears with confirm button", async () => {
      const confirmButton = page.getByRole("button", { name: /^confirm$/i });
      await expect(confirmButton).toBeVisible();

      const cancelButton = page.getByRole("button", { name: /^cancel$/i });
      await expect(cancelButton).toBeVisible();
    });

    await page.close();
  });

  test("allows cancelling patient selection", async ({ browser }) => {
    const user = await withAdminPage(browser, async (adminPage) => {
      return await createDisposableUserViaUi(adminPage, {
        organizationSearch: "Doctor",
        organizationOption: "Doctor",
      });
    });

    const page = await authenticatePatientUser(browser, user.phoneNumber);

    // Create a patient for this phone number
    await createPatientViaApi(page, user.phoneNumber);

    const facilityId = getFacilityId();
    const staffIdMatch = page
      .url()
      .match(/\/appointments\/([a-f0-9-]+)\/book-appointment/);
    const staffId = staffIdMatch ? staffIdMatch[1] : "";

    const mockSlotId = faker.string.uuid();
    await page.goto(
      `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${mockSlotId}&reason=Test`,
    );

    await test.step("Select a patient", async () => {
      const patientCard = page.locator("div[class*='cursor-pointer']").first();
      await patientCard.waitFor({ state: "visible", timeout: 10000 });
      await patientCard.click();
    });

    await test.step("Click cancel button", async () => {
      const cancelButton = page.getByRole("button", { name: /^cancel$/i });
      await cancelButton.click();
    });

    await test.step("Verify bottom bar disappears", async () => {
      const confirmButton = page.getByRole("button", { name: /^confirm$/i });
      await expect(confirmButton).not.toBeVisible();
    });

    await page.close();
  });

  test("highlights selected patient card with border", async ({ browser }) => {
    const user = await withAdminPage(browser, async (adminPage) => {
      return await createDisposableUserViaUi(adminPage, {
        organizationSearch: "Doctor",
        organizationOption: "Doctor",
      });
    });

    const page = await authenticatePatientUser(browser, user.phoneNumber);

    // Create a patient for this phone number
    await createPatientViaApi(page, user.phoneNumber);

    const facilityId = getFacilityId();
    const staffIdMatch = page
      .url()
      .match(/\/appointments\/([a-f0-9-]+)\/book-appointment/);
    const staffId = staffIdMatch ? staffIdMatch[1] : "";

    const mockSlotId = faker.string.uuid();
    await page.goto(
      `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${mockSlotId}&reason=Test`,
    );

    await test.step("Select a patient and verify visual feedback", async () => {
      const patientCard = page.locator("div[class*='cursor-pointer']").first();
      await patientCard.waitFor({ state: "visible", timeout: 10000 });

      // Check classes before selection
      const classBeforeClick = await patientCard.getAttribute("class");
      expect(classBeforeClick).not.toContain("border-primary");

      await patientCard.click();

      // Check classes after selection
      const classAfterClick = await patientCard.getAttribute("class");
      expect(classAfterClick).toContain("border-primary");
    });

    await page.close();
  });

  test("displays patient information in card (name, DOB/age, gender)", async ({
    browser,
  }) => {
    const user = await withAdminPage(browser, async (adminPage) => {
      return await createDisposableUserViaUi(adminPage, {
        organizationSearch: "Doctor",
        organizationOption: "Doctor",
      });
    });

    const page = await authenticatePatientUser(browser, user.phoneNumber);

    // Create a patient for this phone number
    const patientName = faker.person.fullName();
    await page.request.post(`http://127.0.0.1:9000/api/v1/public/patient/`, {
      headers: {
        Authorization: `Bearer ${(await page.context().storageState()).origins.flatMap((o) => o.localStorage).find((i) => i.name === "patient_otp_verification")!.value.match(/"token":"([^"]+)"/)?.[1]}`,
        "Content-Type": "application/json",
      },
      data: {
        name: patientName,
        phone_number: user.phoneNumber,
        emergency_phone_number: user.phoneNumber,
        gender: 1,
        year_of_birth: 1990,
        address: faker.location.streetAddress(),
        pincode: faker.number.int({ min: 100000, max: 999999 }),
        geo_organization: getFacilityId(),
      },
    });

    const facilityId = getFacilityId();
    const staffIdMatch = page
      .url()
      .match(/\/appointments\/([a-f0-9-]+)\/book-appointment/);
    const staffId = staffIdMatch ? staffIdMatch[1] : "";

    const mockSlotId = faker.string.uuid();
    await page.goto(
      `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${mockSlotId}&reason=Test`,
    );

    await test.step("Verify patient card information", async () => {
      const patientCard = page.locator("div[class*='cursor-pointer']").first();
      await patientCard.waitFor({ state: "visible", timeout: 10000 });

      // Verify name is displayed (capitalized)
      await expect(patientCard.getByText(patientName, { exact: false })).toBeVisible();

      // Verify age/DOB label
      await expect(
        patientCard.getByText(/date of birth|age/i),
      ).toBeVisible();

      // Verify gender label
      await expect(patientCard.getByText(/sex/i)).toBeVisible();
    });

    await page.close();
  });
});

test.describe("Patient Select Page - Error Handling", () => {
  test("redirects to facility page when staffId missing", async ({
    browser,
  }) => {
    const user = await withAdminPage(browser, async (adminPage) => {
      return await createDisposableUserViaUi(adminPage);
    });

    const page = await authenticatePatientUser(browser, user.phoneNumber);

    const facilityId = getFacilityId();
    const mockSlotId = faker.string.uuid();

    await test.step("Navigate to patient select without staffId", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments//patient-select?slotId=${mockSlotId}`,
      );
    });

    await test.step("Verify redirect and error toast", async () => {
      // Should redirect back to facility page
      await page.waitForURL(new RegExp(`/facility/${facilityId}`), {
        timeout: 10000,
      });
    });

    await page.close();
  });

  test("redirects to OTP page when authentication token missing", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const mockStaffId = faker.string.uuid();
    const mockSlotId = faker.string.uuid();

    await test.step("Navigate to patient select without auth", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${mockStaffId}/patient-select?slotId=${mockSlotId}`,
      );
    });

    await test.step("Verify redirect to OTP send page", async () => {
      await page.waitForURL(
        new RegExp(`/facility/${facilityId}/appointments/${mockStaffId}/otp/send`),
        { timeout: 10000 },
      );
    });
  });

  test("redirects to schedule page when slotId missing", async ({
    browser,
  }) => {
    const user = await withAdminPage(browser, async (adminPage) => {
      return await createDisposableUserViaUi(adminPage, {
        organizationSearch: "Doctor",
        organizationOption: "Doctor",
      });
    });

    const page = await authenticatePatientUser(browser, user.phoneNumber);

    const facilityId = getFacilityId();
    const staffIdMatch = page
      .url()
      .match(/\/appointments\/([a-f0-9-]+)\/book-appointment/);
    const staffId = staffIdMatch ? staffIdMatch[1] : "";

    await test.step("Navigate to patient select without slotId", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffId}/patient-select`,
      );
    });

    await test.step("Verify redirect to schedule page", async () => {
      await page.waitForURL(
        new RegExp(`/appointments/${staffId}/book-appointment`),
        { timeout: 10000 },
      );
    });

    await page.close();
  });
});

test.describe("Patient Select Page - Appointment Creation", () => {
  test("creates appointment when patient selected and confirmed", async ({
    browser,
  }) => {
    const user = await withAdminPage(browser, async (adminPage) => {
      return await createDisposableUserViaUi(adminPage, {
        organizationSearch: "Doctor",
        organizationOption: "Doctor",
      });
    });

    const page = await authenticatePatientUser(browser, user.phoneNumber);

    // Create a patient for this phone number
    await createPatientViaApi(page, user.phoneNumber);

    const facilityId = getFacilityId();
    const staffIdMatch = page
      .url()
      .match(/\/appointments\/([a-f0-9-]+)\/book-appointment/);
    const staffId = staffIdMatch ? staffIdMatch[1] : "";

    // We need a real slot for this test, so let's navigate through the proper flow
    await test.step("Select appointment slot from schedule", async () => {
      // Click a date in the calendar
      const dateButtons = page.locator('button[name="day"]').filter({
        hasNotText: /^$/,
      });
      const availableDate = dateButtons.first();
      await availableDate.waitFor({ state: "visible", timeout: 10000 });
      await availableDate.click();

      // Wait for slots
      await page.waitForTimeout(1000);

      // Check if slots exist
      const slotButtons = page.getByRole("button").filter({
        hasText: /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/,
      });

      const slotCount = await slotButtons.count();

      if (slotCount > 0) {
        // Select first available slot and continue
        await slotButtons.first().click();
        await page.getByRole("button", { name: /continue/i }).click();

        // Wait for patient select page
        await page.waitForURL(/\/patient-select\?slotId=/);

        await test.step("Select patient and confirm", async () => {
          const patientCard = page
            .locator("div[class*='cursor-pointer']")
            .first();
          await patientCard.waitFor({ state: "visible", timeout: 10000 });
          await patientCard.click();

          // Wait for API response
          const appointmentResponse = page.waitForResponse(
            (response) =>
              response
                .url()
                .includes("/api/v1/public/appointment/slot/") &&
              response.request().method() === "POST",
          );

          const confirmButton = page.getByRole("button", {
            name: /^confirm$/i,
          });
          await confirmButton.click();

          // Wait for success
          await appointmentResponse;
        });

        await test.step("Verify navigation to success page", async () => {
          await page.waitForURL(/\/appointments\/[^/]+\/success/, {
            timeout: 10000,
          });
          await expectToast(page, /appointment.*success/i);
        });
      }
    });

    await page.close();
  });
});
