import { expect, test } from "@playwright/test";
import {
  KITCHEN_SINK_FACILITY_SLUG,
  getQuestionnaireIdBySlug,
} from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({
  storageState: "tests/.auth/user.json",
  viewport: { width: 375, height: 812 },
});

/** Mobile smoke against the kitchen-sink fixture — read-only (no saves). */
test.describe("Questionnaire v2 mobile layout", () => {
  test("the list renders cards instead of the table", async ({ page }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/questionnaires`);
    await page
      .getByPlaceholder("Search Questionnaires")
      .fill("E2E Kitchen Sink");

    const card = page.getByRole("button", {
      name: "E2E Kitchen Sink (Facility)",
    });
    await expect(card).toBeVisible();
    await expect(page.locator("table")).not.toBeVisible();

    await card.click();
    await page.waitForURL(/\/settings\/questionnaires\/[0-9a-f-]+$/);
    await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
      "E2E Kitchen Sink (Facility)",
    );
  });

  test("the builder falls back to a Select for question navigation", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const id = await getQuestionnaireIdBySlug(KITCHEN_SINK_FACILITY_SLUG);
    await page.goto(
      `/facility/${facilityId}/settings/questionnaires/${id}/edit`,
    );

    await test.step("The desktop tree nav is hidden, the Select shows", async () => {
      await expect(page.getByRole("navigation")).not.toBeVisible();
      await expect(
        page.getByRole("combobox").filter({ hasText: "Primary symptom" }),
      ).toBeVisible();
    });

    await test.step("Choosing an option selects that question", async () => {
      await page
        .getByRole("combobox")
        .filter({ hasText: "Primary symptom" })
        .click();
      await page
        .getByRole("option", { name: "Is the patient stable?" })
        .click();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue("Is the patient stable?");
    });

    await test.step("The mobile add button is the phone's one add path", async () => {
      // Outline (with its add affordances) is hidden below md and the
      // canvas append zones only exist at lg — this button is it.
      await page.getByRole("button", { name: "Add new question" }).click();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue("");
      await expect(
        page.getByRole("combobox").filter({ hasText: "Untitled Question" }),
      ).toBeVisible();
    });
  });
});
