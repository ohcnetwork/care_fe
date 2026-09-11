import { faker } from "@faker-js/faker";
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

test.describe("Questionnaire v2 builder save validation", () => {
  test("blocks save when a question has no title", async ({ page }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Validation Title ${Date.now()}`;
    const questionTitle = faker.lorem.words(3);
    const putRequests = trackQuestionnairePutRequests(page);

    await test.step("Create a questionnaire and open the builder", async () => {
      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title,
      });
    });

    await test.step("Save Changes is disabled before any edit", async () => {
      await expect(
        page.getByRole("button", { name: "Save Changes" }),
      ).toBeDisabled();
    });

    await test.step("Add a question and leave its title blank", async () => {
      await page.getByRole("button", { name: "Add First Question" }).click();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue("");
    });

    await test.step("Save is blocked with no PUT sent", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Every question needs a title");
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/edit$/);
      expect(putRequests).toHaveLength(0);
    });

    await test.step("Filling the title allows the save to succeed", async () => {
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(questionTitle);
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      expect(putRequests).toHaveLength(1);
    });
  });

  test("blocks save when a group question has no sub-questions", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Validation Group ${Date.now()}`;
    const groupTitle = faker.lorem.words(3);
    const childTitle = faker.lorem.words(3);
    const putRequests = trackQuestionnairePutRequests(page);

    await test.step("Create a questionnaire and open the builder", async () => {
      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title,
      });
    });

    await test.step("Add a group question with no sub-questions", async () => {
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(groupTitle);
      // The type picker is the only combobox on screen for a freshly-added
      // question (AnswerOptionsEditor/SubQuestionsList aren't rendered yet).
      await page.getByRole("combobox").click();
      // The type option's accessible name also includes its description text,
      // so this can't be an exact match — "Group" alone is still unambiguous.
      await page.getByRole("option", { name: "Group" }).click();
    });

    await test.step("Save is blocked with no PUT sent", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(
        page,
        "Group questions must contain at least one sub-question",
      );
      await expect(page).toHaveURL(/\/edit$/);
      expect(putRequests).toHaveLength(0);
    });

    await test.step("Adding a titled sub-question allows the save to succeed", async () => {
      await page.getByRole("button", { name: "Add Sub-Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(childTitle);
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      expect(putRequests).toHaveLength(1);
    });
  });
});
