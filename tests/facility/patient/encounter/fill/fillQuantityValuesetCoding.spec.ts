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

const UNITS_FIXTURE_SLUG = "e2e-units";

/**
 * P1-11 FE: QuantityInput's handleUnitChange wrote the picked unit `Code`
 * to `unit` only, never to `coding`. The backend validates a valueset-backed
 * quantity's `value.coding` against the question's `answer_value_set`
 * (`answer_value_set: { slug: "e2e-dose-units" }` on "Dose given" here) and
 * currently 500s when `coding` is missing — a backend bug handed off
 * separately, but the happy path (coding present) validates fine. This pins
 * the FE half: a picked unit must submit the same code as BOTH `unit` and
 * `coding`, and that the coding survives a subsequent value edit (the
 * per-keystroke write in handleValueChange threads through the entry's
 * current `coding` rather than dropping it).
 *
 * Order matters here — unit picked FIRST, then the value typed — so the
 * assertion actually exercises handleValueChange's coding passthrough and
 * not just handleUnitChange in isolation.
 */
test.describe("Fill page: valueset quantity coding", () => {
  test("picking a bounded unit chip then typing a value submits the code as both unit and coding", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const questionnaireId = await getQuestionnaireIdBySlug(UNITS_FIXTURE_SLUG);

    await page.goto(
      `/facility/${facilityId}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
    );

    const block = questionBlock(page, "Dose given");
    await block.scrollIntoViewIfNeeded();

    // "milligram" is the author's default (pre-selected) — pick a
    // different bounded unit so the write actually exercises
    // handleUnitChange, then type the value afterwards.
    await page.getByRole("radio", { name: "gram", exact: true }).click();
    await expect(
      page.getByRole("radio", { name: "gram", exact: true }),
    ).toHaveAttribute("aria-checked", "true");

    await block.getByRole("spinbutton").fill("250");
    await expect(block.getByRole("spinbutton")).toHaveValue("250");

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await page.getByRole("button", { name: "Save Changes" }).click();

    const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
      requests: {
        url: string;
        body: {
          results?: {
            values: {
              value?: string;
              unit?: { code?: string; system?: string };
              coding?: { code?: string; system?: string };
            }[];
          }[];
        };
      }[];
    };
    const submit = body.requests.find((request) =>
      request.url.includes(`/questionnaire/${questionnaireId}/submit/`),
    );
    // Only the quantity question's answer carries a `unit` in its
    // response entry — integer/decimal units are question-level metadata
    // and never get written into the submitted value (see NumberInput).
    const quantityValue = (submit?.body.results ?? [])
      .flatMap((result) => result.values)
      .find((value) => value.unit);

    expect(quantityValue?.value).toBe("250");
    expect(quantityValue?.unit?.code).toBe("g");
    // The regression under test: the picked code must ALSO land in
    // `coding`, and must still be there after the follow-up value edit.
    expect(quantityValue?.coding?.code).toBe("g");
    expect(quantityValue?.coding?.system).toBe("http://unitsofmeasure.org");

    // End to end: the backend's coding=None 500 only fired on a missing
    // coding — with it present, submission succeeds.
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
  });
});
