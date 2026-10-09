import { expect, test } from "@playwright/test";
import {
  KITCHEN_SINK_FACILITY_SLUG,
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Fill page shell", () => {
  let fillUrl: string;
  let patientName: string;

  test.beforeEach(async ({ page }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    fillUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`;
    const encounterResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          `/api/v1/encounter/${getEncounterId()}/` && response.ok(),
    );
    await page.goto(fillUrl);
    patientName = (await (await encounterResponse).json()).patient.name;
    await expect(
      questionBlock(page, "Is bilateral air entry present?"),
    ).toBeVisible();
  });

  test("fullscreen layout: clinical context and actions stay visible while patient details scroll away", async ({
    page,
  }) => {
    // Fill routes opt out of the app sidebar (fullscreen shell).
    await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
    const patient = page.getByRole("button", {
      name: patientName,
      exact: true,
    });
    await expect(patient).toBeInViewport();
    const save = page.getByRole("button", {
      name: "Save Changes",
      exact: true,
    });
    const cancel = page.getByRole("button", { name: "Cancel", exact: true });
    await expect(save).toBeInViewport();
    await expect(cancel).toBeInViewport();

    // The ≥lg outline is an overlay (per the reference): a tick rail on
    // the canvas' left edge, the panel floats over the canvas on demand.
    // Selecting a row scrolls its block into view.
    const toggle = page.getByRole("button", { name: "Questions outline" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    const outline = page.getByRole("navigation", { name: "Questions" });
    await expect(outline).toBeVisible();
    await outline.getByRole("button", { name: /FiO2/ }).click();
    const targetQuestion = questionBlock(page, "FiO2 (%)");
    await expect(targetQuestion).toBeInViewport({ ratio: 1 });
    await expect(patient).not.toBeInViewport();
    await expect(save).toBeInViewport();
    await expect(cancel).toBeInViewport();
    await expect(page.getByText(/^Blood Group:?$/)).toBeInViewport();
    // A jump must land below the pinned actions, not merely somewhere
    // inside the viewport where the strip could cover the question.
    await expect
      .poll(async () => {
        const [questionBox, saveBox, cancelBox] = await Promise.all([
          targetQuestion.boundingBox(),
          save.boundingBox(),
          cancel.boundingBox(),
        ]);
        if (!questionBox || !saveBox || !cancelBox) return -1;
        return (
          questionBox.y -
          Math.max(saveBox.y + saveBox.height, cancelBox.y + cancelBox.height)
        );
      })
      .toBeGreaterThanOrEqual(0);
    await expect(
      page.getByRole("tab", { name: "Questionnaire", exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Minimize", exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Close", exact: true }),
    ).toBeInViewport();

    // Close returns to the encounter updates tab.
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.waitForURL(/\/updates$/);
  });

  test("clinical history tab embeds the patient history sections without leaving the form", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "Patient Clinical History" }).click();

    // The embedded panel carries the shared history sections as pills.
    await expect(page.getByRole("tab", { name: "Responses" })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Past Symptoms" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Allergies" })).toBeVisible();

    // Switching back keeps the form exactly where it was (no navigation).
    await page.getByRole("tab", { name: /Questionnaire/ }).click();
    await expect(
      questionBlock(page, "Is bilateral air entry present?"),
    ).toBeVisible();
    expect(page.url()).toContain("/questionnaire/");
  });
});

test.describe("Fill page value serialization", () => {
  test("a time answer submits as HH:mm:ss and the backend accepts it", async ({
    page,
  }) => {
    // The browser's time input emits a bare "HH:mm"; the backend parses
    // time answers with strptime("%H:%M:%S") and 400s on anything else,
    // rolling the whole atomic batch back. No spec answered a time
    // question before, which is why a broken submit stayed green.
    const questionnaireId = await getQuestionnaireIdBySlug(
      KITCHEN_SINK_FACILITY_SLUG,
    );
    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
    );

    const timeInput = questionBlock(page, "Last medication time").locator(
      'input[type="time"]',
    );
    await timeInput.scrollIntoViewIfNeeded();
    await timeInput.fill("14:30");
    await expect(timeInput).toHaveValue("14:30");

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await page.getByRole("button", { name: "Save Changes" }).click();

    const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
      requests: {
        url: string;
        body: { results?: { values: { value?: string }[] }[] };
      }[];
    };
    const submit = body.requests.find((request) =>
      request.url.includes(`/questionnaire/${questionnaireId}/submit/`),
    );
    const submittedValues = (submit?.body.results ?? []).flatMap((result) =>
      result.values.map((value) => value.value),
    );
    expect(submittedValues).toContain("14:30:00");

    // End to end: the server took it.
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
  });

  test("a repeats answer whose first row was cleared in place still submits its later rows", async ({
    page,
  }) => {
    // Clearing a repeats row writes `value: undefined` at that index. The
    // compose gate used to look only at values[0], dropping the WHOLE
    // answer — later rows silently never submitted while the required
    // check (which scans every entry) reported the question answered.
    const questionnaireId = await getQuestionnaireIdBySlug(
      KITCHEN_SINK_FACILITY_SLUG,
    );
    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
    );

    const block = questionBlock(page, "Medications taken (repeats)");
    await block.scrollIntoViewIfNeeded();
    await block.getByRole("textbox").first().fill("Paracetamol");
    await block.getByRole("button", { name: "Add another" }).click();
    await block.getByRole("textbox").nth(1).fill("Ibuprofen");
    // Clear the FIRST row in place — the second must still submit.
    await block.getByRole("textbox").first().fill("");

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await page.getByRole("button", { name: "Save Changes" }).click();

    const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
      requests: {
        url: string;
        body: { results?: { values: { value?: string }[] }[] };
      }[];
    };
    const submit = body.requests.find((request) =>
      request.url.includes(`/questionnaire/${questionnaireId}/submit/`),
    );
    const submittedValues = (submit?.body.results ?? []).flatMap((result) =>
      result.values.map((value) => value.value),
    );
    expect(submittedValues).toContain("Ibuprofen");
    expect(submittedValues).not.toContain("Paracetamol");

    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);
  });
});
