import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/** Backend E2E fixture: subject_type "facility", one string question. */
const FACILITY_QUESTIONNAIRE_SLUG = "e2e-subject-facility";
const FACILITY_QUESTIONNAIRE_TITLE = "E2E Facility Questionnaire";

// `FillSubject` (fill/subject.ts) and `SUBJECT_TYPES`
// (types/questionnaire/questionnaire.ts) both carry "facility" as a real
// subject type, on par with "location" and "device" — the builder lets an
// author create one (QuestionnaireCreatePage's subject-type picker) and
// this repo's own E2E fixtures seed one (`e2e-subject-facility`). But
// unlike location (`LocationView.tsx`) and device (`DeviceShow.tsx`),
// nothing in `src/Routers` ever mounts `QuestionnaireFillPage` with
// `subject={{ type: "facility", facilityId }}`, and no page renders a
// "Fill questionnaire" button for the facility itself — grep for
// `type: "facility"` under `src/Routers` and `Fill questionnaire` under
// `src/pages/Facility` come back empty. A facility-subject questionnaire
// can be authored but never filled.
test.describe("Facility questionnaire fill", () => {
  let facilityId: string;
  let questionnaireId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
    // Resolve the fixture BEFORE driving any UI — a missing fixture fails
    // with the helper's "reload backend E2E fixtures" error instead of an
    // inscrutable missing button.
    questionnaireId = await getQuestionnaireIdBySlug(
      FACILITY_QUESTIONNAIRE_SLUG,
    );
  });

  test("the facility overview offers a fill entry point for a facility-subject questionnaire", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/overview`);

    // Mirrors DeviceShow.tsx / LocationView.tsx: a "Fill questionnaire"
    // button that navigates to a subject-scoped fill route.
    await page.getByRole("button", { name: "Fill questionnaire" }).click();
    await page.waitForURL(`**/facility/${facilityId}/questionnaire`);
    await expect(
      page.getByRole("heading", { name: "Select a questionnaire to fill" }),
    ).toBeVisible();
  });

  test("fills and submits a facility-subject questionnaire via submit_resource", async ({
    page,
  }) => {
    const answer = `Fac-${faker.string.alphanumeric(10)}`;

    await page.goto(`/facility/${facilityId}/questionnaire/${questionnaireId}`);
    await expect(
      page.getByRole("heading", { name: FACILITY_QUESTIONNAIRE_TITLE }),
    ).toBeVisible();

    // A resource subject gets the lean shell — no patient context, same as
    // the location/device fill routes.
    await expect(page.locator('[data-sidebar="sidebar"]')).toHaveCount(0);
    await expect(page.getByText("Blood Group:")).toHaveCount(0);

    await questionBlock(page, "Notes").getByRole("textbox").fill(answer);

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await page.getByRole("button", { name: "Save Changes" }).click();

    const body = JSON.parse((await batchRequest).postData() ?? "{}") as {
      requests: { url: string; body: { resource_id: string } }[];
    };
    expect(body.requests).toHaveLength(1);
    expect(body.requests[0].url).toContain(
      `/api/v1/questionnaire/${questionnaireId}/submit_resource/`,
    );
    expect(body.requests[0].body.resource_id).toBe(facilityId);
    expect(body.requests[0].body).not.toHaveProperty("patient");
    expect(body.requests[0].body).not.toHaveProperty("encounter");

    await expectToast(page, "Questionnaire submitted successfully");
  });
});
