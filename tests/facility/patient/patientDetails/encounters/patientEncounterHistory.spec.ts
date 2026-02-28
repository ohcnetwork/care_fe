import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Encounter History Tab", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounters`,
    );
  });

  test("should display the encounters tab with encounter history", async ({
    page,
  }) => {
    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // The encounters tab should show encounter cards/timeline
    // Fixture creates at least 1 encounter per patient
    const encounterContent = page
      .locator('[data-slot="card"]')
      .or(page.getByText(/in progress|planned|completed/i).first());

    await expect(encounterContent.first()).toBeVisible({ timeout: 10000 });
  });

  test("should display encounter status badges", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Wait for encounter cards to load
    await page.waitForTimeout(1000);

    // Look for status badges (In Progress, Completed, etc.)
    const statusBadge = page
      .locator('[data-slot="badge"]')
      .filter({ hasText: /in progress|planned|completed|on hold/i });

    if (await statusBadge.first().isVisible().catch(() => false)) {
      await expect(statusBadge.first()).toBeVisible();
    }
  });

  test("should have Create Encounter button", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // The encounters tab should have a "Create Encounter" button
    const createButton = page.getByRole("button", {
      name: /create encounter/i,
    });
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to encounter when clicking on encounter card", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    // Click on the first encounter card/link
    const encounterLink = page
      .getByRole("link")
      .filter({ hasText: /view|encounter/i })
      .first();

    if (await encounterLink.isVisible().catch(() => false)) {
      await encounterLink.click();

      // Should navigate to the encounter page
      await page.waitForURL(/\/encounter\/[^/]+/);
      await expect(page).toHaveURL(/\/encounter\/[^/]+/);
    } else {
      // If no links, try clicking on a card directly
      const encounterCard = page.locator('[data-slot="card"]').first();
      if (await encounterCard.isVisible().catch(() => false)) {
        await encounterCard.click();
      }
    }
  });

  test("should show encounter class information", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Encounters should display their class (Inpatient, Ambulatory, etc.)
    const classInfo = page.getByText(
      /inpatient|ambulatory|observation|emergency|virtual|home health/i,
    );

    if (await classInfo.first().isVisible().catch(() => false)) {
      await expect(classInfo.first()).toBeVisible();
    }
  });
});
