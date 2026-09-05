import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import { ensurePractitionerSchedule, getCurrentUser } from "./helpers";

test.use({ storageState: "tests/.auth/user.json" });

async function openBookAppointmentSheet(page: Page) {
  await page.getByRole("button", { name: /schedule appointment/i }).click();
  await expect(
    page.getByRole("heading", { name: /book appointment/i }),
  ).toBeVisible();
}

/**
 * Selects a practitioner via search in the department picker.
 * Searching surfaces practitioners directly (not only departments).
 */
async function selectPractitioner(page: Page, searchName: string) {
  const sheet = page.locator('[data-slot="sheet-content"]');
  const trigger = sheet
    .getByRole("combobox")
    .filter({ hasText: /select practitioner/i });
  await trigger.click();

  const popover = page
    .locator("[data-radix-popper-content-wrapper], [role='dialog']")
    .last();
  await expect(popover).toBeVisible();

  const allDeptToggle = popover.getByRole("button", {
    name: /my dept|all dept/i,
  });
  if (await allDeptToggle.isVisible().catch(() => false)) {
    const label = await allDeptToggle.textContent();
    if (label && /my dept/i.test(label)) {
      await allDeptToggle.click();
    }
  }

  const search = popover.getByPlaceholder(
    /search departments and practitioners/i,
  );
  await search.fill(searchName);

  const practitionerOption = popover
    .getByRole("option")
    .filter({ hasText: new RegExp(searchName, "i") })
    .first();
  await expect(practitionerOption).toBeVisible({ timeout: 15000 });
  await practitionerOption.click();
}

test.describe("Book Appointment Flow", () => {
  let facilityId: string;
  let patientId: string;
  let practitionerId: string;
  let practitionerSearchName: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    const currentUser = await getCurrentUser();
    practitionerId = currentUser.id;
    practitionerSearchName =
      currentUser.first_name || currentUser.username || "admin";

    await ensurePractitionerSchedule({
      facilityId,
      practitionerId,
    });

    await page.goto(`/facility/${facilityId}/patient/${patientId}`);
  });

  test("should open book appointment sheet from patient home", async ({
    page,
  }) => {
    await openBookAppointmentSheet(page);

    await expect(page.getByText(/select resource type/i)).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /practitioner/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder(/reason for visit/i)).toBeVisible();
  });

  test("should show bookings tab in the appointment sheet", async ({
    page,
  }) => {
    await openBookAppointmentSheet(page);

    await page.getByRole("tab", { name: /^bookings$/i }).click();
    await expect(
      page.getByRole("tab", { name: /^bookings$/i }),
    ).toHaveAttribute("data-state", "active");
  });

  test("should book an appointment after selecting practitioner and slot", async ({
    page,
  }) => {
    const reason = `E2E visit ${faker.string.alphanumeric(6)}`;

    await openBookAppointmentSheet(page);
    await selectPractitioner(page, practitionerSearchName);

    await page.getByPlaceholder(/reason for visit/i).fill(reason);

    const confirmButton = page.getByRole("button", {
      name: /confirm appointment/i,
    });
    await expect(confirmButton).toBeVisible({ timeout: 20000 });
    await confirmButton.click();

    await expectToast(page, /appointment created successfully/i);
    await expect(page).toHaveURL(/\/appointments\/[^/?]+/);
    await expect(page.getByText(/appointment details/i)).toBeVisible();
  });
});
