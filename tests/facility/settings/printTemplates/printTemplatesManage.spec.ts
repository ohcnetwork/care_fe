import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { expectAndDismissToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

import type { FacilityRead } from "@/types/facility/facility";

// Only these documents' templates are changed: no other spec prints them, so
// the templates can't leak into their printouts.
const DOCUMENT = "Medication Return";
const OTHER_DOCUMENT = "Request Order";
const SAVED_TOAST = "Print templates updated successfully";

function waitForFacilityUpdate(page: Page, facilityId: string) {
  return page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/v1/facility/${facilityId}/`) &&
      response.request().method() === "PUT",
  );
}

test.describe("Print templates", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/general`);
    await page
      .getByRole("link", { name: "Print Templates", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Print Templates", level: 1 }),
    ).toBeVisible();
  });

  test("customizes, edits and resets a document template", async ({ page }) => {
    const watermark = faker.word.noun().toUpperCase();
    const row = page.getByRole("listitem", { name: DOCUMENT, exact: true });
    const editor = page.getByRole("dialog", {
      name: `${DOCUMENT} Template`,
      exact: true,
    });
    const save = editor.getByRole("button", { name: "Save", exact: true });

    await test.step("Customize the document's page and watermark", async () => {
      await row
        .getByRole("button", { name: `Customize ${DOCUMENT} template` })
        .click();
      await editor.getByLabel("Page Size").click();
      await page.getByRole("option", { name: "A5", exact: true }).click();
      await editor.getByLabel("Orientation").click();
      await page
        .getByRole("option", { name: "Landscape", exact: true })
        .click();
      await editor.getByLabel("Top").fill("12");
      await editor.getByRole("switch", { name: "Enable Watermark" }).click();
      await editor.getByLabel("Watermark Text").fill(watermark);
      await editor.getByLabel("Opacity (0–1)").fill("0.2");

      const response = waitForFacilityUpdate(page, facilityId);
      await save.click();
      expect((await response).status()).toBe(200);
      await expectAndDismissToast(page, SAVED_TOAST);
      await expect(editor).toBeHidden();
      await expect(row.getByText("Custom", { exact: true })).toBeVisible();
      await expect(row).toContainText("A5 · Landscape · Custom Margins");
      await expect(row).toContainText("Watermark");
    });

    await test.step("Prefill the saved settings after a reload", async () => {
      await page.reload();
      await row
        .getByRole("button", { name: `Edit ${DOCUMENT} template` })
        .click();
      await expect(editor.getByLabel("Page Size")).toHaveText("A5");
      await expect(editor.getByLabel("Orientation")).toHaveText("Landscape");
      // Blank sides were saved with the default margin.
      for (const [side, value] of [
        ["Top", "12"],
        ["Right", "10"],
        ["Bottom", "10"],
        ["Left", "10"],
      ]) {
        await expect(editor.getByLabel(side)).toHaveValue(value);
      }
      await expect(editor.getByLabel("Watermark Text")).toHaveValue(watermark);
      await expect(editor.getByLabel("Opacity (0–1)")).toHaveValue("0.2");
      await expect(save).toBeDisabled();
    });

    await test.step("Change one margin", async () => {
      await editor.getByLabel("Bottom").fill("8");
      const response = waitForFacilityUpdate(page, facilityId);
      await save.click();
      const updated: FacilityRead = await (await response).json();
      expect(
        updated.print_templates.find(
          (template) => template.slug === "medication_return",
        ),
      ).toMatchObject({
        page: {
          size: "A5",
          orientation: "landscape",
          margin: { top: 12, right: 10, bottom: 8, left: 10 },
        },
        watermark: { enabled: true, text: watermark, opacity: 0.2 },
      });
      await expectAndDismissToast(page, SAVED_TOAST);
      await expect(editor).toBeHidden();
    });

    await test.step("Customize another document", async () => {
      // The facility API ignores an empty template list, so the reset below
      // must leave another template behind to take effect.
      await page
        .getByRole("button", { name: `Customize ${OTHER_DOCUMENT} template` })
        .click();
      const other = page.getByRole("dialog", {
        name: `${OTHER_DOCUMENT} Template`,
        exact: true,
      });
      await other.getByLabel("Page Size").click();
      await page.getByRole("option", { name: "Legal", exact: true }).click();
      const response = waitForFacilityUpdate(page, facilityId);
      await other.getByRole("button", { name: "Save", exact: true }).click();
      expect((await response).status()).toBe(200);
      await expectAndDismissToast(page, SAVED_TOAST);
      await expect(other).toBeHidden();
    });

    await test.step("Reset the document to the default template", async () => {
      await row
        .getByRole("button", { name: `Edit ${DOCUMENT} template` })
        .click();
      await editor.getByRole("button", { name: "Reset to Default" }).click();
      const confirm = page.getByRole("alertdialog", {
        name: `Reset ${DOCUMENT} template?`,
      });
      const response = waitForFacilityUpdate(page, facilityId);
      await confirm.getByRole("button", { name: "Reset to Default" }).click();
      const updated: FacilityRead = await (await response).json();
      const slugs = updated.print_templates.map((template) => template.slug);
      expect(slugs).not.toContain("medication_return");
      expect(slugs).toContain("request_order");
      await expectAndDismissToast(page, SAVED_TOAST);
      await expect(editor).toBeHidden();
      await expect(row.getByText("Custom", { exact: true })).toHaveCount(0);
      await expect(
        row.getByRole("button", { name: `Customize ${DOCUMENT} template` }),
      ).toBeVisible();
    });
  });
});
