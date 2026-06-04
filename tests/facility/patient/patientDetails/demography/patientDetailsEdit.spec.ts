import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

function generateEditData() {
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
      day: faker.number.int({ min: 1, max: 28 }).toString(),
      month: faker.number.int({ min: 1, max: 12 }).toString(),
      year: faker.number.int({ min: 1950, max: 2005 }).toString(),
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
    address: faker.location.streetAddress({ useFullAddress: true }),
    pincode: `${faker.number.int({ min: 1, max: 9 })}${faker.string.numeric(5)}`,
  };
}

function getPatientDetailsUrl() {
  return `/facility/${getFacilityId()}/patient/${getPatientId()}`;
}

async function navigateToPatientEdit(page: Page) {
  const patientDetailsUrl = getPatientDetailsUrl();
  // Navigate to patient details first to establish browser history,
  // since the edit form calls goBack() after successful update.
  await page.goto(patientDetailsUrl);
  await expect(
    page.getByRole("heading", { name: "General Info" }),
  ).toBeVisible();
  await page.goto(`${patientDetailsUrl}/update`);
  await expect(page.getByRole("button", { name: /update/i })).toBeVisible();
  // Wait for form to be populated with patient data (form.reset fires after API fetch)
  const nameField = page.getByRole("textbox", { name: /name.*\*/i });
  await expect(nameField).not.toHaveValue("");
}

/**
 * Ensures the geo_organization field is filled to a leaf level (required for form submission).
 * Opens Additional Details and selects through cascading comboboxes until no more levels appear.
 */
async function ensureGeoOrgFilled(page: Page) {
  // Open Additional Details if collapsed
  const additionalDetailsSection = page.getByRole("button", {
    name: "Additional Details",
  });
  // Check if section content is visible; if not, click to expand
  const region = page.getByRole("region", {
    name: "Additional Details",
  });
  if (!(await region.isVisible().catch(() => false))) {
    await additionalDetailsSection.click();
    await region.waitFor({ state: "visible", timeout: 3000 });
  }

  // Wait for the geo org picker to finish loading its data.
  // While loading, it shows a spinner (animate-spin). We must wait for all
  // spinners to disappear so combobox text accurately reflects their state.
  await expect(region.locator(".animate-spin")).toHaveCount(0, {
    timeout: 10000,
  });

  // The geo org picker renders cascading comboboxes. We need to select
  // through all levels until a leaf is reached (no more comboboxes appear).
  const comboboxes = region.getByRole("combobox");
  let count = await comboboxes.count();
  if (count === 0) return;

  // Find the first combobox that needs filling (has placeholder text "Select...")
  let startLevel = 0;
  for (let i = 0; i < count; i++) {
    const text = await comboboxes
      .nth(i)
      .textContent()
      .catch(() => "");
    if (!text || text.includes("Select")) {
      startLevel = i;
      break;
    }
    startLevel = i + 1; // All filled so far, start after last filled
  }

  // All visible comboboxes are already filled — geo org is valid
  if (startLevel >= count) {
    return;
  }

  // Select through remaining levels until we reach a leaf node
  let level = startLevel;
  while (true) {
    const currentCount = await comboboxes.count();
    if (currentCount <= level) break;

    const combobox = comboboxes.nth(level);
    await combobox.click();
    const option = page.getByRole("option").first();
    try {
      await option.waitFor({ state: "visible", timeout: 10000 });
    } catch {
      await page.keyboard.press("Escape");
      break;
    }
    await option.click();
    level++;

    // Wait for next level to appear (if the selected org has children)
    try {
      await comboboxes.nth(level).waitFor({ state: "visible", timeout: 5000 });
      // Also wait for the new level's options to load
      await expect(region.locator(".animate-spin")).toHaveCount(0, {
        timeout: 10000,
      });
    } catch {
      break;
    }
  }
}

async function submitAndExpectSuccess(page: Page) {
  // Ensure geo_organization is filled (required field that may be empty for legacy patients)
  await ensureGeoOrgFilled(page);

  const patientId = getPatientId();
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes("/api/v1/patient/") && r.request().method() === "PUT",
    ),
    page.getByRole("button", { name: /update/i }).click(),
  ]);
  expect(response.status()).toBe(200);
  // Verify we navigated back to patient details
  await expect(page).toHaveURL(new RegExp(`/patient/${patientId}`), {
    timeout: 10000,
  });
  // Wait for patient data to load (ensures fresh data, not stale cache)
  await page.waitForResponse(
    (r) =>
      r.url().includes(`/api/v1/patient/${patientId}/`) &&
      r.request().method() === "GET" &&
      r.status() === 200,
  );
  await expect(
    page.getByRole("heading", { name: "General Info" }),
  ).toBeVisible();
}

test.describe("Patient Details Edit", () => {
  test("should navigate to edit page from patient details", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();

    await page.goto(`/facility/${facilityId}/patient/${patientId}`);
    await expect(
      page.getByRole("heading", { name: "General Info" }),
    ).toBeVisible();

    await test.step("Click Edit button in General Info section", async () => {
      await page.getByRole("button", { name: /edit/i }).first().click();
      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/patient/${patientId}/update`),
      );
    });
  });

  test("should submit edit form with minimal change (verifies geo org prefill)", async ({
    page,
  }) => {
    // First, ensure the patient has geo_organization set (legacy patients may not)
    await navigateToPatientEdit(page);
    await ensureGeoOrgFilled(page);

    // Make a trivial change to enable the submit button (it's disabled when !isDirty)
    const addressField = page.getByRole("textbox", { name: /^Address/i });
    const currentAddress = await addressField.inputValue();
    await addressField.clear();
    await addressField.fill(currentAddress + " ");

    const patientId = getPatientId();
    const [setupResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/v1/patient/") &&
          r.request().method() === "PUT",
      ),
      page.getByRole("button", { name: /update/i }).click(),
    ]);
    expect(setupResponse.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/patient/${patientId}`), {
      timeout: 10000,
    });
    await expect(
      page.getByRole("heading", { name: "General Info" }),
    ).toBeVisible();

    await test.step("Re-open edit form, make trivial change, and submit without touching geo org", async () => {
      // Now that the patient has a geo_org saved, re-open the form.
      // The geo org should be prefilled from the API — no need to select it again.
      await navigateToPatientEdit(page);

      // Make a trivial change to enable the Update button (form requires isDirty)
      const nameField = page.getByRole("textbox", { name: /name.*\*/i });
      const currentName = await nameField.inputValue();
      await nameField.clear();
      await nameField.fill(currentName + ".");

      // Submit WITHOUT calling ensureGeoOrgFilled — geo org must be prefilled correctly
      const [response] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes("/api/v1/patient/") &&
            r.request().method() === "PUT",
        ),
        page.getByRole("button", { name: /update/i }).click(),
      ]);
      expect(response.status()).toBe(200);
      await expect(page).toHaveURL(new RegExp(`/patient/${patientId}`), {
        timeout: 10000,
      });
      await expect(
        page.getByRole("heading", { name: "General Info" }),
      ).toBeVisible();
    });
  });

  test("should edit patient name and verify update", async ({ page }) => {
    const editData = generateEditData();
    await navigateToPatientEdit(page);

    await test.step("Update patient name", async () => {
      const nameField = page.getByRole("textbox", { name: /name.*\*/i });
      await nameField.clear();
      await nameField.fill(editData.name);
    });

    await test.step("Submit the form", async () => {
      await submitAndExpectSuccess(page);
    });

    await test.step("Verify updated name on patient details", async () => {
      const generalInfo = page.locator("#general-info");
      await expect(generalInfo.getByText(editData.name)).toBeVisible();
    });
  });

  test("should edit patient phone number", async ({ page }) => {
    const editData = generateEditData();
    await navigateToPatientEdit(page);

    await test.step("Update phone number", async () => {
      const phoneField = page.getByRole("textbox", {
        name: "Phone Number *",
        exact: true,
      });
      await phoneField.clear();
      await phoneField.fill(editData.phoneNumber);
    });

    await test.step("Submit the form", async () => {
      await submitAndExpectSuccess(page);
    });

    await test.step("Verify updated phone number on patient details", async () => {
      // Phone is displayed formatted with +91 prefix and spaces
      const lastFour = editData.phoneNumber.slice(-4);
      const generalInfo = page.locator("#general-info");
      await expect(
        generalInfo.getByText(new RegExp(lastFour)).first(),
      ).toBeVisible();
    });
  });

  test("should edit patient gender", async ({ page }) => {
    await navigateToPatientEdit(page);

    const genders = ["Male", "Female", "Transgender", "Non-binary"];
    let selectedGender = "";

    await test.step("Change gender to a different value", async () => {
      // Find which gender is currently selected and pick a different one
      for (const gender of genders) {
        const radio = page.getByRole("radio", { name: gender, exact: true });
        if (await radio.isChecked()) continue;
        await radio.click();
        selectedGender = gender;
        break;
      }
    });

    await test.step("Submit the form", async () => {
      await submitAndExpectSuccess(page);
    });

    await test.step("Verify updated gender on patient details", async () => {
      const generalInfo = page.locator("#general-info");
      await expect(generalInfo.getByText(selectedGender)).toBeVisible();
    });
  });

  test("should edit patient date of birth", async ({ page }) => {
    const editData = generateEditData();
    await navigateToPatientEdit(page);

    await test.step("Update date of birth", async () => {
      await page
        .getByPlaceholder("DD", { exact: true })
        .fill(editData.dateOfBirth.day);
      await page
        .getByPlaceholder("MM", { exact: true })
        .fill(editData.dateOfBirth.month);
      await page
        .getByPlaceholder("YYYY", { exact: true })
        .fill(editData.dateOfBirth.year);
    });

    await test.step("Submit the form", async () => {
      await submitAndExpectSuccess(page);
    });

    await test.step("Verify updated DOB on patient details", async () => {
      const generalInfo = page.locator("#general-info");
      // DOB is displayed as "DD MMM YYYY" (e.g. "15 Mar 1990")
      await expect(
        generalInfo.getByText(editData.dateOfBirth.year),
      ).toBeVisible();
    });
  });

  test("should edit patient additional details", async ({ page }) => {
    const editData = generateEditData();
    await navigateToPatientEdit(page);

    await test.step("Open Additional Details section", async () => {
      const additionalDetailsSection = page.getByRole("button", {
        name: "Additional Details",
      });
      const text = await additionalDetailsSection.textContent();
      if (text?.toLowerCase().includes("optional")) {
        await additionalDetailsSection.click();
      }
    });

    await test.step("Update address", async () => {
      const addressField = page.getByRole("textbox", {
        name: /^Address/i,
      });
      await addressField.clear();
      await addressField.fill(editData.address);
    });

    await test.step("Update PIN code", async () => {
      const pincodeField = page.getByRole("spinbutton", { name: "PIN Code" });
      await pincodeField.clear();
      await pincodeField.fill(editData.pincode);
    });

    await test.step("Submit the form", async () => {
      await submitAndExpectSuccess(page);
    });

    await test.step("Verify updated address on patient details", async () => {
      const generalInfo = page.locator("#general-info");
      await expect(
        generalInfo.getByText(editData.address).first(),
      ).toBeVisible();
    });
  });

  test("should edit geographic organization", async ({ page }) => {
    const editData = generateEditData();
    await navigateToPatientEdit(page);

    await test.step("Open Additional Details section", async () => {
      const additionalDetailsSection = page.getByRole("button", {
        name: "Additional Details",
      });
      const text = await additionalDetailsSection.textContent();
      if (text?.toLowerCase().includes("optional")) {
        await additionalDetailsSection.click();
      }
    });

    let lastSelectedOption = "";

    await test.step("Select through cascading geo org comboboxes", async () => {
      await page
        .getByRole("button", { name: /update/i })
        .scrollIntoViewIfNeeded();

      const region = page.getByRole("region", {
        name: "Additional Details",
      });

      // Iterate through cascading comboboxes until no more levels appear
      let level = 0;
      while (true) {
        const comboboxes = region.getByRole("combobox");
        const count = await comboboxes.count();
        if (count <= level) break;

        const combobox = comboboxes.nth(level);
        await combobox.click();
        const option = page.getByRole("option").first();
        await option.waitFor({ state: "visible" });
        lastSelectedOption = (await option.textContent()) ?? "";
        await option.click();

        level++;
        // Wait briefly for next level to appear
        try {
          await region
            .getByRole("combobox")
            .nth(level)
            .waitFor({ state: "visible", timeout: 3000 });
        } catch {
          break;
        }
      }
    });

    await test.step("Also update address to ensure dirty state", async () => {
      const addressField = page.getByRole("textbox", {
        name: /^Address/i,
      });
      await addressField.clear();
      await addressField.fill(editData.address);
    });

    await test.step("Submit the form", async () => {
      await submitAndExpectSuccess(page);
    });

    await test.step("Verify geo organization on patient details", async () => {
      const generalInfo = page.locator("#general-info");
      await expect(
        generalInfo.getByText(lastSelectedOption.trim()),
      ).toBeVisible();
    });
  });

  test("should edit multiple fields at once", async ({ page }) => {
    const editData = generateEditData();
    await navigateToPatientEdit(page);

    await test.step("Update name", async () => {
      const nameField = page.getByRole("textbox", { name: /name.*\*/i });
      await nameField.clear();
      await nameField.fill(editData.name);
    });

    await test.step("Update gender", async () => {
      await page
        .getByRole("radio", { name: editData.gender, exact: true })
        .click();
    });

    await test.step("Update blood group", async () => {
      await page.getByRole("combobox", { name: /blood group/i }).click();
      await page
        .getByRole("option", { name: editData.bloodGroup, exact: true })
        .click();
    });

    await test.step("Open Additional Details and update address", async () => {
      const additionalDetailsSection = page.getByRole("button", {
        name: "Additional Details",
      });
      const text = await additionalDetailsSection.textContent();
      if (text?.toLowerCase().includes("optional")) {
        await additionalDetailsSection.click();
      }

      const addressField = page.getByRole("textbox", {
        name: /^Address/i,
      });
      await addressField.clear();
      await addressField.fill(editData.address);
    });

    await test.step("Submit the form", async () => {
      await submitAndExpectSuccess(page);
    });

    await test.step("Verify updated fields on patient details", async () => {
      const generalInfo = page.locator("#general-info");
      await expect(generalInfo.getByText(editData.name)).toBeVisible();
      await expect(
        generalInfo.getByText(editData.address).first(),
      ).toBeVisible();
    });
  });

  test("should show validation error for invalid phone number on edit", async ({
    page,
  }) => {
    await navigateToPatientEdit(page);

    await test.step("Enter invalid phone number", async () => {
      const phoneField = page.getByRole("textbox", {
        name: "Phone Number *",
        exact: true,
      });
      await phoneField.clear();
      await phoneField.fill("123");
    });

    await test.step("Submit and verify validation error", async () => {
      await page.getByRole("button", { name: /update/i }).click();
      await expect(
        page.getByText(/entered phone number is not valid/i).first(),
      ).toBeVisible();
    });
  });
});
