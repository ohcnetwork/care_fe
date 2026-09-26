import { faker } from "@faker-js/faker";
import { type Page, expect, test } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * D1 v1 / P1-13: a REQUIRED structured question whose slot can never
 * render blocks Save Changes by name instead of the old fail-open waiver
 * (the section's data silently dropped behind a success toast). Pinned
 * here with `structured_type: "x_e2e.missing"` — a plugin-namespaced id
 * (`{slug}.{name}`, see `PLUGIN_STRUCTURED_TYPE_PATTERN`) this build never
 * registers a component for, so `resolveStructuredSlotState` resolves it
 * as `unknown_type` on every mount, the same way it would for a disabled
 * plugin. A non-required question in the identical broken state stays
 * skippable: Save succeeds and only the OTHER, answerable question's data
 * reaches the batch.
 *
 * The fixture questionnaire is authored straight through the API (admin
 * bearer, same create shape `tests/setup/questionnaire.setup.ts` and
 * `tests/helper/questionnaireV2.ts` use) — the studio's question builder
 * has no editor for a structured type this build doesn't know about, so
 * this scenario cannot be authored through the UI at all. Each test creates
 * its own questionnaire with a unique slug (Date.now + faker) so re-runs
 * never collide; the DB snapshot handles cleanup, same as every other spec
 * here.
 */

const STRUCTURED_LABEL = "Missing Plugin Section";
const STRING_LABEL = "Clinical Note";

interface HardBlockFixture {
  questionnaireId: string;
  stringQuestionId: string;
}

async function createHardBlockQuestionnaire(
  required: boolean,
): Promise<HardBlockFixture> {
  const stringQuestionId = faker.string.uuid();
  const suffix = `${required ? "req" : "opt"}-${Date.now()}-${faker.string
    .alphanumeric(4)
    .toLowerCase()}`;

  const body = {
    title: `E2E Hard Block ${required ? "Required" : "Optional"} ${suffix}`,
    slug: `e2e-hard-block-${suffix}`,
    status: "active",
    subject_type: "encounter",
    auth_context: "instance",
    questions: [
      {
        id: faker.string.uuid(),
        link_id: "Q-STRUCTURED",
        text: STRUCTURED_LABEL,
        type: "structured",
        structured_type: "x_e2e.missing",
        required,
        questions: [],
      },
      {
        id: stringQuestionId,
        link_id: "Q-STRING",
        text: STRING_LABEL,
        type: "string",
        required: false,
        questions: [],
      },
    ],
  };

  const res = await fetch(`${apiBaseUrl()}/api/v1/questionnaire/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to create hard-block fixture questionnaire: ${res.status} — ${await res.text()}`,
    );
  }
  const created = (await res.json()) as { id: string };
  return { questionnaireId: created.id, stringQuestionId };
}

/** Tracks POSTs to the batch endpoint from the moment it's called —
 *  registering the listener AFTER the click would only prove no request
 *  had arrived YET, not that the action never sends one (same pattern as
 *  fillSubmitGuards.spec.ts's P1-10 cap preflight). */
function trackBatchRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/v1/batch_requests/")
    ) {
      urls.push(request.url());
    }
  });
  return urls;
}

test.describe("P1-13: hard-block validation for broken structured slots", () => {
  test("a required structured section stuck on a broken slot blocks Save Changes by name, and posts nothing", async ({
    page,
  }) => {
    const { questionnaireId } = await createHardBlockQuestionnaire(true);
    const posts = trackBatchRequests(page);

    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
    );

    const structuredBlock = questionBlock(page, STRUCTURED_LABEL);
    await expect(structuredBlock).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save Changes" }),
    ).toBeVisible();
    // The plugin-missing notice branches on `required`: this variant must
    // NOT promise the entries are simply skipped (that would contradict
    // the blocking error asserted below) — it says the section is
    // required and saving is blocked until it loads.
    await expect(
      structuredBlock.getByText(
        "This section is required — the form can't be saved until it's available.",
      ),
    ).toBeVisible();

    await questionBlock(page, STRING_LABEL)
      .getByRole("textbox")
      .fill(faker.lorem.sentence());

    await page.getByRole("button", { name: "Save Changes" }).click();

    await expectToast(page, "Validation failed");
    await expect(
      structuredBlock.getByText(
        `"${STRUCTURED_LABEL}" can't be completed right now, but it is required. The form can't be saved until it loads.`,
      ),
    ).toBeVisible();
    // Notice-only slot, no focusable input of its own — the error-scroll
    // fallback focuses the question block itself (see
    // useSubmitFillSession.ts's scrollToQuestion).
    await expect(structuredBlock).toBeFocused();

    expect(
      posts,
      "a required question stuck on a broken structured slot must block before any network call",
    ).toHaveLength(0);
  });

  test("a non-required structured section stuck on a broken slot is skipped: Save succeeds with only the other answer", async ({
    page,
  }) => {
    const { questionnaireId, stringQuestionId } =
      await createHardBlockQuestionnaire(false);

    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
    );

    const structuredBlock = questionBlock(page, STRUCTURED_LABEL);
    await expect(structuredBlock).toBeVisible();
    // The non-required variant of the plugin-missing notice — the actual
    // behavior this commit adds on this path. Task 7 already made
    // composeBatch skip an unknown_type question regardless of `required`,
    // so without this assertion the case below would pass unchanged on
    // pre-fix code and prove nothing about the notice-copy change.
    await expect(
      structuredBlock.getByText(
        "Entries in this section will not be submitted.",
      ),
    ).toBeVisible();

    await questionBlock(page, STRING_LABEL)
      .getByRole("textbox")
      .fill(faker.lorem.sentence());

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await page.getByRole("button", { name: "Save Changes" }).click();

    const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
      requests: {
        url: string;
        body: { results: { question_id: string }[] };
      }[];
    };
    const submit = body.requests.find((request) =>
      request.url.includes(`/questionnaire/${questionnaireId}/submit/`),
    );
    expect(
      submit,
      "the plain-answer /submit/ sub-request must still be in the batch",
    ).toBeTruthy();
    expect(
      submit?.body.results,
      "only the answerable string question may reach results — the broken structured section carries no data to drop",
    ).toHaveLength(1);
    expect(submit?.body.results[0].question_id).toBe(stringQuestionId);

    await expectToast(page, "Questionnaire submitted successfully");
  });
});
