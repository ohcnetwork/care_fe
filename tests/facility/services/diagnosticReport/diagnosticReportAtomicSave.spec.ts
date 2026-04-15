import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Diagnostic Report Atomic Save", () => {
  /**
   * Verifies that saving diagnostic results uses the batch endpoint
   * (/api/v1/batch_requests/) instead of separate API calls for
   * observations and diagnostic report updates.
   *
   * This test intercepts network requests to confirm atomicity:
   * - A single POST to /api/v1/batch_requests/ should be made
   * - No separate calls to upsert_observations or individual report update
   */
  test("should use batch endpoint when saving diagnostic results", async ({
    page,
  }) => {
    // Track API calls to verify batch usage
    const batchRequests: { url: string; body: unknown }[] = [];
    const separateObservationCalls: string[] = [];
    const separateReportUpdateCalls: string[] = [];

    // Intercept network requests
    page.on("request", (request) => {
      const url = request.url();
      const method = request.method();

      if (url.includes("/api/v1/batch_requests/") && method === "POST") {
        let body: unknown = null;
        try {
          body = request.postDataJSON();
        } catch {
          body = request.postData();
        }
        batchRequests.push({ url, body });
      }

      // Track if old separate endpoints are still being called
      if (url.includes("/upsert_observations/") && method === "POST") {
        separateObservationCalls.push(url);
      }
      if (url.match(/\/diagnostic_report\/[^/]+\/$/) && method === "PUT") {
        separateReportUpdateCalls.push(url);
      }
    });

    // Navigate to encounters and find one with a service request
    // We need to find a service request with a diagnostic report in preliminary status
    const facilityResponse = await page.request.get(
      "/api/v1/facility/?limit=1",
    );
    const facilityData = await facilityResponse.json();

    if (!facilityData.results || facilityData.results.length === 0) {
      test.skip(true, "No facility found - skipping test");
      return;
    }

    const facilityId = facilityData.results[0].id;

    // Find a service request with diagnostic results
    const srResponse = await page.request.get(
      `/api/v1/facility/${facilityId}/service_request/?limit=20&status=active`,
    );
    const srData = await srResponse.json();

    if (!srData.results || srData.results.length === 0) {
      test.skip(true, "No active service requests found - skipping test");
      return;
    }

    // Find a service request that has a diagnostic report in preliminary status
    let targetSR = null;
    for (const sr of srData.results) {
      if (
        sr.diagnostic_reports?.length > 0 &&
        sr.diagnostic_reports[0].status === "preliminary"
      ) {
        targetSR = sr;
        break;
      }
    }

    if (!targetSR) {
      test.skip(
        true,
        "No service request with preliminary diagnostic report found - skipping test",
      );
      return;
    }

    // Navigate to the service request page
    await page.goto(`/facility/${facilityId}/service_requests/${targetSR.id}`);

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Expand the test results section if collapsed
    const testResultsEntry = page.getByText("Test Results Entry");
    if (await testResultsEntry.isVisible()) {
      // Check if form is collapsed - look for the expand button
      const expandButton = page.locator(
        "button:has(svg.lucide-chevrons-up-down)",
      );
      if (await expandButton.isVisible().catch(() => false)) {
        await expandButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Look for result input fields and fill at least one
    const resultInputs = page
      .locator('input[type="number"], input[type="text"]')
      .filter({
        has: page.locator("[placeholder]"),
      });

    const inputCount = await resultInputs.count();
    if (inputCount > 0) {
      // Fill the first available result input
      await resultInputs.first().fill("42");
    }

    // Click the "Save Results" button
    const saveButton = page.getByRole("button", { name: /save results/i });

    if (await saveButton.isVisible().catch(() => false)) {
      // Reset tracking arrays before clicking save
      batchRequests.length = 0;
      separateObservationCalls.length = 0;
      separateReportUpdateCalls.length = 0;

      await saveButton.click();

      // Wait for the API call to complete
      await page.waitForTimeout(3000);

      // CRITICAL ASSERTIONS: Verify atomicity

      // 1. Batch endpoint should have been called
      expect(
        batchRequests.length,
        "Expected batch endpoint (/api/v1/batch_requests/) to be called for atomic save",
      ).toBeGreaterThanOrEqual(1);

      // 2. Separate observation upsert should NOT have been called
      expect(
        separateObservationCalls.length,
        "Separate observation upsert endpoint should NOT be called - use batch instead",
      ).toBe(0);

      // 3. Separate diagnostic report update should NOT have been called
      expect(
        separateReportUpdateCalls.length,
        "Separate diagnostic report update endpoint should NOT be called - use batch instead",
      ).toBe(0);

      // 4. Verify the batch request body contains both sub-requests
      if (batchRequests.length > 0) {
        const batchBody = batchRequests[0].body as {
          requests?: Array<{
            url: string;
            method: string;
            reference_id: string;
          }>;
        };

        expect(batchBody).toHaveProperty("requests");
        expect(Array.isArray(batchBody.requests)).toBe(true);

        // Should contain at least the diagnostic report update request
        const referenceIds = batchBody.requests!.map((r) => r.reference_id);
        expect(referenceIds).toContain("update-diagnostic-report");

        // If observations were submitted, should also contain observation upsert
        if (inputCount > 0) {
          expect(referenceIds).toContain("upsert-observations");
        }
      }
    } else {
      test.skip(
        true,
        "Save Results button not visible - report may not be in editable state",
      );
    }
  });

  /**
   * Verifies that a successful batch save shows the correct i18n toast message
   * and collapses the form.
   */
  test("should show localized success toast and collapse form on successful save", async ({
    page,
  }) => {
    // Wait for a successful batch response
    await page.route("**/api/v1/batch_requests/", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        // Let the request through but intercept the response
        const response = await route.fetch();
        const status = response.status();

        if (status >= 200 && status < 300) {
          // Pass through the successful response
          await route.fulfill({ response });
        } else {
          await route.fulfill({ response });
        }
      } else {
        await route.continue();
      }
    });

    // Navigate to encounters and find a suitable service request
    const facilityResponse = await page.request.get(
      "/api/v1/facility/?limit=1",
    );
    const facilityData = await facilityResponse.json();

    if (!facilityData.results || facilityData.results.length === 0) {
      test.skip(true, "No facility found");
      return;
    }

    const facilityId = facilityData.results[0].id;

    const srResponse = await page.request.get(
      `/api/v1/facility/${facilityId}/service_request/?limit=20&status=active`,
    );
    const srData = await srResponse.json();

    let targetSR = null;
    for (const sr of srData.results || []) {
      if (
        sr.diagnostic_reports?.length > 0 &&
        sr.diagnostic_reports[0].status === "preliminary"
      ) {
        targetSR = sr;
        break;
      }
    }

    if (!targetSR) {
      test.skip(
        true,
        "No service request with preliminary diagnostic report found",
      );
      return;
    }

    await page.goto(`/facility/${facilityId}/service_requests/${targetSR.id}`);
    await page.waitForLoadState("networkidle");

    // Expand form if collapsed
    const expandButton = page.locator(
      "button:has(svg.lucide-chevrons-up-down)",
    );
    if (await expandButton.isVisible().catch(() => false)) {
      await expandButton.click();
      await page.waitForTimeout(500);
    }

    // Fill a result value
    const resultInputs = page
      .locator('input[type="number"], input[type="text"]')
      .filter({
        has: page.locator("[placeholder]"),
      });
    if ((await resultInputs.count()) > 0) {
      await resultInputs.first().fill("55");
    }

    const saveButton = page.getByRole("button", { name: /save results/i });
    if (!(await saveButton.isVisible().catch(() => false))) {
      test.skip(true, "Save Results button not visible");
      return;
    }

    await saveButton.click();

    // Verify success toast appears with i18n message
    const toaster = page.locator(".toaster.group");
    await expect(
      toaster.getByText(/diagnostic report updated successfully/i),
    ).toBeVisible({ timeout: 10000 });

    // Verify form collapses after successful save
    // The collapse button should switch to expand (chevrons-up-down)
    await expect(
      page.locator("button:has(svg.lucide-chevrons-up-down)"),
    ).toBeVisible({ timeout: 5000 });
  });

  /**
   * Verifies that the batch request body structure is correct,
   * containing proper URLs and methods for both sub-requests.
   */
  test("should send correct batch request structure with proper URLs and methods", async ({
    page,
  }) => {
    let capturedBatchBody: {
      requests?: Array<{
        url: string;
        method: string;
        reference_id: string;
        body: unknown;
      }>;
    } | null = null;

    // Intercept the batch request to capture its body
    await page.route("**/api/v1/batch_requests/", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        try {
          capturedBatchBody = request.postDataJSON();
        } catch {
          capturedBatchBody = null;
        }
        await route.continue();
      } else {
        await route.continue();
      }
    });

    const facilityResponse = await page.request.get(
      "/api/v1/facility/?limit=1",
    );
    const facilityData = await facilityResponse.json();
    if (!facilityData.results?.length) {
      test.skip(true, "No facility found");
      return;
    }
    const facilityId = facilityData.results[0].id;

    const srResponse = await page.request.get(
      `/api/v1/facility/${facilityId}/service_request/?limit=20&status=active`,
    );
    const srData = await srResponse.json();

    let targetSR = null;
    for (const sr of srData.results || []) {
      if (
        sr.diagnostic_reports?.length > 0 &&
        sr.diagnostic_reports[0].status === "preliminary"
      ) {
        targetSR = sr;
        break;
      }
    }

    if (!targetSR) {
      test.skip(
        true,
        "No service request with preliminary diagnostic report found",
      );
      return;
    }

    await page.goto(`/facility/${facilityId}/service_requests/${targetSR.id}`);
    await page.waitForLoadState("networkidle");

    // Expand form
    const expandButton = page.locator(
      "button:has(svg.lucide-chevrons-up-down)",
    );
    if (await expandButton.isVisible().catch(() => false)) {
      await expandButton.click();
      await page.waitForTimeout(500);
    }

    // Fill result
    const resultInputs = page
      .locator('input[type="number"], input[type="text"]')
      .filter({
        has: page.locator("[placeholder]"),
      });
    if ((await resultInputs.count()) > 0) {
      await resultInputs.first().fill("99");
    }

    const saveButton = page.getByRole("button", { name: /save results/i });
    if (!(await saveButton.isVisible().catch(() => false))) {
      test.skip(true, "Save Results button not visible");
      return;
    }

    await saveButton.click();
    await page.waitForTimeout(3000);

    // Validate the batch request body structure
    expect(
      capturedBatchBody,
      "Batch request body should have been captured",
    ).not.toBeNull();

    const requests = capturedBatchBody!.requests!;
    expect(requests.length).toBeGreaterThanOrEqual(1);

    // Find the diagnostic report update request
    const reportUpdate = requests.find(
      (r) => r.reference_id === "update-diagnostic-report",
    );
    expect(
      reportUpdate,
      "Batch should contain update-diagnostic-report request",
    ).toBeDefined();
    expect(reportUpdate!.method).toBe("PUT");
    expect(reportUpdate!.url).toMatch(
      /\/api\/v1\/patient\/[^/]+\/diagnostic_report\/[^/]+\/$/,
    );

    // If observations were included, validate that sub-request too
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
