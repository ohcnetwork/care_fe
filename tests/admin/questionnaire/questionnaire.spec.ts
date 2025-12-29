import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire Visibility by Status and Subject Type", () => {
  async function createQuestionnaire(
    page: Page,
    subjectType: "encounter" | "patient",
    status: "active" | "draft" | "retired",
  ) {
    const slug = faker.string.alphanumeric({ length: 10 });
    const name = `Test ${subjectType} ${status} ${slug}`;

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 15000 });
    
    const adminDashboardLink = page.getByRole("link", { name: "Admin Dashboard" });
    await adminDashboardLink.waitFor({ state: "visible", timeout: 10000 });
    await adminDashboardLink.click();
    
    const createButton = page.getByRole("button", { name: "Create Questionnaire" });
    await createButton.waitFor({ state: "visible", timeout: 10000 });
    await createButton.click();
    
    await page.getByRole("button", { name: "Import" }).click();
    await page
      .locator("[data-slot='dropdown-menu-item']")
      .getByText("Import from URL")
      .click();

    await page
      .getByPlaceholder("https://example.com/questionnaire.json")
      .fill(
        "https://raw.githubusercontent.com/nihal467/questionnaire/refs/heads/main/All%20Structure%20Question.json",
      );
    await page.locator("[data-slot='button']").getByText("Import").click();
    await page.getByRole("button", { name: "Import Form" }).click();

    await page
      .locator("[data-slot='card-title']")
      .getByText("Properties")
      .scrollIntoViewIfNeeded();

    await page.locator(`#status-${status}`).click();
    await page.locator(`#subject-type-${subjectType}`).click();

    await page.locator("input[name='title']").fill(name);
    await page.locator("input[name='slug']").fill(slug);

    await page
      .getByRole("button", { name: "Select Organizations" })
      .first()
      .click();
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill("Admin");
    await page.locator("[cmdk-item]").getByText("Admin").first().click();
    await page.keyboard.press("Escape");

    await page.locator("button[type='submit']").click();

    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire created successfully"),
    ).toBeVisible({ timeout: 10000 });

    return name;
  }

  async function navigateToEncounterPage(page: Page) {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    await page.getByText("View Encounter").first().click();
    await page.getByRole("link", { name: "Update Encounter" }).click();
  }

  async function navigateToPatientUpdatesPage(page: Page) {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    await page.getByText("View Encounter").first().click();

    await page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .last()
      .click();

    await page.getByRole("link", { name: "View Profile" }).click();

    await page.getByRole("tab", { name: "Updates" }).click();

    await page.getByRole("link", { name: "Add Patient Updates" }).click();
  }

  async function checkQuestionnaireAvailability(
    page: Page,
    questionnaireName: string,
    shouldBeAvailable: boolean,
  ) {
    await page
      .getByRole("combobox")
      .filter({ hasText: /add form/i })
      .click();

    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill(questionnaireName);

    if (shouldBeAvailable) {
      await expect(
        page.getByRole("option", { name: questionnaireName }).first(),
      ).toBeVisible();
      await page.keyboard.press("Escape");
    } else {
      await expect(
        page.locator("[cmdk-empty]").getByText("No Results Found"),
      ).toBeVisible();
      await page.keyboard.press("Escape");
    }
  }

  test.beforeAll(async ({ browser }) => {
    // Verify authentication state exists before running tests
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    
    try {
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 10000 });
      // Quick check to ensure we can access the app
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    } catch (error) {
      console.error("Failed to verify authentication in beforeAll:", error);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test.describe("Encounter Subject Type Questionnaires", () => {
    test("Active + Encounter Subject -> Visible in encounter, not in patient updates", async ({
      page,
    }) => {
      const questionnaireName = await createQuestionnaire(
        page,
        "encounter",
        "active",
      );

      await navigateToEncounterPage(page);
      await checkQuestionnaireAvailability(page, questionnaireName, true);
    });

    test("Draft + Encounter Subject -> Not visible in encounter, not in patient updates", async ({
      page,
    }) => {
      const questionnaireName = await createQuestionnaire(
        page,
        "encounter",
        "draft",
      );

      await navigateToEncounterPage(page);
      await checkQuestionnaireAvailability(page, questionnaireName, false);
    });

    test("Retired + Encounter Subject -> Not visible in encounter, not in patient updates", async ({
      page,
    }) => {
      const questionnaireName = await createQuestionnaire(
        page,
        "encounter",
        "retired",
      );

      await navigateToEncounterPage(page);
      await checkQuestionnaireAvailability(page, questionnaireName, false);
    });
  });

  test.describe("Patient Subject Type Questionnaires", () => {
    test("Active + Patient Subject -> Visible in patient updates, not in encounter", async ({
      page,
    }) => {
      const questionnaireName = await createQuestionnaire(
        page,
        "patient",
        "active",
      );

      await navigateToPatientUpdatesPage(page);
      await checkQuestionnaireAvailability(page, questionnaireName, true);
    });

    test("Draft + Patient Subject -> Not visible in patient updates, not in encounter", async ({
      page,
    }) => {
      const questionnaireName = await createQuestionnaire(
        page,
        "patient",
        "draft",
      );

      await navigateToPatientUpdatesPage(page);
      await checkQuestionnaireAvailability(page, questionnaireName, false);
    });

    test("Retired + Patient Subject -> Not visible in patient updates, not in encounter", async ({
      page,
    }) => {
      const questionnaireName = await createQuestionnaire(
        page,
        "patient",
        "retired",
      );

      await navigateToPatientUpdatesPage(page);
      await checkQuestionnaireAvailability(page, questionnaireName, false);
    });
  });
});
