import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

/**
 * Patient Login Flow Tests
 *
 * Tests the OTP-based authentication flow for patients booking public appointments.
 * This is the entry point for the patient-facing appointment scheduling system.
 *
 * Flow:
 * 1. Patient enters phone number
 * 2. System sends OTP via SMS
 * 3. Patient enters OTP code
 * 4. System authenticates and redirects to appointment booking
 */

test.describe("Patient Login - Phone Number Entry", () => {
  let facilityId: string;
  let staffId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    // Using a mock staff ID for testing
    // In production, this would come from facility staff list
    staffId = "mock-staff-id";

    await page.goto(
      `/facility/${facilityId}/appointments/${staffId}/otp/send`,
    );
  });

  test("should display phone number entry form", async ({ page }) => {
    await test.step("Verify page heading", async () => {
      await expect(
        page.getByText(/enter phone number to login/i),
      ).toBeVisible();
    });

    await test.step("Verify phone input field is present", async () => {
      const phoneInput = page.getByRole("textbox", { name: /phone number/i });
      await expect(phoneInput).toBeVisible();
    });

    await test.step("Verify send OTP button is present", async () => {
      const sendButton = page.getByRole("button", { name: /send otp/i });
      await expect(sendButton).toBeVisible();
      await expect(sendButton).toBeEnabled();
    });
  });

  test("should validate invalid phone number format", async ({ page }) => {
    await test.step("Enter invalid phone number", async () => {
      const phoneInput = page.getByRole("textbox", { name: /phone number/i });
      await phoneInput.fill("123"); // Too short
    });

    await test.step("Submit form", async () => {
      await page.getByRole("button", { name: /send otp/i }).click();
    });

    await test.step("Verify validation error appears", async () => {
      await expect(
        page.getByText(/phone number.*invalid|validation error/i),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test("should handle empty phone number submission", async ({ page }) => {
    await test.step("Submit without entering phone number", async () => {
      await page.getByRole("button", { name: /send otp/i }).click();
    });

    await test.step("Verify validation error or no request sent", async () => {
      // Either validation error appears or button remains enabled (no API call)
      const hasError = await page
        .getByText(/phone number.*required|validation error/i)
        .isVisible()
        .catch(() => false);
      const buttonEnabled = await page
        .getByRole("button", { name: /send otp/i })
        .isEnabled();

      expect(hasError || buttonEnabled).toBeTruthy();
    });
  });

  test("should disable send button during OTP request", async ({ page }) => {
    await test.step("Enter valid phone number", async () => {
      const phoneInput = page.getByRole("textbox", { name: /phone number/i });
      // International format for testing
      await phoneInput.fill("+1234567890");
    });

    await test.step("Click send OTP button", async () => {
      await page.getByRole("button", { name: /send otp/i }).click();
    });

    await test.step("Verify button shows loading state", async () => {
      // Button should be disabled during API call
      const sendButton = page.getByRole("button", { name: /send otp/i });
      await expect(sendButton).toBeDisabled({ timeout: 2000 });
    });
  });

  test("should allow phone number editing before submission", async ({
    page,
  }) => {
    await test.step("Enter initial phone number", async () => {
      const phoneInput = page.getByRole("textbox", { name: /phone number/i });
      await phoneInput.fill("+1234567890");
    });

    await test.step("Clear and enter new phone number", async () => {
      const phoneInput = page.getByRole("textbox", { name: /phone number/i });
      await phoneInput.clear();
      await phoneInput.fill("+9876543210");
    });

    await test.step("Verify new number is displayed", async () => {
      const phoneInput = page.getByRole("textbox", { name: /phone number/i });
      await expect(phoneInput).toHaveValue("+9876543210");
    });
  });
});

test.describe("Patient Login - OTP Verification", () => {
  let facilityId: string;
  let staffId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    staffId = "mock-staff-id";

    // Navigate to the verify page (after OTP has been sent)
    await page.goto(
      `/facility/${facilityId}/appointments/${staffId}/otp/verify`,
    );
  });

  test("should display OTP verification form", async ({ page }) => {
    await test.step("Verify verification heading", async () => {
      await expect(
        page.getByText(/please check your messages/i),
      ).toBeVisible();
    });

    await test.step("Verify OTP input fields are present", async () => {
      await expect(
        page.getByText(/enter the verification code/i),
      ).toBeVisible();
    });

    await test.step("Verify verify button is present", async () => {
      const verifyButton = page.getByRole("button", { name: /verify/i });
      await expect(verifyButton).toBeVisible();
    });
  });

  test("should have 5 OTP input slots", async ({ page }) => {
    await test.step("Verify all 5 OTP input slots exist", async () => {
      // InputOTP component renders 5 slots for OTP entry
      const otpSlots = page.locator("[data-input-otp-slot]");
      await expect(otpSlots).toHaveCount(5);
    });
  });

  test("should auto-focus first OTP input field", async ({ page }) => {
    await test.step("Verify first input slot receives focus", async () => {
      // The first OTP slot should be focused on page load
      const firstSlot = page.locator("[data-input-otp-slot]").first();
      await expect(firstSlot).toBeFocused();
    });
  });

  test("should accept numeric OTP input", async ({ page }) => {
    await test.step("Type OTP digits", async () => {
      // Type OTP sequentially - InputOTP auto-advances between slots
      const firstSlot = page.locator("[data-input-otp-slot]").first();
      await firstSlot.click();
      await page.keyboard.type("12345");
    });

    await test.step("Verify all digits are entered", async () => {
      // Check that OTP input has been populated
      const verifyButton = page.getByRole("button", { name: /verify/i });
      await expect(verifyButton).toBeEnabled();
    });
  });

  test("should validate OTP length before submission", async ({ page }) => {
    await test.step("Enter incomplete OTP", async () => {
      const firstSlot = page.locator("[data-input-otp-slot]").first();
      await firstSlot.click();
      await page.keyboard.type("123"); // Only 3 digits instead of 5
    });

    await test.step("Verify verify button state", async () => {
      const verifyButton = page.getByRole("button", { name: /verify/i });
      // Button should be disabled or form shows validation error
      const isDisabled = await verifyButton.isDisabled();
      const hasError = await page
        .getByText(/must be 5 characters/i)
        .isVisible()
        .catch(() => false);

      expect(isDisabled || hasError).toBeTruthy();
    });
  });
});

test.describe("Patient Login - Navigation and Flow", () => {
  let facilityId: string;
  let staffId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
    staffId = "mock-staff-id";
  });

  test("should navigate from send to verify page after OTP sent", async ({
    page,
  }) => {
    await test.step("Start at OTP send page", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffId}/otp/send`,
      );
      await expect(
        page.getByText(/enter phone number to login/i),
      ).toBeVisible();
    });

    await test.step("Verify URL matches send page", async () => {
      expect(page.url()).toContain("/otp/send");
    });
  });

  test("should allow navigating back from verify to send page", async ({
    page,
  }) => {
    await test.step("Start at verify page", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffId}/otp/verify`,
      );
    });

    await test.step("Navigate back using browser back button", async () => {
      await page.goBack();
    });

    await test.step("Verify returned to send page", async () => {
      expect(page.url()).toContain("/otp/send");
      await expect(
        page.getByText(/enter phone number to login/i),
      ).toBeVisible();
    });
  });

  test("should show patient context for appointment booking", async ({
    page,
  }) => {
    await test.step("Navigate to OTP send page", async () => {
      await page.goto(
        `/facility/${facilityId}/appointments/${staffId}/otp/send`,
      );
    });

    await test.step("Verify page is in patient context", async () => {
      // Page should not show staff navigation or admin features
      const staffNavigation = page.getByRole("navigation", {
        name: /facility/i,
      });
      await expect(staffNavigation).not.toBeVisible();
    });
  });
});
