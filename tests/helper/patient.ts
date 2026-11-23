import { faker } from "@faker-js/faker";
import { expect, type Page, test } from "@playwright/test";
import { setTimeout as delay } from "node:timers/promises";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { selectComboboxOption } from "tests/helper/ui";

async function getGovtOrganizationId(
  headers: Record<string, string>,
): Promise<string> {
  const organizationsResponse = await fetch(
    `${apiBaseUrl()}/api/v1/organization/?org_type=govt&limit=1`,
    { headers },
  );
  if (!organizationsResponse.ok) {
    throw new Error(
      `Failed to fetch test patient organizations: ${organizationsResponse.status}`,
    );
  }
  const organizations = (await organizationsResponse.json()) as {
    results: { id: string }[];
  };
  const geoOrganization = organizations.results[0]?.id;
  if (!geoOrganization) {
    throw new Error("No government organization for the test patient");
  }
  return geoOrganization;
}

/**
 * Creates a throwaway patient through the API. Specs that create encounters
 * use one each: the backend caps a patient's active encounters per facility,
 * so creating them for a shared patient eventually rejects every new one.
 * Without a geo organization, the patient goes in the first government one.
 */
export async function createTestPatient(
  namePrefix = "E2E Patient",
  geoOrganizationId?: string,
): Promise<string> {
  const headers = adminApiHeaders();
  const geoOrganization =
    geoOrganizationId ?? (await getGovtOrganizationId(headers));
  const body = JSON.stringify({
    name: `${namePrefix} ${faker.string.alphanumeric(12)}`,
    gender: "male",
    phone_number: `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`,
    date_of_birth: "1990-01-15",
    geo_organization: geoOrganization,
    identifiers: [],
  });
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${apiBaseUrl()}/api/v1/patient/`, {
      method: "POST",
      headers,
      body,
    });
    if (response.ok) {
      return ((await response.json()) as { id: string }).id;
    }
    const error = await response.text();
    // The backend serializes patient creation with a global lock. Only
    // retry its explicit pre-create rejection, never an ambiguous failure.
    if (
      attempt >= 4 ||
      response.status !== 400 ||
      !error.includes("Patient creation failed, try again after a while")
    ) {
      throw new Error(
        `Failed to create test patient: ${response.status} — ${error}`,
      );
    }
    await delay(250 * (attempt + 1));
  }
}

/** Same as {@link createTestPatient}. */
export const createPatient = createTestPatient;

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  transgender: "Transgender",
  non_binary: "Non-binary",
};

/** The label the UI shows for an API gender value (the GENDER__* strings). */
export function genderLabel(gender: string): string {
  return GENDER_LABELS[gender] ?? gender;
}

// ---------------------------------------------------------------------------
// UI steps: registration
// ---------------------------------------------------------------------------

/** Random data for the patient registration form. */
export function generatePatientRegistrationData() {
  return {
    name: faker.person.fullName(),
    phoneNumber: `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`,
    gender: faker.helpers.arrayElement([
      "Male",
      "Female",
      "Transgender",
      "Non-binary",
    ]),
    dateOfBirth: {
      day: faker.number.int({ min: 1, max: 28 }).toString().padStart(2, "0"),
      month: faker.number.int({ min: 1, max: 12 }).toString().padStart(2, "0"),
      year: faker.number.int({ min: 1950, max: 2009 }).toString(),
    },
    bloodGroup: faker.helpers.arrayElement([
      "A+",
      "A-",
      "B+",
      "B-",
      "O+",
      "O-",
      "AB+",
      "AB-",
    ]),
    pincode: `${faker.number.int({ min: 1, max: 9 })}${faker.string.numeric(5)}`,
    address: faker.location.streetAddress({ useFullAddress: true }),
    emergencyContact: {
      name: faker.person.fullName(),
      phoneNumber: `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`,
    },
  };
}

export type PatientRegistrationData = ReturnType<
  typeof generatePatientRegistrationData
>;

/** Opens the registration form from the facility patients page (Shift+Enter in the phone search). */
export async function startPatientRegistration(page: Page) {
  await page
    .getByRole("textbox", { name: /search by patient phone number/i })
    .press("Shift+Enter");
}

/** Fills name, phone number and gender on the registration form. */
export async function fillPatientBasicInfo(
  page: Page,
  data: { name: string; phoneNumber: string; gender: string },
) {
  await test.step("Fill patient basic information", async () => {
    await page.getByRole("textbox", { name: /name.*\*/i }).fill(data.name);
    await page
      .getByRole("textbox", { name: /phone number.*\*/i })
      .fill(data.phoneNumber);
    await page.getByRole("radio", { name: data.gender, exact: true }).click();
  });
}

/** Fills the DD / MM / YYYY date of birth fields on the registration form. */
export async function fillPatientDateOfBirth(
  page: Page,
  dob: { day: string; month: string; year: string },
) {
  await test.step("Fill date of birth", async () => {
    await page.getByPlaceholder("DD", { exact: true }).fill(dob.day);
    await page.getByPlaceholder("MM", { exact: true }).fill(dob.month);
    await page.getByPlaceholder("YYYY", { exact: true }).fill(dob.year);
  });
}

/** Picks a blood group on the registration form. */
export async function selectPatientBloodGroup(page: Page, bloodGroup: string) {
  await test.step("Select blood group", async () => {
    await page.getByRole("combobox", { name: /blood group/i }).click();
    await page.getByRole("option", { name: bloodGroup, exact: true }).click();
  });
}

/**
 * Fills the "Additional Details" section: address, PIN code, and every geo
 * organization level.
 * TODO: Update state selection to a specific state once fixtures support it.
 */
export async function fillPatientAdditionalDetails(
  page: Page,
  data: { address: string; pincode: string },
) {
  await test.step("Fill additional details", async () => {
    const additionalDetailsSection = page.getByRole("button", {
      name: "Additional Details",
    });
    const additionalDetailsSectionText =
      await additionalDetailsSection.textContent();

    if (additionalDetailsSectionText?.toLowerCase().includes("optional")) {
      await additionalDetailsSection.click();
    }

    await page.getByRole("textbox", { name: "Address" }).fill(data.address);
    await page.getByRole("spinbutton", { name: "PIN Code" }).fill(data.pincode);

    await page
      .getByRole("button", { name: /register patient/i })
      .scrollIntoViewIfNeeded();

    // Geo org levels cascade: selecting an organization with children adds
    // the next level's combobox in the same render, so once a pick's popup
    // has closed the count of comboboxes is final for that pick.
    const geoRegion = page.getByRole("region", { name: "Additional Details" });
    const comboboxes = geoRegion.getByRole("combobox");
    for (let filled = 0; filled < (await comboboxes.count()); filled++) {
      await selectComboboxOption(comboboxes.nth(filled));
    }
  });
}

/**
 * Submits the registration form, waits for the success toast and returns the
 * new patient's id (read from the create response; the app only navigates
 * with a partial id). The backend serializes patient creation with a global
 * lock and rejects a create that arrives while it is held; like
 * `createTestPatient`, this resubmits only that explicit rejection, so any
 * other failure surfaces with its status and body.
 */
export async function submitPatientRegistration(page: Page): Promise<string> {
  return test.step("Submit patient registration", async () => {
    for (let attempt = 0; ; attempt++) {
      const createResponse = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/v1/patient/" &&
          response.request().method() === "POST",
        { timeout: 15000 },
      );
      await page.getByRole("button", { name: /register patient/i }).click();
      const response = await createResponse;
      if (response.ok()) {
        await expect(
          page
            .locator("li[data-sonner-toast]")
            .getByText(/patient registered successfully/i),
        ).toBeVisible({ timeout: 15000 });
        return ((await response.json()) as { id: string }).id;
      }
      const error = await response.text();
      if (
        attempt >= 4 ||
        response.status() !== 400 ||
        !error.includes("Patient creation failed, try again after a while")
      ) {
        throw new Error(
          `Patient registration failed: ${response.status()} — ${error}`,
        );
      }
      await delay(250 * (attempt + 1));
    }
  });
}

export interface RegisterPatientInput extends Partial<PatientRegistrationData> {
  facilityId: string;
}

/**
 * Registers a patient through the facility registration form (random data,
 * overridable per field); returns the new patient's id, name and phone.
 */
export async function registerPatientViaUi(
  page: Page,
  { facilityId, ...overrides }: RegisterPatientInput,
): Promise<{ patientId: string; name: string; phoneNumber: string }> {
  const data = { ...generatePatientRegistrationData(), ...overrides };
  let patientId = "";

  await test.step(
    "patient.register",
    async () => {
      await page.goto(`/facility/${facilityId}/patients`);
      await startPatientRegistration(page);
      await fillPatientBasicInfo(page, data);
      await fillPatientDateOfBirth(page, data.dateOfBirth);
      await selectPatientBloodGroup(page, data.bloodGroup);
      await fillPatientAdditionalDetails(page, data);
      patientId = await submitPatientRegistration(page);
    },
    { box: true },
  );

  return { patientId, name: data.name, phoneNumber: data.phoneNumber };
}

// ---------------------------------------------------------------------------
// UI steps: patient details tabs
// ---------------------------------------------------------------------------

/** Opens the patient's Files tab and waits for its "Add Files" button. */
export async function openPatientFilesTab(
  page: Page,
  { facilityId, patientId }: { facilityId: string; patientId: string },
) {
  await page.goto(`/facility/${facilityId}/patient/${patientId}`);

  // Wait for Files tab to be visible and click it
  const filesTab = page.getByRole("tab", { name: "Files" });
  await expect(filesTab).toBeVisible({ timeout: 10000 });
  await filesTab.click();

  // Wait for the Files section to load by checking for Add Files button
  await expect(page.getByRole("button", { name: "Add Files" })).toBeVisible({
    timeout: 10000,
  });
}

export interface UploadPatientFileInput {
  filePath: string;
  displayName: string;
  /** With `patientId`, opens that patient's Files tab first; otherwise uploads from the open Files tab. */
  facilityId?: string;
  patientId?: string;
}

/** Uploads one file with a display name from a patient's Files tab; returns the file id. */
export async function uploadPatientFileViaUi(
  page: Page,
  { filePath, displayName, facilityId, patientId }: UploadPatientFileInput,
): Promise<{ fileId: string; displayName: string }> {
  let fileId = "";

  await test.step(
    "patient.files.upload",
    async () => {
      if (facilityId && patientId) {
        await openPatientFilesTab(page, { facilityId, patientId });
      }
      await page.getByRole("button", { name: "Add Files" }).click();

      // Wait for file input to be attached
      await expect(page.locator('input[type="file"]')).toBeAttached({
        timeout: 5000,
      });
      await page.locator('input[type="file"]').setInputFiles(filePath);

      // Wait for file name input to be visible
      await expect(
        page.getByRole("textbox", { name: "File Name" }).first(),
      ).toBeVisible({ timeout: 5000 });
      await page
        .getByRole("textbox", { name: "File Name" })
        .first()
        .fill(displayName);

      const uploadPromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/files/") &&
          response.request().method() === "POST",
        { timeout: 15000 },
      );

      await page.getByRole("button", { name: "Upload" }).click();
      const response = await uploadPromise;
      expect(response.status()).toBe(200);
      await expect(page.getByText("File Uploaded Successfully")).toBeVisible({
        timeout: 10000,
      });
      await page.getByRole("button", { name: "Close toast" }).click();
      fileId = ((await response.json()) as { id: string }).id;
    },
    { box: true },
  );

  return { fileId, displayName };
}

export interface CreatePatientNoteThreadInput {
  facilityId: string;
  patientId: string;
  title?: string;
  /** When given, also posts this as the thread's first message. */
  message?: string;
}

/** Starts a discussion thread on the patient's Notes tab (optionally with a first message). */
export async function createPatientNoteThreadViaUi(
  page: Page,
  {
    facilityId,
    patientId,
    title = `Patient Note ${faker.string.alphanumeric(8)}`,
    message,
  }: CreatePatientNoteThreadInput,
): Promise<{ title: string }> {
  await test.step(
    "patient.notes.create",
    async () => {
      await page.goto(`/facility/${facilityId}/patient/${patientId}/notes`);
      // Wait for notes section to load
      await expect(
        page.getByRole("button", { name: /New/i }).first(),
      ).toBeVisible();

      await page.getByRole("button", { name: /New/i }).first().click();
      await page.getByPlaceholder("Enter discussion title...").fill(title);
      await page.getByRole("button", { name: /Create/i }).click();
      await expect(page.getByText("Thread created successfully")).toBeVisible();

      if (message !== undefined) {
        const messageInput = page.getByPlaceholder("Type your message...");
        await messageInput.fill(message);
        await page.getByRole("button", { name: "Send message" }).click();
        // The input clears once the message is sent
        await expect(messageInput).toBeEmpty();
      }
    },
    { box: true },
  );

  return { title };
}

/** Opens the patient's Users tab (from the patient page). */
export async function openPatientUsersTab(page: Page) {
  await page.getByRole("tab", { name: "Users" }).click();
}

/** Opens the "Assign User" dialog on the patient's Users tab. */
export async function openAssignUserDialog(page: Page) {
  await page.getByRole("button", { name: "Assign User" }).click();
}

/** Picks a user in the open "Assign User" dialog. */
export async function selectUserToAssign(page: Page, userName: string) {
  await page.getByRole("combobox").first().click();
  await page.locator("[cmdk-input]").fill(userName);
  await page.getByRole("option", { name: userName }).first().click();
}

/** Picks a role in the open "Assign User" dialog. */
export async function selectAssignUserRole(page: Page, role: string) {
  await page.getByRole("combobox").filter({ hasText: "Select Role" }).click();
  await page.getByRole("option", { name: role }).first().click();
}

export interface AssignUserToPatientInput {
  facilityId: string;
  patientId: string;
  /** Display name or username to search, e.g. "Admin User". */
  userName: string;
  /** Role label, e.g. "Nurse". */
  role: string;
}

/** Assigns a user with a role to the patient from the patient's Users tab. */
export async function assignUserToPatientViaUi(
  page: Page,
  { facilityId, patientId, userName, role }: AssignUserToPatientInput,
): Promise<{ userName: string; role: string }> {
  await test.step(
    "patient.user.assign",
    async () => {
      await page.goto(`/facility/${facilityId}/patient/${patientId}`);
      await openPatientUsersTab(page);
      await openAssignUserDialog(page);
      await selectUserToAssign(page, userName);
      await selectAssignUserRole(page, role);
      await page.getByRole("button", { name: "Assign to Patient" }).click();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("User added to patient successfully"),
      ).toBeVisible({ timeout: 10000 });
    },
    { box: true },
  );

  return { userName, role };
}

export interface CreateResourceRequestInput {
  facilityId: string;
  patientId: string;
  title?: string;
  reason?: string;
  /** Category option label, e.g. "Medicines". */
  category?: string;
  contactName?: string;
  contactNumber?: string;
}

/**
 * Creates a resource request from the patient's Requests tab (assigned to the
 * first facility offered); returns the request id and the values entered.
 */
export async function createResourceRequestViaUi(
  page: Page,
  {
    facilityId,
    patientId,
    title = `Resource ${faker.string.alphanumeric(6)}`,
    reason = faker.lorem.sentence(),
    category = "Medicines",
    contactName = faker.person.fullName(),
    contactNumber = `${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`,
  }: CreateResourceRequestInput,
): Promise<{
  requestId: string;
  title: string;
  reason: string;
  category: string;
}> {
  let requestId = "";

  await test.step(
    "patient.request.create",
    async () => {
      await page.goto(`/facility/${facilityId}/patient/${patientId}`);
      await page.getByRole("tab", { name: "Requests" }).click();
      await page.getByRole("link", { name: "Create Request" }).click();

      await selectComboboxOption(
        page.getByRole("combobox", { name: "Category" }),
        { name: category },
      );
      await page.getByRole("textbox", { name: "Title" }).fill(title);
      await page.getByRole("textbox", { name: "Reason" }).fill(reason);
      await selectComboboxOption(
        page
          .getByRole("combobox")
          .filter({ hasText: "Start typing to search..." }),
      );
      await page
        .getByRole("textbox", { name: "Name of Contact Person at" })
        .fill(contactName);
      await page
        .getByRole("textbox", { name: "Contact Person Number" })
        .fill(contactNumber);

      const createResponse = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/resource/") &&
          response.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Submit" }).click();
      const response = await createResponse;
      expect(response.status()).toBe(200);
      requestId = ((await response.json()) as { id: string }).id;
    },
    { box: true },
  );

  return { requestId, title, reason, category };
}
