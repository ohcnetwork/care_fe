import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/** How many fill-session drafts this origin currently holds. */
async function fillDraftCount(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("care_qn_fill_draft--"),
      ).length,
  );
}

test.describe("Fill page local autosave", () => {
  test("reload prompts to resume, Resume applies the draft, submit clears it", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const fillUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`;
    const note = faker.lorem.sentence();

    await page.goto(fillUrl);
    const airEntry = questionBlock(page, "Is bilateral air entry present?");
    await expect(airEntry).toBeVisible();
    const textInput = questionBlock(
      page,
      "Note on Bilateral Air Entry",
    ).getByRole("textbox");

    // No draft yet — no Draft chip on the tab, no prompt.
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).not.toContainText("Draft");

    await airEntry.getByRole("radio", { name: "yes", exact: true }).click();
    await textInput.fill(note);

    // Any edit marks the session as a draft.
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    // Reload — the pagehide flush persists the pending debounce, but the
    // fresh mount must NOT silently seed the store: it prompts instead.
    await page.reload();
    await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
    await expect(textInput).toHaveValue("");
    await expect(
      questionBlock(page, "Is bilateral air entry present?").getByRole(
        "radio",
        { name: "yes", exact: true },
      ),
    ).toHaveAttribute("aria-checked", "false");

    // Resume applies the draft into the live store.
    await page.getByRole("button", { name: /resume/i }).click();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
    await expect(textInput).toHaveValue(note);
    await expect(
      questionBlock(page, "Is bilateral air entry present?").getByRole(
        "radio",
        { name: "yes", exact: true },
      ),
    ).toHaveAttribute("aria-checked", "true");
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    // Fill the required questions and submit — success clears the draft.
    await questionBlock(page, "Is bilateral air entry present?")
      .getByRole("radio", { name: "no", exact: true })
      .click();
    await questionBlock(page, "Select Modality")
      .getByRole("radio", { name: "invasive", exact: true })
      .click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);

    // Back on the fill page: nothing to restore.
    await page.goto(fillUrl);
    await expect(
      questionBlock(page, "Is bilateral air entry present?"),
    ).toBeVisible();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
  });

  test("Discard deletes the draft, a later reload shows no prompt", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    const fillUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`;
    const note = faker.lorem.sentence();

    await page.goto(fillUrl);
    const airEntry = questionBlock(page, "Is bilateral air entry present?");
    await expect(airEntry).toBeVisible();
    const textInput = questionBlock(
      page,
      "Note on Bilateral Air Entry",
    ).getByRole("textbox");

    await airEntry.getByRole("radio", { name: "yes", exact: true }).click();
    await textInput.fill(note);
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    await page.reload();
    await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
    await expect(textInput).toHaveValue("");

    // Discard: prompt gone, form stays pristine, chip gone.
    await page.getByRole("button", { name: "Discard", exact: true }).click();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
    await expect(textInput).toHaveValue("");
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).not.toContainText("Draft");

    // The draft was deleted, not merely dismissed — a later reload has
    // nothing left to prompt about.
    await page.reload();
    await expect(airEntry).toBeVisible();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
    await expect(textInput).toHaveValue("");
  });

  test("an untouched clinical form writes no draft, however much it prefetches", async ({
    page,
  }) => {
    // The fixed "encounter" questionnaire: its structured widget fetches
    // the encounter and writes it into the response store from a mount
    // effect. That write is not an edit — it is server data arriving — but
    // the draft layer used to count it both as dirty AND as draft content,
    // so merely OPENING this form (the Update Encounter flow, one of the
    // highest-traffic screens) persisted a draft and every later visit
    // opened with a false "unsaved entry" prompt that restored nothing.
    const fillUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/encounter`;

    await page.goto(fillUrl);
    // The widget has rendered WITH its prefetched row — the encounter
    // class combobox only carries a value once the fetch landed.
    await expect(
      page.getByRole("button", { name: "Save Changes" }),
    ).toBeVisible();
    await expect(page.getByRole("combobox").first()).toBeVisible();

    // Touch nothing. No Draft chip, and nothing in storage after well over
    // the autosave debounce.
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).not.toContainText("Draft");
    await expect.poll(() => fillDraftCount(page), { timeout: 5000 }).toBe(0);

    // And the next visit is clean — no prompt to answer, nothing to
    // restore.
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Save Changes" }),
    ).toBeVisible();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
    await expect(await fillDraftCount(page)).toBe(0);
  });
});
