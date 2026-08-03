import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { questionBlock } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * The patient-subject fill mount. Every other `FillSubject` variant is
 * pinned by a spec — encounter by the fill/ suite and the migrated clinical
 * flows, location and device by their own submit_resource specs — while
 * this one shipped as a full rewrite of a deleted component with no
 * coverage at all, and it is the only subject that submits through
 * `/submit/` WITHOUT an encounter.
 *
 * The questionnaire is built here rather than taken from a fixture: the
 * backend E2E fixture set has no patient-subject questionnaire, and
 * `subject_type: "patient"` is only offered in the INSTANCE scope
 * (`SUBJECT_TYPES_FOR_CONTEXT`), so it has to come from `/admin`.
 */
test.describe("Patient-subject questionnaire fill", () => {
  test("fills and submits against the patient, with no encounter in the body", async ({
    page,
  }) => {
    test.slow();
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const title = `QV2 Patient Subject ${Date.now()}`;
    const questionTitle = `Note ${faker.string.alphanumeric(6)}`;
    const answer = `Pt-${faker.string.alphanumeric(10)}`;

    let questionnaireId = "";

    await test.step("author a patient-subject questionnaire with one question", async () => {
      await page.goto("/admin/questionnaires/new");
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(title);
      await page
        .getByRole("radiogroup", { name: "Subject Type" })
        .getByRole("radio", { name: "Patient", exact: true })
        .click();
      await page.getByRole("button", { name: "Save Questionnaire" }).click();
      await expectToast(page, "Questionnaire created successfully");
      await page.waitForURL(/\/admin\/questionnaires\/[0-9a-f-]+$/);
      questionnaireId = page.url().split("/").pop() as string;

      await page.getByRole("button", { name: "Edit Questions" }).click();
      await page.waitForURL(/\/edit$/);
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(questionTitle);
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("the patient mount renders the canvas without the encounter chrome", async () => {
      await page.goto(
        `/facility/${facilityId}/patient/${patientId}/questionnaire/${questionnaireId}`,
      );
      await expect(questionBlock(page, questionTitle)).toBeVisible();
      // A patient IS in scope, so the clinical-history tab is there — what
      // must not be is anything encounter-shaped.
      await expect(
        page.getByRole("tab", { name: "Patient Clinical History" }),
      ).toBeVisible();
      expect(page.url()).not.toContain("/encounter/");
    });

    await test.step("submitting records against the patient and exits to their updates", async () => {
      await questionBlock(page, questionTitle)
        .getByRole("textbox")
        .fill(answer);

      const batchRequest = page.waitForRequest(
        (request) =>
          request.url().includes("/api/v1/batch_requests/") &&
          request.method() === "POST",
      );
      await page.getByRole("button", { name: "Save Changes" }).click();

      const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
        requests: {
          url: string;
          body: { resource_id: string; patient: string; encounter?: string };
        }[];
      };
      expect(body.requests).toHaveLength(1);
      expect(body.requests[0].url).toContain(
        `/api/v1/questionnaire/${questionnaireId}/submit/`,
      );
      // resource_id is the PATIENT here (it is the encounter on an
      // encounter fill), and there is no encounter to record against.
      expect(body.requests[0].body.resource_id).toBe(patientId);
      expect(body.requests[0].body.patient).toBe(patientId);
      expect(body.requests[0].body.encounter).toBeUndefined();

      await expectToast(page, "Questionnaire submitted successfully");
      await page.waitForURL(
        `**/facility/${facilityId}/patient/${patientId}/updates`,
      );
    });
  });
});
