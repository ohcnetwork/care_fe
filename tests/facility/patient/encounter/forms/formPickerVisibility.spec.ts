import { expect, test, type Locator, type Page } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

type Status = "active" | "draft" | "retired";

async function createInstanceQuestionnaire(
  title: string,
  status: Status,
  subjectType: "encounter" | "location",
): Promise<string> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/questionnaire/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      title,
      slug: title.toLowerCase().replace(/\s+/g, "-"),
      version: "1.0",
      status,
      subject_type: subjectType,
      auth_context: "instance",
      questions: [
        {
          id: crypto.randomUUID(),
          link_id: "note",
          text: "Note",
          type: "string",
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`questionnaire create: ${res.status} ${await res.text()}`);
  }
  return ((await res.json()) as { id: string }).id;
}

test.describe("Encounter questionnaire pickers offer only active encounter forms", () => {
  // One worker, so beforeAll seeds the questionnaires once for all pickers.
  test.describe.configure({ mode: "default" });
  const stamp = Date.now();
  const prefix = `Picker ${stamp}`;
  const titles = {
    activeEncounter: `${prefix} Active Encounter`,
    draftEncounter: `${prefix} Draft Encounter`,
    retiredEncounter: `${prefix} Retired Encounter`,
    activeLocation: `${prefix} Active Location`,
  };
  // Mounted on the fill page; its title must not match the search prefix.
  const hostTitle = `Picker Host ${stamp}`;
  let hostId = "";
  const encounterPath = () =>
    `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}`;

  test.beforeAll(async () => {
    await createInstanceQuestionnaire(
      titles.activeEncounter,
      "active",
      "encounter",
    );
    await createInstanceQuestionnaire(
      titles.draftEncounter,
      "draft",
      "encounter",
    );
    await createInstanceQuestionnaire(
      titles.retiredEncounter,
      "retired",
      "encounter",
    );
    await createInstanceQuestionnaire(
      titles.activeLocation,
      "active",
      "location",
    );
    hostId = await createInstanceQuestionnaire(
      hostTitle,
      "active",
      "encounter",
    );
  });

  /** Searches the open picker for the prefix and asserts only the active
   *  encounter questionnaire is offered. */
  async function expectOnlyActiveEncounterForm(page: Page, picker: Locator) {
    const pickerRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname === "/api/v1/questionnaire/" &&
        url.searchParams.get("title") === prefix
      );
    });
    await picker.getByPlaceholder("Search Forms").fill(prefix);

    const params = new URL((await pickerRequest).url()).searchParams;
    expect(params.get("status")).toBe("active");
    expect(params.get("subject_type")).toBe("encounter");

    await expect(
      picker.getByRole("option").filter({ hasText: titles.activeEncounter }),
    ).toBeVisible();
    await expect(picker.getByRole("option")).toHaveCount(1);
    for (const hidden of [
      titles.draftEncounter,
      titles.retiredEncounter,
      titles.activeLocation,
    ]) {
      await expect(picker.getByText(hidden)).toHaveCount(0);
    }
  }

  test("encounter overview Forms quick action", async ({ page }) => {
    await page.goto(`${encounterPath()}/updates`);
    await page.getByRole("button", { name: "Forms" }).click();
    await expectOnlyActiveEncounterForm(page, page.getByRole("dialog"));
  });

  test("encounter fill page questionnaire selector", async ({ page }) => {
    await page.goto(`${encounterPath()}/questionnaire`);
    await page
      .getByRole("combobox", { name: "Select a questionnaire to fill" })
      .click();
    await expectOnlyActiveEncounterForm(page, page.getByRole("dialog"));
  });

  test("Add questionnaire picker while filling another form", async ({
    page,
  }) => {
    await page.goto(`${encounterPath()}/questionnaire/${hostId}`);
    await page.getByRole("button", { name: "Add questionnaire" }).click();
    await expectOnlyActiveEncounterForm(page, page.getByRole("dialog"));
  });
});
