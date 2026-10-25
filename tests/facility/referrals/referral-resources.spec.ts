import { faker } from "@faker-js/faker";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { createReferralFixture } from "tests/helper/referrals";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

async function post(request: APIRequestContext, path: string, data: unknown) {
  const response = await request.post(`${apiBaseUrl()}${path}`, {
    headers: adminApiHeaders(),
    data,
  });
  expect(response.ok(), (await response.text()).slice(0, 2000)).toBeTruthy();
  return response.json();
}

test.describe("Referral shared records", () => {
  // The backend API suite owns attachment authorization. These journeys protect
  // UI selection, delegated presentation and persistence through real writes.
  test("shares clinical records inline and removes only the selected attachment", async ({
    page,
    request,
  }, testInfo) => {
    const facilityId = getFacilityId();
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    const fixture = await createReferralFixture(request, {
      facilityId,
      patientId,
      encounterId,
    });
    const questionId = faker.string.uuid();
    const formTitle = `Clinical assessment ${fixture.suffix}`;
    const finding = `Assessment finding ${fixture.suffix}`;
    const form = await post(request, "/api/v1/questionnaire/", {
      auth_context: "instance",
      slug: `record-${fixture.suffix}`,
      title: formTitle,
      description: "Shared clinical assessment",
      status: "active",
      subject_type: "encounter",
      actions: [],
      questions: [
        {
          id: questionId,
          link_id: "finding",
          text: "Clinical finding",
          type: "string",
          required: true,
        },
      ],
    });
    const clinical = await post(
      request,
      `/api/v1/questionnaire/${form.id}/submit/`,
      {
        resource_id: fixture.encounterId,
        encounter: fixture.encounterId,
        patient: fixture.patientId,
        results: [
          {
            question_id: questionId,
            values: [{ value: finding }],
            note: "Review at the receiving clinic",
          },
        ],
      },
    );
    const diagnosisNote = `Continue assessment for asthma ${fixture.suffix}`;
    const onset = "Symptoms began during childhood";
    const onsetNote = `Intermittent since school age ${fixture.suffix}`;
    const [diagnosis] = await post(
      request,
      `/api/v1/patient/${fixture.patientId}/diagnosis/upsert/`,
      {
        datapoints: [
          {
            encounter: fixture.encounterId,
            code: {
              system: "http://snomed.info/sct",
              code: "195967001",
              display: "Asthma",
            },
            clinical_status: "active",
            verification_status: "confirmed",
            severity: "moderate",
            category: "encounter_diagnosis",
            onset: { onset_string: onset, note: onsetNote },
            note: diagnosisNote,
          },
        ],
      },
    );
    await page.goto(fixture.path);
    const records = page
      .getByRole("region", { name: "Referral request", exact: true })
      .getByRole("region", { name: "Shared records", exact: true });
    await records
      .getByRole("button", { name: "Add record", exact: true })
      .click();
    const picker = page.getByRole("dialog", {
      name: "Add record",
      exact: true,
    });
    await picker.getByRole("combobox", { name: "Record type" }).click();
    await expect(page.getByRole("option")).toHaveCount(6);
    await page.getByRole("option", { name: "Response", exact: true }).click();
    await picker
      .getByRole("button", { name: `Select ${formTitle}`, exact: true })
      .click();
    await picker
      .getByRole("button", { name: "Add record", exact: true })
      .click();
    await expect(picker).not.toBeVisible();
    const responseRecords = page
      .getByRole("region", { name: "Responses", exact: true })
      .getByRole("region", { name: "Response records", exact: true });
    await page
      .getByRole("region", { name: "Responses", exact: true })
      .getByRole("button", { name: "Respond", exact: true })
      .click();
    await expect(page).toHaveURL(
      (url) => url.pathname === `${fixture.path}/respond`,
    );
    const draftRecommendation = `Unsaved response draft ${fixture.suffix}`;
    const responseInput = questionBlock(page, fixture.responseLabel).getByRole(
      "textbox",
    );
    await responseInput.fill(draftRecommendation);
    const editorRecords = page.getByRole("region", {
      name: "Response records",
      exact: true,
    });
    await expect(
      editorRecords.getByText(
        "Records are shared immediately and remain attached if you discard unsaved answers.",
        { exact: true },
      ),
    ).toBeVisible();
    await editorRecords
      .getByRole("button", { name: "Add record", exact: true })
      .click();
    await expect(
      picker.getByText("Response records", { exact: true }),
    ).toBeVisible();
    await picker.getByRole("combobox", { name: "Record type" }).click();
    await page.getByRole("option", { name: "Diagnosis", exact: true }).click();
    await picker
      .getByRole("button", { name: "Select Asthma", exact: true })
      .click();
    await picker
      .getByRole("button", { name: "Add record", exact: true })
      .click();
    await expect(picker).not.toBeVisible();
    await expect(responseInput).toHaveValue(draftRecommendation);
    await expect(
      editorRecords
        .getByRole("region", { name: "Asthma", exact: true })
        .getByText(diagnosisNote, { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    const discard = page.getByRole("alertdialog", {
      name: "Discard response?",
      exact: true,
    });
    await discard.getByRole("button", { name: "Discard", exact: true }).click();
    await expect(page).toHaveURL(fixture.path);
    await expect(
      responseRecords
        .getByRole("region", { name: "Asthma", exact: true })
        .getByText(diagnosisNote, { exact: true }),
    ).toBeVisible();
    const referralAfterDiscard = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/`,
      { headers: adminApiHeaders() },
    );
    expect(referralAfterDiscard.ok()).toBeTruthy();
    const savedReferral = (await referralAfterDiscard.json()) as {
      questionnaire_responses: { questionnaire_type: string }[];
    };
    expect(
      savedReferral.questionnaire_responses.filter(
        (item) => item.questionnaire_type === "response",
      ),
    ).toHaveLength(0);
    const attachments = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/resources/`,
      { headers: adminApiHeaders() },
    );
    expect(attachments.ok()).toBeTruthy();
    const attached = (await attachments.json()) as {
      results: { id: string; resource_id: string }[];
    };
    const validAttachment = attached.results.find(
      (item) => item.resource_id === clinical.id,
    );
    expect(validAttachment).toBeDefined();
    expect(attached.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resource_id: clinical.id,
          attachment_type: "source",
        }),
        expect.objectContaining({
          resource_id: diagnosis.id,
          attachment_type: "response",
        }),
      ]),
    );
    const withdrawnClinical = await post(
      request,
      `/api/v1/questionnaire/${form.id}/submit/`,
      {
        resource_id: fixture.encounterId,
        encounter: fixture.encounterId,
        patient: fixture.patientId,
        results: [
          {
            question_id: questionId,
            values: [{ value: `Withdrawn attachment ${fixture.suffix}` }],
          },
        ],
      },
    );
    const withdrawnAttachment = await post(
      request,
      `/api/v1/referral/${fixture.referralId}/resources/`,
      {
        resource_type: "questionnaire_response",
        resource_id: withdrawnClinical.id,
        attachment_type: "source",
      },
    );
    const batchUrl = (url: URL) => url.pathname === "/api/v1/batch_requests/";
    const hasBothAttachments = (
      body: {
        requests?: { reference_id: string }[];
      } | null,
    ) =>
      [validAttachment!.id, withdrawnAttachment.id].every((id) =>
        body?.requests?.some((item) => item.reference_id === id),
      );
    let withdrawnDuringResolve = false;
    await page.route(batchUrl, async (route) => {
      if (
        !withdrawnDuringResolve &&
        hasBothAttachments(route.request().postDataJSON())
      ) {
        // The list is current when fetched, but another user withdraws one
        // attachment before the real backend resolves the batch.
        withdrawnDuringResolve = true;
        const removed = await request.delete(
          `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/resources/${withdrawnAttachment.id}/`,
          { headers: adminApiHeaders() },
        );
        expect(removed.ok()).toBeTruthy();
      }
      await route.continue();
    });
    const mixedBatch = page.waitForResponse(
      (response) =>
        batchUrl(new URL(response.url())) &&
        hasBothAttachments(response.request().postDataJSON()),
    );
    await page.reload();
    const mixedResult = await mixedBatch;
    expect(await mixedResult.json()).toMatchObject({
      results: expect.arrayContaining([
        expect.objectContaining({
          reference_id: validAttachment!.id,
          status_code: 200,
        }),
        expect.objectContaining({
          reference_id: withdrawnAttachment.id,
          status_code: 404,
        }),
      ]),
    });
    expect(withdrawnDuringResolve).toBe(true);
    const referralUrl = page.url();
    const preview = records.getByRole("region", {
      name: formTitle,
      exact: true,
    });
    await expect(page).toHaveURL(referralUrl);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(preview.getByText(finding, { exact: true })).toBeVisible();
    const diagnosisRecord = responseRecords.getByRole("region", {
      name: "Asthma",
      exact: true,
    });
    await expect(diagnosisRecord).toBeVisible();
    for (const detail of [
      "Active",
      "Confirmed",
      "Moderate",
      onset,
      onsetNote,
      diagnosisNote,
    ]) {
      await expect(diagnosisRecord).toContainText(detail);
    }
    await expect(
      preview.getByText("(Review at the receiving clinic)", { exact: true }),
    ).toBeVisible();
    const unavailable = records.getByRole("region", {
      name: "Response",
      exact: true,
    });
    await expect(unavailable.getByRole("alert")).toContainText(
      "This record is no longer available or could not be loaded.",
    );
    await expect(preview.getByText(finding, { exact: true })).toBeVisible();
    await page.unroute(batchUrl);
    const retriedBatch = page.waitForResponse(
      (response) =>
        batchUrl(new URL(response.url())) &&
        hasBothAttachments(response.request().postDataJSON()),
    );
    await unavailable
      .getByRole("button", { name: "Retry", exact: true })
      .click();
    expect((await (await retriedBatch).json()).results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reference_id: validAttachment!.id,
          status_code: 200,
        }),
        expect.objectContaining({
          reference_id: withdrawnAttachment.id,
          status_code: 404,
        }),
      ]),
    );
    await expect(preview.getByText(finding, { exact: true })).toBeVisible();
    await expect(
      unavailable.getByRole("button", { name: "Retry", exact: true }),
    ).toBeVisible();
    await expect(
      diagnosisRecord.getByText(diagnosisNote, { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('[data-sonner-toast][data-type="error"]'),
    ).toHaveCount(0);
    const originalViewport = page.viewportSize();
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(async () => {
        await preview.scrollIntoViewIfNeeded();
        await expect(preview.getByText(finding, { exact: true })).toBeVisible();
      }).toPass();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(
          `shared-response-inline-${viewport.width}.png`,
        ),
        fullPage: true,
        animations: "disabled",
      });
    }
    if (originalViewport) await page.setViewportSize(originalViewport);
    await page.reload();
    await expect(preview).toBeVisible();
    await expect(unavailable).toHaveCount(0);
    await expect(preview.getByText(finding, { exact: true })).toBeVisible();
    const detailUrl = page.url();
    await page
      .getByRole("region", { name: "Responses", exact: true })
      .getByRole("button", { name: "Respond", exact: true })
      .click();
    await expect(page).toHaveURL(
      (url) => url.pathname === `${fixture.path}/respond`,
    );
    await page
      .getByRole("tab", { name: "Referral and shared records", exact: true })
      .click();
    await expect(
      page
        .getByRole("tabpanel", {
          name: "Referral and shared records",
          exact: true,
        })
        .getByRole("region", { name: "Shared records", exact: true })
        .getByRole("region", { name: formTitle, exact: true })
        .getByText(finding, { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page).toHaveURL(detailUrl);
    await preview
      .getByRole("button", {
        name: `Actions for ${formTitle}`,
        exact: true,
      })
      .click();
    await page.getByRole("menuitem", { name: "Remove", exact: true }).click();
    const confirm = page.getByRole("alertdialog", {
      name: "Remove shared record?",
    });
    await confirm.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(confirm).not.toBeVisible();
    await expect(preview).toHaveCount(0);
    // Keep the browser session: the reference tab's all-category cache must not
    // keep a removed source attachment disabled in the scoped record picker.
    await records
      .getByRole("button", { name: "Add record", exact: true })
      .click();
    await picker.getByRole("combobox", { name: "Record type" }).click();
    await page.getByRole("option", { name: "Response", exact: true }).click();
    const availableResponses = picker.getByRole("button", {
      name: `Select ${formTitle}`,
      exact: true,
    });
    // Both native responses remain on the patient; neither is shared now.
    await expect(availableResponses).toHaveCount(2);
    for (const candidate of await availableResponses.all()) {
      await expect(candidate).toBeEnabled();
    }
    await picker.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(picker).not.toBeVisible();
    await page.reload();
    await expect(preview).toHaveCount(0);
    await expect(
      diagnosisRecord.getByText(diagnosisNote, { exact: true }),
    ).toBeVisible();
    const remainingAttachments = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/resources/`,
      { headers: adminApiHeaders() },
    );
    expect(remainingAttachments.ok()).toBeTruthy();
    expect(await remainingAttachments.json()).toMatchObject({
      count: 1,
      results: [
        {
          resource_type: "condition",
          resource_id: diagnosis.id,
          attachment_type: "response",
        },
      ],
    });
    const original = await request.get(
      `${apiBaseUrl()}/api/v1/patient/${fixture.patientId}/questionnaire_response/${clinical.id}/`,
      { headers: adminApiHeaders() },
    );
    expect(original.ok()).toBeTruthy();
    expect(await original.json()).toMatchObject({
      status: "completed",
      responses: [{ question_id: questionId, values: [{ value: finding }] }],
    });
  });

  test("retains an uploaded referral file when sharing fails and retries without uploading again", async ({
    page,
    request,
  }, testInfo) => {
    const fixture = await createReferralFixture(request);
    const name = `Shared image ${fixture.suffix}`;
    await page.goto(fixture.path);
    const records = page
      .getByRole("region", { name: "Responses", exact: true })
      .getByRole("region", { name: "Response records", exact: true });
    await page
      .getByRole("region", { name: "Responses", exact: true })
      .getByRole("button", { name: "Respond", exact: true })
      .click();
    await expect(page).toHaveURL(
      (url) => url.pathname === `${fixture.path}/respond`,
    );
    const responsePageUrl = page.url();
    await page
      .getByRole("region", { name: "Response records", exact: true })
      .getByRole("button", { name: "Upload file", exact: true })
      .click();
    const upload = page.getByRole("dialog", {
      name: "Upload File",
      exact: true,
    });
    await upload
      .locator('input[type="file"]')
      .setInputFiles("tests/fixtures/images/sample_img2.png");
    await upload
      .getByRole("textbox", { name: "File Name", exact: true })
      .fill(name);
    const attachmentPath = `/api/v1/referral/${fixture.referralId}/resources/`;
    const attachmentUrl = (url: URL) => url.pathname === attachmentPath;
    let interruptedAttachment = false;
    await page.route(attachmentUrl, async (route) => {
      if (route.request().method() === "POST" && !interruptedAttachment) {
        interruptedAttachment = true;
        await route.abort("failed");
        return;
      }
      await route.continue();
    });
    await upload
      .getByRole("button", { name: "Upload and share", exact: true })
      .click();
    const retry = upload.getByRole("button", {
      name: "Retry sharing",
      exact: true,
    });
    await expect(retry).toBeVisible({ timeout: 30000 });
    expect(interruptedAttachment).toBe(true);
    await expect(upload).toContainText(name);
    await expect(page).toHaveURL(responsePageUrl);
    await page.unroute(attachmentUrl);
    await retry.click();
    await expect(upload).not.toBeVisible({ timeout: 30000 });
    await expect(page).toHaveURL(responsePageUrl);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page).toHaveURL(fixture.path);
    await page.reload();
    const referralUrl = page.url();
    await records
      .getByRole("button", { name: `View ${name}`, exact: true })
      .click();
    const file = page.getByRole("dialog", {
      name: "File Preview",
      exact: true,
    });
    await expect(file).toBeVisible();
    await expect(page).toHaveURL(referralUrl);
    await expect(
      file.getByRole("button", { name: "Download", exact: true }),
    ).toBeVisible();
    await expect(
      file.getByRole("button", { name: "Zoom In", exact: true }),
    ).toBeVisible();
    const image = file.getByRole("img", { name: new RegExp(name) });
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBeGreaterThan(0);
    await page.screenshot({
      path: testInfo.outputPath("shared-file-preview.png"),
      fullPage: false,
      animations: "disabled",
    });
    const attachments = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/resources/`,
      { headers: adminApiHeaders() },
    );
    expect(attachments.ok()).toBeTruthy();
    const linked = await attachments.json();
    expect(linked).toMatchObject({
      count: 1,
      results: [{ resource_type: "file_upload", attachment_type: "response" }],
    });
    const referralAfterUpload = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/`,
      { headers: adminApiHeaders() },
    );
    expect(referralAfterUpload.ok()).toBeTruthy();
    const savedReferral = (await referralAfterUpload.json()) as {
      questionnaire_responses: { questionnaire_type: string }[];
    };
    expect(
      savedReferral.questionnaire_responses.filter(
        (item) => item.questionnaire_type === "response",
      ),
    ).toHaveLength(0);
    const files = await request.get(`${apiBaseUrl()}/api/v1/files/`, {
      headers: adminApiHeaders(),
      params: { file_type: "referral", associating_id: fixture.referralId },
    });
    expect(files.ok()).toBeTruthy();
    expect(await files.json()).toMatchObject({
      count: 1,
      results: [
        { id: linked.results[0].resource_id, name, upload_completed: true },
      ],
    });
  });

  test("books through native appointments, repairs its referral link, and returns to the referral", async ({
    page,
    request,
  }) => {
    const facilityId = getFacilityId();
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    const fixture = await createReferralFixture(request, {
      facilityId,
      patientId,
      encounterId,
    });
    const serviceName = `Referral clinic ${fixture.suffix}`;
    const scheduleName = `Consultation ${fixture.suffix}`;
    const service = await post(
      request,
      `/api/v1/facility/${fixture.facilityId}/healthcare_service/`,
      {
        name: serviceName,
        extra_details: "Referral scheduling test",
        internal_type: "scheduling",
        managing_organization: null,
        locations: [],
      },
    );
    const start = new Date();
    const end = new Date(start.getTime() + 7 * 86400000);
    await post(request, `/api/v1/facility/${fixture.facilityId}/schedule/`, {
      name: scheduleName,
      valid_from: start.toISOString(),
      valid_to: end.toISOString(),
      is_public: false,
      resource_type: "healthcare_service",
      resource_id: service.id,
      availabilities: [
        {
          name: `Clinic hours ${fixture.suffix}`,
          slot_type: "appointment",
          slot_size_in_minutes: 60,
          tokens_per_slot: 3,
          availability: Array.from({ length: 7 }, (_, day_of_week) => ({
            day_of_week,
            start_time: "08:00:00",
            end_time: "18:00:00",
          })),
        },
      ],
    });
    const sourceUrl = `/facility/${fixture.facilityId}/referrals?direction=outgoing`;
    const referralPath = `${fixture.path}?${new URLSearchParams({ sourceUrl })}`;
    const appointmentsPath = `/facility/${fixture.facilityId}/patient/${fixture.patientId}/appointments`;
    await page.goto(referralPath);
    const records = page
      .getByRole("region", { name: "Responses", exact: true })
      .getByRole("region", { name: "Response records", exact: true });
    await page
      .getByRole("region", { name: "Appointment and visit", exact: true })
      .getByRole("link", { name: "Book appointment", exact: true })
      .click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === appointmentsPath &&
        url.searchParams.get("open_schedule") === "true" &&
        url.searchParams.get("referralId") === fixture.referralId,
    );
    const booking = page.getByRole("dialog", {
      name: "Book Appointment",
      exact: true,
    });
    await expect(
      booking.getByPlaceholder("Type the reason for visit"),
    ).toHaveValue(fixture.title);
    await booking
      .getByRole("radio", { name: "Healthcare Service", exact: true })
      .click();
    await booking
      .getByRole("combobox", { name: "Select Healthcare Service", exact: true })
      .click();
    await page.getByRole("option", { name: new RegExp(serviceName) }).click();
    // The browser and backend can be on different calendar dates. Choose a
    // complete future schedule day, beyond its first-day midnight boundary.
    const appointmentDate = new Date(start);
    appointmentDate.setDate(appointmentDate.getDate() + 2);
    if (appointmentDate.getMonth() !== start.getMonth())
      await booking
        .getByRole("button", { name: "Next Month", exact: true })
        .click();
    const appointmentDay = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, "0")}-${String(appointmentDate.getDate()).padStart(2, "0")}`;
    const slotsLoaded = page.waitForResponse(
      (response) =>
        response.url().includes("/slots/get_slots_for_day/") &&
        response.request().method() === "POST" &&
        response.request().postDataJSON().day === appointmentDay,
    );
    await booking
      .getByRole("button", {
        name: new RegExp(`^${appointmentDate.getDate()}\\s+\\d+ left$`),
      })
      .click();
    expect((await slotsLoaded).ok()).toBeTruthy();
    // The existing picker preselects the first slot. Choose another slot rather
    // than toggling the default selection off.
    await expect(
      booking.getByRole("button", { name: "Confirm Appointment", exact: true }),
    ).toBeEnabled();
    await booking
      .getByRole("button", { name: /^\d\d:\d\d\s+3 left$/ })
      .nth(1)
      .click();
    await booking
      .getByRole("button", { name: "Confirm Appointment", exact: true })
      .click();
    await expect(booking).not.toBeVisible();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname.startsWith(`${appointmentsPath}/`) &&
        url.searchParams.get("referralId") === fixture.referralId,
    );
    await expect(page.getByText(fixture.title, { exact: true })).toBeVisible();
    const nativeDetailUrl = page.url();
    await page.reload();
    const referralContext = page.getByRole("region", {
      name: "Referral appointment",
      exact: true,
    });
    await expect(
      referralContext.getByText(
        `This appointment is linked to ${fixture.title}.`,
        { exact: true },
      ),
    ).toBeVisible();
    const attachments = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/resources/`,
      { headers: adminApiHeaders() },
    );
    expect(attachments.ok()).toBeTruthy();
    const linked = await attachments.json();
    expect(linked).toMatchObject({
      count: 1,
      results: [{ resource_type: "appointment", attachment_type: "response" }],
    });
    const appointment = await request.get(
      `${apiBaseUrl()}/api/v1/facility/${fixture.facilityId}/appointments/${linked.results[0].resource_id}/`,
      { headers: adminApiHeaders() },
    );
    expect(appointment.ok()).toBeTruthy();
    expect(await appointment.json()).toMatchObject({
      patient: { id: fixture.patientId },
      note: fixture.title,
      status: "booked",
    });
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `${appointmentsPath}/${linked.results[0].resource_id}`,
    );

    // Repair an absent link on the existing native appointment. This must not
    // repeat booking creation when the attachment needs to be retried.
    const detached = await request.delete(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/resources/${linked.results[0].id}/`,
      { headers: adminApiHeaders() },
    );
    expect(detached.ok()).toBeTruthy();
    await page.goto(nativeDetailUrl);
    await referralContext
      .getByRole("button", {
        name: "Link appointment to referral",
        exact: true,
      })
      .click();
    await expect(
      referralContext.getByText(
        `This appointment is linked to ${fixture.title}.`,
        { exact: true },
      ),
    ).toBeVisible();
    const repaired = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${fixture.referralId}/resources/`,
      { headers: adminApiHeaders() },
    );
    expect(repaired.ok()).toBeTruthy();
    expect(await repaired.json()).toMatchObject({
      count: 1,
      results: [
        {
          resource_type: "appointment",
          attachment_type: "response",
          resource_id: linked.results[0].resource_id,
        },
      ],
    });
    const bookings = await request.get(
      `${apiBaseUrl()}/api/v1/facility/${fixture.facilityId}/appointments/`,
      {
        headers: adminApiHeaders(),
        params: {
          resource_type: "healthcare_service",
          resource_ids: service.id,
          patient: fixture.patientId,
        },
      },
    );
    expect(bookings.ok()).toBeTruthy();
    expect(await bookings.json()).toMatchObject({
      count: 1,
      results: [{ id: linked.results[0].resource_id }],
    });

    await referralContext
      .getByRole("link", { name: "Return to referral", exact: true })
      .click();
    await expect(page).toHaveURL(referralPath);
    const inlineAppointment = records.getByRole("region", {
      name: scheduleName,
      exact: true,
    });
    await expect(
      inlineAppointment.getByText(fixture.title, { exact: true }),
    ).toBeVisible();
    await expect(
      inlineAppointment.getByText("Booked", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(referralPath);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("region", { name: "Appointment and visit", exact: true })
      .getByRole("link", { name: "Manage appointment", exact: true })
      .click();
    const appointmentPath = `${appointmentsPath}/${linked.results[0].resource_id}`;
    await expect(page).toHaveURL((url) => url.pathname === appointmentPath);
    await expect(page.getByText(fixture.title, { exact: true })).toBeVisible();

    // A standalone native appointment must not inherit the previous referral
    // context through cached data or the last booking session.
    await page.goto(appointmentPath);
    await expect(page.getByText(fixture.title, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Return to referral", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: "Referral appointment", exact: true }),
    ).toHaveCount(0);
  });
});
