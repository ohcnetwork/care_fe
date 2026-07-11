import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  expectFieldError,
  fillQuantityValue,
  fillStringField,
  selectQuantityCoding,
  selectQuantityUnit,
  submitAndExpectSuccess,
  submitForm,
} from "tests/helper/questionnaire";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

/**
 * Quantity question validation — AC11 + AC12
 *
 * The quantity question renders three fields that must ALL be filled together
 * (all-or-nothing): value input, coding select (system-route), and unit select
 * (system-ucum-units). Submitting with only a subset triggers the
 * "quantity_all_fields_required" validation error.
 *
 * NOTE: The unit select renders unconditionally for all quantity questions,
 * so "full fill" always requires value + coding + unit, not just value + coding.
 */

const QUESTIONNAIRE_SLUG = "quantity-validation-test";

// Stable values known to exist in the seeded value sets
const CODING_SEARCH = "Sublabial";
const UNIT_SEARCH = "milligram";

test.describe("Quantity Question — All-or-Nothing Validation", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${QUESTIONNAIRE_SLUG}`,
    );
    await expect(
      page.getByText("Reference Note", { exact: true }),
    ).toBeVisible();
  });

  // ── Partial fills → blocked ──────────────────────────────────────────────

  test("T1: value only (no coding, no unit) → validation error", async ({
    page,
  }) => {
    const note = faker.lorem.words(3);

    await test.step("Fill the filler string question", async () => {
      await fillStringField(page, "Reference Note", note);
    });

    await test.step("Fill only the numeric value — leave coding and unit empty", async () => {
      await fillQuantityValue(page, "42");
    });

    await test.step("Submit and expect blocked with quantity error", async () => {
      await submitForm(page);
      await expectFieldError(page, "Route Quantity");
    });

    await test.step("Verify the page has NOT navigated away", async () => {
      await expect(
        page.getByText("Reference Note", { exact: true }),
      ).toBeVisible();
    });
  });

  test("T2: value + coding (no unit) → validation error", async ({ page }) => {
    const note = faker.lorem.words(3);

    await test.step("Fill the filler string question", async () => {
      await fillStringField(page, "Reference Note", note);
    });

    await test.step("Fill value and select coding — leave unit empty", async () => {
      await fillQuantityValue(page, "15");
      await selectQuantityCoding(page, CODING_SEARCH);
    });

    await test.step("Submit and expect blocked with quantity error", async () => {
      await submitForm(page);
      await expectFieldError(page, "Route Quantity");
    });

    await test.step("Verify the page has NOT navigated away", async () => {
      await expect(
        page.getByText("Reference Note", { exact: true }),
      ).toBeVisible();
    });
  });

  test("T3: coding only (no value, no unit) → validation error", async ({
    page,
  }) => {
    const note = faker.lorem.words(3);

    await test.step("Fill the filler string question", async () => {
      await fillStringField(page, "Reference Note", note);
    });

    await test.step("Select only coding — leave value and unit empty", async () => {
      await selectQuantityCoding(page, CODING_SEARCH);
    });

    await test.step("Submit and expect blocked with quantity error", async () => {
      await submitForm(page);
      await expectFieldError(page, "Route Quantity");
    });

    await test.step("Verify the page has NOT navigated away", async () => {
      await expect(
        page.getByText("Reference Note", { exact: true }),
      ).toBeVisible();
    });
  });

  // ── Full fill → success ─────────────────────────────────────────────────

  test("T4: value + coding + unit (all three) → submits successfully", async ({
    page,
  }) => {
    const note = faker.lorem.words(3);

    await test.step("Fill the filler string question", async () => {
      await fillStringField(page, "Reference Note", note);
    });

    await test.step("Fill all three quantity fields", async () => {
      await fillQuantityValue(page, "100");
      await selectQuantityCoding(page, CODING_SEARCH);
      await selectQuantityUnit(page, UNIT_SEARCH);
    });

    await test.step("Submit and expect success", async () => {
      await submitAndExpectSuccess(page);
    });
  });
});
