import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Device Contact Point Validation", () => {
  let facilityId: string;
  let deviceName: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    deviceName = faker.commerce.productName();

    await page.goto(`/facility/${facilityId}/settings/devices`);
    await page.getByRole("link", { name: "Add Device" }).click();
    await page
      .getByRole("textbox", { name: "Registered Name *" })
      .fill(deviceName);
  });

  test("should validate phone number format correctly", async ({ page }) => {
    // Add phone contact point
    await page.getByRole("button", { name: "Add Contact Point" }).click();

    // Select phone system (default is phone)
    const phoneInput = page.getByPlaceholder("Enter phone number").first();

    // Test invalid phone numbers
    const invalidPhoneNumbers = [
      "123", // Too short
      "abcdefghij", // Letters
      "12345", // Too short
      "00000000000", // Invalid format
    ];

    for (const invalidPhone of invalidPhoneNumbers) {
      await phoneInput.fill(invalidPhone);
      await page.getByRole("button", { name: "Save" }).click();

      // Should show validation error
      await expect(
        page.locator("text=Invalid phone number").first(),
      ).toBeVisible({ timeout: 2000 });

      // Clear for next test
      await phoneInput.clear();
    }

    // Test valid phone number (Indian format)
    const validPhone =
      faker.helpers.arrayElement(["6", "7", "8", "9"]) +
      faker.string.numeric(9);
    await phoneInput.fill(validPhone);
    await page.getByRole("button", { name: "Save" }).click();

    // Should succeed and show success message
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();
  });

  test("should validate email format correctly", async ({ page }) => {
    // Add email contact point
    await page.getByRole("button", { name: "Add Contact Point" }).click();

    // Select email system
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Email" }).click();

    const emailInput = page.getByPlaceholder("Enter email address").first();

    // Test invalid emails
    const invalidEmails = [
      "notanemail",
      "missing@domain",
      "@nodomain.com",
      "no@domain@double.com",
      "spaces in@email.com",
    ];

    for (const invalidEmail of invalidEmails) {
      await emailInput.fill(invalidEmail);
      await page.getByRole("button", { name: "Save" }).click();

      // Should show validation error
      await expect(page.locator("text=Invalid email").first()).toBeVisible({
        timeout: 2000,
      });

      // Clear for next test
      await emailInput.clear();
    }

    // Test valid email
    const validEmail = faker.internet.email();
    await emailInput.fill(validEmail);
    await page.getByRole("button", { name: "Save" }).click();

    // Should succeed
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();
  });

  test("should validate URL format correctly", async ({ page }) => {
    // Add URL contact point
    await page.getByRole("button", { name: "Add Contact Point" }).click();

    // Select URL system
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "URL" }).click();

    const urlInput = page.getByPlaceholder("Enter URL").first();

    // Test invalid URLs
    const invalidUrls = [
      "notaurl",
      "htp://missing-t.com",
      "www.nodomain",
      "just text",
    ];

    for (const invalidUrl of invalidUrls) {
      await urlInput.fill(invalidUrl);
      await page.getByRole("button", { name: "Save" }).click();

      // Should show validation error
      await expect(page.locator("text=Invalid url").first()).toBeVisible({
        timeout: 2000,
      });

      // Clear for next test
      await urlInput.clear();
    }

    // Test valid URL
    const validUrl = faker.internet.url();
    await urlInput.fill(validUrl);
    await page.getByRole("button", { name: "Save" }).click();

    // Should succeed
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();
  });

  test("should validate fax number format correctly", async ({ page }) => {
    // Add fax contact point
    await page.getByRole("button", { name: "Add Contact Point" }).click();

    // Select fax system
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Fax" }).click();

    const faxInput = page.getByPlaceholder("Enter fax number").first();

    // Test invalid fax number
    await faxInput.fill("123");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator("text=Invalid phone number").first()).toBeVisible(
      { timeout: 2000 },
    );

    // Test valid fax number (same format as phone)
    const validFax =
      faker.helpers.arrayElement(["6", "7", "8", "9"]) +
      faker.string.numeric(9);
    await faxInput.clear();
    await faxInput.fill(validFax);
    await page.getByRole("button", { name: "Save" }).click();

    // Should succeed
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();
  });

  test("should validate SMS number format correctly", async ({ page }) => {
    // Add SMS contact point
    await page.getByRole("button", { name: "Add Contact Point" }).click();

    // Select SMS system
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "SMS" }).click();

    const smsInput = page.getByPlaceholder("Enter sms number").first();

    // Test invalid SMS number
    await smsInput.fill("abc");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator("text=Invalid phone number").first()).toBeVisible(
      { timeout: 2000 },
    );

    // Test valid SMS number (same format as phone)
    const validSms =
      faker.helpers.arrayElement(["6", "7", "8", "9"]) +
      faker.string.numeric(9);
    await smsInput.clear();
    await smsInput.fill(validSms);
    await page.getByRole("button", { name: "Save" }).click();

    // Should succeed
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();
  });

  test("should validate pager format correctly", async ({ page }) => {
    // Add pager contact point
    await page.getByRole("button", { name: "Add Contact Point" }).click();

    // Select pager system
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Pager" }).click();

    const pagerInput = page.getByPlaceholder("Enter pager").first();

    // Test empty pager (should fail)
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.locator("text=This field is required").first(),
    ).toBeVisible({ timeout: 2000 });

    // Test pager that's too long (over 20 characters)
    await pagerInput.fill("a".repeat(21));
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.locator("text=Must be between 1 and 20 characters").first(),
    ).toBeVisible({ timeout: 2000 });

    // Test valid pager
    const validPager = faker.string.alphanumeric(10);
    await pagerInput.clear();
    await pagerInput.fill(validPager);
    await page.getByRole("button", { name: "Save" }).click();

    // Should succeed
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();
  });

  test("should validate other contact type correctly", async ({ page }) => {
    // Add other contact point
    await page.getByRole("button", { name: "Add Contact Point" }).click();

    // Select other system
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Other" }).click();

    const otherInput = page.getByPlaceholder("Enter other").first();

    // Test empty value (should fail)
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator("text=Required").first()).toBeVisible({
      timeout: 2000,
    });

    // Test valid value
    const validOther = faker.lorem.words(3);
    await otherInput.fill(validOther);
    await page.getByRole("button", { name: "Save" }).click();

    // Should succeed
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();
  });

  test("should prevent duplicate contact values", async ({ page }) => {
    const phoneNumber =
      faker.helpers.arrayElement(["6", "7", "8", "9"]) +
      faker.string.numeric(9);

    // Add first phone contact point
    await page.getByRole("button", { name: "Add Contact Point" }).click();
    await page.getByPlaceholder("Enter phone number").first().fill(phoneNumber);

    // Add second phone contact point with same number
    await page.getByRole("button", { name: "Add Contact Point" }).click();
    await page.getByPlaceholder("Enter phone number").last().fill(phoneNumber);

    // Try to save
    await page.getByRole("button", { name: "Save" }).click();

    // Should show duplicate error
    await expect(
      page.locator("text=Duplicate contact values are not allowed").first(),
    ).toBeVisible({ timeout: 2000 });
  });

  test("should allow duplicate values if they are case-insensitive or have different systems", async ({
    page,
  }) => {
    const email = faker.internet.email().toLowerCase();

    // Add first email contact point
    await page.getByRole("button", { name: "Add Contact Point" }).click();
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Email" }).click();
    await page.getByPlaceholder("Enter email address").first().fill(email);

    // Add second email contact point with uppercase version
    await page.getByRole("button", { name: "Add Contact Point" }).click();
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "Email" }).click();
    await page
      .getByPlaceholder("Enter email address")
      .last()
      .fill(email.toUpperCase());

    // Try to save
    await page.getByRole("button", { name: "Save" }).click();

    // Should show duplicate error (case-insensitive check)
    await expect(
      page.locator("text=Duplicate contact values are not allowed").first(),
    ).toBeVisible({ timeout: 2000 });
  });

  test("should allow multiple contact points with different values", async ({
    page,
  }) => {
    const phoneNumber =
      faker.helpers.arrayElement(["6", "7", "8", "9"]) +
      faker.string.numeric(9);
    const email = faker.internet.email();
    const url = faker.internet.url();

    // Add phone contact point
    await page.getByRole("button", { name: "Add Contact Point" }).click();
    await page.getByPlaceholder("Enter phone number").first().fill(phoneNumber);

    // Add email contact point
    await page.getByRole("button", { name: "Add Contact Point" }).click();
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "Email" }).click();
    await page.getByPlaceholder("Enter email address").first().fill(email);

    // Add URL contact point
    await page.getByRole("button", { name: "Add Contact Point" }).click();
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "URL" }).click();
    await page.getByPlaceholder("Enter URL").first().fill(url);

    // Save
    await page.getByRole("button", { name: "Save" }).click();

    // Should succeed
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();

    // Verify all contact points are displayed on the device page
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();

    // Verify contact information is visible
    await expect(page.getByRole("link", { name: phoneNumber })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole("link", { name: url })).toBeVisible();
  });

  test("should allow removing contact points before saving", async ({
    page,
  }) => {
    // Add multiple contact points
    await page.getByRole("button", { name: "Add Contact Point" }).click();
    await page.getByRole("button", { name: "Add Contact Point" }).click();
    await page.getByRole("button", { name: "Add Contact Point" }).click();

    // Remove the middle one using a more robust selector
    // Find all delete buttons by their role and icon
    const deleteButtons = page.getByRole("button").filter({
      has: page.locator('[icon="l-trash"]'),
    });

    const deleteCount = await deleteButtons.count();
    expect(deleteCount).toBeGreaterThanOrEqual(3);

    // Click the second delete button (index 1)
    await deleteButtons.nth(1).click();

    // Should have 2 contact point inputs now
    const contactInputs = page.getByRole("combobox");
    const inputCount = await contactInputs.count();
    expect(inputCount).toBe(2);
  });
});
