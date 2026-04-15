import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let patientId: string;
let encounterId: string;

test.beforeAll(async () => {
  facilityId = getFacilityId();
  patientId = getPatientId();
  encounterId = getEncounterId();
});

test.describe("Diagnostic Report Atomic Save", () => {
  /**
   * Navigate to the service requests tab of an encounter,
   * open an active service request with a diagnostic report,
   * enter a result value, and verify the save uses a single
   * batch API call rather than two independent mutations.
   */
  test("should use batch endpoint when saving diagnostic results", async ({
    page,
  }) => {
    const batchRequests: string[] = [];
    const separateObservationCalls: string[] = [];
    const separateReportUpdateCalls: string[] = [];

    // Intercept network requests before navigation
    page.on("request", (request) => {
      const url = request.url();
      const method = request.method();

      if (url.includes("/api/v1/batch_requests/") && method === "POST") {
        batchRequests.push(url);
      }
      if (url.includes("/upsert_observations/") && method === "POST") {
        separateObservationCalls.push(url);
      }
      if (url.match(/\/diagnostic_report\/[^/]+\/$/) && method === "PUT") {
        separateReportUpdateCalls.push(url);
      }
    });

    // Navigate to service requests tab
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/service_requests`,
    );
    await page.waitForLoadState("networkidle");

    // Find a service request row and open its detail
    const firstRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();

    const hasRows = await firstRow.isVisible().catch(() => false);
    if (!hasRows) {
      test.skip(true, "No service requests found in this encounter");
      return;
    }

    await firstRow.getByRole("button", { name: /see details/i }).click();
    await page.waitForLoadState("networkidle");

    // Look for a "Save Results" button — only present when report is in preliminary status
    const saveButton = page.getByRole("button", { name: /save results/i });
    const hasSaveButton = await saveButton.isVisible().catch(() => false);

    if (!hasSaveButton) {
      test.skip(
        true,
        "No Save Results button — report may not be in preliminary state",
      );
      return;
    }

    // Fill at least one result input if available
    const resultInputs = page.locator(
      '[data-slot="card"] input[type="number"], [data-slot="card"] input[type="text"]',
    );
    const inputCount = await resultInputs.count();
    if (inputCount > 0) {
      await resultInputs.first().fill("42");
    }

    // Reset tracking before the actual save click
    batchRequests.length = 0;
    separateObservationCalls.length = 0;
    separateReportUpdateCalls.length = 0;

    await saveButton.click();
    await page.waitForTimeout(3000);

    // 1. Batch endpoint must have been called
    expect(
      batchRequests.length,
      "Expected POST /api/v1/batch_requests/ to be called for atomic save",
    ).toBeGreaterThanOrEqual(1);

    // 2. Separate observation upsert must NOT have been called
    expect(
      separateObservationCalls.length,
      "Separate /upsert_observations/ endpoint should NOT be called — use batch",
    ).toBe(0);

    // 3. Separate diagnostic report PUT must NOT have been called
    expect(
      separateReportUpdateCalls.length,
      "Separate PUT /diagnostic_report/ endpoint should NOT be called — use batch",
    ).toBe(0);
  });

  /**
   * Verifies the correct i18n success toast appears after a successful save,
   * confirming the new key `diagnostic_report_updated_successfully` is used.
   */
  test("should show localized success toast on successful save", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/service_requests`,
    );
    await page.waitForLoadState("networkidle");

    const firstRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();

    if (!(await firstRow.isVisible().catch(() => false))) {
      test.skip(true, "No service requests found");
      return;
    }

    await firstRow.getByRole("button", { name: /see details/i }).click();
    await page.waitForLoadState("networkidle");

    const saveButton = page.getByRole("button", { name: /save results/i });
    if (!(await saveButton.isVisible().catch(() => false))) {
      test.skip(true, "No Save Results button visible");
      return;
    }

    // Fill a value if inputs are present
    const resultInputs = page.locator(
      '[data-slot="card"] input[type="number"], [data-slot="card"] input[type="text"]',
    );
    if ((await resultInputs.count()) > 0) {
      await resultInputs.first().fill("55");
    }

    await saveButton.click();

    // Verify the i18n success toast key fires
    await expectToast(page, /diagnostic report updated successfully/i);
  });

  /**
   * Verifies the batch request body contains the correct sub-request structure:
   * - reference_id "update-diagnostic-report" with method PUT
   * - reference_id "upsert-observations" with method POST (when observations exist)
   */
  test("should send correct batch request structure", async ({ page }) => {
    let capturedBatchBody: {
      requests?: Array<{
        url: string;
        method: string;
        reference_id: string;
        body: unknown;
      }>;
    } | null = null;

    // Intercept to capture the batch request body
    await page.route("**/api/v1/batch_requests/", async (route) => {
      if (route.request().method() === "POST") {
        try {
          capturedBatchBody = route.request().postDataJSON();
        } catch {
          capturedBatchBody = null;
        }
      }
      await route.continue();
    });

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/service_requests`,
    );
    await page.waitForLoadState("networkidle");

    const firstRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();

    if (!(await firstRow.isVisible().catch(() => false))) {
      test.skip(true, "No service requests found");
      return;
    }

    await firstRow.getByRole("button", { name: /see details/i }).click();
    await page.waitForLoadState("networkidle");

    const saveButton = page.getByRole("button", { name: /save results/i });
    if (!(await saveButton.isVisible().catch(() => false))) {
      test.skip(true, "No Save Results button visible");
      return;
    }

    const resultInputs = page.locator(
      '[data-slot="card"] input[type="number"], [data-slot="card"] input[type="text"]',
    );
    const inputCount = await resultInputs.count();
    if (inputCount > 0) {
      await resultInputs.first().fill("99");
    }

    await saveButton.click();
    await page.waitForTimeout(3000);

    expect(
      capturedBatchBody,
      "Batch request body should have been captured",
    ).not.toBeNull();

    const requests = capturedBatchBody!.requests!;
    expect(requests.length).toBeGreaterThanOrEqual(1);

    // Validate the diagnostic report update sub-request
    const reportUpdate = requests.find(
      (r) => r.reference_id === "update-diagnostic-report",
    );
    expect(
      reportUpdate,
      'Batch must contain a sub-request with reference_id "update-diagnostic-report"',
    ).toBeDefined();
    expect(reportUpdate!.method).toBe("PUT");
    expect(reportUpdate!.url).toMatch(
      /\/api\/v1\/patient\/[^/]+\/diagnostic_report\/[^/]+\/$/,
    );

    // Validate the observation upsert sub-request if observations were submitted
    const obsUpsert = requests.find(
      (r) => r.reference_id === "upsert-observations",
    );
    if (obsUpsert) {
      expect(obsUpsert.method).toBe("POST");
      expect(obsUpsert.url).toMatch(
        /\/api\/v1\/patient\/[^/]+\/diagnostic_report\/[^/]+\/upsert_observations\/$/,
      );
      expect(obsUpsert.body).toHaveProperty("observations");
    }
  });
});
