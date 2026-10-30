import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test("creates a patient referral using a patient form without attaching an encounter", async ({
  page,
  request,
}) => {
  const suffix = `${Date.now().toString(36)}${faker.string.alphanumeric(4).toLowerCase()}`;
  const facilityId = getFacilityId();
  const patientId = getPatientId();
  const patientUrl = `/facility/${facilityId}/patient/${patientId}/referrals`;
  const unitPrefix = `Patient referral service ${suffix}`;
  const availabilityName = `${unitPrefix} Receiving service`;
  const originAvailabilityName = `${unitPrefix} Origin service`;
  const receivingFacilityName = `Receiving hospital ${suffix}`;
  const title = `Patient referral ${suffix}`;
  const patientQuestion = `Patient referral reason ${suffix}`;
  const encounterQuestion = `Encounter findings ${suffix}`;
  const answer = `Patient requests specialist follow-up ${suffix}`;
  const patientQuestionId = faker.string.uuid();
  let patientFormId: string;
  let referralId: string;
  let availabilityId: string;
  let receivingFacilityId: string;
  const patientResponse = await request.get(
    `${apiBaseUrl()}/api/v1/patient/${patientId}/`,
    { headers: adminApiHeaders() },
  );
  expect(patientResponse.ok()).toBeTruthy();
  const patient = (await patientResponse.json()) as {
    name: string;
    gender: string;
  };
  const gender =
    patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1);
  const facilityResponse = await request.get(
    `${apiBaseUrl()}/api/v1/facility/${facilityId}/`,
    { headers: adminApiHeaders() },
  );
  expect(facilityResponse.ok()).toBeTruthy();
  const originFacility = (await facilityResponse.json()) as {
    name: string;
    geo_organization: { id: string };
    facility_type: string;
    pincode: number;
  };

  const postFixture = async (path: string, data: unknown) => {
    const response = await request.post(`${apiBaseUrl()}${path}`, {
      headers: adminApiHeaders(),
      data,
    });
    expect(response.ok(), (await response.text()).slice(0, 2000)).toBeTruthy();
    return (await response.json()) as { id: string };
  };

  await test.step("Publish patient and encounter request forms at distinct facilities", async () => {
    const receivingFacility = await postFixture("/api/v1/facility/", {
      name: receivingFacilityName,
      description: "Receiving facility for patient-only referrals",
      address: "Test address",
      phone_number: "+919876543210",
      facility_type: originFacility.facility_type,
      pincode: originFacility.pincode,
      is_public: false,
      geo_organization: originFacility.geo_organization.id,
      features: [],
    });
    receivingFacilityId = receivingFacility.id;
    const questionnaires = [];
    for (const subject of ["encounter", "patient"] as const) {
      const form = await postFixture("/api/v1/questionnaire/", {
        auth_context: "instance",
        slug: `${subject}-${suffix}`,
        title: `${subject} referral intake ${suffix}`,
        description: "Patient referral context test",
        status: "active",
        subject_type: subject,
        actions: [],
        questions: [
          {
            id: subject === "patient" ? patientQuestionId : faker.string.uuid(),
            link_id: "reason",
            text: subject === "patient" ? patientQuestion : encounterQuestion,
            type: "string",
            required: true,
          },
        ],
      });
      if (subject === "patient") patientFormId = form.id;
      questionnaires.push({
        questionnaire: form.id,
        questionnaire_type: "request",
      });
    }
    const availabilityData = {
      description: "Accepts patient and encounter referrals",
      status: "active",
      is_public: true,
      referral_type: "consultation",
      entity_type: "facility",
      care_team: [],
      questionnaires,
    };
    const availability = await postFixture("/api/v1/referral_availability/", {
      ...availabilityData,
      name: availabilityName,
      facility: receivingFacilityId,
    });
    availabilityId = availability.id;
    await postFixture("/api/v1/referral_availability/", {
      ...availabilityData,
      name: originAvailabilityName,
      facility: facilityId,
    });
  });

  await test.step("Submit from the patient's referrals tab with only a patient form", async () => {
    await page.goto(patientUrl);
    await page
      .getByRole("button", { name: "New referral", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Request form",
      exact: true,
    });
    const creationPatient = dialog.getByLabel("Patient Details", {
      exact: true,
    });
    await expect(
      creationPatient.getByRole("button", { name: patient.name, exact: true }),
    ).toBeVisible();
    await expect(
      creationPatient.getByText(gender, { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByLabel("Encounter", { exact: true })).toHaveCount(
      0,
    );
    const unitPicker = dialog.getByRole("combobox", {
      name: "Referral unit",
      exact: true,
    });
    const unitSearch = page.getByRole("combobox", {
      name: "Search referral units",
      exact: true,
    });
    const originUnit = page.getByRole("option").filter({
      hasText: originAvailabilityName,
    });
    const receivingUnit = page.getByRole("option").filter({
      hasText: availabilityName,
    });
    await expect(
      dialog.getByRole("combobox", { name: "Refer to", exact: true }),
    ).toContainText("Facilities");
    await unitPicker.click();
    await unitSearch.fill(unitPrefix);
    await expect(originUnit).toBeVisible();
    await expect(receivingUnit).toBeVisible();
    await receivingUnit.click();
    await expect(questionBlock(page, patientQuestion)).toBeVisible();
    await expect(questionBlock(page, encounterQuestion)).toHaveCount(0);
    await expect(
      dialog.getByRole("combobox", { name: "Request form", exact: true }),
    ).toHaveCount(0);
    await dialog
      .getByRole("textbox", { name: "Referral title", exact: true })
      .fill(title);
    await questionBlock(page, patientQuestion)
      .getByRole("textbox")
      .fill(answer);
    const destination = dialog.getByRole("region", {
      name: "Destination",
      exact: true,
    });
    await destination
      .getByRole("button", {
        name: "Change destination",
        exact: true,
      })
      .click();
    await unitPicker.click();
    await unitSearch.fill(originAvailabilityName);
    await expect(originUnit).toBeVisible();
    await expect(receivingUnit).toHaveCount(0);
    await page.keyboard.press("Escape");
    await destination
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await expect(destination).toContainText(availabilityName);
    await expect(
      dialog.getByRole("textbox", {
        name: "Referral title",
        exact: true,
      }),
    ).toHaveValue(title);
    await expect(
      questionBlock(page, patientQuestion).getByRole("textbox"),
    ).toHaveValue(answer);
    await dialog
      .getByRole("tab", { name: "Patient Clinical History", exact: true })
      .click();
    await expect(
      dialog.getByRole("tab", { name: "Responses", exact: true }),
    ).toBeVisible();
    await dialog
      .getByRole("tab", { name: "Request form", exact: true })
      .click();
    await expect(
      questionBlock(page, patientQuestion).getByRole("textbox"),
    ).toHaveValue(answer);
    await dialog
      .getByRole("button", { name: "Review referral", exact: true })
      .click();
    await expect(dialog).toContainText(answer);
    await expect(creationPatient).toContainText(patient.name);
    await expect(dialog.getByLabel("Encounter", { exact: true })).toHaveCount(
      0,
    );
    const createUrl = (url: URL) => url.pathname === "/api/v1/referral/";
    const failure = "The referral could not be saved. Please try again.";
    let rejectedRequests = 0;
    await page.route(createUrl, async (route) => {
      if (route.request().method() === "POST") {
        rejectedRequests++;
        await route.fulfill({ status: 400, json: { detail: failure } });
        return;
      }
      await route.continue();
    });
    await dialog
      .getByRole("button", { name: "Send referral", exact: true })
      .click();
    const error = dialog.getByRole("alert");
    await expect(error).toContainText(failure);
    await expect(error).toBeInViewport({ ratio: 1 });
    await expect(error).toBeFocused();
    await expect(dialog.getByText(answer, { exact: true })).toBeVisible();
    expect(rejectedRequests).toBe(1);
    await page.unroute(createUrl);
    const created = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/v1/referral/" &&
        response.request().method() === "POST",
    );
    await dialog
      .getByRole("button", { name: "Send referral", exact: true })
      .click();
    const response = await created;
    expect(response.ok(), (await response.text()).slice(0, 2000)).toBeTruthy();
    expect(response.request().postDataJSON()).not.toHaveProperty("encounter");
    expect(response.request().postDataJSON()).toMatchObject({
      availability: availabilityId,
      patient: patientId,
      questionnaire: patientFormId,
    });
    referralId = (await response.json()).id;
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: title }),
    ).toBeVisible();
  });

  await test.step("Reload the saved referral and retain its patient-only origin and answer", async () => {
    const referrals = await request.get(`${apiBaseUrl()}/api/v1/referral/`, {
      headers: adminApiHeaders(),
      params: { patient: patientId, availability: availabilityId },
    });
    expect(referrals.ok()).toBeTruthy();
    expect(await referrals.json()).toMatchObject({
      count: 1,
      results: [{ id: referralId }],
    });
    const saved = await request.get(
      `${apiBaseUrl()}/api/v1/referral/${referralId}/`,
      { headers: adminApiHeaders() },
    );
    expect(saved.ok(), (await saved.text()).slice(0, 2000)).toBeTruthy();
    expect(await saved.json()).toMatchObject({
      patient: patientId,
      encounter: null,
      availability: availabilityId,
      questionnaire_responses: [
        {
          questionnaire: patientFormId,
          questionnaire_snapshot: { subject_type: "patient" },
          questionnaire_response: {
            results: [
              { question_id: patientQuestionId, values: [{ value: answer }] },
            ],
          },
        },
      ],
    });
    await page.getByRole("link", { name: title, exact: true }).click();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: title, exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(answer, { exact: true })).toBeVisible();
    const patientDetails = page.getByRole("region", {
      name: "Patient Details",
      exact: true,
    });
    await expect(
      patientDetails.getByRole("button", { name: patient.name, exact: true }),
    ).toBeVisible();
    await expect(
      patientDetails.getByText(gender, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Originating encounter", exact: true }),
    ).toHaveCount(0);
  });
});
