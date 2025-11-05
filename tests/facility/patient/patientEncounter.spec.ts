import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

/**
 * Test data generator for encounter management
 */
function generateEncounterData() {
  return {
    encounterType: "Home Health" as const,
    encounterTypeValue: "hh",
    status: "In Progress" as const,
    statusValue: "in_progress",
    priority: "ASAP" as const,
    priorityValue: "asap",
    updatedStatus: "Discharged" as const,
    updatedStatusValue: "discharged",
    completedStatus: "Completed" as const,
  };
}

test.describe("Patient Encounter Management", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to facility and encounters page
    await page.goto("/");
    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();

    // Open sidebar
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();

    // Navigate to Patients section
    await page.getByRole("button", { name: "Patients", exact: true }).click();
  });

  test("should create encounter through patient home and mark as completed", async ({
    page,
  }) => {
    const encounterData = generateEncounterData();

    await test.step("Navigate to All Encounters", async () => {
      await page.getByRole("link", { name: /all encounters/i }).click();
      await expect(page).toHaveURL(/\/encounters/);
    });

    await test.step("Filter encounters by date range", async () => {
      // Wait for the page to load
      await page.waitForLoadState("networkidle");

      // Click on Filter button if available
      const filterButton = page.getByRole("button", { name: /filter/i });
      if (await filterButton.isVisible()) {
        await filterButton.click();

        // Select date filter option (Last 6 months)
        const dateFilterOption = page.getByRole("menuitem", {
          name: /last 6 months/i,
        });
        if (await dateFilterOption.isVisible()) {
          await dateFilterOption.click();
        }
      }
    });

    await test.step("Open a patient home page from encounter list", async () => {
      // Wait for encounter cards to load
      await page.waitForSelector('[data-cy="encounter-list-cards"]', {
        timeout: 10000,
      });

      // Get the first encounter card's patient link
      const encounterCard = page
        .locator('[data-cy="encounter-list-cards"]')
        .first();
      await expect(encounterCard).toBeVisible();

      // Click on patient home link
      const patientHomeLink = encounterCard.getByRole("link", {
        name: /patient home/i,
      });
      await patientHomeLink.click();

      // Verify we're on the patient home page
      await expect(page).toHaveURL(/\/patient\//);
    });

    await test.step("Create new encounter with Home Health type", async () => {
      // Find and click Create Encounter button
      const createEncounterButton = page.getByRole("button", {
        name: /create encounter/i,
      });
      await createEncounterButton.scrollIntoViewIfNeeded();
      await createEncounterButton.click();

      // Wait for the sheet to open
      await expect(
        page.getByRole("heading", { name: /initiate encounter/i }),
      ).toBeVisible({ timeout: 5000 });

      // Select encounter type: Home Health
      await page
        .locator(
          `[data-cy="encounter-type-${encounterData.encounterTypeValue}"]`,
        )
        .click();

      // Select organization/department (required field)
      const orgCombobox = page.locator('[data-cy="facility-organization"]');
      if (await orgCombobox.isVisible()) {
        await orgCombobox.click();
        // Select first organization option
        const firstOrgOption = page.getByRole("option").first();
        await firstOrgOption.waitFor({ state: "visible", timeout: 5000 });
        await firstOrgOption.click();
      }

      // Submit the encounter creation
      await page
        .locator('[data-cy="create-encounter-button"]')
        .scrollIntoViewIfNeeded();
      await page.locator('[data-cy="create-encounter-button"]').click();

      // Verify success message
      await expect(
        page.getByText(/encounter created successfully/i),
      ).toBeVisible({ timeout: 10000 });

      // Verify we're redirected to encounter page
      await page.waitForURL(/\/encounter\/[^/]+\/updates/, { timeout: 10000 });
    });

    await test.step("Mark encounter as Completed through Actions tab", async () => {
      // Navigate to Actions tab
      await page.getByRole("button", { name: "Actions", exact: true }).click();

      // Wait for tab content to load
      await page.waitForLoadState("networkidle");

      // Click Mark as completed button
      const markCompletedButton = page.getByRole("button", {
        name: /mark as completed/i,
      });
      await markCompletedButton.scrollIntoViewIfNeeded();
      await markCompletedButton.click();

      // Confirm in the dialog
      await page
        .locator('div[data-slot="alert-dialog-footer"]')
        .getByRole("button", { name: /mark as complete/i })
        .click();

      // Verify completion message
      await expect(page.getByText(/encounter complete/i)).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test("should create encounter using patient phone number and year of birth", async ({
    page,
  }) => {
    const encounterData = generateEncounterData();
    let patientPhone: string;
    let patientYearOfBirth: string;

    await test.step("Navigate to All Encounters and extract patient details", async () => {
      await page.getByRole("link", { name: /all encounters/i }).click();
      await expect(page).toHaveURL(/\/encounters/);

      // Wait for encounter cards
      await page.waitForSelector('[data-cy="encounter-list-cards"]', {
        timeout: 10000,
      });

      // Open first encounter's patient profile
      const encounterCard = page
        .locator('[data-cy="encounter-list-cards"]')
        .first();
      await encounterCard.getByRole("link", { name: /patient home/i }).click();

      // Wait for patient page to load
      await page.waitForURL(/\/patient\//);
      await page.waitForLoadState("networkidle");

      // Try to extract phone number from visible elements
      const phoneElement = page.locator('[data-cy="patient-phone-input"]');
      if (await phoneElement.isVisible()) {
        patientPhone = (await phoneElement.inputValue()) || "";
      } else {
        // Alternative: find phone number in patient details
        const phoneText = await page
          .getByText(/phone number:/i)
          .locator("..")
          .textContent();
        const phoneMatch = phoneText?.match(/\d{10}/);
        patientPhone = phoneMatch ? phoneMatch[0] : "9876543210"; // Fallback
      }

      // Extract year of birth
      const dobElement = page.locator('[data-cy="dob-year-input"]');
      if (await dobElement.isVisible()) {
        patientYearOfBirth = (await dobElement.inputValue()) || "";
      } else {
        // Alternative: extract from age display or year of birth text
        const yearElement = page.locator('[data-cy="year-of-birth"]');
        if (await yearElement.isVisible()) {
          const yearText = await yearElement.textContent();
          const yearMatch = yearText?.match(/\d{4}/);
          patientYearOfBirth = yearMatch ? yearMatch[0] : "2000"; // Fallback
        } else {
          // Try to extract from age display
          const ageText = await page
            .getByText(/\d+ Y,/i)
            .first()
            .textContent();
          if (ageText) {
            const ageMatch = ageText.match(/(\d+) Y/);
            if (ageMatch) {
              const age = parseInt(ageMatch[1]);
              const currentYear = new Date().getFullYear();
              patientYearOfBirth = (currentYear - age).toString();
            }
          } else {
            patientYearOfBirth = "2000"; // Fallback
          }
        }
      }
    });

    await test.step("Search for patient using phone number", async () => {
      // Navigate to patient search
      await page.getByRole("link", { name: /search patients/i }).click();

      // Enter phone number in search
      const searchInput = page.getByRole("textbox", {
        name: /search by patient phone number/i,
      });
      await searchInput.fill(patientPhone);

      // Press Enter to search
      await searchInput.press("Enter");

      // Wait for search results
      await page.waitForLoadState("networkidle");

      // Verify year of birth matches (if visible in search results)
      if (patientYearOfBirth && patientYearOfBirth !== "2000") {
        await expect(
          page.getByText(new RegExp(patientYearOfBirth)),
        ).toBeVisible({
          timeout: 5000,
        });
      }

      // Click on the patient from search results
      const patientLink = page
        .getByRole("link", { name: /view patient/i })
        .first();
      if (await patientLink.isVisible()) {
        await patientLink.click();
      } else {
        // Alternative: click on patient name or card
        await page.locator('[data-cy="patient-card"]').first().click();
      }

      await page.waitForURL(/\/patient\//);
    });

    await test.step("Create encounter with specific type, status, and priority", async () => {
      // Click Create Encounter button
      const createEncounterButton = page.getByRole("button", {
        name: /create encounter/i,
      });
      await createEncounterButton.scrollIntoViewIfNeeded();
      await createEncounterButton.click();

      // Wait for sheet to open
      await expect(
        page.getByRole("heading", { name: /initiate encounter/i }),
      ).toBeVisible({ timeout: 5000 });

      // Select encounter type: Home Health
      await page
        .locator(
          `[data-cy="encounter-type-${encounterData.encounterTypeValue}"]`,
        )
        .click();

      // Select status: In Progress
      const statusSelect = page.locator('[data-cy="encounter-status"]');
      await statusSelect.click();
      await page.getByRole("option", { name: encounterData.status }).click();

      // Select priority: ASAP
      const prioritySelect = page.locator('[data-cy="encounter-priority"]');
      await prioritySelect.click();
      await page.getByRole("option", { name: encounterData.priority }).click();

      // Select organization (required)
      const orgCombobox = page.locator('[data-cy="facility-organization"]');
      if (await orgCombobox.isVisible()) {
        await orgCombobox.click();
        const firstOrgOption = page.getByRole("option").first();
        await firstOrgOption.waitFor({ state: "visible", timeout: 5000 });
        await firstOrgOption.click();
      }

      // Submit encounter creation
      await page
        .locator('[data-cy="create-encounter-button"]')
        .scrollIntoViewIfNeeded();
      await page.locator('[data-cy="create-encounter-button"]').click();

      // Verify success message
      await expect(
        page.getByText(/encounter created successfully/i),
      ).toBeVisible({ timeout: 10000 });

      // Verify we're redirected to encounter page
      await expect(page).toHaveURL(/\/encounter\/[^/]+\/updates/);
    });

    await test.step("Verify encounter details", async () => {
      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Verify status badge shows "In Progress"
      const statusBadge = page.locator('[data-cy="encounter-status-badge"]');
      if (await statusBadge.isVisible()) {
        await expect(statusBadge).toContainText(/in progress/i);
      }

      // Verify encounter type is Home Health
      await expect(page.getByText(/home health/i)).toBeVisible();

      // Verify priority is ASAP
      await expect(page.getByText(/asap/i)).toBeVisible();
    });
  });

  test("should edit encounter details and mark as completed", async ({
    page,
  }) => {
    const encounterData = generateEncounterData();

    await test.step("Navigate to encounters and create a new encounter", async () => {
      await page.getByRole("link", { name: /all encounters/i }).click();
      await page.waitForLoadState("networkidle");

      // Filter for in-progress encounters
      const filterButton = page.getByRole("button", { name: /filter/i });
      if (await filterButton.isVisible()) {
        await filterButton.click();
        const statusMenuItem = page.getByRole("menuitem", {
          name: /status/i,
        });
        if (await statusMenuItem.isVisible()) {
          await statusMenuItem.click();
          await page.getByText(/in progress/i).click();
          await page.keyboard.press("Escape");
          await page.waitForLoadState("networkidle");
        }
      }

      // Open first encounter
      await page.waitForSelector('[data-cy="encounter-list-cards"]', {
        timeout: 10000,
      });
      const encounterCard = page
        .locator('[data-cy="encounter-list-cards"]')
        .first();
      await encounterCard
        .getByRole("button", { name: /view encounter/i })
        .click();

      await expect(page).toHaveURL(/\/encounter\/[^/]+\/updates/);
    });

    await test.step("Navigate to Details tab and update encounter status", async () => {
      // Click on Details/Overview tab (should be default, but ensure we're there)
      const detailsTab = page.getByRole("button", {
        name: /updates|overview/i,
      });
      if (await detailsTab.isVisible()) {
        await detailsTab.click();
      }

      // Wait for page load
      await page.waitForLoadState("networkidle");

      // Click Update Encounter button/link
      const updateEncounterLink = page.getByRole("link", {
        name: /update encounter/i,
      });
      if (await updateEncounterLink.isVisible()) {
        await updateEncounterLink.click();
      } else {
        // Alternative: find edit button with pen icon
        const editButton = page
          .getByRole("button")
          .filter({ has: page.locator("svg.lucide-square-pen") });
        await editButton.first().click();
      }

      // Wait for questionnaire/form to load
      await page.waitForLoadState("networkidle");

      // Update status to Discharged
      const statusSelect = page.getByRole("combobox", {
        name: /encounter status/i,
      });
      if (await statusSelect.isVisible()) {
        await statusSelect.click();
        await page
          .getByRole("option", { name: encounterData.updatedStatus })
          .click();
      }

      // Submit the update
      const submitButton = page.getByRole("button", {
        name: /submit|save|update/i,
      });
      await submitButton.scrollIntoViewIfNeeded();
      await submitButton.click();

      // Verify success
      await expect(page.getByText(/success|updated|saved/i)).toBeVisible({
        timeout: 10000,
      });

      // Navigate back to encounter
      await page.waitForURL(/\/encounter\/[^/]+\/updates/);
    });

    await test.step("Navigate to Actions tab and mark encounter as completed", async () => {
      // Click Actions tab
      await page.getByRole("button", { name: "Actions", exact: true }).click();

      // Wait for tab content
      await page.waitForLoadState("networkidle");

      // Click Mark as completed
      const markCompletedButton = page.getByRole("button", {
        name: /mark as completed/i,
      });
      await markCompletedButton.scrollIntoViewIfNeeded();
      await markCompletedButton.click();

      // Confirm in dialog
      await page
        .locator('div[data-slot="alert-dialog-footer"]')
        .getByRole("button", { name: /mark as complete/i })
        .click();

      // Verify completion message
      await expect(page.getByText(/encounter complete/i)).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step("Verify encounter is marked as completed", async () => {
      // Reload or navigate back to check status
      await page.waitForLoadState("networkidle");

      // Check for completed status badge or indicator
      const completedIndicator = page.getByText(/completed/i);
      await expect(completedIndicator).toBeVisible({ timeout: 5000 });
    });
  });

  test("should validate required fields when creating encounter", async ({
    page,
  }) => {
    await test.step("Navigate to patient and attempt to create encounter without required fields", async () => {
      // Navigate to search patients
      await page.getByRole("link", { name: /search patients/i }).click();

      // Search for a patient
      const searchInput = page.getByRole("textbox", {
        name: /search by patient phone number/i,
      });
      await searchInput.fill("9876543210"); // Use a sample number
      await searchInput.press("Enter");
      await page.waitForLoadState("networkidle");

      // Click on first patient result
      const firstPatientLink = page
        .getByRole("link", { name: /view patient/i })
        .first();
      if (await firstPatientLink.isVisible()) {
        await firstPatientLink.click();
      }

      await page.waitForURL(/\/patient\//);
    });

    await test.step("Try to create encounter without selecting required fields", async () => {
      // Open create encounter form
      const createEncounterButton = page.getByRole("button", {
        name: /create encounter/i,
      });
      await createEncounterButton.scrollIntoViewIfNeeded();
      await createEncounterButton.click();

      await expect(
        page.getByRole("heading", { name: /initiate encounter/i }),
      ).toBeVisible();

      // Try to submit without selecting organization (required field)
      const submitButton = page.locator('[data-cy="create-encounter-button"]');

      // The button should be disabled when organization is not selected
      await expect(submitButton).toBeDisabled();
    });
  });

  test("should display encounter information correctly in encounter list", async ({
    page,
  }) => {
    await test.step("Navigate to All Encounters", async () => {
      await page.getByRole("link", { name: /all encounters/i }).click();
      await expect(page).toHaveURL(/\/encounters/);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify encounter cards display correct information", async () => {
      // Wait for encounter cards
      await page.waitForSelector('[data-cy="encounter-list-cards"]', {
        timeout: 10000,
      });

      const firstEncounterCard = page
        .locator('[data-cy="encounter-list-cards"]')
        .first();
      await expect(firstEncounterCard).toBeVisible();

      // Verify card contains key information
      await expect(firstEncounterCard).toContainText(/patient/i);

      // Verify status badge is present
      const statusBadge = firstEncounterCard.locator(
        '[data-cy="encounter-status-badge"]',
      );
      await expect(statusBadge).toBeVisible();

      // Verify View Encounter button is present
      const viewButton = firstEncounterCard.getByRole("button", {
        name: /view encounter/i,
      });
      await expect(viewButton).toBeVisible();

      // Verify patient home link is present
      const patientHomeLink = firstEncounterCard.getByRole("link", {
        name: /patient home/i,
      });
      await expect(patientHomeLink).toBeVisible();
    });
  });

  test("should navigate between encounter tabs correctly", async ({ page }) => {
    await test.step("Open an encounter", async () => {
      await page.getByRole("link", { name: /all encounters/i }).click();
      await page.waitForLoadState("networkidle");

      const encounterCard = page
        .locator('[data-cy="encounter-list-cards"]')
        .first();
      await encounterCard
        .getByRole("button", { name: /view encounter/i })
        .click();

      await expect(page).toHaveURL(/\/encounter\/[^/]+\/updates/);
    });

    await test.step("Navigate through different tabs", async () => {
      // Check Updates tab (default)
      const updatesTab = page.getByRole("button", { name: /updates/i });
      if (await updatesTab.isVisible()) {
        await expect(updatesTab).toHaveAttribute("data-state", "active");
      }

      // Navigate to Plots tab
      const plotsTab = page.getByRole("button", { name: /plots/i });
      if (await plotsTab.isVisible()) {
        await plotsTab.click();
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveURL(/\/encounter\/[^/]+\/plots/);
      }

      // Navigate to Medicines tab
      const medicinesTab = page.getByRole("button", { name: /medicines/i });
      if (await medicinesTab.isVisible()) {
        await medicinesTab.click();
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveURL(/\/encounter\/[^/]+\/medicines/);
      }

      // Navigate to Actions tab
      const actionsTab = page.getByRole("button", { name: /actions/i });
      if (await actionsTab.isVisible()) {
        await actionsTab.click();
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveURL(/\/encounter\/[^/]+\/actions/);
      }

      // Navigate back to Updates
      const backToUpdatesTab = page.getByRole("button", { name: /updates/i });
      if (await backToUpdatesTab.isVisible()) {
        await backToUpdatesTab.click();
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveURL(/\/encounter\/[^/]+\/updates/);
      }
    });
  });
});
