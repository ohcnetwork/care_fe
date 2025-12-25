import { expect, test } from "@playwright/test";

test.describe("Questionnaire Duplicate Checks", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route("**/api/v1/auth/login/", async (route) => {
      await route.fulfill({ status: 200, json: { token: "mock-token" } });
    });
    await page.context().addCookies([
      {
        name: "jwtToken",
        value: "mock-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Mock User
    await page.route("**/api/v1/users/getcurrentuser/", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 1,
          username: "testuser",
          user_type: "Doctor",
        },
      });
    });

    // Mock Patient
    await page.route("**/api/v1/patient/preview_patient_id/", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: "preview_patient_id",
          name: "Test Patient",
          gender: 1,
          year_of_birth: 1990,
        },
      });
    });

    // Mock Encounter
    await page.route(
      "**/api/v1/encounter/preview_encounter_id/",
      async (route) => {
        await route.fulfill({
          status: 200,
          json: {
            id: "preview_encounter_id",
            status: "in_progress",
            encounter_class: "imp",
            patient: { id: "preview_patient_id" },
          },
        });
      },
    );

    // Mock Questionnaire Submission
    await page.route("**/api/v1/questionnaire/submission/", async (route) => {
      await route.fulfill({
        status: 200,
        json: { results: [] },
      });
    });

    // Mock ValueSets for selectors
    await page.route("**/api/v1/valueset/**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          results: [
            {
              code: "code1",
              display: "Test Condition 1",
              system: "http://snomed.info/sct",
            },
            {
              code: "code2",
              display: "Test Condition 2",
              system: "http://snomed.info/sct",
            },
          ],
        },
      });
    });

    // Mock Empty Lists initially
    await page.route("**/api/v1/patient/*/allergy_intolerance/**", (route) =>
      route.fulfill({ json: { results: [] } }),
    );
    await page.route("**/api/v1/patient/*/diagnosis/**", (route) =>
      route.fulfill({ json: { results: [] } }),
    );
    await page.route("**/api/v1/patient/*/symptom/**", (route) =>
      route.fulfill({ json: { results: [] } }),
    );

    await page.goto(
      "/facility/preview_facility_id/patient/preview_patient_id/encounter/preview_encounter_id/questionnaire/preview_questionnaire_id",
    );
  });

  test("should prevent duplicate allergies unless resolved", async ({
    page,
  }) => {
    // Mock the questionnaire response to already have an allergy
    await page.evaluate((_allergy) => {
      // Simulate existing data if possible, or we just add one then try adding again
    }, {}); // Passing an empty object as existingAllergy is no longer used

    // Since we can't easily inject state into the React component from here without complex mocking of the response prop,
    // we will simulate user interaction to add the same allergy twice.

    // 1. Add first allergy
    await page.getByText("Add Allergy", { exact: false }).click();
    await page.getByPlaceholder("Search").fill("Test");
    await page.getByText("Test Condition 1").click(); // leveraging the valueset mock
    // Wait for it to be added
    await expect(page.getByText("Test Condition 1")).toBeVisible();

    // 2. Try to add the same allergy again
    await page.getByText("Add Allergy", { exact: false }).click();
    await page.getByPlaceholder("Search").fill("Test");
    await page.getByText("Test Condition 1").click();

    // Expect warning toast
    await expect(page.getByText("Allergy already exists!")).toBeVisible();
    await page
      .getByLabel("Close")
      .first()
      .click({ timeout: 5000 })
      .catch(() => {}); // Close drawer/dialog if open

    // 3. Mark the existing allergy as resolved
    await page.getByRole("button", { name: "Mark Resolved" }).first().click(); // Assuming there is a button/menu item for this directly or via menu
    // If it's in a menu:
    // await page.getByRole("button", { name: "Actions" }).click();
    // await page.getByText("Mark Resolved").click();

    // 4. Try to add it again - should succeed now
    await page.getByText("Add Allergy", { exact: false }).click();
    await page.getByPlaceholder("Search").fill("Test");
    await page.getByText("Test Condition 1").click();

    // Expect two instances now (or at least no warning) and 1 resolved, 1 active
    await expect(page.getByText("Test Condition 1")).toHaveCount(2);
  });

  test("should prevent duplicate diagnoses unless resolved", async ({
    page,
  }) => {
    // 1. Add first diagnosis
    await page.getByText("Add Diagnosis", { exact: false }).click();
    await page.getByPlaceholder("Search").fill("Test");
    await page.getByText("Test Condition 1").click();
    await expect(page.getByText("Test Condition 1")).toBeVisible();

    // 2. Try to add again
    await page.getByText("Add Diagnosis", { exact: false }).click();
    await page.getByPlaceholder("Search").fill("Test");
    await page.getByText("Test Condition 1").click();
    await expect(page.getByText("Diagnosis already exists!")).toBeVisible();

    // 3. Resolve existing
    // Need to find how to resolve. Diagnosis has a status dropdown.
    // Actually DiagnosisQuestion uses our custom Select component which might be hard to select by standard html select.
    // It renders as a Trigger.
    // Let's assume there is a way to change status.
    // Based on code: <ClinicalStatusSelect ... /> -> SelectTrigger -> SelectContent

    // Find the status selector for the first row
    // It should currently say "Active"
    await page.getByText("Active").first().click();
    await page.getByText("Resolved").click();

    // 4. Try add again
    await page.getByText("Add Diagnosis", { exact: false }).click();
    await page.getByPlaceholder("Search").fill("Test");
    await page.getByText("Test Condition 1").click();

    // Should succeed
    await expect(page.getByText("Test Condition 1")).toHaveCount(2);
  });

  test("should prevent duplicate symptoms unless resolved", async ({
    page,
  }) => {
    // 1. Add first symptom
    await page.getByText("Add Symptom", { exact: false }).click();
    await page.getByPlaceholder("Search").fill("Test");
    await page.getByText("Test Condition 1").click();
    await expect(page.getByText("Test Condition 1")).toBeVisible();

    // 2. Try to add again
    await page.getByText("Add Symptom", { exact: false }).click();
    await page.getByPlaceholder("Search").fill("Test");
    await page.getByText("Test Condition 1").click();
    await expect(page.getByText("Symptom already exists!")).toBeVisible();

    // 3. Resolve existing
    await page.getByText("Active").first().click();
    await page.getByText("Resolved").click();

    // 4. Try add again
    await page.getByText("Add Symptom", { exact: false }).click();
    await page.getByPlaceholder("Search").fill("Test");
    await page.getByText("Test Condition 1").click();

    // Should succeed
    await expect(page.getByText("Test Condition 1")).toHaveCount(2);
  });
});
