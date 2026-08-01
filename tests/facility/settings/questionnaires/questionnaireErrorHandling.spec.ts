import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createQuestionnaireAndOpenBuilder } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 server-error handling", () => {
  test("a 500 on save shows the failure toast and keeps the editor state", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const questionTitle = faker.lorem.words(3);

    await test.step("Author an unsaved question", async () => {
      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Save 500 ${Date.now()}`,
      });
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(questionTitle);
    });

    await test.step("Fail the save PUT with a 500", async () => {
      await page.route("**/api/v1/questionnaire/*/", (route) => {
        if (route.request().method() === "PUT") {
          return route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({}),
          });
        }
        return route.fallback();
      });

      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Something went wrong..!");
    });

    await test.step("The editor keeps the draft and stays saveable", async () => {
      await expect(page).toHaveURL(/\/edit$/);
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(questionTitle);
      await expect(
        page.getByRole("button", { name: "Save Changes" }),
      ).toBeEnabled();
    });

    await test.step("Retrying after the outage saves the same draft", async () => {
      await page.unroute("**/api/v1/questionnaire/*/");
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      await page.reload();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(questionTitle);
    });
  });
});
