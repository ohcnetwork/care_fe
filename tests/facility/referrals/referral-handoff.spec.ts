import { writeFile } from "node:fs/promises";

import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type Page,
} from "@playwright/test";
import { openMultiFilter } from "tests/helper/multiFilter";
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
  await page.getByLabel(/password/i).fill(account.password);
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

test("hands a referral between facility doctors with an existing appointment, response, and completion", async ({
  browser,
  request,
  baseURL,
}, testInfo) => {
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
  // Facility membership permits scheduling; this department owns its incoming
  // referrals and grants clinical access separately from the facility root.
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
  }).format(new Date(originEncounter.period.start));

  // A real destination appointment exists before the referral's response.
  // Booking creation and retry already have their own native UI journey.
  const scheduleName = `Specialist visit ${suffix}`;
  const start = new Date();
  await api(request, `/api/v1/facility/${destination.id}/schedule/`, {
    name: scheduleName,
    valid_from: start.toISOString(),
    valid_to: new Date(start.getTime() + 7 * 86400000).toISOString(),
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
          start_time: "08:00:00",
          end_time: "18:00:00",
        })),
      },
    ],
  });
  const appointmentDate = new Date(start);
  appointmentDate.setDate(appointmentDate.getDate() + 2);
  const day = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, "0")}-${String(appointmentDate.getDate()).padStart(2, "0")}`;
  const senderContext = await doctorContext(browser, baseURL!);
  const recipientContext = await doctorContext(browser, baseURL!);
  const senderPage = await senderContext.newPage();
  const recipientPage = await recipientContext.newPage();
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
    const slots = await api<{ results: { id: string }[] }>(
      request,
      `/api/v1/facility/${destination.id}/slots/get_slots_for_day/`,
      { resource_type: "practitioner", resource_id: recipient.id, day },
      recipientSession.headers,
    );
    expect(slots.results.length).toBeGreaterThan(0);
    const appointmentNote = `Existing specialist appointment ${suffix}`;
    const appointment = await api<{ id: string; status: string }>(
      request,
      `/api/v1/facility/${destination.id}/slots/${slots.results[0].id}/create_appointment/`,
      { patient: patientId, note: appointmentNote },
      recipientSession.headers,
    );
    expect(appointment.status).toBe("booked");
    const configuration = await createReferralAvailabilityFixture(request, {
      facilityId: sourceFacilityId,
      patientId,
      encounterId,
      destinationFacilityId: destination.id,
      destinationDepartmentId: department.id,
    });
    const clinicalFinding = `Source consultation findings ${suffix}`;
    const referralNote = `Please review the source consultation ${suffix}`;
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
      await test.step("The sender creates, attaches source evidence, reviews and sends through the clinical UI", async () => {
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
          .getByRole("combobox", { name: "Facility", exact: true })
          .click();
        await senderPage
          .getByRole("combobox", { name: "Search facilities", exact: true })
          .fill(destination.name);
        await senderPage
          .getByRole("option", { name: destination.name, exact: true })
          .click();
        await creation
          .getByRole("combobox", { name: "Department / team", exact: true })
          .click();
        await senderPage
          .getByRole("combobox", {
            name: "Search departments / teams",
            exact: true,
          })
          .fill(department.name);
        await senderPage
          .getByRole("option", { name: department.name, exact: true })
          .click();
        await creation
          .getByRole("combobox", { name: "Referral unit", exact: true })
          .click();
        await senderPage
          .getByRole("combobox", { name: "Search referral units", exact: true })
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
          .getByRole("button", { name: "Add to referral", exact: true })
          .click();
        await expect(picker).not.toBeVisible();
        await creation
          .getByRole("button", { name: "Review referral", exact: true })
          .click();
        await expect(
          creation.getByRole("button", { name: "Send referral", exact: true }),
        ).toBeEnabled();
        await expect(
          creation
            .getByText("1 record selected", { exact: true })
            .filter({ visible: true }),
        ).toBeVisible();
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
          resources: [
            {
              resource_type: "questionnaire_response",
              resource_id: clinical.id,
              attachment_type: "source",
            },
          ],
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
        return {
          ...configuration,
          referralId: referral.id,
          path: `/referrals/${referral.id}`,
        };
      });
    await test.step("Each doctor finds the referral in their own facility context", async () => {
      const deniedOrigin = await request.get(
        `${apiBaseUrl()}/api/v1/encounter/${encounterId}/`,
        { headers: recipientSession.headers },
      );
      expect(deniedOrigin.status()).toBe(403);
      const deniedAppointment = await request.get(
        `${apiBaseUrl()}/api/v1/facility/${destination.id}/appointments/${appointment.id}/`,
        { headers: senderSession.headers },
      );
      expect(deniedAppointment.status()).toBe(403);

      await senderPage.goto(
        `/facility/${sourceFacilityId}/referrals?referralDirection=outgoing`,
      );
      const outgoing = senderPage
        .getByRole("row")
        .filter({ hasText: fixture.title });
      await expect(outgoing).toContainText(department.name);
      await expect(outgoing).toContainText(destination.name);
      await outgoing
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

      await recipientPage.goto(
        `/facility/${destination.id}/referrals?referralDirection=incoming`,
      );
      const incoming = recipientPage
        .getByRole("row")
        .filter({ hasText: fixture.title });
      await expect(incoming).toContainText(sourceFacility.name);
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
      await recipientPage
        .getByRole("button", {
          name: "Manage assignees",
          exact: true,
        })
        .click();
      const assignment = recipientPage.getByRole("dialog", {
        name: "Manage assignees",
        exact: true,
      });
      await expect(
        assignment.getByRole("combobox", {
          name: "Find team members in",
          exact: true,
        }),
      ).toContainText(destination.name);
      await assignment
        .getByRole("combobox", { name: "Select Member", exact: true })
        .click();
      await recipientPage
        .getByRole("combobox", { name: "Search", exact: true })
        .fill(recipient.username);
      await recipientPage
        .getByRole("option")
        .filter({
          has: recipientPage.getByText(recipient.username, { exact: true }),
        })
        .click();
      await assignment
        .getByRole("combobox", { name: "Select Role", exact: true })
        .click();
      await recipientPage
        .getByPlaceholder("Select Role", { exact: true })
        .fill("Doctor");
      await recipientPage
        .getByRole("option")
        .filter({
          has: recipientPage.getByText("Doctor", { exact: true }),
        })
        .click();
      await assignment
        .getByRole("button", { name: "Add", exact: true })
        .click();
      await assignment
        .getByRole("button", { name: "Save Changes", exact: true })
        .click();
      await expect(assignment).not.toBeVisible();
      const assigned = await api<{
        status: string;
        assignees: { member: { id: string }; role: { display: string } }[];
      }>(
        request,
        `/api/v1/referral/${fixture.referralId}/`,
        undefined,
        recipientSession.headers,
      );
      expect(assigned).toMatchObject({
        status: "pending",
        assignees: [
          { member: { id: recipient.id }, role: { display: "Doctor" } },
        ],
      });
      expect(assigned.assignees).toHaveLength(1);
      await recipientPage
        .getByRole("link", { name: "Back", exact: true })
        .click();
      await recipientPage
        .getByRole("heading", { name: "Referrals", exact: true })
        .hover();
      const assignedResponse = recipientPage.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === "/api/v1/referral/" &&
          url.searchParams.get("entity_id") === destination.id &&
          url.searchParams.get("assigned_to_me") === "true"
        );
      });
      await openMultiFilter(recipientPage, /^Assigned to me\b/);
      await recipientPage
        .getByRole("menu")
        .getByText("Yes", { exact: true })
        .click();
      await recipientPage.keyboard.press("Escape");
      const inbox = await assignedResponse;
      expect(inbox.ok()).toBeTruthy();
      expect(await inbox.json()).toMatchObject({
        count: 1,
        results: [{ id: fixture.referralId }],
      });
      await incoming
        .getByRole("link", { name: fixture.title, exact: true })
        .click();
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

    await test.step("Both doctors coordinate in the referral discussion", async () => {
      const message = `Please review the attached consultation ${suffix}`;
      const reply = `I have reviewed the shared consultation ${suffix}`;
      const senderDiscussion = senderPage.getByRole("region", {
        name: "Discussion",
        exact: true,
      });
      const recipientDiscussion = recipientPage.getByRole("region", {
        name: "Discussion",
        exact: true,
      });
      await senderDiscussion
        .getByRole("textbox", { name: "Message", exact: true })
        .fill(message);
      await senderDiscussion
        .getByRole("button", { name: "Send message", exact: true })
        .click();
      await expect(
        senderDiscussion.getByText(message, { exact: true }),
      ).toBeVisible();
      await recipientPage.reload();
      await expect(
        recipientDiscussion.getByText(message, { exact: true }),
      ).toBeVisible();
      await recipientDiscussion
        .getByRole("textbox", { name: "Message", exact: true })
        .fill(reply);
      await recipientDiscussion
        .getByRole("button", { name: "Send message", exact: true })
        .click();
      await expect(
        recipientDiscussion.getByText(reply, { exact: true }),
      ).toBeVisible();
      await senderPage.reload();
      await expect(
        senderDiscussion.getByText(reply, { exact: true }),
      ).toBeVisible();
      const messages = await api<{
        count: number;
        results: { message: string }[];
      }>(
        request,
        `/api/v1/referral/${fixture.referralId}/notes/`,
        undefined,
        senderSession.headers,
      );
      expect(messages.count).toBe(2);
      expect(messages.results.map((item) => item.message)).toEqual(
        expect.arrayContaining([message, reply]),
      );
    });

    await test.step("Referral booking context opens without granting access to the origin chart", async () => {
      const deniedPatient = await request.get(
        `${apiBaseUrl()}/api/v1/patient/${patientId}/`,
        { headers: recipientSession.headers },
      );
      expect([403, 404]).toContain(deniedPatient.status());
      await recipientPage
        .getByRole("link", { name: "Book appointment", exact: true })
        .click();
      await expect(recipientPage).toHaveURL(
        (url) =>
          url.pathname ===
            `/facility/${destination.id}/patient/${patientId}/appointments` &&
          url.searchParams.get("referralId") === fixture.referralId,
      );
      const booking = recipientPage.getByRole("dialog", {
        name: "Book Appointment",
        exact: true,
      });
      await expect(booking).toBeVisible();
      await expect(
        booking.getByPlaceholder("Type the reason for visit"),
      ).toHaveValue(fixture.title);
      await booking.getByRole("button", { name: "Close", exact: true }).click();
      await expect(booking).not.toBeVisible();
      await expect(
        recipientPage.getByRole("heading", { name: patient.name, exact: true }),
      ).toBeVisible();
      await recipientPage
        .getByRole("link")
        .filter({ hasText: `Consultations ${suffix}` })
        .click();
      await expect(recipientPage).toHaveURL(
        (url) =>
          url.pathname ===
            `/facility/${destination.id}/patient/${patientId}/appointments/${appointment.id}` &&
          url.searchParams.get("referralId") === fixture.referralId,
      );
      await expect(
        recipientPage.getByText(appointmentNote, { exact: true }),
      ).toBeVisible();
    });

    await test.step("The recipient links the existing appointment from its native detail page", async () => {
      const context = recipientPage.getByRole("region", {
        name: "Referral appointment",
        exact: true,
      });
      await context
        .getByRole("button", {
          name: "Link appointment to referral",
          exact: true,
        })
        .click();
      await expect(context).toContainText(
        `This appointment is linked to ${fixture.title}.`,
      );
      await recipientPage.reload();
      await expect(context).toContainText(
        `This appointment is linked to ${fixture.title}.`,
      );
      await context
        .getByRole("link", { name: "Return to referral", exact: true })
        .click();
      await expect(recipientPage).toHaveURL(
        (url) => url.pathname === fixture.path,
      );
      const referralUrl = recipientPage.url();
      const records = recipientPage
        .getByRole("region", { name: "Referral request", exact: true })
        .getByRole("region", { name: "Shared records", exact: true });
      const responseRecords = recipientPage
        .getByRole("region", { name: "Responses", exact: true })
        .getByRole("region", { name: "Response records", exact: true });
      const appointmentPanel = responseRecords.getByRole("region", {
        name: scheduleName,
        exact: true,
      });
      await expect(
        appointmentPanel.getByText(appointmentNote, { exact: true }),
      ).toBeVisible();
      const clinicalPanel = records.getByRole("region", {
        name: configuration.requestFormTitle,
        exact: true,
      });
      await expect(
        clinicalPanel.getByText(clinicalFinding, { exact: true }),
      ).toBeVisible();
      await expect(appointmentPanel).toBeVisible();
      await expect(recipientPage).toHaveURL(referralUrl);
      await expect(recipientPage.getByRole("dialog")).toHaveCount(0);
    });

    const recommendation = `Specialist assessment completed ${suffix}`;
    await test.step("The recipient responds and completes without recreating the booking", async () => {
      const responseSection = recipientPage.getByRole("region", {
        name: "Responses",
        exact: true,
      });
      const detailUrl = recipientPage.url();
      const responsePageUrl = new URL(detailUrl);
      responsePageUrl.pathname = `${fixture.path}/respond`;
      await responseSection
        .getByRole("button", { name: "Respond", exact: true })
        .click();
      await expect(recipientPage).toHaveURL(responsePageUrl.href);
      await expect(recipientPage.getByRole("dialog")).toHaveCount(0);
      const response = recipientPage.getByRole("region", {
        name: "Respond",
        exact: true,
      });
      await expect(
        response.getByText(fixture.responseTitle, { exact: true }),
      ).toBeVisible();
      await expect(
        response.getByRole("combobox", { name: "Form", exact: true }),
      ).toHaveCount(0);
      await questionBlock(recipientPage, fixture.responseLabel)
        .getByRole("textbox")
        .fill(recommendation);
      const formsUrl = (url: URL) =>
        url.pathname ===
        `/api/v1/referral/${fixture.referralId}/questionnaires/`;
      await recipientPage.route(formsUrl, async (route) => {
        await route.fulfill({
          status: 503,
          json: { detail: "Response forms temporarily unavailable" },
        });
      });
      const failedRefresh = recipientPage.waitForResponse(
        (result) =>
          formsUrl(new URL(result.url())) &&
          result.request().method() === "GET" &&
          result.status() === 503,
      );
      await recipientPage.context().setOffline(true);
      await expect
        .poll(() => recipientPage.evaluate(() => navigator.onLine))
        .toBe(false);
      await recipientPage.context().setOffline(false);
      await failedRefresh;
      const refreshWarning = response.getByRole("alert");
      await expect(refreshWarning).toBeVisible();
      await expect(
        questionBlock(recipientPage, fixture.responseLabel).getByRole(
          "textbox",
        ),
      ).toHaveValue(recommendation);
      await expect(refreshWarning).toContainText(
        "The response forms could not be refreshed. Your answers are still here. Retry to refresh the available forms.",
      );
      await recipientPage.unroute(formsUrl);
      const retriedForms = recipientPage.waitForResponse(
        (result) =>
          formsUrl(new URL(result.url())) &&
          result.request().method() === "GET" &&
          result.ok(),
      );
      await refreshWarning
        .getByRole("button", { name: "Retry", exact: true })
        .click();
      await retriedForms;
      await expect(refreshWarning).not.toBeVisible();
      await expect(
        questionBlock(recipientPage, fixture.responseLabel).getByRole(
          "textbox",
        ),
      ).toHaveValue(recommendation);
      const originalViewport = recipientPage.viewportSize();
      await recipientPage.setViewportSize({ width: 1440, height: 1000 });
      await expect(
        recipientPage.getByRole("button", {
          name: "Save response",
          exact: true,
        }),
      ).toBeEnabled();
      await recipientPage.screenshot({
        path: testInfo.outputPath("recipient-response-page-1440.png"),
        animations: "disabled",
      });
      await recipientPage
        .getByRole("tab", { name: "Referral and shared records", exact: true })
        .click();
      const reference = recipientPage.getByRole("tabpanel", {
        name: "Referral and shared records",
        exact: true,
      });
      await expect(
        reference.getByText("Specialist assessment requested", { exact: true }),
      ).toBeVisible();
      const sharedRecords = reference.getByRole("region", {
        name: "Shared records",
        exact: true,
      });
      await expect(
        sharedRecords
          .getByRole("region", { name: scheduleName, exact: true })
          .getByText(appointmentNote, { exact: true }),
      ).toBeVisible();
      await expect(recipientPage.getByRole("dialog")).toHaveCount(0);
      await expect(recipientPage).toHaveURL(responsePageUrl.href);
      await expect(
        sharedRecords.getByRole("button", { name: "Add record", exact: true }),
      ).toHaveCount(0);
      await recipientPage.screenshot({
        path: testInfo.outputPath("recipient-response-reference-1440.png"),
        animations: "disabled",
      });
      await recipientPage.setViewportSize({ width: 390, height: 844 });
      await expect
        .poll(() =>
          recipientPage.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
      await recipientPage
        .getByRole("tab", { name: /^Respond(?:\s+Draft)?$/ })
        .click();
      await expect(
        questionBlock(recipientPage, fixture.responseLabel).getByRole(
          "textbox",
        ),
      ).toHaveValue(recommendation);
      await expect
        .poll(() =>
          recipientPage.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
      await recipientPage.screenshot({
        path: testInfo.outputPath("recipient-response-page-390.png"),
        animations: "disabled",
      });
      if (originalViewport)
        await recipientPage.setViewportSize(originalViewport);
      await recipientPage
        .getByRole("button", { name: "Cancel", exact: true })
        .click();
      const discard = recipientPage.getByRole("alertdialog", {
        name: "Discard response?",
        exact: true,
      });
      await expect(discard).toBeVisible();
      await discard
        .getByRole("button", { name: "Keep editing", exact: true })
        .click();
      await expect(discard).not.toBeVisible();
      await expect(recipientPage).toHaveURL(responsePageUrl.href);
      await expect(
        questionBlock(recipientPage, fixture.responseLabel).getByRole(
          "textbox",
        ),
      ).toHaveValue(recommendation);
      await recipientPage
        .getByRole("button", { name: "Save response", exact: true })
        .click();
      await expect(recipientPage).toHaveURL(detailUrl);
      await recipientPage.reload();
      await expect(
        responseSection.getByText(recommendation, { exact: true }),
      ).toBeVisible();
      const requestContent = recipientPage.getByRole("region", {
        name: "Referral request",
        exact: true,
      });
      const intakeAnswer = requestContent
        .getByRole("region", { name: "Request", exact: true })
        .getByText("Specialist assessment requested", { exact: true });
      const sourceAnswer = requestContent
        .getByRole("region", { name: "Shared records", exact: true })
        .getByText(clinicalFinding, { exact: true });
      const responseAppointment = responseSection
        .getByRole("region", { name: "Response records", exact: true })
        .getByRole("region", { name: scheduleName, exact: true });
      await expect(
        requestContent.getByText(referralNote, { exact: true }),
      ).toBeVisible();
      await expect(intakeAnswer).toBeVisible();
      await expect(sourceAnswer).toBeVisible();
      await expect(
        responseAppointment.getByText(appointmentNote, { exact: true }),
      ).toBeVisible();
      await recipientPage
        .getByRole("button", { name: "Hide request", exact: true })
        .click();
      await expect(
        recipientPage.getByRole("button", {
          name: "Show request",
          exact: true,
        }),
      ).toHaveAttribute("aria-expanded", "false");
      await expect(requestContent).not.toBeVisible();
      await expect(intakeAnswer).not.toBeVisible();
      await expect(sourceAnswer).not.toBeVisible();
      await expect(
        responseSection.getByText(recommendation, { exact: true }),
      ).toBeVisible();
      await expect(
        responseAppointment.getByText(appointmentNote, { exact: true }),
      ).toBeVisible();
      await expect(recipientPage).toHaveURL(detailUrl);
      await recipientPage.screenshot({
        path: testInfo.outputPath("recipient-responses-request-hidden.png"),
        fullPage: true,
        animations: "disabled",
      });
      await recipientPage
        .getByRole("button", { name: "Show request", exact: true })
        .click();
      await expect(
        recipientPage.getByRole("button", {
          name: "Hide request",
          exact: true,
        }),
      ).toHaveAttribute("aria-expanded", "true");
      await expect(
        requestContent.getByText(referralNote, { exact: true }),
      ).toBeVisible();
      await expect(intakeAnswer).toBeVisible();
      await expect(sourceAnswer).toBeVisible();
      await expect(
        recipientPage
          .getByRole("list", { name: "Referral progress", exact: true })
          .getByRole("listitem")
          .filter({ hasText: "In progress" }),
      ).toHaveAttribute("aria-current", "step");
      const replied = await api<{
        status: string;
        questionnaire_responses: {
          id: string;
          questionnaire_type: string;
          created_by: { id: string };
        }[];
      }>(
        request,
        `/api/v1/referral/${fixture.referralId}/`,
        undefined,
        recipientSession.headers,
      );
      expect(replied.status).toBe("in_progress");
      const replies = replied.questionnaire_responses.filter(
        (item) => item.questionnaire_type === "response",
      );
      expect(replies).toHaveLength(1);
      expect(replies[0].created_by.id).toBe(recipient.id);
      await recipientPage
        .getByRole("button", { name: "Referral actions", exact: true })
        .click();
      await recipientPage
        .getByRole("menuitem", { name: "Complete referral", exact: true })
        .click();
      const complete = recipientPage.getByRole("alertdialog", {
        name: "Complete referral",
        exact: true,
      });
      await complete
        .getByRole("button", { name: "Complete referral", exact: true })
        .click();
      await expect(complete).not.toBeVisible();
      await expect(
        recipientPage
          .getByRole("list", { name: "Referral progress", exact: true })
          .getByRole("listitem")
          .filter({ hasText: "Completed" }),
      ).toHaveAttribute("aria-current", "step");
      await recipientPage.reload();
      await expect(
        recipientPage.getByText(recommendation, { exact: true }),
      ).toBeVisible();
      await recipientPage.screenshot({
        path: testInfo.outputPath("recipient-completed-referral.png"),
        fullPage: true,
        animations: "disabled",
      });
      const saved = await api<{
        status: string;
        questionnaire_responses: {
          id: string;
          questionnaire_type: string;
          created_by: { id: string };
        }[];
      }>(
        request,
        `/api/v1/referral/${fixture.referralId}/`,
        undefined,
        senderSession.headers,
      );
      expect(saved.status).toBe("completed");
      expect(
        saved.questionnaire_responses
          .filter((item) => item.questionnaire_type === "response")
          .map((item) => item.id),
      ).toEqual([replies[0].id]);
      expect(saved.questionnaire_responses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            questionnaire_type: "response",
            created_by: expect.objectContaining({ id: recipient.id }),
          }),
        ]),
      );
      const resources = await api<{
        count: number;
        results: {
          resource_id: string;
          resource_type: string;
          attachment_type: string;
        }[];
      }>(
        request,
        `/api/v1/referral/${fixture.referralId}/resources/`,
        undefined,
        senderSession.headers,
      );
      expect(resources).toMatchObject({
        count: 2,
        results: expect.arrayContaining([
          expect.objectContaining({
            resource_type: "appointment",
            resource_id: appointment.id,
            attachment_type: "response",
          }),
          expect.objectContaining({
            resource_type: "questionnaire_response",
            resource_id: clinical.id,
            attachment_type: "source",
          }),
        ]),
      });
      const bookings = await api<{
        count: number;
        results: { id: string; status: string }[];
      }>(
        request,
        `/api/v1/patient/${patientId}/get_appointments/?facility=${destination.id}`,
        undefined,
        recipientSession.headers,
      );
      expect(bookings).toMatchObject({
        count: 1,
        results: [{ id: appointment.id, status: "booked" }],
      });
      const deniedOrigin = await request.get(
        `${apiBaseUrl()}/api/v1/encounter/${encounterId}/`,
        { headers: recipientSession.headers },
      );
      expect(deniedOrigin.status()).toBe(403);
    });

    await test.step("The sender receives the completed response and delegated appointment summary", async () => {
      await senderPage.reload();
      await expect(
        senderPage
          .getByRole("list", { name: "Referral progress", exact: true })
          .getByRole("listitem")
          .filter({ hasText: "Completed" }),
      ).toHaveAttribute("aria-current", "step");
      await expect(
        senderPage.getByText(recommendation, { exact: true }),
      ).toBeVisible();
      await senderPage.screenshot({
        path: testInfo.outputPath("sender-completed-referral.png"),
        fullPage: true,
        animations: "disabled",
      });
      const senderReferralUrl = senderPage.url();
      const senderRecords = senderPage
        .getByRole("region", { name: "Responses", exact: true })
        .getByRole("region", { name: "Response records", exact: true });
      const preview = senderRecords.getByRole("region", {
        name: scheduleName,
        exact: true,
      });
      await expect(
        preview.getByText(appointmentNote, { exact: true }),
      ).toBeVisible();
      await expect(preview.getByText("Booked", { exact: true })).toBeVisible();
      await expect(senderPage).toHaveURL(senderReferralUrl);
      await expect(senderPage.getByRole("dialog")).toHaveCount(0);
      const appointmentVisit = senderPage.getByRole("region", {
        name: "Appointment and visit",
        exact: true,
      });
      await expect(
        appointmentVisit.getByRole("link", {
          name: "Manage appointment",
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(
        appointmentVisit.getByText(appointmentNote, { exact: true }),
      ).toBeVisible();
      await expect(senderPage).toHaveURL(senderReferralUrl);
      await expect(senderPage.getByRole("dialog")).toHaveCount(0);
      const referrals = await api<{ count: number; results: { id: string }[] }>(
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
              is_superuser: senderSession.identity.is_superuser,
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
            status: "completed",
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
  } finally {
    await senderContext.close();
    await recipientContext.close();
  }
});
