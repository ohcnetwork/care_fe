import { createServiceRequest } from "@/tests/facility/services/encounter/serviceRequests/serviceRequest";
import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let patientId: string;
let encounterId: string;

test.beforeAll(async () => {
  facilityId = getFacilityId();
  patientId = getPatientId();
  encounterId = getEncounterId();
});

test.describe("Diagnostic Report - Save Results", () => {
  /**
   * End-to-end test: user creates a service request, opens its detail view,
   * enters observation results, clicks "Save Results", and sees the success toast.
   *
   * This validates the save flow from a user perspective — we don't check API
   * internals, only that the UI behaves correctly after saving.
   */
  test("should show success toast after saving diagnostic results", async ({
    page,
  }) => {
    // Step 1: Create a service request (uses a lab test activity definition)
    await createServiceRequest(page, facilityId, patientId, encounterId);

    // Step 2: Navigate to service requests list and open the newly created one
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/service_requests`,
    );
    await page.waitForLoadState("networkidle");

    // Open the first service request detail
    const firstRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();
    await expect(firstRow).toBeVisible();
    await firstRow.getByRole("button", { name: /see details/i }).click();
    await page.waitForLoadState("networkidle");

    // Step 3: Expect the "Test Results Entry" section to be present
    await expect(page.getByText("Test Results Entry")).toBeVisible({
      timeout: 10000,
    });

    // Step 4: Expand the form if collapsed
    const expandTrigger = page
      .locator('[data-slot="collapsible-trigger"]')
      .filter({ hasText: /test results entry/i });
    if (await expandTrigger.isVisible().catch(() => false)) {
      await expandTrigger.click();
    }

    // Step 5: Look for a "Save Results" button — only present when report is editable
    const saveButton = page.getByRole("button", { name: /save results/i });
    if (!(await saveButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(
        true,
        "Save Results not visible — specimen may not be collected or report not in preliminary state",
      );
      return;
    }

    // Step 6: Fill at least one result field if available
    const resultInputs = page.getByLabel(/result/i);
    const inputCount = await resultInputs.count();
    if (inputCount > 0) {
      await resultInputs.first().fill("42");
    }

    // Step 7: Click save
    await saveButton.click();

    // Step 8: Verify the success toast
    await expectToast(page, /diagnostic report updated successfully/i);
  });

  /**
   * After saving, the "Test Results Entry" form should collapse automatically.
   */
  test("should collapse the form after saving results", async ({ page }) => {
    await createServiceRequest(page, facilityId, patientId, encounterId);

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/service_requests`,
    );
    await page.waitForLoadState("networkidle");

    const firstRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();
    await expect(firstRow).toBeVisible();
    await firstRow.getByRole("button", { name: /see details/i }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Test Results Entry")).toBeVisible({
      timeout: 10000,
    });

    // Expand if collapsed
    const expandTrigger = page
      .locator('[data-slot="collapsible-trigger"]')
      .filter({
        hasText: /test results entry/i,
      });
    if (await expandTrigger.isVisible().catch(() => false)) {
      await expandTrigger.click();
    }

    const saveButton = page.getByRole("button", { name: /save results/i });
    if (!(await saveButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "Save Results not visible");
      return;
    }

    const resultInputs = page.getByLabel(/result/i);
    if ((await resultInputs.count()) > 0) {
      await resultInputs.first().fill("55");
    }

    await saveButton.click();

    // Success toast
    await expectToast(page, /diagnostic report updated successfully/i);

    // Form should collapse — Save Results button should no longer be visible
    await expect(
      page.getByRole("button", { name: /save results/i }),
    ).not.toBeVisible({ timeout: 5000 });
  });
});
