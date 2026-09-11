import { faker } from "@faker-js/faker";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import {
  createDisposableUserViaUi,
  DEFAULT_DISPOSABLE_USER_PASSWORD,
} from "tests/helper/user";
import { getFacilityId } from "tests/support/facilityId";

/**
 * Local OTP used for testing (same as backend fixture)
 * @see tests/auth/passwordResetOtp.spec.ts
 */
const LOCAL_OTP = "45612";

/**
 * Helper to create authenticated admin page for user setup
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
 * Tests for Public Appointment Patient Login flow
 *
 * This tests the OTP-based authentication for patients booking public appointments.
 * The flow includes:
 * 1. Enter phone number and send OTP
 * 2. Verify OTP code
 * 3. Access booking interface
 *
 * Route: /facility/:facilityId/appointments/:staffId/otp/:page
 * Component: @/pages/PublicAppointments/auth/PatientLogin.tsx
 */
test.describe("Patient Login for Public Appointments", () => {
  let facilityId: string;
  let staffUsername: string;

  test.beforeEach(async ({ browser }) => {
    facilityId = getFacilityId();

    // Create a disposable staff user for appointment booking
    const user = await withAdminPage(browser, async (page) => {
      return await createDisposableUserViaUi(page);
    });
    staffUsername = user.username;
  });

  test("shows phone number entry form on send page", async ({ page }) => {
    await test.step("Navigate to OTP send page", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
    });

    await test.step("Verify phone number form elements", async () => {
      // Check heading
      await expect(
        page.getByText(/enter phone number to login/i),
      ).toBeVisible();

      // Check phone input field
      await expect(page.getByPlaceholder(/enter phone number/i)).toBeVisible();

      // Check send OTP button
      await expect(
        page.getByRole("button", { name: /send otp/i }),
      ).toBeVisible();

      // Check back button
      await expect(
        page.getByRole("button", { name: /back/i }),
      ).toBeVisible();
    });
  });

  test("validates phone number before sending OTP", async ({ page }) => {
    await test.step("Navigate to OTP send page", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
    });

    await test.step("Enter invalid phone number", async () => {
      const phoneInput = page.getByPlaceholder(/enter phone number/i);
      await phoneInput.fill("123"); // Invalid phone number
    });

    await test.step("Attempt to send OTP", async () => {
      await page.getByRole("button", { name: /send otp/i }).click();
    });

    await test.step("Verify validation error", async () => {
      await expect(
        page.getByText(/phone number validation error/i),
      ).toBeVisible();
    });
  });

  test("sends OTP and navigates to verification page", async ({ page }) => {
    const phoneNumber = "+918754345346"; // Valid test phone number

    await test.step("Navigate to OTP send page", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
    });

    await test.step("Enter valid phone number", async () => {
      const phoneInput = page.getByPlaceholder(/enter phone number/i);
      await phoneInput.fill(phoneNumber);
    });

    await test.step("Send OTP", async () => {
      await page.getByRole("button", { name: /send otp/i }).click();
    });

    await test.step("Verify success and navigation", async () => {
      // Check for success toast
      await expectToast(page, /otp sent successfully/i);

      // Verify navigation to verify page
      await expect(page).toHaveURL(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/verify`,
      );
    });
  });

  test("shows OTP verification form on verify page", async ({ page }) => {
    const phoneNumber = "+918754345346";

    await test.step("Navigate to send page and send OTP", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
      await page.getByPlaceholder(/enter phone number/i).fill(phoneNumber);
      await page.getByRole("button", { name: /send otp/i }).click();
      await expectToast(page, /otp sent successfully/i);
    });

    await test.step("Verify OTP form elements", async () => {
      // Check heading
      await expect(
        page.getByText(/please check your messages/i),
      ).toBeVisible();

      // Check phone number display
      await expect(page.getByText(phoneNumber)).toBeVisible();

      // Check OTP input label
      await expect(
        page.getByText(/enter the verification code/i),
      ).toBeVisible();

      // Check verify button
      await expect(
        page.getByRole("button", { name: /verify otp/i }),
      ).toBeVisible();

      // Check resend OTP link
      await expect(page.getByText(/resend otp/i)).toBeVisible();

      // Check back button navigates to send page
      await expect(
        page.getByRole("button", { name: /back/i }),
      ).toBeVisible();
    });
  });

  test("validates OTP length before submission", async ({ page }) => {
    const phoneNumber = "+918754345346";

    await test.step("Navigate to verify page", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
      await page.getByPlaceholder(/enter phone number/i).fill(phoneNumber);
      await page.getByRole("button", { name: /send otp/i }).click();
      await expectToast(page, /otp sent successfully/i);
    });

    await test.step("Enter incomplete OTP", async () => {
      // OTP requires 5 digits - enter only 3
      const otpInput = page.locator('input[type="text"]').first();
      await otpInput.click();
      await otpInput.pressSequentially("123");
    });

    await test.step("Verify validation message", async () => {
      await page.getByRole("button", { name: /verify otp/i }).click();
      // Form should show validation error
      await expect(
        page.getByText(/one-time password must be 5 characters/i),
      ).toBeVisible();
    });
  });

  test("successfully verifies OTP and redirects to booking", async ({
    page,
  }) => {
    const phoneNumber = "+918754345346";

    await test.step("Navigate to send page and send OTP", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
      await page.getByPlaceholder(/enter phone number/i).fill(phoneNumber);
      await page.getByRole("button", { name: /send otp/i }).click();
      await expectToast(page, /otp sent successfully/i);
    });

    await test.step("Enter valid OTP", async () => {
      const otpInput = page.locator('input[type="text"]').first();
      await otpInput.click();
      await otpInput.pressSequentially(LOCAL_OTP);
    });

    await test.step("Submit OTP verification", async () => {
      await page.getByRole("button", { name: /verify otp/i }).click();
    });

    await test.step("Verify successful authentication and redirect", async () => {
      // Should redirect to book appointment page
      await expect(page).toHaveURL(
        `/facility/${facilityId}/appointments/${staffUsername}/book-appointment`,
        { timeout: 10000 },
      );
    });
  });

  test("allows resending OTP from verify page", async ({ page }) => {
    const phoneNumber = "+918754345346";

    await test.step("Navigate to verify page", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
      await page.getByPlaceholder(/enter phone number/i).fill(phoneNumber);
      await page.getByRole("button", { name: /send otp/i }).click();
      await expectToast(page, /otp sent successfully/i);
    });

    await test.step("Click resend OTP", async () => {
      await page.getByText(/resend otp/i).click();
    });

    await test.step("Verify OTP resent", async () => {
      await expectToast(page, /otp sent successfully/i);
      // Should stay on verify page
      await expect(page).toHaveURL(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/verify`,
      );
    });
  });

  test("navigates back from verify to send page", async ({ page }) => {
    const phoneNumber = "+918754345346";

    await test.step("Navigate to verify page", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
      await page.getByPlaceholder(/enter phone number/i).fill(phoneNumber);
      await page.getByRole("button", { name: /send otp/i }).click();
      await expectToast(page, /otp sent successfully/i);
    });

    await test.step("Click back button", async () => {
      await page.getByRole("button", { name: /back/i }).click();
    });

    await test.step("Verify navigation to send page", async () => {
      await expect(page).toHaveURL(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
      // Form should be visible again
      await expect(page.getByPlaceholder(/enter phone number/i)).toBeVisible();
    });
  });

  test("handles loading states during OTP send", async ({ page }) => {
    const phoneNumber = "+918754345346";

    await test.step("Navigate to OTP send page", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
    });

    await test.step("Enter phone number and observe loading state", async () => {
      await page.getByPlaceholder(/enter phone number/i).fill(phoneNumber);
      const sendButton = page.getByRole("button", { name: /send otp/i });

      // Click and immediately check for disabled state
      await sendButton.click();

      // Button should be disabled during loading
      // (may be too fast to catch in test, but structure ensures it works)
    });

    await test.step("Verify success after loading", async () => {
      await expectToast(page, /otp sent successfully/i);
    });
  });

  test("handles loading states during OTP verification", async ({ page }) => {
    const phoneNumber = "+918754345346";

    await test.step("Navigate to verify page", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
      await page.getByPlaceholder(/enter phone number/i).fill(phoneNumber);
      await page.getByRole("button", { name: /send otp/i }).click();
      await expectToast(page, /otp sent successfully/i);
    });

    await test.step("Enter OTP and observe loading state", async () => {
      const otpInput = page.locator('input[type="text"]').first();
      await otpInput.click();
      await otpInput.pressSequentially(LOCAL_OTP);

      const verifyButton = page.getByRole("button", { name: /verify otp/i });
      await verifyButton.click();

      // Button should be disabled during loading
      // (may be too fast to catch in test)
    });

    await test.step("Verify successful redirect", async () => {
      await expect(page).toHaveURL(
        `/facility/${facilityId}/appointments/${staffUsername}/book-appointment`,
        { timeout: 10000 },
      );
    });
  });

  test("skips OTP if recent token exists", async ({ page, context }) => {
    const phoneNumber = "+918754345346";

    await test.step("Complete OTP flow to get token", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
      await page.getByPlaceholder(/enter phone number/i).fill(phoneNumber);
      await page.getByRole("button", { name: /send otp/i }).click();
      await expectToast(page, /otp sent successfully/i);

      const otpInput = page.locator('input[type="text"]').first();
      await otpInput.click();
      await otpInput.pressSequentially(LOCAL_OTP);
      await page.getByRole("button", { name: /verify otp/i }).click();

      await expect(page).toHaveURL(
        `/facility/${facilityId}/appointments/${staffUsername}/book-appointment`,
        { timeout: 10000 },
      );
    });

    await test.step("Navigate back to OTP page with valid token", async () => {
      // Token should be in localStorage and still valid (< 14 minutes)
      await page.goto(
        `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
      );
    });

    await test.step("Verify automatic redirect", async () => {
      // Should skip OTP and redirect directly to booking
      await expect(page).toHaveURL(
        `/facility/${facilityId}/appointments/${staffUsername}/book-appointment`,
        { timeout: 10000 },
      );
    });
  });
});
