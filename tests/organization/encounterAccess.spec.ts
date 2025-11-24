import { expect, test, type Page } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Helper function to navigate to organization and extract organization ID
 */
async function navigateToOrganization(page: Page): Promise<string> {
  await page.goto("/");
  await page.getByRole("tab", { name: "Governance" }).click();

  // Click the first organization link (more generic selector)
  const orgLinks = page.getByRole("link").filter({ hasText: /Government/i });
  await orgLinks.first().click();

  // Wait for URL to update and extract organization ID
  await page.waitForURL(/\/organization\/([^/]+)/);
  const urlMatch = page.url().match(/\/organization\/([^/]+)/);
  if (!urlMatch) {
    throw new Error("Could not extract organization ID from URL");
  }
  return urlMatch[1];
}

/**
 * Helper function to navigate to a patient and extract patient ID
 */
async function navigateToPatient(
  page: Page,
  organizationId: string,
): Promise<string> {
  await page.getByRole("menuitem", { name: "Patients" }).click();
  await page.waitForURL(`**/organization/${organizationId}/patients`);

  // Wait for patients to load and click the first patient
  const patientLink = page
    .getByRole("link")
    .filter({ has: page.locator("h3") })
    .first();
  await patientLink.waitFor({ state: "visible" });
  await patientLink.click();

  // Extract patient ID from URL
  await page.waitForURL(/\/patient\/([^/]+)/);
  const urlMatch = page.url().match(/\/patient\/([^/]+)/);
  if (!urlMatch) {
    throw new Error("Could not extract patient ID from URL");
  }
  return urlMatch[1];
}

/**
 * Helper function to get the first encounter ID for a patient
 * Returns null if no encounters exist
 */
async function getFirstEncounterId(page: Page): Promise<string | null> {
  await page.getByRole("tab", { name: "Encounters" }).click();
  await page.waitForURL(/\/patient\/([^/]+)\/encounters/);

  // Check if there are any encounters
  // Using data-testid as primary selector, with cursor-pointer as fallback for cards
  const encounterCards = page.locator('[data-testid="encounter-card"]').or(
    page.locator(".cursor-pointer").filter({
      has: page.locator(
        "text=/Inpatient|Ambulatory|Observation|Emergency|Virtual|Home Health/i",
      ),
    }),
  );

  const encounterCount = await encounterCards.count();
  if (encounterCount === 0) {
    return null;
  }

  // Click on first encounter to get the encounter ID
  await encounterCards.first().click();
  await page.waitForURL(/\/encounter\/([^/]+)/);

  const urlMatch = page.url().match(/\/encounter\/([^/]+)/);
  if (!urlMatch) {
    throw new Error("Could not extract encounter ID from URL");
  }
  return urlMatch[1];
}

/**
 * Helper function to setup patient and encounter for testing
 * Returns an object with patientId and encounterId
 */
async function setupPatientAndEncounter(
  page: Page,
  organizationId: string,
): Promise<{ patientId: string; encounterId: string | null }> {
  const patientId = await navigateToPatient(page, organizationId);
  const encounterId = await getFirstEncounterId(page);
  return { patientId, encounterId };
}

test.describe("Patient Encounter Access via Organization", () => {
  let organizationId: string;

  test.beforeEach(async ({ page }) => {
    organizationId = await navigateToOrganization(page);
  });

  test("Access patient encounter through organization patients list", async ({
    page,
  }) => {
    const { patientId, encounterId } = await setupPatientAndEncounter(
      page,
      organizationId,
    );

    test.skip(!encounterId, "No encounters found for patient");

    // Navigate via organization route
    const orgEncounterUrl = `/organization/${organizationId}/patient/${patientId}/encounter/${encounterId}/overview`;

    // TODO: Currently the UI crashes when accessing encounter via organization route
    // This test will fail until the issue is fixed. Once fixed, remove test.fail()
    test.fail(
      true,
      "Known issue: UI crashes when accessing encounter via organization route",
    );

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
  });

  test("Direct access to encounter via organization URL", async ({ page }) => {
    const { patientId, encounterId } = await setupPatientAndEncounter(
      page,
      organizationId,
    );

    test.skip(!encounterId, "No encounters found for patient");

    // TODO: Currently the UI crashes when accessing encounter via organization route
    // This test will fail until the issue is fixed. Once fixed, remove test.fail()
    test.fail(
      true,
      "Known issue: UI crashes when accessing encounter via organization route",
    );

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
    expect(page.url()).toContain(`/organization/${organizationId}/`);
  });

  test("Navigate between encounter tabs using organization route", async ({
    page,
  }) => {
    const { patientId, encounterId } = await setupPatientAndEncounter(
      page,
      organizationId,
    );

    test.skip(!encounterId, "No encounters found for patient");

    // TODO: Currently the UI crashes when accessing encounter via organization route
    // This test will fail until the issue is fixed. Once fixed, remove test.fail()
    test.fail(
      true,
      "Known issue: UI crashes when accessing encounter via organization route",
    );

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
  });

  test("Verify organization context when accessing encounter", async ({
    page,
  }) => {
    const { patientId, encounterId } = await setupPatientAndEncounter(
      page,
      organizationId,
    );

    test.skip(!encounterId, "No encounters found for patient");

    // TODO: Currently the UI crashes when accessing encounter via organization route
    // This test will fail until the issue is fixed. Once fixed, remove test.fail()
    test.fail(
      true,
      "Known issue: UI crashes when accessing encounter via organization route",
    );

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
  });
});
