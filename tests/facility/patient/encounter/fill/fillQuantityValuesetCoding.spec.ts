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

interface SubmitBatchBody {
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
}

/**
 * P1-11 FE: QuantityInput used to write the picked unit `Code` to `unit`
 * only, never to `coding` — and separately, an entry that never touched the
 * unit picker (default unit accepted, only the value typed) derived `unit`
 * with a `question.unit` fallback but `coding` with none, so it submitted
 * `coding: undefined` too. The backend validates a valueset-backed
 * quantity's `value.coding` against the question's `answer_value_set`
 * (`answer_value_set: { slug: "e2e-dose-units" }` on "Dose given" here) and
 * currently 500s when `coding` is missing — a backend bug handed off
 * separately, but the happy path (coding present) validates fine. Both
 * specs below pin that the submitted `coding` always mirrors the unit shown
 * to the user, whichever of the two paths set it.
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
    // handleUnitChange, then type the value afterwards (unit-then-value
    // order, so the assertion also exercises handleValueChange's coding
    // passthrough on the write that follows, not just handleUnitChange in
    // isolation).
    await block.getByRole("radio", { name: "gram", exact: true }).click();
    await expect(
      block.getByRole("radio", { name: "gram", exact: true }),
    ).toHaveAttribute("aria-checked", "true");

    await block.getByRole("spinbutton").fill("250");
    await expect(block.getByRole("spinbutton")).toHaveValue("250");

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await page.getByRole("button", { name: "Save Changes" }).click();

    const body = JSON.parse(
      (await batchRequest).postData() ?? "{}",
    ) as SubmitBatchBody;
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

  test("accepting the default unit and only typing a value still submits a coding", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const questionnaireId = await getQuestionnaireIdBySlug(UNITS_FIXTURE_SLUG);

    await page.goto(
      `/facility/${facilityId}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
    );

    const block = questionBlock(page, "Dose given");
    await block.scrollIntoViewIfNeeded();

    // No unit chip click at all — the author's default ("milligram", mg)
    // stays pre-selected. This is the path handleUnitChange never runs on:
    // `unit` falls back to `question.unit`, and `coding` must fall back to
    // it too, or this submits `coding: undefined` exactly like the
    // unpicked-default backend 500.
    await expect(
      block.getByRole("radio", { name: "milligram", exact: true }),
    ).toHaveAttribute("aria-checked", "true");
    await block.getByRole("spinbutton").fill("10");

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await page.getByRole("button", { name: "Save Changes" }).click();

    const body = JSON.parse(
      (await batchRequest).postData() ?? "{}",
    ) as SubmitBatchBody;
    const submit = body.requests.find((request) =>
      request.url.includes(`/questionnaire/${questionnaireId}/submit/`),
    );
    const quantityValue = (submit?.body.results ?? [])
      .flatMap((result) => result.values)
      .find((value) => value.unit);

    expect(quantityValue?.value).toBe("10");
    expect(quantityValue?.unit?.code).toBe("mg");
    // The gap the reviewer caught: the default-unit path must ALSO carry a
    // coding, not just an explicit pick.
    expect(quantityValue?.coding?.code).toBe("mg");
    expect(quantityValue?.coding?.system).toBe("http://unitsofmeasure.org");

    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
  });
});
