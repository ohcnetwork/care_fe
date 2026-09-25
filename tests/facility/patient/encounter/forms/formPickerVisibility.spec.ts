import { expect, test } from "@playwright/test";
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
): Promise<void> {
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
}

test.describe("Encounter Forms picker visibility", () => {
  const stamp = Date.now();
  const prefix = `Picker ${stamp}`;
  const titles = {
    activeEncounter: `${prefix} Active Encounter`,
    draftEncounter: `${prefix} Draft Encounter`,
    retiredEncounter: `${prefix} Retired Encounter`,
    activeLocation: `${prefix} Active Location`,
  };

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
  });

  test("only active encounter-subject questionnaires are offered", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/updates`,
    );
    await page.getByRole("button", { name: "Forms" }).click();
    const picker = page.getByRole("dialog");

    const pickerRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname === "/api/v1/questionnaire/" &&
        url.searchParams.get("title") === prefix
      );
    });
    await picker.getByPlaceholder("Search Forms").fill(prefix);

    await test.step("The picker asks for active encounter questionnaires", async () => {
      const params = new URL((await pickerRequest).url()).searchParams;
      expect(params.get("status")).toBe("active");
      expect(params.get("subject_type")).toBe("encounter");
    });

    await test.step("Only the active encounter questionnaire is listed", async () => {
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
    });
  });
});
