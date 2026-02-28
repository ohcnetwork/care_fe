import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Update/Edit", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
    patientId = getPatientId();
  });

  test("should load patient update form with existing data", async ({
    page,
  }) => {
    // Navigate to patient update page
    await page.goto(`/facility/${facilityId}/patient/${patientId}/update`);

    await page.waitForLoadState("networkidle");

    // The update form should display existing patient data
    // Name field should be pre-filled
    const nameField = page.getByRole("textbox", { name: /name.*\*/i });
    await expect(nameField).toBeVisible({ timeout: 10000 });

    // The name field should have a value (pre-filled with existing patient name)
    const nameValue = await nameField.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);
  });

  test("should update patient address", async ({ page }) => {
    // Navigate to patient update page
    await page.goto(`/facility/${facilityId}/patient/${patientId}/update`);

    await page.waitForLoadState("networkidle");

    // Wait for form to load with existing data
    const nameField = page.getByRole("textbox", { name: /name.*\*/i });
    await expect(nameField).toBeVisible({ timeout: 10000 });

    // Expand additional details if collapsed
    const additionalDetailsSection = page.getByRole("button", {
      name: "Additional Details",
    });
    if (await additionalDetailsSection.isVisible().catch(() => false)) {
      const sectionText = await additionalDetailsSection.textContent();
      if (sectionText?.toLowerCase().includes("optional")) {
        await additionalDetailsSection.click();
      }
    }

    // Update the address field
    const newAddress = faker.location.streetAddress();
    const addressField = page.getByRole("textbox", { name: /address/i });

    if (await addressField.isVisible().catch(() => false)) {
      await addressField.clear();
      await addressField.fill(newAddress);
    }

    // Submit the update
    const updateButton = page.getByRole("button", { name: /update/i });
    await updateButton.scrollIntoViewIfNeeded();
    await updateButton.click();

    // Verify success message
    await expect(
      page.getByText(/patient.*updated.*successfully|patient_update_success/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should display phone number field pre-filled", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/patient/${patientId}/update`);

    await page.waitForLoadState("networkidle");

    // Phone number field should be pre-filled
    const phoneField = page.getByRole("textbox", {
      name: /phone number.*\*/i,
    });
    await expect(phoneField).toBeVisible({ timeout: 10000 });

    const phoneValue = await phoneField.inputValue();
    expect(phoneValue.length).toBeGreaterThan(0);
  });

  test("should display gender selection pre-selected", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/patient/${patientId}/update`);

    await page.waitForLoadState("networkidle");

    // Wait for form to load
    await expect(page.getByRole("textbox", { name: /name.*\*/i })).toBeVisible({
      timeout: 10000,
    });

    // One of the gender radio buttons should be checked
    const genderRadios = page.getByRole("radio");
    const radioCount = await genderRadios.count();
    expect(radioCount).toBeGreaterThan(0);

    // At least one should be checked
    let hasChecked = false;
    for (let i = 0; i < radioCount; i++) {
      if (await genderRadios.nth(i).isChecked()) {
        hasChecked = true;
        break;
      }
    }
    expect(hasChecked).toBe(true);
  });

  test("should show validation error for invalid phone number", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/patient/${patientId}/update`);

    await page.waitForLoadState("networkidle");

    // Wait for form to load
    await expect(page.getByRole("textbox", { name: /name.*\*/i })).toBeVisible({
      timeout: 10000,
    });

    // Set an invalid phone number
    const phoneField = page.getByRole("textbox", {
      name: /phone number.*\*/i,
    });
    await phoneField.clear();
    await phoneField.fill("123");

    // Try to submit
    const updateButton = page.getByRole("button", { name: /update/i });
    await updateButton.scrollIntoViewIfNeeded();
    await updateButton.click();

    // Should show validation error
    await expect(
      page.getByText(/entered phone number is not valid/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
