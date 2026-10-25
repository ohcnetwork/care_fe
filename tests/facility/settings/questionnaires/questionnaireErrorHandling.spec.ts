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

test.describe("Questionnaire v2 save race with concurrent edits", () => {
  test("an edit made while the save PUT is in flight survives the response", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const originalTitle = `Original ${stamp}`;
    const midFlightTitle = `Mid flight ${stamp}`;
    const titleInput = page.getByRole("textbox", { name: "Question Title" });
    const saveButton = page.getByRole("button", { name: "Save Changes" });

    await test.step("Author an unsaved question", async () => {
      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Save Race ${stamp}`,
      });
      await page.getByRole("button", { name: "Add First Question" }).click();
      await titleInput.pressSequentially(originalTitle);
    });

    await test.step("Delay the save PUT so an edit can land while it's in flight", async () => {
      await page.route("**/api/v1/questionnaire/*/", async (route) => {
        if (route.request().method() !== "PUT") {
          return route.fallback();
        }
        // Long enough that the edit below lands well before the real
        // backend's response comes back through this same handler.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return route.fallback();
      });
    });

    await test.step("Click Save, then edit the question while it's in flight", async () => {
      await saveButton.click();
      // The button disables for the duration of the mutation — confirms
      // the PUT is genuinely in flight before the edit below races it.
      await expect(saveButton).toBeDisabled();
      await titleInput.fill(midFlightTitle);
    });

    await test.step("The response lands without discarding the in-flight edit", async () => {
      await expectToast(page, "Questionnaire updated successfully");
      await expect(titleInput).toHaveValue(midFlightTitle);
      // The in-flight edit was never part of the PUT that just succeeded —
      // the editor must stay dirty so Save can persist it.
      await expect(saveButton).toBeEnabled();
    });

    await test.step("Saving again persists the edit that survived", async () => {
      // No expectToast here — the previous save's identical-text toast can
      // still be visible (sonner's default duration), which would make a
      // second `getByText` match on it a strict-mode violation. Waiting for
      // the PUT's own response is the stronger, unambiguous signal that
      // this second save actually completed before reloading.
      await page.unroute("**/api/v1/questionnaire/*/");
      const putResponse = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/questionnaire/") &&
          response.request().method() === "PUT",
      );
      await saveButton.click();
      await putResponse;
      await page.reload();
      await expect(titleInput).toHaveValue(midFlightTitle);
    });
  });
});
