import { writeFile } from "node:fs/promises";

import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type Page,
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

test("shares a referral between non-admin facility doctors without granting access to the source chart", async ({
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
  }).format(new Date(originEncounter.period.start));

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
          .getByRole("button", { name: "Review referral", exact: true })
          .click();
        await expect(
          creation.getByRole("button", { name: "Send referral", exact: true }),
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
      // The baseline API has no referral-specific write permission response.
      // Recipient-only access is readable but does not expose mutation controls.
      for (const name of [
        "Manage assignees",
        "Start referral",
        "Respond",
        "Add response",
        "Add record",
        "Upload file",
      ]) {
        await expect(
          recipientPage.getByRole("button", { name, exact: true }),
        ).toHaveCount(0);
      }
      const discussion = recipientPage.getByRole("region", {
        name: "Discussion",
        exact: true,
      });
      await expect(
        discussion.getByText(discussionMessage, { exact: true }),
      ).toBeVisible();
      await expect(
        discussion.getByRole("textbox", { name: "Message", exact: true }),
      ).toHaveCount(0);
      await recipientPage.reload();
      await expect(
        clinicalPreview.getByText(clinicalFinding, { exact: true }),
      ).toBeVisible();
      await expect(
        discussion.getByText(discussionMessage, { exact: true }),
      ).toBeVisible();
      await recipientPage.screenshot({
        path: testInfo.outputPath("recipient-read-only-referral.png"),
        fullPage: true,
        animations: "disabled",
      });
    });

    await test.step("Keep one referral, its source record, and the original author identities", async () => {
      const saved = await api<{
        status: string;
        created_by: { id: string };
        questionnaire_responses: { questionnaire_type: string }[];
      }>(
        request,
        `/api/v1/referral/${fixture.referralId}/`,
        undefined,
        senderSession.headers,
      );
      expect(saved).toMatchObject({
        status: "pending",
        created_by: { id: sender.id },
      });
      expect(saved.questionnaire_responses).toHaveLength(1);
      expect(saved.questionnaire_responses[0].questionnaire_type).toBe(
        "request",
      );
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
  } finally {
    await senderContext.close();
    await recipientContext.close();
  }
});
