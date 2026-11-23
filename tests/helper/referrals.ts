import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
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

/** Creates an active, public referral availability with request and response forms through the API. */
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
      subject_type: "referral",
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

/** Creates a referral availability and a pending referral to it through the API. */
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

export interface ReferralRequestInput {
  facilityId: string;
  patientId: string;
  /** Opens the dialog from this encounter's referrals tab (the patient's referrals tab when omitted). */
  encounterId?: string;
  /** The "Refer to" kind; the dialog starts on "Facilities". */
  referTo?: "Facilities" | "Departments";
  /** Name of the referral unit (availability) to send to. */
  unitName: string;
  /** Text typed into the unit search (defaults to `unitName`). */
  unitSearch?: string;
  title: string;
  note?: string;
  /** Answers to the unit's request form, by question label. */
  answers: { question: string; answer: string }[];
}

/** Opens "New Referral", fills the destination, title, note and request form, and opens its review (does not send). */
export async function fillReferralRequestViaUi(
  page: Page,
  {
    facilityId,
    patientId,
    encounterId,
    referTo,
    unitName,
    unitSearch,
    title,
    note,
    answers,
  }: ReferralRequestInput,
): Promise<void> {
  await test.step(
    "referral.create: fill the request",
    async () => {
      await page.goto(
        encounterId
          ? `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/referrals`
          : `/facility/${facilityId}/patient/${patientId}/referrals`,
      );
      await page
        .getByRole("button", { name: "New Referral", exact: true })
        .click();
      const creation = page.getByRole("dialog", {
        name: "Request form",
        exact: true,
      });
      if (referTo) {
        await creation
          .getByRole("combobox", { name: "Refer to", exact: true })
          .click();
        await page.getByRole("option", { name: referTo, exact: true }).click();
      }
      await creation
        .getByRole("combobox", { name: "Referral unit", exact: true })
        .click();
      await page
        .getByRole("combobox", {
          name: "Search referral units",
          exact: true,
        })
        .fill(unitSearch ?? unitName);
      await page.getByRole("option").filter({ hasText: unitName }).click();
      await creation
        .getByRole("textbox", { name: "Referral title", exact: true })
        .fill(title);
      if (note !== undefined)
        await creation
          .getByRole("textbox", {
            name: "Additional note (optional)",
            exact: true,
          })
          .fill(note);
      for (const { question, answer } of answers)
        await questionBlock(page, question).getByRole("textbox").fill(answer);
      await creation
        .getByRole("button", { name: "Review referral", exact: true })
        .click();
    },
    { box: true },
  );
}

/** Sends a referral through the "New Referral" dialog of a patient or encounter. */
export async function createReferralViaUi(
  page: Page,
  input: ReferralRequestInput,
): Promise<{ referralId: string }> {
  return test.step(
    "referral.create",
    async () => {
      await fillReferralRequestViaUi(page, input);
      const creation = page.getByRole("dialog", {
        name: "Request form",
        exact: true,
      });
      const createResponse = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/v1/referral/" &&
          response.request().method() === "POST",
      );
      await creation
        .getByRole("button", { name: "Send referral", exact: true })
        .click();
      const saved = await createResponse;
      expect(saved.ok(), (await saved.text()).slice(0, 2000)).toBeTruthy();
      const referral = (await saved.json()) as { id: string };
      await expect(creation).toBeHidden();
      return { referralId: referral.id };
    },
    { box: true },
  );
}
