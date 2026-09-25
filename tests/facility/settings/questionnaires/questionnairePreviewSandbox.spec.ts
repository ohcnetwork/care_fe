import { expect, test, type Page } from "@playwright/test";
import {
  createFacilityQuestionnaireViaApi,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const LABEL = {
  string: "Preview string",
  text: "Preview text",
  url: "Preview url",
  integer: "Preview integer",
  decimal: "Preview decimal",
  boolean: "Preview boolean",
  date: "Preview date",
  time: "Preview time",
  choice: "Preview choice",
  group: "Preview group",
  child: "Preview group child",
};

const QUESTIONS = [
  ...(
    [
      "string",
      "text",
      "url",
      "integer",
      "decimal",
      "boolean",
      "date",
      "time",
    ] as const
  ).map((type) => ({
    id: crypto.randomUUID(),
    link_id: type,
    text: LABEL[type],
    type,
  })),
  {
    id: crypto.randomUUID(),
    link_id: "choice",
    text: LABEL.choice,
    type: "choice",
    answer_option: [{ value: "Alpha" }, { value: "Beta" }],
  },
  {
    id: crypto.randomUUID(),
    link_id: "group",
    text: LABEL.group,
    type: "group",
    questions: [
      {
        id: crypto.randomUUID(),
        link_id: "child",
        text: LABEL.child,
        type: "string",
      },
    ],
  },
];

/** Records every non-GET API call except the app's background token
 *  refresh — the preview itself must never write. */
function trackWrites(page: Page): string[] {
  const writes: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (
      request.method() !== "GET" &&
      url.includes("/api/") &&
      !url.includes("/auth/token/")
    ) {
      writes.push(`${request.method()} ${url}`);
    }
  });
  return writes;
}

/**
 * How each answer type renders is pinned by questionnairePreviewTypes.spec.ts;
 * this spec pins that answering them in preview never writes anything, and
 * that the edit canvas keeps the field area (and its note) inert.
 */
test.describe("Questionnaire v2 preview is a sandbox", () => {
  let editUrl = "";

  test.beforeEach(async () => {
    const facilityId = getFacilityId();
    const id = await createFacilityQuestionnaireViaApi(
      facilityId,
      `QV2 Preview Sandbox ${Date.now()}`,
      QUESTIONS,
    );
    editUrl = `/facility/${facilityId}/settings/questionnaires/${id}/edit`;
  });

  test("answering every type in preview sends nothing and offers no submit", async ({
    page,
  }) => {
    const writes = trackWrites(page);
    await page.goto(`${editUrl}?mode=preview`);
    const block = (label: string) => questionBlock(page, label);

    await block(LABEL.string).getByPlaceholder("Enter details").fill("a");
    await block(LABEL.text).locator("textarea").fill("b");
    await block(LABEL.url).locator('input[type="url"]').fill("https://x.org");
    await block(LABEL.integer).getByRole("spinbutton").fill("7");
    await block(LABEL.decimal).getByRole("spinbutton").fill("37.5");
    await block(LABEL.boolean)
      .getByRole("radio", { name: "Yes", exact: true })
      .click();
    await block(LABEL.choice)
      .getByRole("radio", { name: "Beta", exact: true })
      .click();
    await block(LABEL.date)
      .getByRole("button", { name: "Pick a date" })
      .click();
    await page
      .locator('[role="gridcell"]:not([data-outside]) button')
      .first()
      .click();
    await block(LABEL.time).locator('input[type="time"]').fill("08:15");
    await block(LABEL.child).getByPlaceholder("Enter details").fill("c");

    await expect(page.getByRole("button", { name: /submit/i })).toHaveCount(0);
    expect(writes).toEqual([]);
  });

  test("the note beside a field stays static on the edit canvas", async ({
    page,
  }) => {
    const string = questionBlock(page, LABEL.string);
    const noteButton = string.locator('button[aria-label="Add note"]');

    await page.goto(editUrl);

    await test.step("The field area, note included, is inert", async () => {
      const inertArea = string.locator("[inert]");
      await expect(inertArea).toHaveCount(1);
      await expect(
        inertArea.locator('button[aria-label="Add note"]'),
      ).toHaveCount(1);
    });

    await test.step("Clicking the note selects the question; no note opens", async () => {
      // Move selection away first — the first question starts selected.
      await page
        .getByRole("navigation")
        .getByRole("button", { name: LABEL.text })
        .click();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(LABEL.text);
      const bounds = await noteButton.boundingBox();
      expect(bounds).not.toBeNull();
      await page.mouse.click(
        bounds!.x + bounds!.width / 2,
        bounds!.y + bounds!.height / 2,
      );
      await expect(page.getByPlaceholder("Add note")).toHaveCount(0);
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(LABEL.string);
    });
  });
});
