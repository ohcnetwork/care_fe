import { expect, test } from "@playwright/test";
import {
  VERSIONED_SLUG,
  getQuestionnaireIdBySlug,
} from "tests/helper/questionnaireV2";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Versions-tab depth via the e2e-versioned backend fixture: internal
 * revision 3 with two archived revisions (v2 "Observation note (v2)" and v1
 * "(v1)"). Read-only — the fixture is never mutated.
 */
test.describe("Questionnaire v2 versions depth (e2e-versioned fixture)", () => {
  test("both archived revisions open read-only with their own content", async ({
    page,
  }) => {
    const id = await getQuestionnaireIdBySlug(VERSIONED_SLUG);
    await page.goto(`/admin/questionnaires/${id}`);

    await test.step("Open the Versions tab", async () => {
      await page.getByRole("tab", { name: "Versions" }).click();
      await expect(
        page.getByRole("heading", { name: "Version history" }),
      ).toBeVisible();
    });

    // "v3" also renders in the sticky header's revision badge — scope the
    // timeline assertions to the Versions tabpanel.
    const panel = page.getByRole("tabpanel");

    await test.step("Current revision card shows v3 with Continue Editing", async () => {
      await expect(panel.getByText("v3", { exact: true })).toBeVisible();
      await expect(
        panel.getByRole("button", { name: "Continue Editing" }),
      ).toBeVisible();
    });

    await test.step("Two archived revisions are listed, newest first", async () => {
      await expect(panel.getByRole("button", { name: "Open" })).toHaveCount(2);
      await expect(panel.getByText("v2", { exact: true })).toBeVisible();
      await expect(panel.getByText("v1", { exact: true })).toBeVisible();
    });

    await test.step("Revision 2 opens as a full-page read-only viewer", async () => {
      await panel.getByRole("button", { name: "Open" }).first().click();
      await page.waitForURL(/\/versions\/[0-9a-f-]+$/);
      await expect(page.getByText("Past revision")).toBeVisible();
      await expect(page.getByText("Observation note (v2)")).toBeVisible();
      // Readonly renderer: the input is disabled, not just display-only.
      await expect(page.getByPlaceholder("Enter details")).toBeDisabled();
    });

    await test.step("Back returns to the Versions tab", async () => {
      await page.getByRole("button", { name: "Back" }).click();
      await page.waitForURL(/\?tab=versions$/);
      await expect(page.getByRole("tab", { name: "Versions" })).toHaveAttribute(
        "data-state",
        "active",
      );
      await expect(
        page.getByRole("heading", { name: "Version history" }),
      ).toBeVisible();
    });

    await test.step("Revision 1 shows the older snapshot full-page", async () => {
      await page
        .getByRole("tabpanel")
        .getByRole("button", { name: "Open" })
        .last()
        .click();
      await page.waitForURL(/\/versions\/[0-9a-f-]+$/);
      await expect(page.getByText("Observation note (v1)")).toBeVisible();
      await expect(page.getByPlaceholder("Enter details")).toBeDisabled();
    });
  });
});
