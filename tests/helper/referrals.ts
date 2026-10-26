import { faker } from "@faker-js/faker";
import { expect, type APIRequestContext } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

// The creation UI has its own workflow test. These fixtures let the management
// and record-sharing journeys begin at a persisted referral with real forms.
interface ReferralFixtureOptions {
  facilityId?: string;
  patientId?: string;
  encounterId?: string;
  destinationFacilityId?: string;
  destinationDepartmentId?: string;
  createHeaders?: Record<string, string>;
}

export async function createReferralAvailabilityFixture(
  request: APIRequestContext,
  options: ReferralFixtureOptions = {},
) {
  const suffix = `${Date.now().toString(36)}${faker.string.alphanumeric(4).toLowerCase()}`;
  const facilityId = options.facilityId ?? getFacilityId();
  const patientId = options.patientId ?? getPatientId();
  const encounterId = options.encounterId ?? getEncounterId();
  const post = async (
    path: string,
    data: unknown,
    headers = adminApiHeaders(),
  ) => {
    const response = await request.post(`${apiBaseUrl()}${path}`, {
      headers,
      data,
    });
    expect(response.ok(), (await response.text()).slice(0, 2000)).toBeTruthy();
    return response.json();
  };
  const requestQuestionId = faker.string.uuid();
  const responseQuestionId = faker.string.uuid();
  const responseTitle = `Specialist response ${suffix}`;
  const responseLabel = `Recommendation ${suffix}`;
  const makeForm = (title: string, slug: string, id: string, label: string) =>
    post("/api/v1/questionnaire/", {
      auth_context: "instance",
      slug,
      title,
      description: "Referral workflow form",
      status: "active",
      subject_type: "encounter",
      actions: [],
      questions: [
        {
          id,
          link_id: "assessment",
          text: label,
          type: "string",
          required: true,
        },
      ],
    });
  const intake = await makeForm(
    `Intake ${suffix}`,
    `intake-${suffix}`,
    requestQuestionId,
    "Referral reason",
  );
  const responseForm = await makeForm(
    responseTitle,
    `reply-${suffix}`,
    responseQuestionId,
    responseLabel,
  );
  const availability = await post("/api/v1/referral_availability/", {
    name: `Specialist service ${suffix}`,
    description: "Referral management test",
    status: "active",
    is_public: true,
    referral_type: "consultation",
    entity_type: options.destinationDepartmentId
      ? "internal_organization"
      : "facility",
    facility: options.destinationFacilityId ?? facilityId,
    ...(options.destinationDepartmentId && {
      internal_organization: options.destinationDepartmentId,
    }),
    care_team: [],
    questionnaires: [
      { questionnaire: intake.id, questionnaire_type: "request" },
      { questionnaire: responseForm.id, questionnaire_type: "response" },
    ],
  });
  const title = `Referral workflow ${suffix}`;
  return {
    suffix,
    facilityId,
    patientId,
    encounterId,
    availabilityId: availability.id as string,
    availabilityName: availability.name as string,
    title,
    responseTitle,
    responseLabel,
    requestFormId: intake.id as string,
    requestFormTitle: intake.title as string,
    requestQuestionId,
  };
}

export async function createReferralFixture(
  request: APIRequestContext,
  options: ReferralFixtureOptions = {},
) {
  const fixture = await createReferralAvailabilityFixture(request, options);
  const response = await request.post(`${apiBaseUrl()}/api/v1/referral/`, {
    headers: options.createHeaders ?? adminApiHeaders(),
    data: {
      availability: fixture.availabilityId,
      patient: fixture.patientId,
      encounter: fixture.encounterId,
      title: fixture.title,
      note: "",
      questionnaire: fixture.requestFormId,
      questionnaire_response: {
        results: [
          {
            question_id: fixture.requestQuestionId,
            values: [{ value: "Specialist assessment requested" }],
          },
        ],
      },
    },
  });
  expect(response.ok(), (await response.text()).slice(0, 2000)).toBeTruthy();
  const referral = (await response.json()) as { id: string };
  return {
    ...fixture,
    referralId: referral.id,
    path: `/referrals/${referral.id}`,
  };
}
