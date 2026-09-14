import { expect, type Locator, type Page, test } from "@playwright/test";
import { draftFormNoteText } from "tests/helper/fillDrafts";
import {
  adminApiHeaders,
  apiBaseUrl,
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

interface FixtureQuestion {
  id: string;
  link_id: string;
  text: string;
  questions?: FixtureQuestion[];
}

interface FixtureQuestionnaire {
  id: string;
  title: string;
  version: number | string;
  questions: FixtureQuestion[];
}

let userId: string;
let questionnaire: FixtureQuestionnaire;
let noteQuestion: FixtureQuestion;

test.beforeAll(async () => {
  const questionnaireId = await getQuestionnaireIdBySlug(
    "respiratory_status-v3",
  );
  const [userResponse, questionnaireResponse] = await Promise.all([
    fetch(`${apiBaseUrl()}/api/v1/users/getcurrentuser/`, {
      headers: adminApiHeaders(),
    }),
    fetch(`${apiBaseUrl()}/api/v1/questionnaire/${questionnaireId}/`, {
      headers: adminApiHeaders(),
    }),
  ]);
  expect(userResponse.ok).toBe(true);
  expect(questionnaireResponse.ok).toBe(true);
  userId = ((await userResponse.json()) as { id: string }).id;
  questionnaire = (await questionnaireResponse.json()) as FixtureQuestionnaire;
  const flatten = (questions: FixtureQuestion[]): FixtureQuestion[] =>
    questions.flatMap((question) => [
      question,
      ...flatten(question.questions ?? []),
    ]);
  const note = flatten(questionnaire.questions).find(
    (question) => question.text === "Note on Bilateral Air Entry",
  );
  expect(note).toBeTruthy();
  noteQuestion = note!;
});

function draftRow(page: Page, source: "local" | "server", id: string) {
  return page.locator(`[data-draft-source="${source}"][data-draft-id="${id}"]`);
}

async function openMixedOverview(page: Page) {
  const encounterUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
  const localTitle =
    "Respiratory assessment with additional clinical questionnaires";
  const contextTitle =
    "Discharge prescription follow-up with a long questionnaire title";
  const serverTitle =
    "Respiratory assessment saved to the server with a long title";
  const contextKey = new URLSearchParams({
    prescription: crypto.randomUUID(),
    toDischarge: "true",
  }).toString();
  const now = Date.now();

  function localDraft({
    title,
    context,
    owner = userId,
    subject = `encounter:${getEncounterId()}`,
    savedAt = new Date(now - 120_000).toISOString(),
    addedForm = false,
  }: {
    title: string;
    context?: string;
    owner?: string;
    subject?: string;
    savedAt?: string;
    addedForm?: boolean;
  }) {
    const scopeKey = `${owner}--${subject}--${questionnaire.id}${context ? `--context=${encodeURIComponent(context)}` : ""}`;
    const form = {
      questionnaireId: questionnaire.id,
      questionnaireVersion: String(questionnaire.version),
      title,
      structuredSkipped: false,
      responses: {
        [noteQuestion.id]: {
          question_id: noteQuestion.id,
          link_id: noteQuestion.link_id,
          structured_type: null,
          values: [{ type: "string", value: `Saved note for ${title}` }],
        },
      },
    };
    return {
      key: `care_qn_fill_draft--${scopeKey}`,
      value: JSON.stringify({
        schemaVersion: 2,
        userId: owner,
        subjectKey: subject,
        entryQuestionnaireId: questionnaire.id,
        ...(context ? { contextKey: context } : {}),
        savedAt,
        forms: [
          form,
          ...(addedForm
            ? [
                {
                  ...form,
                  questionnaireId: "symptom",
                  title: "Symptoms",
                  responses: {},
                },
              ]
            : []),
        ],
      }),
    };
  }

  const local = localDraft({ title: localTitle, addedForm: true });
  const contextual = localDraft({
    title: contextTitle,
    context: contextKey,
    savedAt: new Date(now - 30_000).toISOString(),
  });
  const excluded = [
    localDraft({ title: "Another user's draft", owner: crypto.randomUUID() }),
    localDraft({
      title: "Another encounter's draft",
      subject: `encounter:${crypto.randomUUID()}`,
    }),
    localDraft({
      title: "Expired draft",
      context: "toDischarge=true",
      savedAt: new Date(now - 25 * 60 * 60_000).toISOString(),
    }),
  ];
  const entries = [local, contextual, ...excluded];
  const server = {
    id: crypto.randomUUID(),
    status: "draft",
    created_date: new Date(now - 90_000).toISOString(),
    modified_date: new Date(now - 60_000).toISOString(),
    created_by: null,
    updated_by: null,
    response_dump: {
      questionnaireResponses: {
        questionnaire: { ...questionnaire, title: serverTitle },
        responses: [],
      },
    },
  };
  const updates: { id: string; body: unknown }[] = [];
  await page.route("**/api/v1/form_submission/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      request.method() === "GET" &&
      url.pathname === "/api/v1/form_submission/"
    ) {
      expect(url.searchParams.get("encounter")).toBe(getEncounterId());
      expect(url.searchParams.get("status")).toBe("draft");
      return route.fulfill({
        json: {
          count: updates.length ? 0 : 1,
          results: updates.length ? [] : [server],
        },
      });
    }
    if (request.method() === "PUT") {
      updates.push({
        id: url.pathname.split("/").at(-2)!,
        body: request.postDataJSON(),
      });
      return route.fulfill({ json: { ...server, status: "entered_in_error" } });
    }
    return route.fallback();
  });

  await page.goto(`${encounterUrl}/updates`);
  await expect(draftRow(page, "server", server.id)).toBeVisible();
  // Seed after app boot so expiry and auth sweeps cannot masquerade as the
  // overview's scope filter. A storage event exercises updates from another tab.
  await page.evaluate((drafts) => {
    for (const draft of drafts) localStorage.setItem(draft.key, draft.value);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: drafts[0].key,
        newValue: drafts[0].value,
        storageArea: localStorage,
      }),
    );
  }, entries);
  await expect(draftRow(page, "local", local.key)).toBeVisible();
  await expect(draftRow(page, "local", contextual.key)).toBeVisible();
  return {
    encounterUrl,
    local,
    contextual,
    contextKey,
    contextTitle,
    server,
    entries,
    excluded,
    updates,
  };
}

async function expectOneLine(row: Locator, viewportWidth: number) {
  const geometry = await row.evaluate((element) => {
    const row = element.getBoundingClientRect();
    const children = Array.from(element.children)
      .map((child) => child.getBoundingClientRect())
      .filter((child) => child.width > 0 && child.height > 0);
    return {
      height: row.height,
      left: row.left,
      right: row.right,
      centers: children.map((child) => child.y + child.height / 2),
    };
  });
  expect(geometry.height).toBeLessThanOrEqual(56);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(viewportWidth);
  expect(
    Math.max(...geometry.centers) - Math.min(...geometry.centers),
  ).toBeLessThanOrEqual(2);
  await expect(row.locator("input, textarea, [data-question-id]")).toHaveCount(
    0,
  );
  await expect(row.getByRole("button", { name: /^Continue / })).toBeVisible();
  await expect(row.getByRole("button", { name: /^Discard / })).toBeVisible();
}

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`mixed local and server drafts use one line at ${viewport.width}px and exclude unrelated or expired drafts`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const fixture = await openMixedOverview(page);
    const region = page.getByRole("region", { name: "Draft Forms" });
    const rows = region.locator("li[data-draft-source]");
    await expect(rows).toHaveCount(3);
    expect(
      await rows.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("data-draft-id")),
      ),
    ).toEqual([fixture.contextual.key, fixture.server.id, fixture.local.key]);
    await expect(draftRow(page, "local", fixture.local.key)).toContainText(
      "+1",
    );
    for (const row of await rows.all()) {
      await expectOneLine(row, viewport.width);
      if (viewport.width >= 768)
        await expect(row.locator("time")).toBeVisible();
      else await expect(row.locator("time")).toBeHidden();
    }
    await expect(region.getByText("Local", { exact: true })).toHaveCount(2);
    await expect(region.getByText("Shared", { exact: true })).toHaveCount(1);
    for (const excluded of fixture.excluded) {
      await expect(draftRow(page, "local", excluded.key)).toHaveCount(0);
      expect(
        await page.evaluate((key) => localStorage.getItem(key), excluded.key),
      ).toBe(excluded.value);
    }
  });
}

test("local Continue preserves the saved prescription and discharge context and restores its answers", async ({
  page,
}) => {
  const fixture = await openMixedOverview(page);
  await draftRow(page, "local", fixture.contextual.key)
    .getByRole("button", { name: /^Continue / })
    .click();
  await page.waitForURL(/\/questionnaire\//);
  const url = new URL(page.url());
  expect(url.pathname).toBe(
    `${fixture.encounterUrl}/questionnaire/${questionnaire.id}`,
  );
  expect(url.searchParams.get("resume_local_draft")).toBe("true");
  url.searchParams.delete("resume_local_draft");
  expect(url.searchParams.toString()).toBe(fixture.contextKey);
  expect(url.searchParams.has("continue_draft")).toBe(false);
  await expect(
    questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
  ).toHaveValue(`Saved note for ${fixture.contextTitle}`);
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toHaveCount(0);
});

test("Continue restores an actual autosaved multi-form session and keeps subsequent edits", async ({
  page,
}) => {
  const encounterUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
  const addedId = await getQuestionnaireIdBySlug("patient_feedback");
  const draftKey = `care_qn_fill_draft--${userId}--encounter:${getEncounterId()}--${questionnaire.id}`;
  const localRow = draftRow(page, "local", draftKey);
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(`${encounterUrl}/questionnaire/${questionnaire.id}`);
  const primaryNote = () =>
    questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox");
  const addedNote = () =>
    questionBlock(page, "Any Suggestions for Improvement").getByRole("textbox");
  await primaryNote().fill("Original primary note from real form filling");
  await page.getByRole("button", { name: "Add questionnaire" }).click();
  await page.getByPlaceholder("Search Forms").fill("Feedback");
  await page.getByRole("option", { name: /Feedback Form/ }).click();
  await addedNote().fill("Original added form note from real form filling");
  await expect
    .poll(() => draftFormNoteText(page, questionnaire.id))
    .toBe("Original primary note from real form filling");
  await expect
    .poll(() => draftFormNoteText(page, addedId))
    .toBe("Original added form note from real form filling");

  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.waitForURL(/\/updates$/);
  await expect(localRow).toContainText("+1");
  await localRow.getByRole("button", { name: /^Continue / }).click();
  await expect(primaryNote()).toHaveValue(
    "Original primary note from real form filling",
  );
  await expect(addedNote()).toHaveValue(
    "Original added form note from real form filling",
  );
  await expect(page.locator("[data-form-key]")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toHaveCount(0);

  await primaryNote().fill("Edited primary note after Continue");
  await addedNote().fill("Edited added form note after Continue");
  // Close before another debounce; the live edit must be flushed on exit.
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.waitForURL(/\/updates$/);
  await localRow.getByRole("button", { name: /^Continue / }).click();
  await expect(primaryNote()).toHaveValue("Edited primary note after Continue");
  await expect(addedNote()).toHaveValue(
    "Edited added form note after Continue",
  );
  await expect(page.locator("[data-form-key]")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toHaveCount(0);
});

test("Continue restores an actual structured encounter edit over its server prefill", async ({
  page,
}) => {
  const encounterUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
  const draftKey = `care_qn_fill_draft--${userId}--encounter:${getEncounterId()}--encounter`;
  const identifier = "LOCAL-DRAFT-OVERVIEW-RESUME";
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(`${encounterUrl}/questionnaire/encounter`);
  await page.getByPlaceholder("Ip/op/obs/emr number").fill(identifier);
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), draftKey))
    .toContain(identifier);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.waitForURL(/\/updates$/);
  await draftRow(page, "local", draftKey)
    .getByRole("button", { name: /^Continue / })
    .click();
  await expect(page.getByPlaceholder("Ip/op/obs/emr number")).toHaveValue(
    identifier,
  );
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toHaveCount(0);
});

for (const state of ["missing", "malformed"] as const) {
  test(`an explicitly requested ${state} local draft reports failure instead of opening a blank form`, async ({
    page,
  }) => {
    const encounterUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;
    if (state === "malformed") {
      await page.addInitScript(
        (key) =>
          localStorage.setItem(
            key,
            JSON.stringify({ savedAt: new Date().toISOString(), forms: null }),
          ),
        `care_qn_fill_draft--${userId}--encounter:${getEncounterId()}--${questionnaire.id}`,
      );
    }
    await page.goto(
      `${encounterUrl}/questionnaire/${questionnaire.id}?resume_local_draft=true`,
    );
    await expect(
      page.getByText("Couldn't load this draft. Go back and try again."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save Changes" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "Note on Bilateral Air Entry" }),
    ).toHaveCount(0);
  });
}

test("discard confirms and removes only the selected local or server draft", async ({
  page,
}) => {
  const fixture = await openMixedOverview(page);
  const localRow = draftRow(page, "local", fixture.contextual.key);
  await localRow.getByRole("button", { name: /^Discard / }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(localRow).toBeVisible();
  expect(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      fixture.contextual.key,
    ),
  ).toBe(fixture.contextual.value);

  await localRow.getByRole("button", { name: /^Discard / }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Discard", exact: true })
    .click();
  await expect(localRow).toHaveCount(0);
  expect(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      fixture.contextual.key,
    ),
  ).toBeNull();
  expect(fixture.updates).toHaveLength(0);
  for (const entry of fixture.entries.filter(
    (entry) => entry.key !== fixture.contextual.key,
  )) {
    expect(
      await page.evaluate((key) => localStorage.getItem(key), entry.key),
    ).toBe(entry.value);
  }
  await expect(draftRow(page, "local", fixture.local.key)).toBeVisible();

  const serverRow = draftRow(page, "server", fixture.server.id);
  await serverRow.getByRole("button", { name: /^Discard / }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Discard", exact: true })
    .click();
  await expect(serverRow).toHaveCount(0);
  expect(fixture.updates).toEqual([
    {
      id: fixture.server.id,
      body: {
        status: "entered_in_error",
        response_dump: fixture.server.response_dump,
      },
    },
  ]);
  await expect(draftRow(page, "local", fixture.local.key)).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), fixture.local.key),
  ).toBe(fixture.local.value);
});
