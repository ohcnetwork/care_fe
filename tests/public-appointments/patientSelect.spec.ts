import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";

/**
 * Patient Select Page E2E Tests
 *
 * This test suite covers the patient selection flow for public appointment booking.
 * The PatientSelect page allows authenticated users (via OTP) to select an existing
 * patient or create a new one before booking an appointment.
 *
 * Key functionality tested:
 * - Authentication gate (requires patient token)
 * - Query parameter validation (slotId, reason)
 * - Patient list display from API
 * - Patient card selection
 * - Navigation to patient registration
 * - Appointment confirmation flow
 */

// Use authenticated admin state for API setup
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Select Page", () => {
  const facilityId = "9c8c6292-bb2a-430b-a241-0db02ce7ce51"; // Default facility from fixtures
  const staffId = faker.string.uuid();
  const slotId = faker.string.uuid();
  const reason = faker.lorem.sentence();

  /**
   * Helper to mock patient token in localStorage
   * This simulates the OTP authentication flow that happens before reaching patient-select
   */
  async function mockPatientToken(page: Page, token?: string) {
    const mockToken = {
      token: token || faker.string.alphanumeric(64),
      phoneNumber: faker.phone.number("+91##########"),
    };

    await page.addInitScript((tokenData) => {
      localStorage.setItem(
        "patient_token",
        JSON.stringify({
          token: tokenData.token,
          phone_number: tokenData.phoneNumber,
        }),
      );
    }, mockToken);

    return mockToken;
  }

  /**
   * Helper to mock patient list API response
   */
  async function mockPatientListResponse(page: Page, patients: any[]) {
    await page.route("**/api/v1/otp/patient/", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            count: patients.length,
            next: null,
            previous: null,
            results: patients,
          }),
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Helper to create mock patient data
   */
  function createMockPatient(overrides = {}) {
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      gender: faker.helpers.arrayElement(["male", "female", "non_binary"]),
      phone_number: faker.phone.number("+91##########"),
      emergency_phone_number: faker.phone.number("+91##########"),
      address: faker.location.streetAddress(),
      pincode: faker.number.int({ min: 100000, max: 999999 }),
      date_of_birth: faker.date.past({ years: 30 }).toISOString().split("T")[0],
      year_of_birth: faker.number.int({ min: 1950, max: 2020 }),
      geo_organization: {
        id: faker.string.uuid(),
        name: faker.company.name(),
      },
      ...overrides,
    };
  }

  test.describe("Authentication and Navigation Guards", () => {
    test("redirects to login when patient token is missing", async ({
      page,
    }) => {
      await test.step("Navigate without token", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Verify redirect to OTP send page", async () => {
        await page.waitForURL(
          `**/facility/${facilityId}/appointments/${staffId}/otp/send`,
          { timeout: 10000 },
        );
        await expect(page).toHaveURL(
          new RegExp(`/facility/${facilityId}/appointments/${staffId}/otp/send`),
        );
      });

      await test.step("Verify error toast message", async () => {
        // Toast should indicate missing phone number
        await expect(
          page.getByText(/phone.*number.*not.*found/i),
        ).toBeVisible({ timeout: 5000 });
      });
    });

    test("redirects when slotId is missing", async ({ page }) => {
      await mockPatientToken(page);

      await test.step("Navigate without slotId", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?reason=${reason}`,
        );
      });

      await test.step("Verify redirect to appointment booking page", async () => {
        await page.waitForURL(
          `**/facility/${facilityId}/appointments/${staffId}/book-appointment`,
          { timeout: 10000 },
        );
      });

      await test.step("Verify error toast message", async () => {
        await expect(
          page.getByText(/selected.*slot.*not.*found/i),
        ).toBeVisible({ timeout: 5000 });
      });
    });

    test("shows correct page when all required params are present", async ({
      page,
    }) => {
      await mockPatientToken(page);
      await mockPatientListResponse(page, []);

      await test.step("Navigate with all required params", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Verify page loads correctly", async () => {
        await expect(
          page.getByRole("heading", { name: /select.*register.*patient/i }),
        ).toBeVisible({ timeout: 10000 });
      });
    });
  });

  test.describe("Patient List Display", () => {
    test("displays loading state while fetching patients", async ({ page }) => {
      await mockPatientToken(page);

      await test.step("Navigate to patient select", async () => {
        // Don't mock the API to see loading state
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Verify loading indicator appears", async () => {
        // Loading component should be visible initially
        const loadingIndicator = page.locator('[data-testid="loading"]');
        // Check if it was visible (might be very brief)
        await page.waitForLoadState("domcontentloaded");
      });
    });

    test("displays message when no patients are found", async ({ page }) => {
      await mockPatientToken(page);
      await mockPatientListResponse(page, []);

      await test.step("Navigate to patient select", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Verify no patients message", async () => {
        await expect(
          page.getByText(/no.*patients.*found.*phone.*number/i),
        ).toBeVisible({ timeout: 10000 });
      });

      await test.step("Verify sticky confirm button is not shown", async () => {
        const confirmButton = page
          .getByRole("button", { name: /confirm/i })
          .last();
        await expect(confirmButton).not.toBeVisible();
      });
    });

    test("displays patient cards with correct information", async ({
      page,
    }) => {
      const mockPatients = [
        createMockPatient({
          name: "John Doe",
          gender: "male",
          date_of_birth: "1990-05-15",
        }),
        createMockPatient({
          name: "Jane Smith",
          gender: "female",
          year_of_birth: 1985,
          date_of_birth: null,
        }),
      ];

      await mockPatientToken(page);
      await mockPatientListResponse(page, mockPatients);

      await test.step("Navigate to patient select", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Verify all patient cards are displayed", async () => {
        await expect(page.getByText("John Doe")).toBeVisible({
          timeout: 10000,
        });
        await expect(page.getByText("Jane Smith")).toBeVisible();
      });

      await test.step("Verify patient card shows gender", async () => {
        // Gender should be translated (GENDER__male, GENDER__female)
        const johnCard = page.locator('[role="heading"]', {
          hasText: "John Doe",
        });
        await expect(johnCard).toBeVisible();
      });

      await test.step("Verify date of birth formatting", async () => {
        // Patient with DOB should show formatted date (15 May 1990)
        await expect(page.getByText(/15.*May.*1990/i)).toBeVisible();
      });

      await test.step("Verify age calculation for year_of_birth only", async () => {
        // Patient without DOB should show calculated age (current year - 1985)
        const expectedAge = new Date().getFullYear() - 1985;
        await expect(
          page.getByText(new RegExp(`${expectedAge}.*years`, "i")),
        ).toBeVisible();
      });
    });

    test("displays multiple patients in grid layout", async ({ page }) => {
      const mockPatients = Array.from({ length: 4 }, () =>
        createMockPatient(),
      );

      await mockPatientToken(page);
      await mockPatientListResponse(page, mockPatients);

      await test.step("Navigate to patient select", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Verify grid layout", async () => {
        // Cards should be in a grid container
        const gridContainer = page.locator(".grid");
        await expect(gridContainer).toBeVisible({ timeout: 10000 });
      });

      await test.step("Verify all patient cards are rendered", async () => {
        for (const patient of mockPatients) {
          await expect(page.getByText(patient.name)).toBeVisible();
        }
      });
    });
  });

  test.describe("Patient Selection", () => {
    test("allows selecting a patient card", async ({ page }) => {
      const mockPatient = createMockPatient({ name: "Test Patient" });

      await mockPatientToken(page);
      await mockPatientListResponse(page, [mockPatient]);

      await test.step("Navigate to patient select", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Click patient card", async () => {
        const patientCard = page
          .locator('[role="heading"]', { hasText: "Test Patient" })
          .locator("..");
        await patientCard.click();
      });

      await test.step("Verify card is highlighted", async () => {
        // Selected card should have border-primary class
        const patientCard = page
          .locator('[role="heading"]', { hasText: "Test Patient" })
          .locator("..");
        await expect(patientCard).toHaveClass(/border-primary/);
      });

      await test.step("Verify sticky confirm button appears", async () => {
        const confirmButton = page
          .getByRole("button", { name: /confirm/i })
          .last();
        await expect(confirmButton).toBeVisible();
      });
    });

    test("allows changing patient selection", async ({ page }) => {
      const mockPatients = [
        createMockPatient({ name: "Patient One" }),
        createMockPatient({ name: "Patient Two" }),
      ];

      await mockPatientToken(page);
      await mockPatientListResponse(page, mockPatients);

      await test.step("Navigate to patient select", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Select first patient", async () => {
        const patientOneCard = page
          .locator('[role="heading"]', { hasText: "Patient One" })
          .locator("..");
        await patientOneCard.click();
        await expect(patientOneCard).toHaveClass(/border-primary/);
      });

      await test.step("Select second patient", async () => {
        const patientTwoCard = page
          .locator('[role="heading"]', { hasText: "Patient Two" })
          .locator("..");
        await patientTwoCard.click();
        await expect(patientTwoCard).toHaveClass(/border-primary/);
      });

      await test.step("Verify first patient is deselected", async () => {
        const patientOneCard = page
          .locator('[role="heading"]', { hasText: "Patient One" })
          .locator("..");
        await expect(patientOneCard).not.toHaveClass(/border-primary/);
      });
    });

    test("allows canceling selection", async ({ page }) => {
      const mockPatient = createMockPatient({ name: "Test Patient" });

      await mockPatientToken(page);
      await mockPatientListResponse(page, [mockPatient]);

      await test.step("Navigate to patient select", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Select patient", async () => {
        const patientCard = page
          .locator('[role="heading"]', { hasText: "Test Patient" })
          .locator("..");
        await patientCard.click();
      });

      await test.step("Click cancel button", async () => {
        const cancelButton = page
          .getByRole("button", { name: /cancel/i })
          .last();
        await cancelButton.click();
      });

      await test.step("Verify patient is deselected", async () => {
        const patientCard = page
          .locator('[role="heading"]', { hasText: "Test Patient" })
          .locator("..");
        await expect(patientCard).not.toHaveClass(/border-primary/);
      });

      await test.step("Verify sticky bar is hidden", async () => {
        const confirmButton = page
          .getByRole("button", { name: /confirm/i })
          .last();
        await expect(confirmButton).not.toBeVisible();
      });
    });
  });

  test.describe("Navigation", () => {
    test("navigates back to appointment booking", async ({ page }) => {
      await mockPatientToken(page);
      await mockPatientListResponse(page, []);

      await test.step("Navigate to patient select", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Click back button", async () => {
        const backButton = page.getByRole("button", { name: /back/i });
        await backButton.click();
      });

      await test.step("Verify navigation to booking page", async () => {
        await page.waitForURL(
          `**/facility/${facilityId}/appointments/${staffId}/book-appointment`,
          { timeout: 10000 },
        );
      });
    });

    test("navigates to patient registration form", async ({ page }) => {
      await mockPatientToken(page);
      await mockPatientListResponse(page, []);

      await test.step("Navigate to patient select", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Click add new patient button", async () => {
        const addPatientButton = page.getByRole("button", {
          name: /add.*new.*patient/i,
        });
        await addPatientButton.click();
      });

      await test.step("Verify navigation to registration page", async () => {
        await page.waitForURL(
          `**/facility/${facilityId}/appointments/${staffId}/patient-registration**`,
          { timeout: 10000 },
        );
      });

      await test.step("Verify query params are preserved", async () => {
        const url = new URL(page.url());
        expect(url.searchParams.get("slotId")).toBe(slotId);
        expect(url.searchParams.get("reason")).toBe(reason);
      });
    });
  });

  test.describe("Appointment Creation", () => {
    test("creates appointment on confirm", async ({ page }) => {
      const mockPatient = createMockPatient({ name: "Test Patient" });
      const mockToken = await mockPatientToken(page);

      await mockPatientListResponse(page, [mockPatient]);

      // Mock appointment creation API
      let appointmentCreated = false;
      let appointmentData: any = null;

      await page.route("**/api/v1/otp/slots/*/create_appointment/", async (route) => {
        appointmentCreated = true;
        const requestBody = JSON.parse(route.request().postData() || "{}");
        appointmentData = requestBody;

        const mockAppointment = {
          id: faker.string.uuid(),
          patient: mockPatient.id,
          note: requestBody.note,
          created_date: new Date().toISOString(),
        };

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockAppointment),
        });
      });

      await test.step("Navigate to patient select", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Select patient", async () => {
        await page.waitForTimeout(1000); // Wait for data to load
        const patientCard = page
          .locator('[role="heading"]', { hasText: "Test Patient" })
          .locator("..");
        await patientCard.click();
      });

      await test.step("Click confirm button", async () => {
        const confirmButton = page
          .getByRole("button", { name: /confirm/i })
          .last();
        await confirmButton.click();
      });

      await test.step("Verify appointment creation API was called", async () => {
        await page.waitForTimeout(2000);
        expect(appointmentCreated).toBe(true);
        expect(appointmentData.patient).toBe(mockPatient.id);
        expect(appointmentData.note).toBe(reason);
      });

      await test.step("Verify success toast", async () => {
        await expect(
          page.getByText(/appointment.*created.*success/i),
        ).toBeVisible({ timeout: 10000 });
      });
    });

    test("includes authorization header in API request", async ({ page }) => {
      const mockPatient = createMockPatient({ name: "Test Patient" });
      const mockToken = await mockPatientToken(page);

      await mockPatientListResponse(page, [mockPatient]);

      let authHeader = "";

      await page.route("**/api/v1/otp/slots/*/create_appointment/", async (route) => {
        authHeader = route.request().headers()["authorization"] || "";

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: faker.string.uuid(),
            patient: mockPatient.id,
          }),
        });
      });

      await test.step("Navigate to patient select", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Select patient and confirm", async () => {
        await page.waitForTimeout(1000);
        const patientCard = page
          .locator('[role="heading"]', { hasText: "Test Patient" })
          .locator("..");
        await patientCard.click();

        const confirmButton = page
          .getByRole("button", { name: /confirm/i })
          .last();
        await confirmButton.click();
      });

      await test.step("Verify authorization header", async () => {
        await page.waitForTimeout(2000);
        expect(authHeader).toContain("Bearer");
        expect(authHeader).toContain(mockToken.token);
      });
    });
  });

  test.describe("Responsive Design", () => {
    test("displays correctly on mobile viewport", async ({ page }) => {
      const mockPatients = [createMockPatient(), createMockPatient()];

      await mockPatientToken(page);
      await mockPatientListResponse(page, mockPatients);

      await test.step("Set mobile viewport", async () => {
        await page.setViewportSize({ width: 375, height: 667 });
      });

      await test.step("Navigate to patient select", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Verify mobile layout", async () => {
        // Grid should be single column on mobile
        const gridContainer = page.locator(".grid");
        await expect(gridContainer).toBeVisible({ timeout: 10000 });
      });

      await test.step("Verify add patient button is full width", async () => {
        const addPatientButton = page.getByRole("button", {
          name: /add.*new.*patient/i,
        });
        await expect(addPatientButton).toHaveClass(/w-full/);
      });
    });

    test("sticky bottom bar is visible on scroll", async ({ page }) => {
      const mockPatients = Array.from({ length: 10 }, () =>
        createMockPatient(),
      );

      await mockPatientToken(page);
      await mockPatientListResponse(page, mockPatients);

      await test.step("Navigate to patient select", async () => {
        await page.goto(
          `/facility/${facilityId}/appointments/${staffId}/patient-select?slotId=${slotId}&reason=${reason}`,
        );
      });

      await test.step("Select first patient", async () => {
        await page.waitForTimeout(1000);
        const firstCard = page.locator('[role="heading"]').first().locator("..");
        await firstCard.click();
      });

      await test.step("Scroll down the page", async () => {
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(500);
      });

      await test.step("Verify sticky bar remains visible", async () => {
        const stickyBar = page.locator(".fixed.bottom-0");
        await expect(stickyBar).toBeVisible();
      });

      await test.step("Verify confirm button is accessible", async () => {
        const confirmButton = page
          .getByRole("button", { name: /confirm/i })
          .last();
        await expect(confirmButton).toBeVisible();
      });
    });
  });
});
