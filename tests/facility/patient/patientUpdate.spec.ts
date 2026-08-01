import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Update/Edit", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    await page.goto(`/facility/${facilityId}/patient/${patientId}/update`);
    await expect(
      page.getByRole("textbox", { name: "Name *", exact: true }),
    ).toBeVisible();
  });

  test("should load the update form with existing patient data", async ({
    page,
  }) => {
    const nameField = page.getByRole("textbox", {
      name: "Name *",
      exact: true,
    });
    expect((await nameField.inputValue()).length).toBeGreaterThan(0);
  });

  test("should display the phone number pre-filled", async ({ page }) => {
    const phoneField = page.getByRole("textbox", {
      name: "Phone Number *",
      exact: true,
    });
    expect((await phoneField.inputValue()).length).toBeGreaterThan(0);
  });

  test("should display the gender pre-selected", async ({ page }) => {
    const genderRadios = page.getByRole("radio");
    const radioCount = await genderRadios.count();
    expect(radioCount).toBeGreaterThan(0);

    let hasChecked = false;
    for (let i = 0; i < radioCount; i++) {
      if (await genderRadios.nth(i).isChecked()) {
        hasChecked = true;
        break;
      }
    }
    expect(hasChecked).toBe(true);
  });

  test("should update the patient's name", async ({ page }) => {
    const emergencyToggle = page.getByRole("checkbox", {
      name: /different emergency contact/i,
    });
    if (await emergencyToggle.isChecked()) await emergencyToggle.click();

    const nameField = page.getByRole("textbox", {
      name: "Name *",
      exact: true,
    });
    await nameField.clear();
    await nameField.fill(faker.person.fullName());

    const updateResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/v1/patient/${patientId}/`) &&
        resp.request().method() === "PUT" &&
        resp.status() === 200,
    );
    await page.getByRole("button", { name: /update/i }).click();
    await updateResponse;
  });

  test("should show a validation error for an invalid phone number", async ({
    page,
  }) => {
    const phoneField = page.getByRole("textbox", {
      name: "Phone Number *",
      exact: true,
    });
    await phoneField.clear();
    await phoneField.fill("123");

    await page.getByRole("button", { name: /update/i }).click();

    await expect(
      page.getByText("Entered phone number is not valid").first(),
    ).toBeVisible();
  });
});
