import { faker } from "@faker-js/faker";
import { expect, test, type Request } from "@playwright/test";
import {
  encounterPath,
  newEncounter,
  openFormFromEncounter,
  saveStudio,
} from "tests/helper/authoredForms";
import {
  fillStringField,
  submitAndExpectSuccess,
  verifySubmittedValues,
} from "tests/helper/questionnaire";
import {
  addTopLevelQuestion,
  adminApiHeaders,
  apiBaseUrl,
  getQuestionnaireViaApi,
  openQuestionBuilder,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const SAVE_BUTTON = /Save (Questionnaire|Form)/;

test.describe("Create a questionnaire, then use it on an encounter", () => {
  test("with every optional field set it is offered and filled on the encounter", async ({
    page,
  }) => {
    const basePath = `/facility/${getFacilityId()}/settings/questionnaires`;
    const stamp = Date.now();
    const title = `QV2 All Fields ${stamp}`;
    const slug = `qv2-all-fields-${stamp}`;
    const description = `Every field ${faker.lorem.words(3)}`;
    const questionTitle = `Chief complaint ${stamp}`;
    const answer = `answer-${stamp}`;
    let id = "";

    await test.step("Fill title, custom slug, description, Active and Encounter", async () => {
      await page.goto(`${basePath}/new`);
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(title);
      await page.getByRole("textbox", { name: "Slug" }).fill(slug);
      await page
        .getByRole("textbox", { name: "Description" })
        .fill(description);
      await page
        .getByRole("radiogroup", { name: "Status" })
        .getByRole("radio", { name: "Active" })
        .click();
      await page.getByRole("radio", { name: "Encounter", exact: true }).click();
      await page.getByRole("button", { name: SAVE_BUTTON }).click();
      await expectToast(page, "Questionnaire created successfully");
      await page.waitForURL(/\/questionnaires\/[0-9a-f-]+$/);
      id = page.url().split("/").pop()!;
    });

    await test.step("The server stored every field as entered", async () => {
      expect(await getQuestionnaireViaApi(id)).toMatchObject({
        title,
        slug,
        description,
        status: "active",
        subject_type: "encounter",
      });
    });

    await test.step("Add a question in the studio", async () => {
      await openQuestionBuilder(page);
      await addTopLevelQuestion(page, questionTitle);
      await saveStudio(page);
    });

    const encounter = await newEncounter();

    await test.step("The encounter's Forms picker offers it and opens the fill page", async () => {
      await openFormFromEncounter(page, encounter, title);
      await expect(page).toHaveURL(
        `${encounterPath(encounter)}/questionnaire/${id}`,
      );
    });

    await test.step("Answer and submit; the encounter shows the answer", async () => {
      await fillStringField(page, questionTitle, answer);
      await submitAndExpectSuccess(page);
      await verifySubmittedValues(page, [answer]);
    });
  });

  test("with only the title it stays a draft the encounter can't use until activated", async ({
    page,
  }) => {
    const basePath = `/facility/${getFacilityId()}/settings/questionnaires`;
    const title = `QV2 Title Only ${Date.now()}`;
    let id = "";

    await test.step("Save with nothing but the title", async () => {
      await page.goto(`${basePath}/new`);
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(title);
      await page.getByRole("button", { name: SAVE_BUTTON }).click();
      await expectToast(page, "Questionnaire created successfully");
      await page.waitForURL(/\/questionnaires\/[0-9a-f-]+$/);
      id = page.url().split("/").pop()!;
    });

    await test.step("The server fills the defaults", async () => {
      const saved = await getQuestionnaireViaApi(id);
      expect(saved).toMatchObject({
        title,
        status: "draft",
        subject_type: "encounter",
      });
      expect(saved.description ?? "").toBe("");
      expect(saved.slug).toMatch(/^[-\w]+$/);
    });

    await test.step("Add a question so only the status keeps it off the encounter", async () => {
      await openQuestionBuilder(page);
      await addTopLevelQuestion(page, `Only question ${Date.now()}`);
      await saveStudio(page);
    });

    const encounter = await newEncounter();
    const picker = page.getByRole("dialog");

    await test.step("The encounter's Forms picker doesn't offer the draft", async () => {
      await page.goto(`${encounterPath(encounter)}/updates`);
      await page.getByRole("button", { name: "Forms" }).click();
      await picker.getByPlaceholder("Search Forms").fill(title);
      await expect(picker.getByText("No results")).toBeVisible();
    });

    await test.step("Activating it makes the encounter offer it", async () => {
      await page.goto(`${basePath}/${id}`);
      await page
        .getByRole("radiogroup", { name: "Status" })
        .getByRole("radio", { name: "Active" })
        .click();
      await page.getByRole("button", { name: SAVE_BUTTON }).click();
      await expectToast(page, "Questionnaire updated successfully");
      await openFormFromEncounter(page, encounter, title);
      await expect(page).toHaveURL(
        `${encounterPath(encounter)}/questionnaire/${id}`,
      );
    });
  });

  test("a duplicate slug is rejected and nothing is created", async ({
    page,
  }) => {
    const basePath = `/facility/${getFacilityId()}/settings/questionnaires`;
    const stamp = Date.now();
    const slug = `qv2-duplicate-${stamp}`;
    const secondTitle = `QV2 Duplicate B ${stamp}`;
    const isCreate = (request: Request) =>
      request.method() === "POST" &&
      /\/api\/v1\/questionnaire\/$/.test(new URL(request.url()).pathname);

    await test.step("The first questionnaire takes the slug", async () => {
      await page.goto(`${basePath}/new`);
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(`QV2 Duplicate A ${stamp}`);
      await page.getByRole("textbox", { name: "Slug" }).fill(slug);
      await page.getByRole("button", { name: SAVE_BUTTON }).click();
      await expectToast(page, "Questionnaire created successfully");
      await page.waitForURL(/\/questionnaires\/[0-9a-f-]+$/);
    });

    await test.step("A second one with the same slug is sent but not saved", async () => {
      await page.goto(`${basePath}/new`);
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(secondTitle);
      await page.getByRole("textbox", { name: "Slug" }).fill(slug);
      const sent = page.waitForRequest(isCreate);
      await page.getByRole("button", { name: SAVE_BUTTON }).click();
      expect((await sent).postDataJSON()).toMatchObject({
        slug,
        title: secondTitle,
      });
      // The backend answers a slug clash with a 500 (IntegrityError on
      // unique_questionnaire_slug_facility) rather than a field error, so
      // assert on what the user is left with, not on a message.
      await expect(
        page.getByRole("heading", { name: "Create Questionnaire" }),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/questionnaires\/new$/);
      await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
        secondTitle,
      );
    });

    await test.step("The server holds only the first one", async () => {
      const res = await fetch(
        `${apiBaseUrl()}/api/v1/questionnaire/?title=${encodeURIComponent(secondTitle)}`,
        { headers: adminApiHeaders() },
      );
      expect(res.ok).toBe(true);
      const { results } = (await res.json()) as {
        results: { title: string }[];
      };
      expect(results.filter((q) => q.title === secondTitle)).toHaveLength(0);
    });
  });
});
