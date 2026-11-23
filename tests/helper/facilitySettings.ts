import { faker } from "@faker-js/faker";
import { expect, test, type Page, type Response } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";

/**
 * Step functions and API seeders for the facility settings pages:
 * departments, devices, locations, token categories, discounts, the facility
 * cover and patient identifier configs.
 *
 * UI steps open the page they start from unless the browser is already on it,
 * so a spec that navigated in its `beforeEach` keeps its exact flow, and a
 * workflow can call them from anywhere.
 */

// ---------------------------------------------------------------------------
// Shared plumbing
// ---------------------------------------------------------------------------

async function apiRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method,
    headers: getApiHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `${method} ${path} failed: ${response.status} — ${await response.text()}`,
    );
  }
  return (await response.json()) as T;
}

/** Opens `path` unless the browser already shows it. */
async function gotoUnlessOn(page: Page, path: string) {
  const current = page.url().startsWith("http")
    ? new URL(page.url()).pathname
    : "";
  if (current !== path) {
    await page.goto(path);
  }
}

/** Waits for the next POST response to a URL ending in `pathname`. */
function waitForCreate(page: Page, pathname: string): Promise<Response> {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname.endsWith(pathname),
  );
}

async function createdId(response: Response): Promise<string> {
  expect(response.ok(), await response.text()).toBe(true);
  return ((await response.json()) as { id: string }).id;
}

const departmentsPath = (facilityId: string) =>
  `/facility/${facilityId}/settings/departments`;
const devicesPath = (facilityId: string) =>
  `/facility/${facilityId}/settings/devices`;
const locationsPath = (facilityId: string) =>
  `/facility/${facilityId}/settings/locations`;
const tokenCategoriesPath = (facilityId: string) =>
  `/facility/${facilityId}/settings/token_category`;
const generalSettingsPath = (facilityId: string) =>
  `/facility/${facilityId}/settings/general`;

// ---------------------------------------------------------------------------
// API seeders
// ---------------------------------------------------------------------------

interface FacilityDetail {
  id: string;
  name: string;
  facility_type: string;
  pincode: number;
  geo_organization: { id: string };
  discount_configuration: Record<string, unknown> | null;
}

/**
 * Creates a throwaway facility through the API, in the same geo organization
 * and of the same type as `templateFacilityId`. The admin who creates it
 * becomes its facility admin, so specs that change facility-wide settings
 * (cover, print templates) can use it instead of the shared fixture facility.
 */
export async function createFacilityViaApi({
  templateFacilityId,
  name = `E2E Facility ${faker.string.alphanumeric(10)}`,
}: {
  templateFacilityId: string;
  name?: string;
}): Promise<{ facilityId: string; name: string }> {
  const template = await apiRequest<FacilityDetail>(
    "GET",
    `/api/v1/facility/${templateFacilityId}/`,
  );
  const facility = await apiRequest<{ id: string }>(
    "POST",
    "/api/v1/facility/",
    {
      name,
      description: "Throwaway facility for a facility settings spec",
      address: "Test address",
      phone_number: "+919876543210",
      facility_type: template.facility_type,
      pincode: template.pincode,
      is_public: false,
      geo_organization: template.geo_organization.id,
      features: [],
    },
  );
  return { facilityId: facility.id, name };
}

/** Creates a top-level department of a facility through the API. */
export async function createDepartmentViaApi({
  facilityId,
  name = `Dept ${faker.string.alphanumeric(8)}`,
  description = "Department for a facility settings spec",
}: {
  facilityId: string;
  name?: string;
  description?: string;
}): Promise<{ departmentId: string; name: string }> {
  const department = await apiRequest<{ id: string }>(
    "POST",
    `/api/v1/facility/${facilityId}/organizations/`,
    { name, description, org_type: "dept", facility: facilityId },
  );
  return { departmentId: department.id, name };
}

/** Creates a user with no organizations through the API. */
export async function createUserViaApi({
  usernamePrefix = "e2e-user",
}: { usernamePrefix?: string } = {}): Promise<{
  userId: string;
  username: string;
}> {
  const suffix = faker.string.alphanumeric(10).toLowerCase();
  const username = `${usernamePrefix}-${suffix}`;
  const user = await apiRequest<{ id: string }>("POST", "/api/v1/users/", {
    username,
    password: `E2e-${suffix}-8!`,
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: `${username}@example.test`,
    phone_number: `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`,
    gender: "male",
    role_orgs: [],
  });
  return { userId: user.id, username };
}

/**
 * Creates an instance-level patient identifier config through the API. It is
 * a draft by default, so it never shows up on patient registration forms.
 */
export async function createInstancePatientIdentifierConfigViaApi({
  system = `https://e2e.example.test/identifier/${faker.string.alphanumeric(12).toLowerCase()}`,
  display = `E2E identifier ${faker.string.alphanumeric(8)}`,
  status = "draft",
}: {
  system?: string;
  display?: string;
  status?: "draft" | "active" | "inactive";
} = {}): Promise<{ configId: string; system: string }> {
  const config = await apiRequest<{ id: string }>(
    "POST",
    "/api/v1/patient_identifier_config/",
    {
      config: {
        use: "usual",
        description: "",
        system,
        required: false,
        unique: false,
        regex: "",
        display,
        retrieve_config: {},
      },
      status,
    },
  );
  return { configId: config.id, system };
}

/**
 * Whether the facility has a complete discount configuration. A facility that
 * never saved one reports `{}` (the backend field defaults to an empty dict),
 * and every discount code or component save re-sends it, which the API
 * rejects because `max_applicable` and `applicability_order` are required.
 */
export async function hasDiscountConfiguration(
  facilityId: string,
): Promise<boolean> {
  const facility = await apiRequest<FacilityDetail>(
    "GET",
    `/api/v1/facility/${facilityId}/`,
  );
  const config = facility.discount_configuration;
  return (
    typeof config?.max_applicable === "number" &&
    typeof config?.applicability_order === "string"
  );
}

/** API value of a token category resource type shown as e.g. "Healthcare Service". */
export function tokenCategoryResourceTypeValue(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "_");
}

/** The id of the facility's default token category for a resource type, if any. */
export async function getDefaultTokenCategoryId({
  facilityId,
  resourceType,
}: {
  facilityId: string;
  /** API value: "practitioner", "location" or "healthcare_service". */
  resourceType: string;
}): Promise<string | undefined> {
  const { results } = await apiRequest<{ results: { id: string }[] }>(
    "GET",
    `/api/v1/facility/${facilityId}/token/category/?resource_type=${resourceType}&default=true&limit=1`,
  );
  return results[0]?.id;
}

/** Makes a token category the default for its resource type through the API. */
export async function setDefaultTokenCategoryViaApi({
  facilityId,
  tokenCategoryId,
}: {
  facilityId: string;
  tokenCategoryId: string;
}): Promise<void> {
  await apiRequest(
    "POST",
    `/api/v1/facility/${facilityId}/token/category/${tokenCategoryId}/set_default/`,
  );
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export type DepartmentType = "Department" | "Team";

/** Opens the create department/team form on the current departments page. */
export async function openDepartmentForm(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Add Department/Team" })
    .first()
    .click();
}

/** Fills the open create department/team form. */
export async function fillDepartmentForm(
  page: Page,
  options: {
    name?: string;
    type?: DepartmentType;
    description?: string;
  },
): Promise<void> {
  if (options.name) {
    await page
      .getByRole("textbox", { name: "Name" })
      .pressSequentially(options.name);
  }

  if (options.type) {
    await page.getByRole("combobox", { name: "Type" }).click();
    await page.getByRole("option", { name: options.type }).first().click();
  }

  if (options.description) {
    await page
      .getByRole("textbox", { name: "Description" })
      .fill(options.description);
  }
}

/** Searches the departments list and opens the department of that name. */
export async function searchAndOpenDepartment(
  page: Page,
  departmentName: string,
): Promise<void> {
  await page
    .getByRole("textbox", { name: "Search by department/team name" })
    .fill(departmentName);
  await page.getByRole("row").filter({ hasText: departmentName }).click();
}

/**
 * Creates a department or team through the departments page. With
 * `parentDepartmentName` it is created inside that department instead.
 */
export async function createDepartmentViaUi(
  page: Page,
  {
    facilityId,
    name,
    type,
    description,
    parentDepartmentName,
  }: {
    facilityId: string;
    name: string;
    type?: DepartmentType;
    description?: string;
    parentDepartmentName?: string;
  },
): Promise<{ departmentId: string; name: string }> {
  return test.step(
    "department.create",
    async () => {
      await gotoUnlessOn(page, departmentsPath(facilityId));
      if (parentDepartmentName) {
        await searchAndOpenDepartment(page, parentDepartmentName);
      }
      await openDepartmentForm(page);
      await fillDepartmentForm(page, { name, type, description });
      const response = waitForCreate(
        page,
        `/facility/${facilityId}/organizations/`,
      );
      await page.getByRole("button", { name: "Create Organization" }).click();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("Organization created successfully"),
      ).toBeVisible({ timeout: 10000 });
      return { departmentId: await createdId(await response), name };
    },
    { box: true },
  );
}

/** Links an existing user to a department with a role, from its Users tab. */
export async function linkUserToDepartmentViaUi(
  page: Page,
  {
    facilityId,
    departmentName,
    username,
    role,
  }: {
    facilityId: string;
    departmentName: string;
    username: string;
    role: string;
  },
): Promise<void> {
  await test.step(
    "department.user.link",
    async () => {
      await gotoUnlessOn(page, departmentsPath(facilityId));
      await searchAndOpenDepartment(page, departmentName);
      await page.getByRole("tab", { name: "Users" }).click();

      await page.getByRole("button", { name: "Link User" }).click();
      await page.getByRole("combobox").click();
      await page.locator("[cmdk-input]").fill(username);
      await page.getByRole("option", { name: username }).first().click();

      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Role" })
        .click();
      await page.getByPlaceholder("Search Roles").fill(role);
      await page.getByRole("option", { name: role }).first().click();

      await page.getByRole("button", { name: "Add to Organization" }).click();
      // Wait for the success toast to confirm the operation completed
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("User added to organization successfully"),
      ).toBeVisible();
    },
    { box: true },
  );
}

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

export interface CreateDeviceInput {
  facilityId: string;
  /** The required Registered Name. */
  name: string;
  userFriendlyName?: string;
  /** Status option: "Active", "Inactive" or "Entered in Error". */
  status?: string;
  /** Availability option: "Available", "Destroyed", "Damaged" or "Lost". */
  availabilityStatus?: string;
  identifier?: string;
  manufacturer?: string;
  lotNumber?: string;
  serialNumber?: string;
  modelNumber?: string;
  partNumber?: string;
  /** Added as a phone contact point. */
  phoneNumber?: string;
}

/** Registers a device from the facility's Add Device form. */
export async function createDeviceViaUi(
  page: Page,
  {
    facilityId,
    name,
    userFriendlyName,
    status,
    availabilityStatus,
    identifier,
    manufacturer,
    lotNumber,
    serialNumber,
    modelNumber,
    partNumber,
    phoneNumber,
  }: CreateDeviceInput,
): Promise<{ deviceId: string; name: string }> {
  return test.step(
    "device.create",
    async () => {
      await gotoUnlessOn(page, devicesPath(facilityId));
      await page.getByRole("link", { name: "Add Device" }).click();

      await page.getByRole("textbox", { name: "Registered Name *" }).fill(name);
      if (userFriendlyName) {
        await page
          .getByRole("textbox", { name: "User Friendly Name" })
          .fill(userFriendlyName);
      }

      if (status) {
        await page
          .getByRole("combobox", { name: "Status *", exact: true })
          .click();
        await page
          .getByRole("listbox")
          .getByRole("option", { name: status })
          .first()
          .click();
      }

      if (availabilityStatus) {
        await page
          .getByRole("combobox", { name: "Availability Status *", exact: true })
          .click();
        await page
          .getByRole("listbox")
          .getByRole("option", { name: availabilityStatus })
          .first()
          .click();
      }

      if (identifier) {
        await page
          .getByRole("textbox", { name: "Identifier" })
          .fill(identifier);
      }
      if (manufacturer) {
        await page
          .getByRole("textbox", { name: "Manufacturer" })
          .fill(manufacturer);
      }
      if (lotNumber) {
        await page.getByRole("textbox", { name: "Lot Number" }).fill(lotNumber);
      }
      if (serialNumber) {
        await page
          .getByRole("textbox", { name: "Serial Number" })
          .fill(serialNumber);
      }
      if (modelNumber) {
        await page
          .getByRole("textbox", { name: "Model Number" })
          .fill(modelNumber);
      }
      if (partNumber) {
        await page
          .getByRole("textbox", { name: "Part Number" })
          .fill(partNumber);
      }
      if (phoneNumber) {
        await page.getByRole("button", { name: "Add Contact Point" }).click();
        await page
          .getByPlaceholder("Enter phone number")
          .first()
          .fill(phoneNumber);
      }

      const response = waitForCreate(page, `/facility/${facilityId}/device/`);
      await page.getByRole("button", { name: "Save" }).click();
      await expect(
        page.getByText("Device registered successfully"),
      ).toBeVisible();
      return { deviceId: await createdId(await response), name };
    },
    { box: true },
  );
}

/** Searches the devices list and opens the device of that name. */
export async function searchAndOpenDevice(
  page: Page,
  deviceName: string,
): Promise<void> {
  await page
    .getByRole("textbox", { name: "Search devices..." })
    .fill(deviceName);
  await page.getByRole("link", { name: deviceName }).click();
}

/** Adds a service record with today's date to a device. */
export async function addDeviceServiceRecordViaUi(
  page: Page,
  {
    facilityId,
    deviceId,
    notes,
  }: { facilityId: string; deviceId: string; notes: string },
): Promise<void> {
  await test.step(
    "device.service-record.create",
    async () => {
      await gotoUnlessOn(page, `${devicesPath(facilityId)}/${deviceId}`);
      // Wait for device details page to load by checking for Add Service Record button
      await expect(
        page.getByRole("button", { name: "Add Service Record" }),
      ).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("button", { name: "Add Service Record" }).click();

      await page.getByRole("textbox", { name: "Notes *" }).fill(notes);

      await page.getByRole("button", { name: "Save" }).click();

      await expect(page.getByText(notes)).toBeVisible();
    },
    { box: true },
  );
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export interface CreateLocationInput {
  facilityId: string;
  name: string;
  /** Location Form option, such as "Building" or "Ward"; the form's default when omitted. */
  form?: string;
  description?: string;
  /** Status option: "Active", "Inactive" or "Unknown". */
  status?: string;
  /** Operational Status option, such as "Occupied". */
  operationalStatus?: string;
}

/** Creates a top-level location from the facility's location settings. */
export async function createLocationViaUi(
  page: Page,
  {
    facilityId,
    name,
    form,
    description,
    status,
    operationalStatus,
  }: CreateLocationInput,
): Promise<{ locationId: string; name: string }> {
  return test.step(
    "location.create",
    async () => {
      await gotoUnlessOn(page, locationsPath(facilityId));
      await page.getByRole("button", { name: "Add Location" }).click();
      if (form) {
        await page.getByRole("combobox", { name: "Location Form" }).click();
        await page.getByRole("option", { name: form }).click();
      }
      await page.getByRole("textbox", { name: "Name" }).fill(name);
      if (description) {
        await page
          .getByRole("textbox", { name: "Description" })
          .fill(description);
      }
      if (status) {
        await page
          .getByRole("combobox", { name: "Status", exact: true })
          .click();
        await page.getByRole("option", { name: status }).first().click();
      }
      if (operationalStatus) {
        await page
          .getByRole("combobox", { name: "Operational Status" })
          .click();
        await page
          .getByRole("option", { name: operationalStatus })
          .first()
          .click();
      }

      const response = waitForCreate(page, `/facility/${facilityId}/location/`);
      await page.getByRole("button", { name: "Create" }).click();
      await expect(
        page.locator("li[data-sonner-toast]").getByText("Location Created"),
      ).toBeVisible();
      return { locationId: await createdId(await response), name };
    },
    { box: true },
  );
}

// ---------------------------------------------------------------------------
// Token categories
// ---------------------------------------------------------------------------

/** Creates a token category from its resource type's section. */
export async function createTokenCategoryViaUi(
  page: Page,
  {
    facilityId,
    resourceType,
    name,
    shorthand,
  }: {
    facilityId: string;
    /** Section label: "Practitioner", "Location" or "Healthcare Service". */
    resourceType: string;
    name: string;
    shorthand: string;
  },
): Promise<{ tokenCategoryId: string; name: string }> {
  return test.step(
    "queue.token-category.create",
    async () => {
      await gotoUnlessOn(page, tokenCategoriesPath(facilityId));
      await expect(
        page.getByRole("heading", { name: "Token Categories" }),
      ).toBeVisible({ timeout: 10000 });

      await page
        .getByRole("region", { name: resourceType, exact: true })
        .getByRole("button", { name: `Add ${resourceType} Token Category` })
        .click();
      const sheet = page.getByRole("dialog", {
        name: "Create Token Category",
      });
      await sheet.getByRole("textbox", { name: "Name" }).fill(name);
      await sheet.getByRole("textbox", { name: "Shorthand" }).fill(shorthand);
      const response = waitForCreate(
        page,
        `/facility/${facilityId}/token/category/`,
      );
      await sheet.getByRole("button", { name: "Create" }).click();
      await expect(sheet).toBeHidden();
      return { tokenCategoryId: await createdId(await response), name };
    },
    { box: true },
  );
}

// ---------------------------------------------------------------------------
// Discounts
// ---------------------------------------------------------------------------

/**
 * Saves the facility discount configuration as "no limit" and "highest value
 * first". It rewrites the facility's whole monetary config from the page, so
 * only call it on a facility no parallel test is writing discounts to.
 */
export async function configureDiscountViaUi(
  page: Page,
  { facilityId }: { facilityId: string },
): Promise<void> {
  await test.step(
    "billing.discount-configuration.configure",
    async () => {
      await page.goto(
        `/facility/${facilityId}/settings/billing/discount_configuration`,
      );
      await page.waitForLoadState("networkidle");

      // Enter edit mode
      const editButton = page.getByRole("button", { name: /edit/i });
      await expect(editButton).toBeVisible();
      await editButton.click();

      // Set a simple, valid configuration using the real labels
      const maxApplicableInput = page.getByLabel(
        /maximum applicable discounts/i,
      );
      await expect(maxApplicableInput).toBeVisible();
      await maxApplicableInput.fill("0"); // 0 = no limit

      const applicabilityOrderTrigger = page.getByLabel(/applicability order/i);
      await expect(applicabilityOrderTrigger).toBeVisible();
      await applicabilityOrderTrigger.click();

      const totalDescOption = page.getByRole("option", {
        name: /highest value first/i,
      });
      await expect(totalDescOption).toBeVisible();
      await totalDescOption.click();

      const saveButton = page.getByRole("button", { name: /save/i });
      await expect(saveButton).toBeVisible();
      await saveButton.click();
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByText(/discount configuration saved successfully/i),
      ).toBeVisible();
    },
    { box: true },
  );
}

/** Creates a facility discount code from the discount codes settings. */
export async function createDiscountCodeViaUi(
  page: Page,
  {
    facilityId,
    name,
    code,
  }: { facilityId: string; name: string; code: string },
): Promise<{ name: string; code: string }> {
  return test.step(
    "billing.discount-code.create",
    async () => {
      await gotoUnlessOn(
        page,
        `/facility/${facilityId}/settings/billing/discount_codes`,
      );
      await page.getByRole("button", { name: /create discount code/i }).click();

      await page.getByRole("textbox", { name: /name/i }).fill(name);
      await page.getByRole("textbox", { name: /code/i }).fill(code);

      await page.getByRole("button", { name: /save/i }).click();

      await expect(
        page.getByText(/discount code created successfully/i),
      ).toBeVisible();
      return { name, code };
    },
    { box: true },
  );
}

// ---------------------------------------------------------------------------
// Facility cover image
// ---------------------------------------------------------------------------

/** Uploads (or replaces) the facility cover image from General settings. */
export async function uploadFacilityCoverViaUi(
  page: Page,
  { facilityId, filePath }: { facilityId: string; filePath: string },
): Promise<void> {
  await test.step(
    "facility.settings.cover.upload",
    async () => {
      await gotoUnlessOn(page, generalSettingsPath(facilityId));
      await page
        .getByRole("button", { name: /^(Add|Edit) cover photo$/i })
        .click();

      await page.locator("input[type='file']").setInputFiles(filePath);

      await page.getByRole("button", { name: "Crop" }).click();
      await page.getByRole("button", { name: "Upload", exact: true }).click();

      await expect(page.getByText("Cover image updated")).toBeVisible();
    },
    { box: true },
  );
}

/** Deletes the facility cover image from General settings. */
export async function deleteFacilityCoverViaUi(
  page: Page,
  { facilityId }: { facilityId: string },
): Promise<void> {
  await test.step(
    "facility.settings.cover.delete",
    async () => {
      await gotoUnlessOn(page, generalSettingsPath(facilityId));
      await page
        .getByRole("button", { name: /^(Add|Edit) cover photo$/i })
        .click();
      await page.getByRole("button", { name: "Delete" }).click();

      await expect(page.getByText("Cover image deleted")).toBeVisible();
    },
    { box: true },
  );
}

// ---------------------------------------------------------------------------
// Patient identifier configs
// ---------------------------------------------------------------------------

/** Creates a facility-level patient identifier config from facility settings. */
export async function createFacilityPatientIdentifierConfigViaUi(
  page: Page,
  {
    facilityId,
    use,
    display,
    description,
    system,
    status,
  }: {
    facilityId: string;
    /** Use option; the form's default ("usual") when omitted. */
    use?: string;
    display: string;
    description: string;
    system: string;
    /** Status option; the form's default ("Draft") when omitted. */
    status?: string;
  },
): Promise<{ configId: string }> {
  return test.step(
    "facility.patient-identifier-config.create",
    async () => {
      await gotoUnlessOn(
        page,
        `/facility/${facilityId}/settings/patient_identifier_config`,
      );
      await page
        .getByRole("button", { name: "Add patient identifier config" })
        .click();

      if (use) {
        await page.getByRole("combobox").filter({ hasText: "usual" }).click();
        await page.getByRole("option", { name: use }).click();
      }

      await page.getByRole("textbox", { name: "Display" }).fill(display);
      await page
        .getByRole("textbox", { name: "Description" })
        .fill(description);
      await page.getByRole("textbox", { name: "System" }).fill(system);

      if (status) {
        await page.getByRole("combobox").filter({ hasText: "Draft" }).click();
        await page.getByRole("option", { name: status, exact: true }).click();
      }

      const response = waitForCreate(
        page,
        "/api/v1/patient_identifier_config/",
      );
      await page.getByRole("button", { name: "Create" }).click();
      return { configId: await createdId(await response) };
    },
    { box: true },
  );
}
