import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFieldErrorMessage } from "tests/helper/error";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

/**
 * Verifies the behavior driven by the REACT_ENABLE_MINIMAL_PATIENT_REGISTRATION
 * env variable (careConfig.patientRegistration.minimalPatientRegistration).
 *
 * The variable is baked into the production build (see care.config.ts), so a
 * single build can only be in one mode. Rather than reading env vars or
 * requiring CI configuration changes, the active mode is detected at runtime
 * from the rendered registration form: in minimal mode the "Additional
 * Details" accordion trigger is labeled "(Optional)". The mode-specific
 * suites skip themselves when the build is in the other mode.
 *
 * When enabled (minimal/quick registration):
 * - The "Additional Details" accordion section is collapsed and labeled "(Optional)"
 * - Address and permanent address are optional in the zod schema
 * When disabled (default):
 * - The "Additional Details" section is expanded by default with no "(Optional)" label
 * - Address is required and submitting without it shows a field error
 */
async function detectMinimalRegistrationEnabled(page: Page): Promise<boolean> {
  const additionalDetailsTrigger = page.getByRole("button", {
    name: "Additional Details",
  });
  await additionalDetailsTrigger.waitFor({ state: "visible" });
  const text = await additionalDetailsTrigger.textContent();
  return text?.toLowerCase().includes("optional") ?? false;
}

function generatePatientBasics() {
  return {
    name: faker.person.fullName(),
    phoneNumber: `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`,
    gender: faker.helpers.arrayElement(["Male", "Female"]),
    dateOfBirth: {
      day: faker.number.int({ min: 1, max: 28 }).toString().padStart(2, "0"),
      month: faker.number.int({ min: 1, max: 12 }).toString().padStart(2, "0"),
      year: faker.number.int({ min: 1950, max: 2009 }).toString(),
    },
  };
}

type PatientBasics = ReturnType<typeof generatePatientBasics>;

async function fillBasicInfo(page: Page, data: PatientBasics) {
  await test.step("Fill patient basic information", async () => {
    await page.getByRole("textbox", { name: /name.*\*/i }).fill(data.name);
    await page
      .getByRole("textbox", { name: /phone number.*\*/i })
      .fill(data.phoneNumber);
    await page.getByRole("radio", { name: data.gender, exact: true }).click();
    await page.getByPlaceholder("DD", { exact: true }).fill(data.dateOfBirth.day);
    await page
      .getByPlaceholder("MM", { exact: true })
      .fill(data.dateOfBirth.month);
    await page
      .getByPlaceholder("YYYY", { exact: true })
      .fill(data.dateOfBirth.year);
  });
}

/**
 * Selects every level of the cascading geo organization comboboxes.
 * Geo organization is required by the schema in both registration modes.
 */
async function selectGeoOrganization(page: Page) {
  await test.step("Select geo organization levels", async () => {
    await page
      .getByRole("button", { name: /register patient/i })
      .scrollIntoViewIfNeeded();

    const geoRegion = page.getByRole("region", { name: "Additional Details" });
    // Safety bound — geo org hierarchies are shallow (state → district → ...)
    const MAX_GEO_LEVELS = 10;
    let previousCount = 0;

    for (let level = 0; level < MAX_GEO_LEVELS; level++) {
      const comboboxes = geoRegion.getByRole("combobox");
      const count = await comboboxes.count();
      if (count === previousCount) break;

      const combobox = comboboxes.nth(count - 1);
      await combobox.waitFor({ state: "visible" });
      await combobox.click();

      const option = page.getByRole("option").first();
      await option.waitFor({ state: "visible" });
      await option.click();

      previousCount = count;
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
  });
}

test.describe("Patient Registration — minimal registration env variable", () => {
  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/patient/create`);
    await expect(
      page.getByRole("button", { name: /register patient/i }),
    ).toBeVisible();
  });

  test("additional details section reflects the minimal registration config", async ({
    page,
  }) => {
    const additionalDetailsTrigger = page.getByRole("button", {
      name: "Additional Details",
    });
    await expect(additionalDetailsTrigger).toBeVisible();

    const isMinimal = await detectMinimalRegistrationEnabled(page);

    if (isMinimal) {
      await test.step("Section is optional and collapsed by default", async () => {
        await expect(additionalDetailsTrigger).toContainText(/optional/i);
        await expect(additionalDetailsTrigger).toHaveAttribute(
          "aria-expanded",
          "false",
        );
        await expect(
          page.getByRole("textbox", { name: "Address" }),
        ).toBeHidden();
      });
    } else {
      await test.step("Section is required and expanded by default", async () => {
        await expect(additionalDetailsTrigger).not.toContainText(/optional/i);
        await expect(additionalDetailsTrigger).toHaveAttribute(
          "aria-expanded",
          "true",
        );
        await expect(
          page.getByRole("textbox", { name: "Address" }),
        ).toBeVisible();
      });
    }
  });

  test.describe("when minimal registration is disabled (default)", () => {
    test.beforeEach(async ({ page }) => {
      // Build-time env variable — skip when this build is in the other mode.
      test.skip(
        await detectMinimalRegistrationEnabled(page),
        "Build was produced with REACT_ENABLE_MINIMAL_PATIENT_REGISTRATION=true",
      );
    });

    test("marks the address field as required", async ({ page }) => {
      const addressLabel = page
        .locator('[data-slot="form-label"]')
        .filter({ hasText: /^Address/ })
        .first();
      await expect(addressLabel).toBeVisible();
      await expect(addressLabel).toHaveAttribute("aria-required", "true");
    });

    test("shows a required error when submitting without an address", async ({
      page,
    }) => {
      const patientData = generatePatientBasics();
      await fillBasicInfo(page, patientData);
      await selectGeoOrganization(page);

      await test.step("Submit without filling the address", async () => {
        await page.getByRole("button", { name: /register patient/i }).click();
      });

      await test.step("Verify the address required error and no success", async () => {
        const addressField = page.getByRole("textbox", { name: "Address" });
        await expect(getFieldErrorMessage(addressField)).toContainText(
          /required/i,
        );

        await expect(
          page
            .locator("li[data-sonner-toast]")
            .getByText(/patient registered successfully/i),
        ).not.toBeVisible();
      });
    });
  });

  test.describe("when minimal registration is enabled", () => {
    test.beforeEach(async ({ page }) => {
      // Build-time env variable — skip when this build is in the other mode.
      test.skip(
        !(await detectMinimalRegistrationEnabled(page)),
        "Build was produced without REACT_ENABLE_MINIMAL_PATIENT_REGISTRATION=true",
      );
    });

    test("does not mark the address field as required", async ({ page }) => {
      await page.getByRole("button", { name: "Additional Details" }).click();

      const addressLabel = page
        .locator('[data-slot="form-label"]')
        .filter({ hasText: /^Address/ })
        .first();
      await expect(addressLabel).toBeVisible();
      await expect(addressLabel).not.toHaveAttribute("aria-required", "true");
    });

    test("registers a patient without address details", async ({ page }) => {
      const patientData = generatePatientBasics();
      await fillBasicInfo(page, patientData);

      await test.step("Open the optional additional details section", async () => {
        await page.getByRole("button", { name: "Additional Details" }).click();
      });

      // Geo organization is still required by the schema in minimal mode
      await selectGeoOrganization(page);

      await test.step("Submit with no address filled", async () => {
        await page.getByRole("button", { name: /register patient/i }).click();
        await expect(
          page
            .locator("li[data-sonner-toast]")
            .getByText(/patient registered successfully/i),
        ).toBeVisible({ timeout: 15000 });
      });

      await test.step("Verify navigation to the patient page", async () => {
        await page.waitForURL("**/patients/**");
        await expect(page.getByText(patientData.name).first()).toBeVisible();
      });
    });
  });
});
