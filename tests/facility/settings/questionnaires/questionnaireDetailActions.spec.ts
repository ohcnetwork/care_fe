import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import fs from "fs";
import {
  KITCHEN_SINK_FACILITY_SLUG,
  createQuestionnaire,
  getQuestionnaireIdBySlug,
  openQuestionBuilder,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 detail page actions", () => {
  test("question overview expands a group's sub-questions", async ({
    page,
  }) => {
    // Read-only use of the kitchen-sink fixture (expand state is client-side).
    const facilityId = getFacilityId();
    const id = await getQuestionnaireIdBySlug(KITCHEN_SINK_FACILITY_SLUG);
    await page.goto(`/facility/${facilityId}/settings/questionnaires/${id}`);

    // The kitchen sink has exactly one top-level group, so exactly one
    // expand toggle renders on the page.
    const toggle = page.getByRole("button", { name: "Toggle sub-questions" });

    await test.step("The group row shows its sub-question count", async () => {
      await expect(page.getByText("2 Sub-questions")).toBeVisible();
      await expect(page.getByText("General appearance")).not.toBeVisible();
    });

    await test.step("Toggling reveals the sub-question titles", async () => {
      await toggle.click();
      await expect(page.getByText("General appearance")).toBeVisible();
      await expect(page.getByText("Cardiovascular")).toBeVisible();
    });

    await test.step("Toggling again collapses them", async () => {
      await toggle.click();
      await expect(page.getByText("General appearance")).not.toBeVisible();
    });
  });

  test("kebab menu reorders top-level questions", async ({ page }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Reorder ${Date.now()}`;
    const first = `First ${faker.word.words(2)} ${Date.now()}`;
    const second = `Second ${faker.word.words(2)} ${Date.now()}`;
    let detailUrl = "";

    await test.step("Create a questionnaire with two imported questions", async () => {
      detailUrl = await createQuestionnaire(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title,
      });
      await openQuestionBuilder(page);
      await page.getByRole("button", { name: "Import Questions" }).click();
      await page.locator('input[type="file"]').setInputFiles({
        name: "reorder.json",
        mimeType: "application/json",
        buffer: Buffer.from(
          JSON.stringify({
            questions: [
              { text: first, type: "string", link_id: "q-first" },
              { text: second, type: "string", link_id: "q-second" },
            ],
          }),
        ),
      });
      await page.getByRole("button", { name: "Import", exact: true }).click();
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      await page.goto(detailUrl);
    });

    const rows = page.locator("div").filter({ hasText: /^1\./ });

    await test.step("Move the first question down via its kebab", async () => {
      await expect(page.getByText(first)).toBeVisible();
      const firstRow = page
        .locator("div")
        .filter({ has: page.getByText(first, { exact: true }) })
        .filter({ has: page.getByRole("button", { name: "More options" }) })
        .last();
      await firstRow.getByRole("button", { name: "More options" }).click();
      await page.getByRole("menuitem", { name: "Move Down" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("The order is persisted after reload", async () => {
      await page.reload();
      await expect(rows.last()).toContainText(second);
      const orderedTitles = page.locator(
        '[data-slot="badge"]:has-text("String")',
      );
      await expect(orderedTitles).toHaveCount(2);
      // Row 1 now holds the previously-second question.
      const firstOrdinalRow = page
        .locator("div.min-w-0.flex-1", { hasText: /^1\./ })
        .first();
      await expect(firstOrdinalRow).toContainText(second);
    });
  });

  test("Download JSON exports the definition without audit fields", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const id = await getQuestionnaireIdBySlug(KITCHEN_SINK_FACILITY_SLUG);
    await page.goto(`/facility/${facilityId}/settings/questionnaires/${id}`);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download JSON" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(
      `${KITCHEN_SINK_FACILITY_SLUG}.json`,
    );
    const filePath = await download.path();
    const exported = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    expect(exported.id).toBe(id);
    expect(exported.slug).toBe(KITCHEN_SINK_FACILITY_SLUG);
    expect(exported.title).toBe("E2E Kitchen Sink (Facility)");
    expect(Array.isArray(exported.questions)).toBe(true);
    expect(exported.questions.length).toBeGreaterThan(0);
    // Audit user objects must never leave the app in an export file.
    expect(exported).not.toHaveProperty("created_by");
    expect(exported).not.toHaveProperty("updated_by");
  });

  test("Preview Form quick action deep-links into preview mode", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const id = await getQuestionnaireIdBySlug(KITCHEN_SINK_FACILITY_SLUG);
    await page.goto(`/facility/${facilityId}/settings/questionnaires/${id}`);

    await page.getByRole("button", { name: "Preview questionnaire" }).click();
    await page.waitForURL(/\/edit\?mode=preview$/);

    // The builder opened straight into the renderer, not the editor.
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByPlaceholder("Enter details")).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Question Title" }),
    ).not.toBeVisible();
  });

  test("status changes from the detail sidebar and persists", async ({
    page,
  }) => {
    const title = `QV2 Status ${Date.now()}`;
    let detailUrl = "";

    await test.step("Create an active questionnaire", async () => {
      detailUrl = await createQuestionnaire(page, {
        basePath: "/admin/questionnaires",
        title,
      });
    });

    const statusGroup = page.getByRole("radiogroup", { name: "Status" });

    await test.step("Switch status to Retired and save", async () => {
      await statusGroup.getByRole("radio", { name: "Retired" }).click();
      await page.getByRole("button", { name: "Save Questionnaire" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("The status survives a reload", async () => {
      await page.goto(detailUrl);
      await expect(
        statusGroup.getByRole("radio", { name: "Retired" }),
      ).toHaveAttribute("aria-checked", "true");
    });
  });
});
