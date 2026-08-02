import { expect, test } from "@playwright/test";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Fill page shell", () => {
  let fillUrl: string;

  test.beforeEach(async ({ page }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    fillUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`;
    await page.goto(fillUrl);
    await expect(
      questionBlock(page, "Is bilateral air entry present?"),
    ).toBeVisible();
  });

  test("fullscreen layout: no app sidebar, outline navigates the canvas", async ({
    page,
  }) => {
    // Fill routes opt out of the app sidebar (fullscreen shell).
    await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);

    // The ≥lg outline lists the questions with the shared tree nav;
    // selecting a row scrolls its block into view.
    const outline = page.getByRole("navigation", { name: "Questions" });
    await expect(outline).toBeVisible();
    await outline.getByRole("button", { name: /FiO2/ }).click();
    await expect(questionBlock(page, "FiO2 (%)")).toBeInViewport();

    // Context header: patient identity band + primary actions.
    await expect(
      page.getByRole("button", { name: "Save Changes" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // Close returns to the encounter updates tab.
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.waitForURL(/\/updates$/);
  });

  test("clinical history tab embeds the patient history sections without leaving the form", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "Patient Clinical History" }).click();

    // The embedded panel carries the shared history sections as pills.
    await expect(page.getByRole("tab", { name: "Responses" })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Past Symptoms" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Allergies" })).toBeVisible();

    // Switching back keeps the form exactly where it was (no navigation).
    await page.getByRole("tab", { name: /Questionnaire/ }).click();
    await expect(
      questionBlock(page, "Is bilateral air entry present?"),
    ).toBeVisible();
    expect(page.url()).toContain("/questionnaire/");
  });
});
