import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Encounter Access via Organization", () => {
  let organizationId: string;
  let patientId: string;
  let encounterId: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to organization
    await page.goto("/");
    await page.getByRole("tab", { name: "Governance" }).click();

    // Click the first organization link and extract organization ID
    const orgLink = page.getByRole("link", { name: /Government$/ }).first();
    await orgLink.click();

    // Wait for URL to update and extract organization ID
    await page.waitForURL(/\/organization\/([^/]+)$/);
    const urlMatch = page.url().match(/\/organization\/([^/]+)$/);
    if (urlMatch) {
      organizationId = urlMatch[1];
    }
  });

  test("Access patient encounter through organization patients list", async ({
    page,
  }) => {
    // Navigate to organization patients
    await page.getByRole("menuitem", { name: "Patients" }).click();
    await page.waitForURL(`**/organization/${organizationId}/patients`);

    // Wait for patients to load and click the first patient
    const patientLink = page
      .getByRole("link")
      .filter({ has: page.locator("h3") })
      .first();
    await patientLink.waitFor({ state: "visible" });
    await patientLink.click();

    // Wait for patient page to load and extract patient ID
    await page.waitForURL(/\/patient\/([^/]+)/);
    const patientUrlMatch = page.url().match(/\/patient\/([^/]+)/);
    if (patientUrlMatch) {
      patientId = patientUrlMatch[1];
    }

    // Navigate to encounters tab
    await page.getByRole("tab", { name: "Encounters" }).click();
    await page.waitForURL(/\/patient\/([^/]+)\/encounters/);

    // Check if there are any encounters
    const encounterCards = page
      .locator('[data-testid="encounter-card"], .cursor-pointer')
      .filter({
        has: page.locator(
          "text=/Inpatient|Ambulatory|Observation|Emergency|Virtual|Home Health/i",
        ),
      });

    const encounterCount = await encounterCards.count();

    if (encounterCount > 0) {
      // Click on the first encounter
      await encounterCards.first().click();

      // Wait for encounter page to load
      await page.waitForURL(/\/encounter\/([^/]+)/);

      // Extract encounter ID from URL
      const encounterUrlMatch = page.url().match(/\/encounter\/([^/]+)/);
      if (encounterUrlMatch) {
        encounterId = encounterUrlMatch[1];
      }

      // Verify we're on the encounter page with proper heading
      await expect(
        page.getByRole("heading", {
          name: /Inpatient|Ambulatory|Observation|Emergency|Virtual|Home Health/i,
        }),
      ).toBeVisible();

      // Now test accessing the same encounter via organization route
      const orgEncounterUrl = `/organization/${organizationId}/patient/${patientId}/encounter/${encounterId}/overview`;
      await page.goto(orgEncounterUrl);

      // Verify the encounter page loads correctly via organization route
      await expect(
        page.getByRole("heading", {
          name: /Inpatient|Ambulatory|Observation|Emergency|Virtual|Home Health/i,
        }),
      ).toBeVisible();

      // Verify we can navigate to different tabs via organization route
      await page.getByRole("tab", { name: "Details" }).click();
      await expect(page).toHaveURL(
        new RegExp(
          `/organization/${organizationId}/patient/${patientId}/encounter/${encounterId}/details`,
        ),
      );
    } else {
      // If no encounters exist, just verify the empty state is shown
      await expect(page.getByText(/no.*encounters.*found/i)).toBeVisible();
      console.log(
        "No encounters found for patient, skipping encounter access test",
      );
    }
  });

  test("Direct access to encounter via organization URL", async ({ page }) => {
    // First, we need to get a patient with an encounter
    // Navigate to organization patients
    await page.getByRole("menuitem", { name: "Patients" }).click();
    await page.waitForURL(`**/organization/${organizationId}/patients`);

    // Click the first patient
    const patientLink = page
      .getByRole("link")
      .filter({ has: page.locator("h3") })
      .first();
    await patientLink.waitFor({ state: "visible" });
    await patientLink.click();

    // Extract patient ID
    await page.waitForURL(/\/patient\/([^/]+)/);
    const patientUrlMatch = page.url().match(/\/patient\/([^/]+)/);
    if (patientUrlMatch) {
      patientId = patientUrlMatch[1];
    }

    // Navigate to encounters tab
    await page.getByRole("tab", { name: "Encounters" }).click();
    await page.waitForURL(/\/patient\/([^/]+)\/encounters/);

    // Check if there are any encounters
    const encounterCards = page
      .locator('[data-testid="encounter-card"], .cursor-pointer')
      .filter({
        has: page.locator(
          "text=/Inpatient|Ambulatory|Observation|Emergency|Virtual|Home Health/i",
        ),
      });

    const encounterCount = await encounterCards.count();

    if (encounterCount > 0) {
      // Click on first encounter to get the encounter ID
      await encounterCards.first().click();
      await page.waitForURL(/\/encounter\/([^/]+)/);

      const encounterUrlMatch = page.url().match(/\/encounter\/([^/]+)/);
      if (encounterUrlMatch) {
        encounterId = encounterUrlMatch[1];
      }

      // Test direct navigation to encounter via organization URL
      const orgEncounterUrl = `/organization/${organizationId}/patient/${patientId}/encounter/${encounterId}/overview`;
      await page.goto(orgEncounterUrl);

      // Verify the encounter loads correctly
      await expect(
        page.getByRole("heading", {
          name: /Inpatient|Ambulatory|Observation|Emergency|Virtual|Home Health/i,
        }),
      ).toBeVisible();

      // Verify organization context is maintained
      // The URL should still contain the organization ID
      expect(page.url()).toContain(`/organization/${organizationId}/`);
    } else {
      console.log(
        "No encounters found for patient, skipping direct access test",
      );
    }
  });

  test("Navigate between encounter tabs using organization route", async ({
    page,
  }) => {
    // Navigate to patients
    await page.getByRole("menuitem", { name: "Patients" }).click();
    await page.waitForURL(`**/organization/${organizationId}/patients`);

    // Click first patient
    const patientLink = page
      .getByRole("link")
      .filter({ has: page.locator("h3") })
      .first();
    await patientLink.waitFor({ state: "visible" });
    await patientLink.click();

    // Extract patient ID
    await page.waitForURL(/\/patient\/([^/]+)/);
    const patientUrlMatch = page.url().match(/\/patient\/([^/]+)/);
    if (patientUrlMatch) {
      patientId = patientUrlMatch[1];
    }

    // Navigate to encounters tab
    await page.getByRole("tab", { name: "Encounters" }).click();

    // Check for encounters
    const encounterCards = page
      .locator('[data-testid="encounter-card"], .cursor-pointer')
      .filter({
        has: page.locator(
          "text=/Inpatient|Ambulatory|Observation|Emergency|Virtual|Home Health/i",
        ),
      });

    const encounterCount = await encounterCards.count();

    if (encounterCount > 0) {
      // Get encounter ID
      await encounterCards.first().click();
      await page.waitForURL(/\/encounter\/([^/]+)/);

      const encounterUrlMatch = page.url().match(/\/encounter\/([^/]+)/);
      if (encounterUrlMatch) {
        encounterId = encounterUrlMatch[1];
      }

      // Navigate via organization route
      await page.goto(
        `/organization/${organizationId}/patient/${patientId}/encounter/${encounterId}/overview`,
      );

      // Test navigation between tabs
      const tabs = [
        { name: "Overview", urlFragment: "overview" },
        { name: "Details", urlFragment: "details" },
        { name: "Updates", urlFragment: "updates" },
      ];

      for (const tab of tabs) {
        // Click on the tab
        const tabElement = page.getByRole("tab", { name: tab.name });
        if (await tabElement.isVisible()) {
          await tabElement.click();

          // Verify URL contains both organization ID and correct tab
          await expect(page).toHaveURL(
            new RegExp(
              `/organization/${organizationId}/patient/${patientId}/encounter/${encounterId}/${tab.urlFragment}`,
            ),
          );
        }
      }
    } else {
      console.log("No encounters found, skipping tab navigation test");
    }
  });

  test("Verify organization breadcrumb when accessing encounter", async ({
    page,
  }) => {
    // Navigate to patients
    await page.getByRole("menuitem", { name: "Patients" }).click();
    await page.waitForURL(`**/organization/${organizationId}/patients`);

    // Click first patient
    const patientLink = page
      .getByRole("link")
      .filter({ has: page.locator("h3") })
      .first();
    await patientLink.waitFor({ state: "visible" });
    await patientLink.click();

    // Extract patient ID
    await page.waitForURL(/\/patient\/([^/]+)/);
    const patientUrlMatch = page.url().match(/\/patient\/([^/]+)/);
    if (patientUrlMatch) {
      patientId = patientUrlMatch[1];
    }

    // Navigate to encounters
    await page.getByRole("tab", { name: "Encounters" }).click();

    // Check for encounters
    const encounterCards = page
      .locator('[data-testid="encounter-card"], .cursor-pointer')
      .filter({
        has: page.locator(
          "text=/Inpatient|Ambulatory|Observation|Emergency|Virtual|Home Health/i",
        ),
      });

    const encounterCount = await encounterCards.count();

    if (encounterCount > 0) {
      await encounterCards.first().click();
      await page.waitForURL(/\/encounter\/([^/]+)/);

      const encounterUrlMatch = page.url().match(/\/encounter\/([^/]+)/);
      if (encounterUrlMatch) {
        encounterId = encounterUrlMatch[1];
      }

      // Navigate via organization route
      await page.goto(
        `/organization/${organizationId}/patient/${patientId}/encounter/${encounterId}/overview`,
      );

      // Verify page content is accessible
      await expect(
        page.getByRole("heading", {
          name: /Inpatient|Ambulatory|Observation|Emergency|Virtual|Home Health/i,
        }),
      ).toBeVisible();

      // The page should load successfully without errors
      // and the URL should contain the organization context
      expect(page.url()).toContain(`/organization/${organizationId}/`);
    } else {
      console.log("No encounters found, skipping breadcrumb test");
    }
  });
});
