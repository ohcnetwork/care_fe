import { expect, type Page, type Response, test } from "@playwright/test";
import { expectAndDismissToast, expectToast } from "tests/helper/ui";

/**
 * Capability steps for the admin area: roles, governance organizations,
 * suppliers, responsibilities, tag configs and patient identifier configs.
 *
 * Each step opens its page when the browser is not already on it, performs
 * one create action through the UI, waits only for proof that it succeeded
 * and returns the ids the backend gave the new record.
 */

const ROLES_PATH = "/admin/rbac/roles";
const GOVT_ORGANIZATIONS_PATH = "/admin/organizations/govt";
const SUPPLIERS_PATH = "/admin/organizations/product_supplier";
const RESPONSIBILITIES_PATH = "/admin/organizations/role";
const PATIENT_IDENTIFIER_CONFIGS_PATH = "/admin/patient_identifier_config";

/** The role contexts ticked when a step does not choose its own. */
export const DEFAULT_ROLE_CONTEXTS = [
  "Facility",
  "Government Organization",
  "Responsibility",
];

/** The path of the current page without its trailing slash. */
function currentPath(page: Page) {
  return new URL(page.url()).pathname.replace(/\/$/, "");
}

/** Opens `path` unless the current page matches it (the query string is ignored). */
async function openUnlessOn(
  page: Page,
  path: string,
  matches: (pathname: string) => boolean = (pathname) => pathname === path,
) {
  if (matches(currentPath(page))) return false;
  await page.goto(path);
  return true;
}

/** Waits for the next POST response to `pathname` that `match` accepts. */
function waitForCreate(
  page: Page,
  pathname: string,
  match: (body: Record<string, unknown> | null) => boolean = () => true,
) {
  return page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === pathname &&
      response.request().method() === "POST" &&
      match(response.request().postDataJSON()),
  );
}

/** Reads the id of the record a create response returned. */
async function createdId(response: Response) {
  expect(response.ok()).toBeTruthy();
  return ((await response.json()) as { id: string }).id;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  /** Permission labels to tick; every permission when omitted. */
  permissions?: string[];
  /** Context checkbox labels; {@link DEFAULT_ROLE_CONTEXTS} when omitted. */
  contexts?: string[];
}

/** Creates a role on the admin roles page. */
export async function createRoleViaUi(
  page: Page,
  {
    name,
    description,
    permissions,
    contexts = DEFAULT_ROLE_CONTEXTS,
  }: CreateRoleInput,
): Promise<{ roleId: string; name: string }> {
  return test.step(
    "admin.role.create",
    async () => {
      await openUnlessOn(page, ROLES_PATH);
      await page.getByRole("button", { name: /Add Role/i }).click();
      await page.getByPlaceholder("Enter role name").fill(name);
      if (description) {
        await page.getByPlaceholder("Enter role description").fill(description);
      }
      await page
        .getByRole("button", { name: "Select All" })
        .waitFor({ state: "visible" });

      for (const context of contexts) {
        const contextElement = page.getByRole("checkbox", {
          name: context,
          exact: true,
        });
        if (await contextElement.isChecked()) {
          continue;
        }
        await contextElement.click();
      }

      if (permissions) {
        for (const permission of permissions) {
          await page.getByPlaceholder("Search permissions").fill(permission);
          await page
            .getByRole("button", { name: "Select All" })
            .waitFor({ state: "visible" });
          await page.getByLabel(permission).first().check();
        }
      } else {
        // select all permissions
        await page.getByRole("button", { name: "Select All" }).click();
      }

      const response = waitForCreate(page, "/api/v1/role/");
      await page.getByRole("button", { name: /Create Role/i }).click();
      const roleId = await createdId(await response);

      await expectToast(page, "Role created successfully");
      await page.getByRole("button", { name: "Close toast" }).click();
      return { roleId, name };
    },
    { box: true },
  );
}

export interface CreateOrganizationInput {
  name: string;
  /**
   * The governance organization to create the new one under. Without it the
   * step creates a root organization from the governance list.
   */
  parentId?: string;
}

/** Creates a governance (govt) organization, as a root or under `parentId`. */
export async function createOrganizationViaUi(
  page: Page,
  { name, parentId }: CreateOrganizationInput,
): Promise<{ organizationId: string; name: string }> {
  return test.step(
    "admin.organization.create",
    async () => {
      const path = parentId
        ? `${GOVT_ORGANIZATIONS_PATH}/${parentId}`
        : GOVT_ORGANIZATIONS_PATH;
      if ((await openUnlessOn(page, path)) && parentId) {
        // The child "Add organization" button renders with the parent's
        // detail panel, after the page header's root one.
        await expect(
          page.getByRole("textbox", { name: /search by department/i }),
        ).toBeVisible();
      }

      const buttons = page.getByRole("button", { name: /add organization/i });
      await (parentId ? buttons.last() : buttons.first()).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("textbox", { name: /name/i }).fill(name);
      const response = waitForCreate(
        page,
        "/api/v1/organization/",
        (body) => body?.name === name,
      );
      await dialog
        .getByRole("button", { name: /create organization/i })
        .click();
      const organizationId = await createdId(await response);
      await expect(dialog).toBeHidden();
      return { organizationId, name };
    },
    { box: true },
  );
}

/** Creates a product supplier from the suppliers directory. */
export async function createSupplierViaUi(
  page: Page,
  { name, description }: { name: string; description?: string },
): Promise<{ organizationId: string; name: string }> {
  return test.step(
    "admin.supplier.create",
    async () => {
      await openUnlessOn(page, SUPPLIERS_PATH);
      await page.getByRole("button", { name: /add organization/i }).click();
      const createDialog = page.getByRole("dialog");
      await createDialog.getByRole("textbox", { name: /name/i }).fill(name);
      if (description) {
        await createDialog
          .getByRole("textbox", { name: /description/i })
          .fill(description);
      }
      const response = waitForCreate(
        page,
        "/api/v1/organization/",
        (body) => body?.name === name,
      );
      await createDialog
        .getByRole("button", { name: /create organization/i })
        .click();
      const organizationId = await createdId(await response);

      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText(/organization created successfully/i),
      ).toBeVisible();
      return { organizationId, name };
    },
    { box: true },
  );
}

/** Creates a responsibility (role organization) from the responsibilities directory. */
export async function createResponsibilityViaUi(
  page: Page,
  { name, description }: { name: string; description?: string },
): Promise<{ organizationId: string; name: string }> {
  return test.step(
    "admin.responsibility.create",
    async () => {
      // Wide screens open the first responsibility at /role/<id>.
      await openUnlessOn(page, RESPONSIBILITIES_PATH, (pathname) =>
        pathname.startsWith(RESPONSIBILITIES_PATH),
      );
      await page.getByRole("button", { name: /new responsibility/i }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByText(/create responsibility/i)).toBeVisible();
      await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible();

      await dialog.getByRole("textbox", { name: /title/i }).fill(name);
      if (description) {
        await dialog
          .getByRole("textbox", { name: /description/i })
          .fill(description);
      }
      const response = waitForCreate(
        page,
        "/api/v1/organization/",
        (body) => body?.name === name,
      );
      await dialog.getByRole("button", { name: /^create$/i }).click();
      const organizationId = await createdId(await response);

      // Callers create more than one responsibility in a row; close this
      // toast so the next create does not match it as well (two toasts, same
      // text).
      await expectAndDismissToast(page, /organization created successfully/i);
      await expect(dialog).toBeHidden();
      return { organizationId, name };
    },
    { box: true },
  );
}

export interface CreateTagConfigInput {
  /** The display name. */
  name: string;
  /** Creates a facility tag config when given, an instance one otherwise. */
  facilityId?: string;
  /** Category option label, such as "Admin". */
  category?: string;
  description?: string;
  /** Organization option label, such as "Administrator". */
  organization?: string;
  /** Expires the tag automatically after this offset once applied. */
  expiry?: { days: string; hours?: string; allowChange?: boolean };
}

/** The tag config list of the instance, or of `facilityId` when given. */
function tagConfigListPath(facilityId?: string) {
  return facilityId
    ? `/facility/${facilityId}/settings/tag_config`
    : "/admin/tag_config";
}

/** Clicks "Create tag config" and waits until the backend created it. */
async function submitTagConfig(page: Page) {
  const response = waitForCreate(page, "/api/v1/tag_config/");
  await page.getByRole("button", { name: "Create tag config" }).click();
  const tagConfigId = await createdId(await response);
  // Callers often create a parent and a child in a row; close the toast so
  // the next create does not match it as well.
  await expectAndDismissToast(page, "Tag Config created successfully");
  return tagConfigId;
}

/** Creates a top-level tag config on the admin or facility tag config list. */
export async function createTagConfigViaUi(
  page: Page,
  {
    name,
    facilityId,
    category,
    description,
    organization,
    expiry,
  }: CreateTagConfigInput,
): Promise<{ tagConfigId: string; name: string }> {
  return test.step(
    "admin.tag.create",
    async () => {
      await openUnlessOn(page, tagConfigListPath(facilityId));
      await page
        .getByRole("button", { name: "Add tag config" })
        .first()
        .click();
      await page.getByRole("textbox", { name: "Display name *" }).fill(name);

      if (category) {
        await page.getByRole("combobox", { name: "Category" }).click();
        await page.getByRole("option", { name: category }).click();
      }
      if (description) {
        await page
          .getByRole("textbox", { name: "Description" })
          .fill(description);
      }
      if (organization) {
        await page
          .getByRole("combobox")
          .filter({ hasText: "Select Organization" })
          .click();
        await page.getByRole("option", { name: organization }).click();
      }
      if (expiry) {
        await page
          .getByRole("switch", { name: "Expire automatically" })
          .click();
        await page.getByRole("spinbutton", { name: "Days" }).fill(expiry.days);
        if (expiry.hours) {
          await page
            .getByRole("spinbutton", { name: "Hours" })
            .fill(expiry.hours);
        }
        if (expiry.allowChange) {
          await page
            .getByRole("switch", { name: "Allow changing expiry" })
            .click();
        }
      }

      return { tagConfigId: await submitTagConfig(page), name };
    },
    { box: true },
  );
}

/**
 * Adds a child tag to the parent named `parentName`: finds the parent on the
 * tag config list, opens it and uses "Add child tag". Ends on the parent's page.
 */
export async function addChildTagConfigViaUi(
  page: Page,
  {
    parentName,
    name,
    facilityId,
  }: { parentName: string; name: string; facilityId?: string },
): Promise<{ tagConfigId: string; name: string }> {
  return test.step(
    "admin.tag.child.create",
    async () => {
      await openUnlessOn(page, tagConfigListPath(facilityId));
      await page
        .getByRole("textbox", { name: "Search tag configs" })
        .fill(parentName);
      await page
        .getByRole("row", { name: parentName })
        .getByRole("button")
        .click();
      await page.getByRole("button", { name: "Add child tag" }).click();
      await page.getByRole("textbox", { name: "Display name *" }).fill(name);

      return { tagConfigId: await submitTagConfig(page), name };
    },
    { box: true },
  );
}

export interface CreatePatientIdentifierConfigInput {
  /** Use option, such as "usual" or "official". */
  use: string;
  display: string;
  description: string;
  /** The identifier system URL; unique across configs. */
  system: string;
  /** Status option: "Draft", "Active" or "Inactive". */
  status: string;
  regex?: string;
  retrieveWithYearOfBirth?: boolean;
  unique?: boolean;
  /** Picks the auto-generated serial number mode instead of user entered. */
  autoGenerated?: boolean;
}

/** Creates an instance patient identifier config from the admin list. */
export async function createPatientIdentifierConfigViaUi(
  page: Page,
  {
    use,
    display,
    description,
    system,
    status,
    regex,
    retrieveWithYearOfBirth,
    unique,
    autoGenerated,
  }: CreatePatientIdentifierConfigInput,
): Promise<{ configId: string; display: string }> {
  return test.step(
    "admin.patient-identifier-config.create",
    async () => {
      await openUnlessOn(page, PATIENT_IDENTIFIER_CONFIGS_PATH);
      await page
        .getByRole("button", { name: "Add patient identifier config" })
        .click();

      await page.getByRole("combobox").filter({ hasText: "usual" }).click();
      await page.getByRole("option", { name: use }).click();

      await page.getByRole("textbox", { name: "Display" }).fill(display);
      await page
        .getByRole("textbox", { name: "Description" })
        .fill(description);
      await page.getByRole("textbox", { name: "System" }).fill(system);
      if (regex) {
        await page.getByRole("textbox", { name: "Regex" }).fill(regex);
      }
      if (retrieveWithYearOfBirth) {
        await page
          .getByRole("switch", { name: "Retrieve with year of birth" })
          .click();
      }
      if (unique) {
        await page.getByRole("switch", { name: "Unique" }).click();
      }
      if (autoGenerated) {
        await page.getByRole("radio", { name: "Auto-generated" }).click();
      }

      await page.getByRole("combobox").filter({ hasText: "Draft" }).click();
      await page.getByRole("option", { name: status, exact: true }).click();

      const response = waitForCreate(
        page,
        "/api/v1/patient_identifier_config/",
      );
      await page.getByRole("button", { name: "Create" }).click();
      return { configId: await createdId(await response), display };
    },
    { box: true },
  );
}
