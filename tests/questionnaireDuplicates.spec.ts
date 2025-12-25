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
    // Mock Mutation endpoints (POST/PUT)
    await page.route(
      "**/api/v1/patient/*/allergy_intolerance/**",
      async (route) => {
        if (route.request().method() !== "GET") {
          await route.fulfill({ status: 200, json: {} });
        } else {
          await route.fulfill({ json: { results: [] } });
        }
      },
    );
    await page.route("**/api/v1/patient/*/diagnosis/**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fulfill({ status: 200, json: {} });
      } else {
        await route.fulfill({ json: { results: [] } });
      }
    });
    await page.route("**/api/v1/patient/*/symptom/**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fulfill({ status: 200, json: {} });
      } else {
        await route.fulfill({ json: { results: [] } });
      }
    });

    await page.goto(
      "/facility/preview_facility_id/patient/preview_patient_id/encounter/preview_encounter_id/questionnaire/preview_questionnaire_id",
    );
  });

  const testDuplicateCheck = async (page: any, type: string, label: string) => {
    const addText = `Add ${label}`;
    const alreadyExistsText = `${label} already exists!`;

    // 1. Add first item
    await page.getByText(addText, { exact: false }).click();
    await page.getByPlaceholder("Search").fill("Test");
    await page.getByText("Test Condition 1").click(); // leveraging the valueset mock
    await expect(page.getByText("Test Condition 1")).toBeVisible();

    // 2. Try to add the same item again
    await page.getByText(addText, { exact: false }).click();
    await page.getByPlaceholder("Search").fill("Test");
    await page.getByText("Test Condition 1").click();

    // Expect warning toast
    await expect(page.getByText(alreadyExistsText)).toBeVisible();

    // Close any dialogs if present (without swallowing potential errors indiscriminately)
    const closeButton = page.getByLabel("Close").first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // 3. Mark the existing item as resolved
    // For Allergy, it might be a button. For others, it's a status dropdown.
    if (type === "Allergy") {
      await page.getByRole("button", { name: "Mark Resolved" }).first().click();
    } else {
      await page.getByText("Active").first().click();
      await page.getByText("Resolved").click();
    }

    // Verify status changed to Resolved
    if (type !== "Allergy") {
      await expect(page.getByText("Resolved").first()).toBeVisible();
    }

    // 4. Try to add it again - should succeed now
    await page.getByText(addText, { exact: false }).click();
    await page.getByPlaceholder("Search").fill("Test");
    await page.getByText("Test Condition 1").click();

    // Expect two instances now
    await expect(page.getByText("Test Condition 1")).toHaveCount(2);
  };

  test("should prevent duplicate allergies unless resolved", async ({
    page,
  }) => {
    await testDuplicateCheck(page, "Allergy", "Allergy");
  });

  test("should prevent duplicate diagnoses unless resolved", async ({
    page,
  }) => {
    await testDuplicateCheck(page, "Diagnosis", "Diagnosis");
  });

  test("should prevent duplicate symptoms unless resolved", async ({
    page,
  }) => {
    await testDuplicateCheck(page, "Symptom", "Symptom");
  });
});
