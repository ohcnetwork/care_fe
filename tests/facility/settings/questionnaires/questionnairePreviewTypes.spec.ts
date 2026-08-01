import { expect, test, type Page } from "@playwright/test";
import {
  KITCHEN_SINK_FACILITY_SLUG,
  getQuestionnaireIdBySlug,
} from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * READ-side rendering coverage driven by the deterministic
 * e2e-kitchen-sink-facility backend fixture (one top-level question per
 * simple type) — no UI authoring, only the builder's Preview mode.
 * Nothing here saves, so the fixture is never mutated.
 */

/** Opens the kitchen-sink questionnaire straight into preview mode. */
async function openKitchenSinkPreview(page: Page): Promise<void> {
  const facilityId = getFacilityId();
  const id = await getQuestionnaireIdBySlug(KITCHEN_SINK_FACILITY_SLUG);
  await page.goto(
    `/facility/${facilityId}/settings/questionnaires/${id}/edit?mode=preview`,
  );
  await expect(page.getByRole("navigation")).toBeVisible();
}

/** Jumps to a top-level question via the renderer's tree nav. */
async function jumpTo(page: Page, questionText: string): Promise<void> {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: questionText })
    .click();
}

test.describe("Questionnaire v2 preview input types (kitchen sink fixture)", () => {
  test("string, text and url inputs accept typed values", async ({ page }) => {
    await openKitchenSinkPreview(page);

    await test.step("String question renders a text input", async () => {
      // The question title appears both as the field label and as a tree-nav
      // row — assert the label specifically.
      await expect(
        page.locator("label").filter({ hasText: "Primary symptom" }),
      ).toBeVisible();
      const input = page.getByPlaceholder("Enter details");
      await input.fill("headache");
      await expect(input).toHaveValue("headache");
    });

    await test.step("Text question renders a textarea", async () => {
      await jumpTo(page, "Detailed history");
      const textarea = page.locator("textarea");
      await expect(textarea).toBeVisible();
      await textarea.fill("long history text");
      await expect(textarea).toHaveValue("long history text");
    });

    await test.step("URL question renders a url-typed input", async () => {
      await jumpTo(page, "Reference document URL");
      const urlInput = page.locator('input[type="url"]');
      await expect(urlInput).toBeVisible();
      await urlInput.fill("https://example.com/doc");
      await expect(urlInput).toHaveValue("https://example.com/doc");
    });
  });

  test("decimal and integer inputs are numeric", async ({ page }) => {
    await openKitchenSinkPreview(page);

    await test.step("Decimal question accepts a fractional value", async () => {
      await jumpTo(page, "Body temperature (C)");
      const input = page.getByRole("spinbutton");
      await expect(input).toHaveAttribute("inputmode", "decimal");
      await input.fill("37.5");
      await expect(input).toHaveValue("37.5");
    });

    await test.step("Integer question uses numeric input mode", async () => {
      await jumpTo(page, "Pain score (0-10)");
      const input = page.getByRole("spinbutton");
      await expect(input).toHaveAttribute("inputmode", "numeric");
      await input.fill("7");
      await expect(input).toHaveValue("7");
    });
  });

  test("date, dateTime and time questions render their pickers", async ({
    page,
  }) => {
    await openKitchenSinkPreview(page);

    await test.step("Date question: picking a day fills the trigger", async () => {
      await jumpTo(page, "Symptom onset date");
      const trigger = page.getByRole("button", { name: "Pick a date" });
      await expect(trigger).toBeVisible();
      await trigger.click();
      await page
        .locator('[role="gridcell"]:not([data-outside]) button')
        .first()
        .click();
      await expect(
        page.getByRole("button", { name: "Pick a date" }),
      ).not.toBeVisible();
    });

    await test.step("DateTime question: time input unlocks after picking a date", async () => {
      await jumpTo(page, "Admission timestamp");
      const timeInput = page.locator('input[type="time"]');
      await expect(timeInput).toBeDisabled();
      await page.getByRole("button", { name: "Pick a date" }).click();
      await page
        .locator('[role="gridcell"]:not([data-outside]) button')
        .first()
        .click();
      await expect(timeInput).toBeEnabled();
      await timeInput.fill("14:30");
      await expect(timeInput).toHaveValue("14:30");
    });

    await test.step("Time question renders a time input", async () => {
      await jumpTo(page, "Last medication time");
      const timeInput = page.locator('input[type="time"]');
      await timeInput.fill("08:15");
      await expect(timeInput).toHaveValue("08:15");
    });
  });

  test("quantity question renders a value input", async ({ page }) => {
    await openKitchenSinkPreview(page);
    await jumpTo(page, "Dose administered");

    await expect(page.getByText("Value", { exact: true })).toBeVisible();
    const input = page.getByRole("spinbutton");
    await input.fill("250");
    await expect(input).toHaveValue("250");
  });

  test("boolean question renders Yes/No radio chips", async ({ page }) => {
    await openKitchenSinkPreview(page);
    await jumpTo(page, "Is the patient stable?");

    const yes = page.getByRole("radio", { name: "Yes", exact: true });
    const no = page.getByRole("radio", { name: "No", exact: true });
    await yes.click();
    await expect(yes).toHaveAttribute("aria-checked", "true");
    await no.click();
    await expect(no).toHaveAttribute("aria-checked", "true");
    await expect(yes).toHaveAttribute("aria-checked", "false");
  });

  test("notes affordance stores a note and shows the amber dot", async ({
    page,
  }) => {
    await openKitchenSinkPreview(page);

    const noteButton = page.getByRole("button", { name: "Add note" });
    const noteDot = noteButton.locator("span.bg-amber-500");

    await test.step("No dot before a note is written", async () => {
      await expect(noteButton).toBeVisible();
      await expect(noteDot).not.toBeVisible();
    });

    await test.step("Writing a note shows the amber dot", async () => {
      await noteButton.click();
      const noteBox = page.getByPlaceholder("Add note");
      await noteBox.fill("needs follow-up");
      await page.keyboard.press("Escape");
      await expect(noteBox).not.toBeVisible();
      await expect(noteDot).toBeVisible();
    });

    await test.step("Reopening shows the saved note text", async () => {
      await noteButton.click();
      await expect(page.getByPlaceholder("Add note")).toHaveValue(
        "needs follow-up",
      );
    });
  });

  test("nested groups render the two-column layout preset and sub-questions", async ({
    page,
  }) => {
    await openKitchenSinkPreview(page);
    await jumpTo(page, "Examination findings");

    await test.step("Top-level group card with Group badge", async () => {
      await expect(
        page.getByRole("heading", { name: "Examination findings" }),
      ).toBeVisible();
      await expect(page.getByText("Group", { exact: true })).toBeVisible();
    });

    await test.step("containerClasses layout preset is applied", async () => {
      // Fixture styling_metadata.containerClasses = "grid grid-cols-2".
      await expect(
        page.locator('fieldset[class*="grid-cols-2"]'),
      ).toBeVisible();
    });

    await test.step("Direct child and nested group both render", async () => {
      // Titles double as tree-nav rows — assert the field labels/headings.
      await expect(
        page.locator("label").filter({ hasText: "General appearance" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Cardiovascular" }),
      ).toBeVisible();
      await expect(
        page.locator("label").filter({ hasText: "Heart sounds" }),
      ).toBeVisible();
    });

    await test.step("Nested children show dotted ordinals from the tree", async () => {
      // The nav lists the group's children indented beneath it.
      const nav = page.getByRole("navigation");
      await expect(
        nav.getByRole("button", { name: "General appearance" }),
      ).toBeVisible();
    });
  });
});
