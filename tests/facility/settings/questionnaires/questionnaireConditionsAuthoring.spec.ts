import { expect, test, type Page } from "@playwright/test";
import { createQuestionnaireAndOpenBuilder } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/** Counts PUT requests to the questionnaire update endpoint. */
function trackQuestionnairePutRequests(page: Page) {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "PUT" &&
      /\/api\/v1\/questionnaire\/[^/]+\/$/.test(new URL(request.url()).pathname)
    ) {
      requests.push(request.url());
    }
  });
  return requests;
}

/** Imports questions into the freshly-opened builder. */
async function importQuestions(page: Page, questions: object[]): Promise<void> {
  await page.getByRole("button", { name: "Import Questions" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "scaffold.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ questions })),
  });
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expectToast(page, "Questionnaire Imported Successfully");
}

/** The condition editor's field grid (question/operator/answer). */
function conditionGrid(page: Page) {
  return page.locator('div[class*="sm:grid-cols-2"]');
}

async function openVisibilityCard(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Question Visibility Conditions" })
    .click();
}

test.describe("Questionnaire v2 visibility condition authoring", () => {
  test("numeric operator condition authors and evaluates in preview", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const scoreTitle = `Score ${stamp}`;
    const dependentTitle = `High score follow-up ${stamp}`;
    const nav = page.getByRole("navigation");

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Numeric Cond ${stamp}`,
    });
    await importQuestions(page, [
      { text: scoreTitle, type: "integer", link_id: "score" },
      { text: dependentTitle, type: "string", link_id: "dependent" },
    ]);

    await test.step("Author: dependent shows when score is greater than 5", async () => {
      await nav.getByRole("button", { name: dependentTitle }).click();
      await openVisibilityCard(page);
      await page.getByRole("button", { name: "Add a condition" }).click();

      const fields = conditionGrid(page).getByRole("combobox");
      await fields.nth(0).click();
      await page.getByRole("option", { name: scoreTitle }).click();

      // Numeric targets swap in the numeric operator set.
      await fields.nth(1).click();
      await expect(
        page.getByRole("option", { name: "Greater Than or Equal" }),
      ).toBeVisible();
      await page
        .getByRole("option", { name: "Greater Than", exact: true })
        .click();

      await conditionGrid(page).getByRole("spinbutton").fill("5");
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Preview: the dependent follows the numeric answer", async () => {
      await page.getByRole("button", { name: "Preview" }).click();
      await expect(
        nav.getByRole("button", { name: dependentTitle }),
      ).not.toBeVisible();
      await page.getByRole("spinbutton").fill("6");
      await expect(
        nav.getByRole("button", { name: dependentTitle }),
      ).toBeVisible();
      await page.getByRole("spinbutton").fill("5");
      await expect(
        nav.getByRole("button", { name: dependentTitle }),
      ).not.toBeVisible();
    });
  });

  test("two conditions with OR behavior author and evaluate", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const boolTitle = `Consent ${stamp}`;
    const scoreTitle = `Risk score ${stamp}`;
    const dependentTitle = `Escalation ${stamp}`;
    const nav = page.getByRole("navigation");

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 OR Cond ${stamp}`,
    });
    await importQuestions(page, [
      { text: boolTitle, type: "boolean", link_id: "consent" },
      { text: scoreTitle, type: "integer", link_id: "risk" },
      { text: dependentTitle, type: "string", link_id: "escalation" },
    ]);

    await test.step("Author two conditions joined by OR", async () => {
      await nav.getByRole("button", { name: dependentTitle }).click();
      await openVisibilityCard(page);

      await page.getByRole("button", { name: "Add a condition" }).click();
      let fields = conditionGrid(page).nth(0).getByRole("combobox");
      await fields.nth(0).click();
      await page.getByRole("option", { name: boolTitle }).click();
      await fields.nth(1).click();
      await page.getByRole("option", { name: "Equals", exact: true }).click();
      await fields.nth(2).click();
      await page.getByRole("option", { name: "Yes", exact: true }).click();

      await page.getByRole("button", { name: "Add a condition" }).click();
      fields = conditionGrid(page).nth(1).getByRole("combobox");
      await fields.nth(0).click();
      await page.getByRole("option", { name: scoreTitle }).click();
      await conditionGrid(page).nth(1).getByRole("spinbutton").fill("7");

      await page
        .getByRole("radio", { name: "Any condition is true (OR)" })
        .click();
      // The joiner chip between rows flips to OR.
      await expect(page.getByText("or", { exact: true })).toBeVisible();

      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Preview: one matching condition is enough", async () => {
      await page.getByRole("button", { name: "Preview" }).click();
      await expect(
        nav.getByRole("button", { name: dependentTitle }),
      ).not.toBeVisible();
      // Meet only the boolean leg of the OR.
      await page.getByRole("radio", { name: "Yes", exact: true }).click();
      await expect(
        nav.getByRole("button", { name: dependentTitle }),
      ).toBeVisible();
    });
  });

  test("a condition can be deleted again", async ({ page }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const triggerTitle = `Trigger ${stamp}`;
    const dependentTitle = `Dependent ${stamp}`;
    const nav = page.getByRole("navigation");

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Delete Cond ${stamp}`,
    });
    await importQuestions(page, [
      { text: triggerTitle, type: "string", link_id: "trigger" },
      { text: dependentTitle, type: "string", link_id: "dependent" },
    ]);

    await nav.getByRole("button", { name: dependentTitle }).click();
    await openVisibilityCard(page);
    await page.getByRole("button", { name: "Add a condition" }).click();
    await expect(page.getByText("Condition 1")).toBeVisible();

    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText("Condition 1")).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add a condition" }),
    ).toBeVisible();

    // With the incomplete condition gone, the save goes through.
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire updated successfully");
  });

  test("a condition without a target question blocks the save", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const putRequests = trackQuestionnairePutRequests(page);

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Unset Cond ${stamp}`,
    });
    await importQuestions(page, [
      { text: `Solo ${stamp}`, type: "string", link_id: "solo" },
    ]);

    await openVisibilityCard(page);
    await page.getByRole("button", { name: "Add a condition" }).click();

    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(
      page,
      "Every visibility condition needs a target question",
    );
    await expect(page).toHaveURL(/\/edit$/);
    expect(putRequests).toHaveLength(0);
  });
});
