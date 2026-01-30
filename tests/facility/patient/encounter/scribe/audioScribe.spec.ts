import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Audio Scribe", () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(["microphone"]);

    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate to facility's patient list
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
    );

    // Navigate to an existing patient encounter's updates tab
    await page.getByRole("link", { name: "Patient Home" }).first().click();

    // Wait for the page to load and find an existing encounter
    await expect(
      page.getByRole("button", { name: "Create Encounter" }),
    ).toBeVisible();

    // Click on an existing encounter if available, otherwise create one
    const existingEncounter = page
      .locator('[data-testid="encounter-card"]')
      .first();
    if (
      await existingEncounter.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await existingEncounter.click();
    } else {
      // Create a new encounter
      await page.getByRole("button", { name: "Create Encounter" }).click();
      await page.getByRole("button", { name: "Ambulatory" }).click();
      await page.getByRole("button", { name: "Create Encounter" }).click();
      await expect(
        page.getByText("Encounter created successfully"),
      ).toBeVisible();
    }

    // Navigate to updates tab
    await page.getByRole("tab", { name: "Overview" }).click();
  });

  test("should open audio recorder when scribe button is clicked", async ({
    page,
  }) => {
    // Click the scribe button
    const scribeButton = page.getByRole("button", { name: /scribe/i });
    await expect(scribeButton).toBeVisible();
    await scribeButton.click();

    // Verify audio recorder modal opens
    await expect(page.getByText("Audio Scribe")).toBeVisible();
  });

  test("should record audio and show playback controls", async ({ page }) => {
    // Click the scribe button
    await page.getByRole("button", { name: /scribe/i }).click();

    // Wait for recording to start automatically
    await expect(page.getByText("Recording in progress...")).toBeVisible();

    // Let it record for a few seconds
    await page.waitForTimeout(2000);

    // Stop recording
    await page.getByRole("button", { name: /stop/i }).click();

    // Verify recording is complete and playback controls are shown
    await expect(page.getByText("Recording complete")).toBeVisible();
    await expect(page.getByRole("button", { name: /discard/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /upload/i })).toBeVisible();
  });

  test("should discard recording when discard button is clicked", async ({
    page,
  }) => {
    // Click the scribe button
    await page.getByRole("button", { name: /scribe/i }).click();

    // Wait for recording to start
    await expect(page.getByText("Recording in progress...")).toBeVisible();
    await page.waitForTimeout(1000);

    // Stop recording
    await page.getByRole("button", { name: /stop/i }).click();

    // Click discard
    await page.getByRole("button", { name: /discard/i }).click();

    // Verify we're back to ready state (or modal closed)
    await expect(page.getByText("Ready to record")).toBeVisible();
  });

  test("should attempt upload when upload button is clicked", async ({
    page,
  }) => {
    // Set up route interception for the scribe API
    let uploadRequestMade = false;
    await page.route("**/api/v1/scribe/process/**", async (route) => {
      uploadRequestMade = true;
      // Return a mock success response
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          transcript: "Mock transcript",
          bundle: {},
        }),
      });
    });

    // Click the scribe button
    await page.getByRole("button", { name: /scribe/i }).click();

    // Wait for recording to start
    await expect(page.getByText("Recording in progress...")).toBeVisible();
    await page.waitForTimeout(2000);

    // Stop recording
    await page.getByRole("button", { name: /stop/i }).click();

    // Verify upload button is visible
    await expect(page.getByRole("button", { name: /upload/i })).toBeVisible();

    // Click upload
    await page.getByRole("button", { name: /upload/i }).click();

    // Wait for the upload to complete
    await page.waitForTimeout(1000);

    // Verify the API was called
    expect(uploadRequestMade).toBe(true);
  });

  test("should pause and resume recording", async ({ page }) => {
    // Click the scribe button
    await page.getByRole("button", { name: /scribe/i }).click();

    // Wait for recording to start
    await expect(page.getByText("Recording in progress...")).toBeVisible();
    await page.waitForTimeout(1000);

    // Pause recording
    await page.getByRole("button", { name: /pause/i }).click();

    // Verify paused state
    await expect(page.getByText("Recording paused")).toBeVisible();

    // Resume recording
    await page.getByRole("button", { name: /resume/i }).click();

    // Verify recording resumed
    await expect(page.getByText("Recording in progress...")).toBeVisible();
  });

  test("should close audio recorder when close button is clicked", async ({
    page,
  }) => {
    // Click the scribe button
    await page.getByRole("button", { name: /scribe/i }).click();

    // Verify audio recorder is open
    await expect(page.getByText("Audio Scribe")).toBeVisible();

    // Click close button (X)
    await page.getByRole("button", { name: /close/i }).click();

    // Verify audio recorder is closed
    await expect(page.getByText("Audio Scribe")).not.toBeVisible();
  });
});
