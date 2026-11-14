import { expect, test } from "@playwright/test";
import { createQuestionnaireAndOpenBuilder } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire authoring", () => {
  test("numeric equality and absence conditions can be authored and saved", async ({
    page,
  }) => {
    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${getFacilityId()}/settings/questionnaires`,
      title: `Condition operators ${Date.now()}`,
    });
    await page.getByRole("button", { name: "Import Questions" }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "conditions.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          questions: [
            { text: "Integer score", link_id: "integer", type: "integer" },
            { text: "Decimal score", link_id: "decimal", type: "decimal" },
            { text: "Text answer", link_id: "text", type: "string" },
            { text: "Follow up", link_id: "followup", type: "string" },
          ],
        }),
      ),
    });
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Follow up" })
      .click();
    await page.getByRole("tab", { name: "Logic" }).click();
    await page.getByRole("button", { name: "Add a condition" }).click();
    const condition = page.locator('div[class*="sm:grid-cols-2"]');
    const fields = condition.getByRole("combobox");
    for (const target of ["Integer score", "Decimal score", "Text answer"]) {
      await fields.nth(0).click();
      await page.getByRole("option", { name: target, exact: true }).click();
      await fields.nth(1).click();
      await expect(
        page.getByRole("option", { name: "Equals", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Not Equals", exact: true }),
      ).toBeVisible();
      await page.getByRole("option", { name: "Exists", exact: true }).click();
      await fields.nth(2).click();
      await page
        .getByRole("option", { name: "Has no answer", exact: true })
        .click();
    }
    await fields.nth(0).click();
    await page
      .getByRole("option", { name: "Decimal score", exact: true })
      .click();
    await fields.nth(1).click();
    await page.getByRole("option", { name: "Equals", exact: true }).click();
    await condition.getByRole("spinbutton").fill("2.5");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire updated successfully");
    await page.reload();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Follow up" })
      .click();
    await page.getByRole("tab", { name: "Logic" }).click();
    await expect(condition.getByRole("spinbutton")).toHaveValue("2.5");
    await expect(fields.nth(1)).toContainText("Equals");
  });

  test("inspector title edits update plain canvas labels and custom options fit", async ({
    page,
  }) => {
    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${getFacilityId()}/settings/questionnaires`,
      title: `Authoring layout ${Date.now()}`,
    });
    await page.getByRole("button", { name: "Add First Question" }).click();
    const canvas = page.getByRole("region", { name: "Form canvas" });
    const titleInput = page.getByRole("textbox", {
      name: "Question Title",
      exact: true,
    });
    await expect(titleInput).toBeFocused();
    await titleInput.fill("Severity of symptoms");
    await expect(
      canvas.getByText("Severity of symptoms", { exact: true }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("textbox", { name: /Edit question heading/ }),
    ).toHaveCount(0);
    await page.getByRole("combobox", { name: "Question Type" }).click();
    await page.getByRole("option", { name: "Choice" }).click();
    await page.getByRole("button", { name: "Add Option" }).click();
    const row = page.getByRole("row").nth(1);
    await row
      .getByRole("textbox")
      .fill("A long option title can use the whole available width");
    await expect(
      row.getByRole("button", { name: "Delete", exact: true }),
    ).toBeVisible();
    const geometry = await row.evaluate((element) => ({
      width: element.clientWidth,
      content: element.scrollWidth,
      input: element.querySelector("input")!.getBoundingClientRect().width,
    }));
    expect(geometry.content).toBeLessThanOrEqual(geometry.width + 1);
    expect(geometry.input).toBeGreaterThan(200);
    await row.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("row")).toHaveCount(1);
  });
});
