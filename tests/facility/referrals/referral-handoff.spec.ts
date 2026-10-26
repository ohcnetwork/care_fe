import { writeFile } from "node:fs/promises";

import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { createReferralAvailabilityFixture } from "tests/helper/referrals";
import { getFacilityId } from "tests/support/facilityId";

interface Entity {
  id: string;
  name: string;
}

interface Login {
  access: string;
  refresh: string;
}

async function api<T>(
  request: APIRequestContext,
  path: string,
  data?: unknown,
  headers = adminApiHeaders(),
): Promise<T> {
  const response = await request.fetch(`${apiBaseUrl()}${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers,
    data,
  });
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
  return response.json() as Promise<T>;
}

interface DoctorIdentity {
  id: string;
  username: string;
  is_superuser: boolean;
  is_service_account: boolean;
  facilities: Entity[];
}

async function doctorContext(browser: Browser, baseURL: string) {
  return browser.newContext({
    baseURL,
    timezoneId: "Asia/Kolkata",
    storageState: { cookies: [], origins: [] },
  });
}

async function signInDoctor(
  page: Page,
  account: { id: string; username: string; password: string },
  facilityId: string,
) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: /username/i }).fill(account.username);
  await page.getByLabel(/^password$/i).fill(account.password);
  const loginResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/auth/login/" &&
      response.request().method() === "POST",
  );
  const identityResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/users/getcurrentuser/",
  );
  await page.getByRole("button", { name: /login/i }).click();
  const login = await loginResponse;
  expect(login.ok()).toBeTruthy();
  const tokens = (await login.json()) as Login;
  const identityResult = await identityResponse;
  expect(identityResult.ok()).toBeTruthy();
  const identity = (await identityResult.json()) as DoctorIdentity;
  expect(identity).toMatchObject({
    id: account.id,
    username: account.username,
    is_superuser: false,
    is_service_account: false,
  });
  expect(identity.facilities.map((facility) => facility.id)).toEqual([
    facilityId,
  ]);
  return {
    identity,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.access}`,
    },
  };
}

async function completeReferralHandoff(
  {
    browser,
    request,
    baseURL,
  }: {
    browser: Browser;
    request: APIRequestContext;
    baseURL: string | undefined;
  },
  testInfo: TestInfo,
  walkIn: boolean,
) {
  test.slow();
  expect(baseURL, "The browser base URL is required").toBeTruthy();
  const suffix = faker.string.alphanumeric(10).toLowerCase();
  const sourceFacilityId = getFacilityId();
  const sourceFacility = await api<
    Entity & {
      geo_organization: { id: string };
      facility_type: string;
      pincode: number;
    }
  >(request, `/api/v1/facility/${sourceFacilityId}/`);
  const destination = await api<Entity>(request, "/api/v1/facility/", {
    name: `Receiving hospital ${suffix}`,
    description: "Cross-facility referral workflow fixture",
    address: "Test address",
    phone_number: "+919876543210",
    facility_type: sourceFacility.facility_type,
    pincode: sourceFacility.pincode,
    is_public: false,
    geo_organization: sourceFacility.geo_organization.id,
    features: [],
  });
  const department = await api<Entity>(
    request,
    `/api/v1/facility/${destination.id}/organizations/`,
    {
      name: `Specialist department ${suffix}`,
      org_type: "dept",
      description: "Receiving referral team",
    },
  );
  const roles = await api<{ results: (Entity & { contexts: string[] })[] }>(
    request,
    "/api/v1/role/?name=Doctor&limit=100",
  );
  const doctorRole = roles.results.find(
    (role) => role.name === "Doctor" && role.contexts.includes("FACILITY"),
  );
  expect(
    doctorRole,
    "The standard facility Doctor role is required",
  ).toBeTruthy();

  const createDoctor = async (facilityId: string, label: string) => {
    const username = `referral-${label}-${suffix}`;
    const password = `Referral-${suffix}-8!`;
    const user = await api<{ id: string }>(request, "/api/v1/users/", {
      username,
      password,
      first_name: label,
      last_name: suffix,
      email: `${username}@example.test`,
      phone_number: `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`,
      gender: "male",
      role_orgs: [],
    });
    const roots = await api<{ results: Entity[] }>(
      request,
      `/api/v1/facility/${facilityId}/organizations/?org_type=root`,
    );
    expect(roots.results).toHaveLength(1);
    await api(
      request,
      `/api/v1/facility/${facilityId}/organizations/${roots.results[0].id}/users/`,
      { user: user.id, role: doctorRole!.id },
    );
    return { ...user, username, password };
  };
  const sender = await createDoctor(sourceFacilityId, "sender");
  const recipient = await createDoctor(destination.id, "recipient");
  // The receiving department grants referral access separately from the facility root.
  await api(
    request,
    `/api/v1/facility/${destination.id}/organizations/${department.id}/users/`,
    { user: recipient.id, role: doctorRole!.id },
  );
  const { patientId, encounterId } =
    await createQuestionnaireEncounter(sourceFacilityId);
  const patient = await api<{ name: string; date_of_birth: string }>(
    request,
    `/api/v1/patient/${patientId}/`,
  );
  const originEncounter = await api<{ period: { start: string } }>(
    request,
    `/api/v1/encounter/${encounterId}/`,
  );
  const birthday = new Date(patient.date_of_birth);
  const today = new Date();
  const birthdayThisYear = new Date(
    today.getFullYear(),
    birthday.getUTCMonth(),
    birthday.getUTCDate(),
  );
  const patientAge = `${today.getFullYear() - birthday.getUTCFullYear() - (today < birthdayThisYear ? 1 : 0)}y`;
  const encounterStartDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(originEncounter.period.start));

  if (!walkIn) {
    const scheduleName = `Receiving clinic ${suffix}`;
    const scheduleStart = new Date();
    const scheduleStartDay = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(scheduleStart);
    await api(request, `/api/v1/facility/${destination.id}/schedule/`, {
      name: scheduleName,
      valid_from: `${scheduleStartDay}T00:00:00+05:30`,
      valid_to: new Date(scheduleStart.getTime() + 7 * 86400000).toISOString(),
      is_public: false,
      resource_type: "practitioner",
      resource_id: recipient.id,
      availabilities: [
        {
          name: `Consultations ${suffix}`,
          slot_type: "appointment",
          slot_size_in_minutes: 60,
          tokens_per_slot: 3,
          availability: Array.from({ length: 7 }, (_, day_of_week) => ({
            day_of_week,
            start_time: "00:00:00",
            end_time: "23:00:00",
          })),
        },
      ],
    });
  }
  const localFormTitle = `Receiving consultation ${suffix}`;
  const localQuestionLabel = `Receiving assessment ${suffix}`;
  const localForm = await api<Entity>(request, "/api/v1/questionnaire/", {
    auth_context: "facility_organization",
    facility_organization: department.id,
    slug: `receiving-${suffix}`,
    title: localFormTitle,
    description: "Receiving encounter clinical documentation",
    status: "active",
    subject_type: "encounter",
    actions: [],
    questions: [
      {
        id: faker.string.uuid(),
        link_id: "assessment",
        text: localQuestionLabel,
        type: "string",
        required: true,
      },
    ],
  });
  const senderContext = await doctorContext(browser, baseURL!);
  const recipientContext = await doctorContext(browser, baseURL!);
  const senderPage = await senderContext.newPage();
  const recipientPage = await recipientContext.newPage();
  let appointmentCreations = 0;
  recipientPage.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname.endsWith("/create_appointment/")
    )
      appointmentCreations += 1;
  });
  try {
    const senderSession = await signInDoctor(
      senderPage,
      sender,
      sourceFacilityId,
    );
    const recipientSession = await signInDoctor(
      recipientPage,
      recipient,
      destination.id,
    );
    const configuration = await createReferralAvailabilityFixture(request, {
      facilityId: sourceFacilityId,
      patientId,
      encounterId,
      destinationFacilityId: destination.id,
      destinationDepartmentId: department.id,
    });
    const clinicalFinding = `Source consultation findings ${suffix}`;
    const referralNote = `Please review the source consultation ${suffix}`;
    const discussionMessage = `Please review the shared consultation ${suffix}`;
    const clinical = await api<{ id: string }>(
      request,
      `/api/v1/questionnaire/${configuration.requestFormId}/submit/`,
      {
        patient: patientId,
        encounter: encounterId,
        resource_id: encounterId,
        results: [
          {
            question_id: configuration.requestQuestionId,
            values: [{ value: clinicalFinding }],
          },
        ],
      },
      senderSession.headers,
    );
    const fixture =
      await test.step("The sender sends a referral and shares source evidence through the clinical UI", async () => {
        let creationPosts = 0;
        senderPage.on("request", (request) => {
          if (
            new URL(request.url()).pathname === "/api/v1/referral/" &&
            request.method() === "POST"
          )
            creationPosts++;
        });
        await senderPage.goto(
          `/facility/${sourceFacilityId}/patient/${patientId}/encounter/${encounterId}/referrals`,
        );
        await senderPage
          .getByRole("button", { name: "New referral", exact: true })
          .click();
        const creation = senderPage.getByRole("dialog", {
          name: "Request form",
          exact: true,
        });
        await creation
          .getByRole("combobox", { name: "Refer to", exact: true })
          .click();
        await senderPage
          .getByRole("option", { name: "Departments", exact: true })
          .click();
        await creation
          .getByRole("combobox", { name: "Referral unit", exact: true })
          .click();
        await senderPage
          .getByRole("combobox", {
            name: "Search referral units",
            exact: true,
          })
          .fill(configuration.availabilityName);
        await senderPage
          .getByRole("option")
          .filter({ hasText: configuration.availabilityName })
          .click();
        await creation
          .getByRole("textbox", { name: "Referral title", exact: true })
          .fill(configuration.title);
        await creation
          .getByRole("textbox", {
            name: "Additional note (optional)",
            exact: true,
          })
          .fill(referralNote);
        await questionBlock(senderPage, "Referral reason")
          .getByRole("textbox")
          .fill("Specialist assessment requested");
        await creation
          .getByRole("button", { name: "Review referral", exact: true })
          .click();
        await expect(
          creation.getByRole("button", {
            name: "Send referral",
            exact: true,
          }),
        ).toBeEnabled();
        await expect(
          creation
            .getByText("Specialist assessment requested", { exact: true })
            .filter({ visible: true }),
        ).toBeVisible();
        expect(creationPosts).toBe(0);
        await senderPage.screenshot({
          path: testInfo.outputPath("sender-referral-review.png"),
          animations: "disabled",
        });
        const createResponse = senderPage.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === "/api/v1/referral/" &&
            response.request().method() === "POST",
        );
        await creation
          .getByRole("button", { name: "Send referral", exact: true })
          .click();
        const saved = await createResponse;
        expect(saved.ok(), (await saved.text()).slice(0, 2000)).toBeTruthy();
        expect(saved.request().postDataJSON()).toMatchObject({
          availability: configuration.availabilityId,
          patient: patientId,
          encounter: encounterId,
          note: referralNote,
        });
        const referral = (await saved.json()) as {
          id: string;
          status: string;
          created_by: { id: string };
        };
        expect(referral).toMatchObject({
          status: "pending",
          created_by: { id: sender.id },
        });
        expect(creationPosts).toBe(1);
        await expect(creation).not.toBeVisible();
        await senderPage
          .getByRole("row")
          .filter({ hasText: configuration.title })
          .getByRole("link", { name: configuration.title, exact: true })
          .click();
        const sourceRecords = senderPage
          .getByRole("region", { name: "Referral request", exact: true })
          .getByRole("region", { name: "Shared records", exact: true });
        await sourceRecords
          .getByRole("button", { name: "Add record", exact: true })
          .click();
        const picker = senderPage.getByRole("dialog", {
          name: "Add record",
          exact: true,
        });
        await picker
          .getByRole("combobox", { name: "Record type", exact: true })
          .click();
        await senderPage
          .getByRole("option", { name: "Response", exact: true })
          .click();
        await picker
          .getByRole("button", {
            name: `Select ${configuration.requestFormTitle}`,
            exact: true,
          })
          .click();
        await picker
          .getByRole("button", { name: "Add record", exact: true })
          .click();
        await expect(picker).not.toBeVisible();
        await expect(
          sourceRecords.getByText(clinicalFinding, { exact: true }),
        ).toBeVisible();
        const attachments = await api<{
          count: number;
          results: { resource_id: string; attachment_type: string }[];
        }>(
          request,
          `/api/v1/referral/${referral.id}/resources/`,
          undefined,
          senderSession.headers,
        );
        expect(attachments).toMatchObject({
          count: 1,
          results: [{ resource_id: clinical.id, attachment_type: "source" }],
        });
        return {
          ...configuration,
          referralId: referral.id,
          path: `/referrals/${referral.id}`,
        };
      });
    await test.step("The sender finds the referral in the encounter and the recipient in the receiving department", async () => {
      const deniedOrigin = await request.get(
        `${apiBaseUrl()}/api/v1/encounter/${encounterId}/`,
        { headers: recipientSession.headers },
      );
      expect(deniedOrigin.status()).toBe(403);
      const deniedPatient = await request.get(
        `${apiBaseUrl()}/api/v1/patient/${patientId}/`,
        { headers: recipientSession.headers },
      );
      expect(deniedPatient.status()).toBe(404);
      await senderPage.goto(
        `/facility/${sourceFacilityId}/patient/${patientId}/encounter/${encounterId}/referrals`,
      );
      const sent = senderPage
        .getByRole("row")
        .filter({ hasText: fixture.title });
      await expect(sent).toContainText(configuration.availabilityName);
      await sent
        .getByRole("link", { name: fixture.title, exact: true })
        .click();
      await expect(
        senderPage.getByRole("heading", {
          name: fixture.title,
          exact: true,
          level: 1,
        }),
      ).toBeVisible();
      const senderPatient = senderPage.getByRole("region", {
        name: "Patient Details",
        exact: true,
      });
      await expect(
        senderPatient.getByText(patientAge, { exact: true }),
      ).toBeVisible();
      await expect(
        senderPatient.getByText("Male", { exact: true }),
      ).toBeVisible();
      await senderPatient
        .getByRole("button", { name: patient.name, exact: true })
        .click();
      const profile = senderPage.getByRole("link", {
        name: "View Profile",
        exact: true,
      });
      await expect(profile).toHaveAttribute("href", `/patient/${patientId}`);
      await senderPage.keyboard.press("Escape");
      await expect(profile).not.toBeVisible();
      const sourceEncounter = senderPage.getByRole("region", {
        name: "Originating encounter",
        exact: true,
      });
      await expect(sourceEncounter).toContainText("Ambulatory");
      await expect(sourceEncounter).toContainText("In Progress");
      await expect(
        sourceEncounter.getByRole("button", {
          name: `Encounter dates: ${encounterStartDate} – Ongoing`,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        sourceEncounter.getByRole("link", {
          name: "View Encounter",
          exact: true,
        }),
      ).toHaveAttribute(
        "href",
        `/facility/${sourceFacilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
      );

      const senderDiscussion = senderPage.getByRole("region", {
        name: "Discussion",
        exact: true,
      });
      await senderDiscussion
        .getByRole("textbox", { name: "Message", exact: true })
        .fill(discussionMessage);
      await senderDiscussion
        .getByRole("button", { name: "Send message", exact: true })
        .click();
      await expect(
        senderDiscussion.getByText(discussionMessage, { exact: true }),
      ).toBeVisible();

      await recipientPage.goto(
        `/facility/${destination.id}/referrals?referralDepartment=${department.id}`,
      );
      const incoming = recipientPage
        .getByRole("row")
        .filter({ hasText: fixture.title });
      await expect(incoming).toContainText(configuration.availabilityName);
      await incoming
        .getByRole("link", { name: fixture.title, exact: true })
        .click();
      await expect(
        recipientPage.getByText("Specialist assessment requested", {
          exact: true,
        }),
      ).toBeVisible();
      const recipientPatient = recipientPage.getByRole("region", {
        name: "Patient Details",
        exact: true,
      });
      await expect(recipientPatient.getByRole("status")).toContainText(
        "Additional patient details are not available with your current access.",
      );
      await expect(
        recipientPatient.getByText(patient.name, { exact: true }),
      ).toBeVisible();
      await expect(
        recipientPatient.getByText(/^(Male|Female|Transgender|Other|Unknown)$/),
      ).toHaveCount(0);
      await expect(
        recipientPatient.getByText(patientAge, { exact: true }),
      ).toHaveCount(0);
      await expect(recipientPatient).not.toContainText("Blood group:");
      await expect(
        recipientPatient.getByRole("button", {
          name: patient.name,
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(
        recipientPage.getByRole("link", {
          name: "View Encounter",
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(
        recipientPage.getByRole("region", {
          name: "Originating encounter",
          exact: true,
        }),
      ).toContainText(
        "Encounter details are not available with your current access. Shared referral records remain available.",
      );
      const deniedClinical = await request.get(
        `${apiBaseUrl()}/api/v1/patient/${patientId}/questionnaire_response/${clinical.id}/`,
        { headers: recipientSession.headers },
      );
      expect(deniedClinical.status()).toBe(403);
      const recipientReferralUrl = recipientPage.url();
      const recipientRecords = recipientPage
        .getByRole("region", { name: "Referral request", exact: true })
        .getByRole("region", { name: "Shared records", exact: true });
      const clinicalPreview = recipientRecords.getByRole("region", {
        name: configuration.requestFormTitle,
        exact: true,
      });
      await expect(
        clinicalPreview.getByText(clinicalFinding, { exact: true }),
      ).toBeVisible();
      await expect(recipientPage).toHaveURL(recipientReferralUrl);
      await expect(recipientPage.getByRole("dialog")).toHaveCount(0);
      await recipientPage.screenshot({
        path: testInfo.outputPath("recipient-shared-clinical-response.png"),
        animations: "disabled",
      });
      const discussion = recipientPage.getByRole("region", {
        name: "Discussion",
        exact: true,
      });
      await expect(
        discussion.getByText(discussionMessage, { exact: true }),
      ).toBeVisible();
      await recipientPage
        .getByRole("button", { name: "Start referral", exact: true })
        .click();
      await expect(
        recipientPage
          .getByRole("list", { name: "Referral progress", exact: true })
          .getByRole("listitem")
          .filter({ hasText: "In progress" }),
      ).toHaveAttribute("aria-current", "step");
    });

    let appointmentId: string | undefined;
    let receivingEncounterId: string;
    let localResponseId: string;
    let sourceEncounterAccessAfterConsultation: number;
    const localFinding = `Local clinical assessment ${suffix}`;
    const recommendation = `Specialist follow-up recommendation ${suffix}`;
    if (!walkIn) {
      await test.step("The receiving doctor books through the native appointment page", async () => {
        await recipientPage
          .getByRole("link", { name: "Book appointment", exact: true })
          .click();
        const appointmentsPath = `/facility/${destination.id}/patient/${patientId}/appointments`;
        await expect(recipientPage).toHaveURL(
          (url) =>
            url.pathname === appointmentsPath &&
            url.searchParams.get("referralId") === fixture.referralId,
        );
        const booking = recipientPage.getByRole("dialog", {
          name: "Book Appointment",
          exact: true,
        });
        await expect(
          booking.getByPlaceholder("Type the reason for visit"),
        ).toHaveValue(fixture.title);
        await booking
          .getByRole("radio", { name: "Practitioner", exact: true })
          .click();
        await booking
          .getByRole("combobox", { name: "Select Practitioner", exact: true })
          .click();
        await recipientPage
          .getByPlaceholder("Search departments and practitioners")
          .fill(`recipient ${suffix}`);
        const dateInFacility = (date: Date) =>
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(date);
        const todayInFacility = dateInFacility(new Date());
        // Near midnight, use tomorrow's earliest slot; it remains within the
        // native consultation window and avoids the end of today's schedule.
        const appointmentDay = dateInFacility(
          new Date(Date.now() + 2 * 3600000),
        );
        const slotsLoaded = recipientPage.waitForResponse(
          (result) =>
            new URL(result.url()).pathname.endsWith(
              "/slots/get_slots_for_day/",
            ) &&
            result.request().method() === "POST" &&
            result.request().postDataJSON().day === appointmentDay,
        );
        await recipientPage
          .getByRole("option")
          .filter({ hasText: `recipient ${suffix}` })
          .click();
        if (appointmentDay !== todayInFacility) {
          if (appointmentDay.slice(0, 7) !== todayInFacility.slice(0, 7))
            await booking
              .getByRole("button", { name: "Next Month", exact: true })
              .click();
          await booking
            .getByRole("button", {
              name: new RegExp(
                `^${Number(appointmentDay.slice(-2))}\\s+\\d+ left$`,
              ),
            })
            .click();
        }
        expect((await slotsLoaded).ok()).toBeTruthy();
        const confirm = booking.getByRole("button", {
          name: "Confirm Appointment",
          exact: true,
        });
        await expect(confirm).toBeEnabled();
        const created = recipientPage.waitForResponse(
          (result) =>
            new URL(result.url()).pathname.endsWith("/create_appointment/") &&
            result.request().method() === "POST",
        );
        await confirm.click();
        const response = await created;
        expect(response.ok(), await response.text()).toBeTruthy();
        const appointment = await response.json();
        appointmentId = appointment.id;
        expect(appointment).toMatchObject({
          patient: { id: patientId },
          note: fixture.title,
          booked_by: { id: recipient.id },
        });
        await expect(recipientPage).toHaveURL(
          (url) =>
            url.pathname === `${appointmentsPath}/${appointmentId}` &&
            url.searchParams.get("referralId") === fixture.referralId,
        );
        await expect(
          recipientPage.getByRole("region", {
            name: "Referral appointment",
            exact: true,
          }),
        ).toContainText(`This appointment is linked to ${fixture.title}.`);
        const origin = await request.get(
          `${apiBaseUrl()}/api/v1/encounter/${encounterId}/`,
          { headers: recipientSession.headers },
        );
        expect(origin.status()).toBe(403);
        const patientBeforeConsultation = await request.get(
          `${apiBaseUrl()}/api/v1/patient/${patientId}/`,
          { headers: recipientSession.headers },
        );
        expect(patientBeforeConsultation.status()).toBe(404);
      });
    }

    await test.step("Start consultation and document the receiving encounter through its native form", async () => {
      if (walkIn) {
        const origin = await request.get(
          `${apiBaseUrl()}/api/v1/encounter/${encounterId}/`,
          {
            headers: recipientSession.headers,
          },
        );
        expect(origin.status()).toBe(403);
        const inaccessiblePatient = await request.get(
          `${apiBaseUrl()}/api/v1/patient/${patientId}/`,
          {
            headers: recipientSession.headers,
          },
        );
        expect(inaccessiblePatient.status()).toBe(404);
        await recipientPage
          .getByRole("button", { name: /^Start consultation$/i })
          .click();
      } else {
        await recipientPage
          .getByRole("button", { name: /\bStart Consultation$/ })
          .click();
      }
      const encounterForm = recipientPage.getByRole("dialog", {
        name: "Initiate Patient Encounter",
        exact: true,
      });
      await expect(encounterForm).toContainText(patient.name);
      await expect(
        encounterForm.getByRole("combobox", { name: "Status", exact: true }),
      ).toContainText("In Progress");
      await encounterForm
        .getByRole("button", { name: /^Ambulatory Patient visits/ })
        .click();
      await encounterForm
        .getByRole("combobox", { name: "Select Department", exact: true })
        .click();
      await recipientPage
        .getByRole("option", { name: department.name, exact: true })
        .click();
      await expect(
        encounterForm.getByRole("combobox", {
          name: "Select Department",
          exact: true,
        }),
      ).toContainText(department.name);
      const created = recipientPage.waitForResponse(
        (result) =>
          new URL(result.url()).pathname === "/api/v1/encounter/" &&
          result.request().method() === "POST",
      );
      await encounterForm
        .getByRole("button", { name: /^Create Encounter/ })
        .click();
      const response = await created;
      expect(response.ok(), await response.text()).toBeTruthy();
      const encounter = await response.json();
      receivingEncounterId = encounter.id;
      expect(receivingEncounterId).not.toBe(encounterId);
      expect(encounter).toMatchObject({
        patient: { id: patientId },
        facility: { id: destination.id },
        created_by: { id: recipient.id },
        status: "in_progress",
        encounter_class: "amb",
      });
      if (walkIn) {
        expect(
          response.request().postDataJSON().appointment ?? null,
        ).toBeNull();
        expect(encounter.appointment?.id ?? null).toBeNull();
      } else {
        expect(encounter.appointment).toMatchObject({ id: appointmentId });
      }
      await expect(recipientPage).toHaveURL(
        (url) =>
          url.pathname ===
            `/facility/${destination.id}/patient/${patientId}/encounter/${receivingEncounterId}/updates` &&
          url.searchParams.get("referralId") === fixture.referralId &&
          (walkIn
            ? url.searchParams.get("referralEncounterId") ===
                receivingEncounterId &&
              !url.searchParams.has("referralAppointmentId")
            : url.searchParams.get("referralAppointmentId") === appointmentId),
      );
      const receivingEncounterUrl = recipientPage.url();
      const review = recipientPage.getByRole("region", {
        name: "Referral review",
        exact: true,
      });
      await expect(
        review.getByRole("link", { name: "View referral", exact: true }),
      ).toBeVisible();
      await recipientPage.getByRole("button", { name: /\bForms$/ }).click();
      await recipientPage
        .getByPlaceholder("Search Forms", { exact: true })
        .fill(localFormTitle);
      await recipientPage
        .getByRole("option")
        .filter({ hasText: localFormTitle })
        .click();
      await expect(recipientPage).toHaveURL(
        (url) =>
          url.pathname.endsWith(`/questionnaire/${localForm.id}`) &&
          url.searchParams.get("referralId") === fixture.referralId,
      );
      await questionBlock(recipientPage, localQuestionLabel)
        .getByRole("textbox")
        .fill(localFinding);
      const submitted = recipientPage.waitForResponse((result) => {
        if (
          new URL(result.url()).pathname !== "/api/v1/batch_requests/" ||
          result.request().method() !== "POST"
        )
          return false;
        const body = result.request().postDataJSON() as {
          requests: { url: string; method: string }[];
        };
        return body.requests.some(
          (entry) =>
            entry.method === "POST" &&
            entry.url === `/api/v1/questionnaire/${localForm.id}/submit/`,
        );
      });
      await recipientPage
        .getByRole("button", { name: "Save Changes", exact: true })
        .click();
      const savedResponse = await submitted;
      expect(savedResponse.ok(), await savedResponse.text()).toBeTruthy();
      const batch = (await savedResponse.json()) as {
        results: {
          reference_id: string;
          status_code: number;
          data?: { id: string };
        }[];
      };
      const clinicalResult = batch.results.find(
        (entry) => entry.reference_id === localForm.id,
      );
      expect(clinicalResult).toMatchObject({
        status_code: 200,
        data: { id: expect.any(String) },
      });
      localResponseId = clinicalResult!.data!.id;
      const encounterContext = new URL(receivingEncounterUrl);
      await expect(recipientPage).toHaveURL(
        (url) =>
          url.pathname === encounterContext.pathname &&
          [
            "referralId",
            "referralSourceUrl",
            "referralAppointmentId",
            "referralEncounterId",
          ].every(
            (key) =>
              url.searchParams.get(key) ===
              encounterContext.searchParams.get(key),
          ),
      );
      const savedClinical = await api<{
        encounter: { id: string } | string;
        created_by: { id: string };
      }>(
        request,
        `/api/v1/patient/${patientId}/questionnaire_response/${localResponseId}/`,
        undefined,
        recipientSession.headers,
      );
      expect(savedClinical.created_by.id).toBe(recipient.id);
      expect(
        typeof savedClinical.encounter === "string"
          ? savedClinical.encounter
          : savedClinical.encounter.id,
      ).toBe(receivingEncounterId);
      // Baseline patient-wide access can broaden after an active local encounter.
      // Record it explicitly rather than claiming source isolation still holds.
      sourceEncounterAccessAfterConsultation = (
        await request.get(`${apiBaseUrl()}/api/v1/encounter/${encounterId}/`, {
          headers: recipientSession.headers,
        })
      ).status();
      await recipientPage.screenshot({
        path: testInfo.outputPath("recipient-local-encounter.png"),
        fullPage: true,
      });
      await review.getByRole("link", { name: "Respond", exact: true }).click();
      await expect(recipientPage).toHaveURL(
        (url) =>
          url.pathname === `${fixture.path}/respond` &&
          url.searchParams.get("referralFacilityId") === destination.id &&
          (walkIn
            ? url.searchParams.get("referralEncounterId") ===
                receivingEncounterId &&
              !url.searchParams.has("referralAppointmentId")
            : url.searchParams.get("referralAppointmentId") === appointmentId),
      );
      if (walkIn) {
        // The source encounter is readable under native post-consultation policy,
        // so rejection here must be the receiving-facility mismatch, not a 403.
        expect(sourceEncounterAccessAfterConsultation).toBe(200);
        const validResponseUrl = recipientPage.url();
        const wrongFacilityUrl = new URL(validResponseUrl);
        wrongFacilityUrl.searchParams.set("referralEncounterId", encounterId);
        wrongFacilityUrl.searchParams.set(
          "referralFacilityId",
          sourceFacilityId,
        );
        await recipientPage.goto(wrongFacilityUrl.toString());
        await expect(recipientPage.getByRole("alert")).toContainText(
          "The referral link could not be verified. Retry to return to the referral.",
        );
        await expect(
          recipientPage.getByRole("button", {
            name: "Save response and complete",
            exact: true,
          }),
        ).toHaveCount(0);
        await expect(
          questionBlock(recipientPage, fixture.responseLabel),
        ).toHaveCount(0);
        await recipientPage.goto(validResponseUrl);
      }
    });

    await test.step("Share the local clinical record and save a response that completes the referral", async () => {
      await questionBlock(recipientPage, fixture.responseLabel)
        .getByRole("textbox")
        .fill(recommendation);
      const visitResourceUrl = (url: URL) =>
        url.pathname ===
        (walkIn
          ? `/api/v1/encounter/${receivingEncounterId}/`
          : `/api/v1/facility/${destination.id}/appointments/${appointmentId}/`);
      await recipientPage.route(visitResourceUrl, async (route) => {
        await route.fulfill({
          status: 503,
          json: { detail: "Receiving visit temporarily unavailable" },
        });
      });
      const failedRefresh = recipientPage.waitForResponse(
        (result) =>
          visitResourceUrl(new URL(result.url())) &&
          result.request().method() === "GET" &&
          result.status() === 503,
      );
      await recipientPage.context().setOffline(true);
      await expect
        .poll(() => recipientPage.evaluate(() => navigator.onLine))
        .toBe(false);
      await recipientPage.context().setOffline(false);
      await failedRefresh;
      const visitWarning = recipientPage.getByRole("alert").filter({
        hasText: "The receiving visit could not be refreshed.",
      });
      await expect(visitWarning).toContainText(
        "Your answers are kept here. Retry before saving the response.",
      );
      await expect(
        questionBlock(recipientPage, fixture.responseLabel).getByRole(
          "textbox",
        ),
      ).toHaveValue(recommendation);
      const saveResponse = recipientPage.getByRole("button", {
        name: "Save response and complete",
        exact: true,
      });
      await expect(saveResponse).toBeDisabled();
      await recipientPage.unroute(visitResourceUrl);
      await visitWarning
        .getByRole("button", { name: "Retry", exact: true })
        .click();
      await expect(visitWarning).not.toBeVisible();
      await expect(saveResponse).toBeEnabled();
      await expect(
        questionBlock(recipientPage, fixture.responseLabel).getByRole(
          "textbox",
        ),
      ).toHaveValue(recommendation);
      const records = recipientPage.getByRole("region", {
        name: "Response records",
        exact: true,
      });
      await records
        .getByRole("button", { name: "Add record", exact: true })
        .click();
      const picker = recipientPage.getByRole("dialog", {
        name: "Add record",
        exact: true,
      });
      await picker
        .getByRole("combobox", { name: "Record type", exact: true })
        .click();
      await recipientPage
        .getByRole("option", { name: "Response", exact: true })
        .click();
      await picker
        .getByRole("button", {
          name: `Select ${localFormTitle}`,
          exact: true,
        })
        .click();
      await picker
        .getByRole("button", { name: "Add record", exact: true })
        .click();
      await expect(picker).not.toBeVisible();
      await expect(
        records.getByText(localFinding, { exact: true }),
      ).toBeVisible();
      await expect(
        questionBlock(recipientPage, fixture.responseLabel).getByRole(
          "textbox",
        ),
      ).toHaveValue(recommendation);
      await recipientPage.screenshot({
        path: testInfo.outputPath("recipient-response-with-local-record.png"),
        fullPage: true,
      });
      await records
        .getByText(localFinding, { exact: true })
        .scrollIntoViewIfNeeded();
      await recipientPage.screenshot({
        path: testInfo.outputPath("recipient-response-local-record-detail.png"),
        animations: "disabled",
      });
      await recipientPage
        .getByRole("button", {
          name: "Save response and complete",
          exact: true,
        })
        .click();
      await expect(recipientPage).toHaveURL(
        (url) => url.pathname === fixture.path,
      );
      await recipientPage.reload();
      await expect(
        recipientPage
          .getByRole("list", { name: "Referral progress", exact: true })
          .getByRole("listitem")
          .filter({ hasText: "Completed" }),
      ).toHaveAttribute("aria-current", "step");
      const responses = recipientPage.getByRole("region", {
        name: "Responses",
        exact: true,
      });
      await expect(
        responses.getByText(recommendation, { exact: true }),
      ).toBeVisible();
      await expect(
        responses.getByText(localFinding, { exact: true }),
      ).toBeVisible();
      const completedReferralUrl = new URL(recipientPage.url());
      const appointmentVisit = recipientPage.getByRole("region", {
        name: "Appointment and visit",
        exact: true,
      });
      const manageAppointment = appointmentVisit.getByRole("link", {
        name: "Manage appointment",
        exact: true,
      });
      if (walkIn) await expect(manageAppointment).toHaveCount(0);
      else await expect(manageAppointment).toBeVisible();
      await expect(
        appointmentVisit.getByRole("link", { name: "Respond", exact: true }),
      ).toHaveCount(0);
      await appointmentVisit
        .getByRole("link", { name: "View Encounter", exact: true })
        .click();
      await expect(recipientPage).toHaveURL(
        (url) =>
          url.pathname ===
            `/facility/${destination.id}/patient/${patientId}/encounter/${receivingEncounterId}/updates` &&
          url.searchParams.get("referralId") === fixture.referralId,
      );
      const completedReview = recipientPage.getByRole("region", {
        name: "Referral review",
        exact: true,
      });
      await expect(
        completedReview.getByRole("link", {
          name: "View referral",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        completedReview.getByRole("link", { name: "Respond", exact: true }),
      ).toHaveCount(0);
      await completedReview
        .getByRole("link", { name: "View referral", exact: true })
        .click();
      await expect(recipientPage).toHaveURL(
        (url) =>
          url.pathname === completedReferralUrl.pathname &&
          url.searchParams.get("sourceUrl") ===
            completedReferralUrl.searchParams.get("sourceUrl"),
      );
      await recipientPage
        .getByRole("button", { name: "Hide request", exact: true })
        .click();
      await expect(
        recipientPage.getByRole("region", {
          name: "Referral request",
          exact: true,
        }),
      ).not.toBeVisible();
      await expect(
        responses.getByText(recommendation, { exact: true }),
      ).toBeVisible();
      await expect(
        responses.getByText(localFinding, { exact: true }),
      ).toBeVisible();
      await recipientPage
        .getByRole("button", { name: "Show request", exact: true })
        .click();
      await recipientPage.screenshot({
        path: testInfo.outputPath("recipient-completed-referral.png"),
        fullPage: true,
      });
      await senderPage.reload();
      await expect(
        senderPage
          .getByRole("region", { name: "Responses", exact: true })
          .getByText(recommendation, { exact: true }),
      ).toBeVisible();
      await expect(
        senderPage
          .getByRole("region", { name: "Responses", exact: true })
          .getByText(localFinding, { exact: true }),
      ).toBeVisible();
      await senderPage.screenshot({
        path: testInfo.outputPath("sender-completed-referral.png"),
        fullPage: true,
      });
    });

    await test.step("Retain the native visit and each doctor’s authored records without creating duplicate appointments", async () => {
      const saved = await api<{
        status: string;
        created_by: { id: string };
        questionnaire_responses: {
          questionnaire_type: string;
          created_by: { id: string };
        }[];
      }>(
        request,
        `/api/v1/referral/${fixture.referralId}/`,
        undefined,
        senderSession.headers,
      );
      expect(saved).toMatchObject({
        status: "completed",
        encounter: encounterId,
        created_by: { id: sender.id },
      });
      expect(saved.questionnaire_responses).toHaveLength(2);
      expect(
        saved.questionnaire_responses.find(
          (item) => item.questionnaire_type === "response",
        ),
      ).toMatchObject({ created_by: { id: recipient.id } });
      const bookings = await api<{
        count: number;
        results: { id: string }[];
      }>(
        request,
        `/api/v1/patient/${patientId}/get_appointments/?facility=${destination.id}`,
        undefined,
        recipientSession.headers,
      );
      expect(appointmentCreations).toBe(walkIn ? 0 : 1);
      if (walkIn) {
        expect(bookings).toMatchObject({ count: 0, results: [] });
        const localEncounter = await api<{ appointment?: { id?: string } }>(
          request,
          `/api/v1/encounter/${receivingEncounterId}/`,
          undefined,
          recipientSession.headers,
        );
        expect(localEncounter.appointment?.id ?? null).toBeNull();
      } else {
        expect(bookings).toMatchObject({
          count: 1,
          results: [{ id: appointmentId }],
        });
        const booking = await api<unknown>(
          request,
          `/api/v1/facility/${destination.id}/appointments/${appointmentId}/`,
          undefined,
          recipientSession.headers,
        );
        expect(booking).toMatchObject({
          status: "in_consultation",
          associated_encounter: { id: receivingEncounterId },
        });
      }
      const resources = await api<{
        count: number;
        results: {
          resource_type: string;
          attachment_type: string;
          metadata?: Record<string, unknown>;
        }[];
      }>(
        request,
        `/api/v1/referral/${fixture.referralId}/resources/`,
        undefined,
        senderSession.headers,
      );
      expect(resources).toMatchObject({
        count: walkIn ? 2 : 3,
        results: expect.arrayContaining([
          expect.objectContaining({
            resource_type: "questionnaire_response",
            resource_id: clinical.id,
            attachment_type: "source",
          }),
          expect.objectContaining({
            resource_type: "questionnaire_response",
            resource_id: localResponseId,
            attachment_type: "response",
          }),
          ...(!walkIn
            ? [
                expect.objectContaining({
                  resource_type: "appointment",
                  resource_id: appointmentId,
                  attachment_type: "response",
                }),
              ]
            : []),
        ]),
      });
      if (walkIn) {
        expect(
          resources.results.every(
            (record) => record.resource_type === "questionnaire_response",
          ),
        ).toBe(true);
        expect(
          resources.results.some(
            (record) => record.attachment_type === "metadata",
          ),
        ).toBe(false);
        expect(
          resources.results.some((record) =>
            JSON.stringify(record.metadata ?? {}).includes(
              receivingEncounterId,
            ),
          ),
        ).toBe(false);
      }
      const referrals = await api<{
        count: number;
        results: { id: string }[];
      }>(
        request,
        `/api/v1/referral/?patient=${patientId}&availability=${fixture.availabilityId}`,
        undefined,
        senderSession.headers,
      );
      expect(referrals).toMatchObject({
        count: 1,
        results: [{ id: fixture.referralId }],
      });
      const sourceRecord = await api<{ created_by: { id: string } }>(
        request,
        `/api/v1/patient/${patientId}/questionnaire_response/${clinical.id}/`,
        undefined,
        senderSession.headers,
      );
      expect(sourceRecord.created_by.id).toBe(sender.id);
      const messages = await api<{
        count: number;
        results: { message: string; created_by: { id: string } }[];
      }>(
        request,
        `/api/v1/referral/${fixture.referralId}/notes/`,
        undefined,
        recipientSession.headers,
      );
      expect(messages).toMatchObject({
        count: 1,
        results: [
          { message: discussionMessage, created_by: { id: sender.id } },
        ],
      });
      const manifestPath = testInfo.outputPath(
        "cross-facility-identities-and-outcome.json",
      );
      await writeFile(
        manifestPath,
        JSON.stringify(
          {
            sender: {
              id: senderSession.identity.id,
              username: senderSession.identity.username,
              facilityId: sourceFacilityId,
              is_superuser: false,
              role: "Doctor",
            },
            recipient: {
              id: recipientSession.identity.id,
              username: recipientSession.identity.username,
              facilityId: destination.id,
              is_superuser: recipientSession.identity.is_superuser,
              role: "Doctor",
            },
            referralId: fixture.referralId,
            appointmentId: appointmentId ?? null,
            visitType: walkIn ? "walk-in" : "booked",
            sourceEncounterId: encounterId,
            receivingEncounterId,
            sourceEncounterAccessBeforeConsultation: 403,
            sourceEncounterAccessAfterConsultation,
            status: saved.status,
          },
          null,
          2,
        ),
      );
      await testInfo.attach("Cross-facility identities and outcome", {
        path: manifestPath,
        contentType: "application/json",
      });
    });
  } catch (error) {
    // Capture these independent contexts before closing them. Never capture
    // the login form, which contains the synthetic account's password.
    for (const [actor, actorPage] of [
      ["sender", senderPage],
      ["recipient", recipientPage],
    ] as const) {
      if (
        actorPage.isClosed() ||
        !actorPage.url().startsWith(baseURL!) ||
        new URL(actorPage.url()).pathname === "/login"
      )
        continue;
      await actorPage
        .screenshot({
          path: testInfo.outputPath(`${actor}-failure.png`),
          animations: "disabled",
        })
        .catch(() => undefined);
      await actorPage
        .locator("body")
        .ariaSnapshot()
        .then((snapshot) =>
          writeFile(testInfo.outputPath(`${actor}-failure.md`), snapshot),
        )
        .catch(() => undefined);
    }
    throw error;
  } finally {
    await senderContext.close();
    await recipientContext.close();
  }
}

for (const { walkIn, name } of [
  {
    walkIn: false,
    name: "completes a cross-facility referral through a receiving doctor appointment and encounter",
  },
  {
    walkIn: true,
    name: "completes a cross-facility walk-in referral through a receiving doctor encounter",
  },
]) {
  test(name, async ({ browser, request, baseURL }, testInfo) => {
    await completeReferralHandoff(
      { browser, request, baseURL },
      testInfo,
      walkIn,
    );
  });
}
