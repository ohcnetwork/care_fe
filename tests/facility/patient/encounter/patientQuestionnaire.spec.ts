import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("All combination of questionnaire submissions", () => {
  test("Verify the allergy questionnaire are only accessible in encounter", async ({
    page,
  }) => {
    // Create a questionnaire with encounter subject type for allergy testing
    const slugName = faker.string.alphanumeric({ length: 10 });
    const questionnaireName = faker.string.alpha({ length: 10 });
    const allergyOptions = [
      "Fezolinetant",
      "Anifrolumab",
      "Live attenuated virus antigen",
      "Isomaltose",
      "Cetrimonium bromide",
      "Benzenesulfonic acid",
      "Inclisiran",
      "Purified water",
      "Olipudase alfa",
    ];
    const allergyName = faker.helpers.arrayElement(allergyOptions);

    // Navigate to admin dashboard and create questionnaire
    await page.goto("/");
    await page.getByRole("link", { name: "Admin Dashboard" }).click();
    await page.getByRole("button", { name: "Create Questionnaire" }).click();
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

    // Configure questionnaire properties for encounter subject type
    await page
      .locator("[data-slot='card-title']")
      .getByText("Properties")
      .scrollIntoViewIfNeeded();

    await page.locator("#status-active").click();
    await page.locator("#subject-type-encounter").click(); // This makes it encounter-specific

    await page.locator("input[name='title']").fill(questionnaireName);
    await page.locator("input[name='slug']").fill(slugName);

    // Assign questionnaire to Doctor organization
    await page
      .getByRole("button", { name: "Select Organizations" })
      .first()
      .click();
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill("Doctor");
    await page.locator("[cmdk-item]").getByText("Doctor").first().click();
    await page.keyboard.press("Escape");

    await page.locator("button[type='submit']").click();

    // Wait for success notification
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire created successfully"),
    ).toBeVisible({ timeout: 10000 });

    // Logout and switch to doctor user to test encounter questionnaire
    await page.locator("[data-slot='avatar']").click();
    await page
      .locator("[data-slot='dropdown-menu-item']")
      .getByText("Log Out")
      .click();

    // Login as doctor
    await page.goto("/login");
    await page.getByRole("textbox", { name: /username/i }).fill("doctor");
    await page.getByLabel(/password/i).fill("doctor");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

    // Test questionnaire access within an active encounter
    await page.goto("/");

    // Navigate to first facility
    await page.getByRole("button", { name: /select facility/i }).click();
    await page.getByRole("link").first().click();

    // Navigate to encounters
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    // Open first encounter
    await page.getByText("View Encounter").first().click();

    // Navigate to update encounter and add forms
    await page.getByRole("link", { name: "Update Encounter" }).click();

    // Add the questionnaire
    await page
      .getByRole("combobox")
      .filter({ hasText: /add form/i })
      .click();
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill(questionnaireName);
    await page.getByRole("option", { name: questionnaireName }).first().click();

    // Add allergy information to the questionnaire
    await page.getByRole("button", { name: "Allergy" }).click();
    await page
      .getByPlaceholder(/Add Allergy|Add another Allergy/i)
      .first()
      .fill(allergyName);
    await page.locator("[cmdk-item]").getByText(allergyName).click();
    await page.getByRole("button", { name: "Done" }).click();

    // Submit the questionnaire and verify success
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire submitted successfully"),
    ).toBeVisible({ timeout: 10000 });

    // Verify the allergy information appears in the patient overview
    await expect(
      page.locator("[data-slot='collapsible']").getByText("Allergies"),
    ).toBeVisible();
    await expect(
      page.locator("[data-slot='collapsible']").getByText(allergyName),
    ).toBeVisible();
    await expect(
      page.locator("[data-slot='collapsible']").getByText("Active"),
    ).toBeVisible();
  });

  test("Verify the non-supported questionnaire are not accessible in patient update", async ({
    page,
  }) => {
    // Create a questionnaire with patient subject type to test restrictions
    const slugName = faker.string.alphanumeric({ length: 10 });
    const questionnaireName = faker.string.alpha({ length: 10 });

    // Navigate to admin dashboard and create questionnaire
    await page.goto("/");
    await page.getByRole("link", { name: "Admin Dashboard" }).click();
    await page.getByRole("button", { name: "Create Questionnaire" }).click();
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

    // Configure questionnaire properties for patient subject type
    await page
      .locator("[data-slot='card-title']")
      .getByText("Properties")
      .scrollIntoViewIfNeeded();

    await page.locator("#status-active").click();
    await page.locator("#subject-type-patient").click(); // This makes it patient-specific

    await page.locator("input[name='title']").fill(questionnaireName);
    await page.locator("input[name='slug']").fill(slugName);

    // Assign questionnaire to Doctor organization
    await page
      .getByRole("button", { name: "Select Organizations" })
      .first()
      .click();
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill("Doctor");
    await page.locator("[cmdk-item]").getByText("Doctor").first().click();
    await page.keyboard.press("Escape");

    await page.locator("button[type='submit']").click();

    // Wait for success notification
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire created successfully"),
    ).toBeVisible({ timeout: 10000 });

    // Logout and switch to doctor user to test questionnaire access
    await page.locator("[data-slot='avatar']").click();
    await page
      .locator("[data-slot='dropdown-menu-item']")
      .getByText("Log Out")
      .click();

    // Login as doctor
    await page.goto("/login");
    await page.getByRole("textbox", { name: /username/i }).fill("doctor");
    await page.getByLabel(/password/i).fill("doctor");
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

    // Test questionnaire access as doctor user
    await page.goto("/");

    // Navigate to first facility
    await page.getByRole("button", { name: /select facility/i }).click();
    await page.getByRole("link").first().click();

    // Navigate to encounters
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
    );

    // Open first encounter
    await page.getByText("View Encounter").first().click();

    // Navigate to patient profile
    await page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .last()
      .click();
    await page.getByRole("link", { name: "View Profile" }).click();

    // Go to updates tab
    await page.getByRole("tab", { name: "Updates" }).click();
    await page.getByRole("link", { name: "Add Patient Updates" }).click();

    // Try to add the questionnaire
    await page.getByRole("button", { name: "Add Forms" }).click();
    await page
      .getByRole("combobox")
      .filter({ hasText: /add form/i })
      .click();
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill(questionnaireName);
    await page.getByRole("option", { name: questionnaireName }).first().click();

    // Verify that patient-specific questionnaires show appropriate error messages
    // when accessed outside of an active encounter
    const cardContent = page.locator("[data-slot='card-content']");
    await expect(
      cardContent.getByText(
        "Allergy Intolerances cannot be recorded without an active encounter",
      ),
    ).toBeVisible();
    await expect(
      cardContent.getByText(
        "Medication requests cannot be recorded without an active encounter",
      ),
    ).toBeVisible();
    await expect(
      cardContent.getByText(
        "Medication statements cannot be recorded without an active encounter",
      ),
    ).toBeVisible();
    await expect(
      cardContent.getByText(
        "Symptoms cannot be recorded without an active encounter",
      ),
    ).toBeVisible();
    await expect(
      cardContent.getByText(
        "Diagnosis cannot be recorded without an active encounter",
      ),
    ).toBeVisible();
    await expect(
      cardContent.getByText("Create an encounter first to upload files"),
    ).toBeVisible();
  });
});

test.describe("Patient Encounter Questionnaire", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Create a new ABG questionnaire and verify the values", async ({
    page,
  }) => {
    // Test data for respiratory support questionnaire
    const respiratorySupportValues = {
      "etco2-(mmhg)": "120",
    };

    // Navigate to first facility
    await page.getByRole("button", { name: /select facility/i }).click();
    await page.getByRole("link").first().click();

    // Navigate to encounters with in-progress filter
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    // Open first encounter
    await page.getByText("View Encounter").first().click();

    // Navigate to update encounter
    await page.getByRole("link", { name: "Update Encounter" }).click();

    // Add Respiratory Support questionnaire
    await page
      .getByRole("combobox")
      .filter({ hasText: /add form/i })
      .click();
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill("Respiratory Support");
    await page
      .getByRole("option", { name: "Respiratory Support" })
      .first()
      .click();

    // Fill the questionnaire
    for (const [field, value] of Object.entries(respiratorySupportValues)) {
      const questionElement = page.locator(`[data-cy="question-${field}"]`);
      await questionElement.waitFor({ state: "visible" });

      // Try to find input or textarea within the question element
      const input = questionElement.locator("input, textarea").first();
      await input.click();
      await input.fill(value);
    }

    // Submit the questionnaire
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire submitted successfully"),
    ).toBeVisible({ timeout: 10000 });

    // Verify the submitted values appear in the overview
    for (const value of Object.values(respiratorySupportValues)) {
      await expect(page.getByText(value)).toBeVisible();
    }
  });

  test("verify the 500 character limit in input field", async ({ page }) => {
    // Generate text exceeding the 500 character limit to test validation
    const characterMaxLimit = faker.string.alpha(510); // Exceeds the 500 character limit

    // Navigate to first facility
    await page.getByRole("button", { name: /select facility/i }).click();
    await page.getByRole("link").first().click();

    // Navigate to encounters with in-progress filter
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    // Open first encounter
    await page.getByText("View Encounter").first().click();

    // Navigate to update encounter
    await page.getByRole("link", { name: "Update Encounter" }).click();

    // Add Feedback Form questionnaire
    await page
      .getByRole("combobox")
      .filter({ hasText: /add form/i })
      .click();
    await page.locator("[cmdk-input]").waitFor({ state: "visible" });
    await page.locator("[cmdk-input]").fill("Feedback Form");
    await page.getByRole("option", { name: "Feedback Form" }).first().click();

    // Fill the questionnaire with text exceeding the limit
    const questionElement = page.locator(
      '[data-cy="question-any-suggestions-for-improvement"]',
    );
    await questionElement.waitFor({ state: "visible" });

    const input = questionElement.locator("input, textarea").first();
    await input.click();
    await input.fill(characterMaxLimit);

    // Try to submit the questionnaire
    await page.getByRole("button", { name: "Submit", exact: true }).click();

    // Verify that submission fails with appropriate error message
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Failed to submit questionnaire"),
    ).toBeVisible({ timeout: 10000 });

    // Verify the specific error message for character limit
    await expect(
      page.getByText("Text too long. Max allowed size is 500"),
    ).toBeVisible();
  });
});
