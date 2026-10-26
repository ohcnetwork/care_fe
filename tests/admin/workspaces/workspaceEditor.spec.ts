import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import type { UserReadMinimal } from "../../../src/types/user/user";
import type {
  WorkspaceAuthContext,
  WorkspaceCreate,
  WorkspaceRead,
  WorkspaceStatus,
  WorkspaceUpdate,
} from "../../../src/types/workspace/workspace";

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 1440, height: 1000 },
});

interface StoredWorkspace {
  data: WorkspaceRead;
  authContext: WorkspaceAuthContext;
  facilityId: string | null;
  departmentId: string | null;
}

interface WorkspaceWrite {
  method: string;
  pathname: string;
  body: Record<string, unknown> | null;
}

function workspace(
  authContext: WorkspaceAuthContext,
  facilityId?: string,
  status: WorkspaceStatus = "active",
): StoredWorkspace {
  return {
    authContext,
    facilityId: facilityId ?? null,
    departmentId: null,
    data: {
      id: faker.string.uuid(),
      name: `Workspace ${faker.word.words(2)} ${faker.string.alphanumeric(6)}`,
      description: faker.lorem.sentence(),
      template: { sections: [{ key: "overview", visible: true }] },
      status,
      created_by: null,
      updated_by: null,
    },
  };
}

function workspaceUser(id = faker.string.uuid()): UserReadMinimal {
  return {
    id,
    username: `workspace-user-${faker.string.alphanumeric(6)}`,
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    phone_number: "+919999999999",
    user_type: "administrator",
    gender: "non_binary",
    last_login: "2026-01-01T00:00:00Z",
    profile_picture_url: "",
    mfa_enabled: false,
    deleted: false,
    is_service_account: false,
  };
}

async function openGeneralSettings(page: Page) {
  await page.getByRole("button", { name: /^General settings\b/ }).click();
}

/** JSON is an advanced escape hatch; unrecognised templates open it automatically. */
async function openJsonEditor(page: Page) {
  const templateField = page.getByRole("textbox", {
    name: "Template (JSON)",
    exact: true,
  });
  if (await templateField.isVisible()) return;
  await page.getByRole("button", { name: "More options", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Edit as JSON (advanced)", exact: true })
    .click();
  await expect(templateField).toBeVisible();
}

async function addSection(page: Page, column: string, label: string) {
  await page
    .getByRole("button", { name: `Add a section to ${column}`, exact: true })
    .click();
  const picker = page.getByRole("dialog", {
    name: "Add a section",
    exact: true,
  });
  await picker
    .getByRole("textbox", { name: "Search sections", exact: true })
    .fill(label);
  await picker.getByRole("button", { name: label, exact: true }).click();
  await expect(picker).not.toBeVisible();
}

function sectionSettings(page: Page) {
  return page.getByRole("dialog", { name: "Section settings", exact: true });
}

async function openSectionSettings(page: Page, name: string) {
  await page
    .getByRole("button", { name: `Settings for ${name}`, exact: true })
    .first()
    .click();
  await expect(sectionSettings(page)).toBeVisible();
}

async function closeSectionSettings(page: Page) {
  await sectionSettings(page)
    .getByRole("button", { name: "Done", exact: true })
    .click();
  await expect(sectionSettings(page)).not.toBeVisible();
}

async function sectionAction(page: Page, name: string, action: string) {
  await page
    .getByRole("button", { name: `More actions for ${name}`, exact: true })
    .first()
    .click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

async function mockWorkspaceApi(
  page: Page,
  options: {
    records?: StoredWorkspace[];
    failedId?: string;
    facilityId?: string;
    isSuperuser?: boolean;
    userId?: string;
  } = {},
) {
  const facilityId = options.facilityId ?? faker.string.uuid();
  const records = options.records ?? [];
  const writes: WorkspaceWrite[] = [];
  const reads: URL[] = [];
  const rejectedWrites = new Set<string>();
  const failures = { list: false };
  const user = workspaceUser(options.userId);
  const organizations = Array.from({ length: 2 }, () => ({
    id: faker.string.uuid(),
    name: `Department ${faker.word.words(2)} ${faker.string.alphanumeric(6)}`,
    description: "",
    org_type: "dept",
    level_cache: 1,
    active: true,
    has_children: false,
    permissions: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }));
  const assignments = new Map(
    records.map((record) => [record.data.id, [organizations[0].id]]),
  );
  const roleOrganizations = Array.from({ length: 2 }, () => ({
    id: faker.string.uuid(),
    name: `Role ${faker.word.words(2)} ${faker.string.alphanumeric(6)}`,
    description: "",
    org_type: "role",
    active: true,
    metadata: null,
    parent: {},
    created_by: null,
    updated_by: null,
    system_generated: false,
    level_cache: 0,
    has_children: false,
  }));
  const organizationAssignments = new Map(
    records.map((record) => [record.data.id, [roleOrganizations[0].id]]),
  );

  await page.addInitScript(() => {
    localStorage.setItem("care_access_token", "workspace-editor-test");
  });
  // Isolate every API request, including all mutations. This contract test
  // must never authenticate against or modify a configured remote backend.
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const pathname = url.pathname;
      const method = request.method();

      if (method === "GET" && pathname === "/api/v1/users/getcurrentuser/") {
        await route.fulfill({
          json: {
            ...user,
            is_superuser: options.isSuperuser ?? true,
            permissions: [],
            facilities: [],
            organizations: [],
            preferences: {},
            flags: [],
          },
        });
        return;
      }
      if (method === "GET" && pathname === "/api/v1/plug_config/") {
        await route.fulfill({ json: { configs: [] } });
        return;
      }
      if (method === "GET" && pathname === `/api/v1/facility/${facilityId}/`) {
        await route.fulfill({
          json: {
            id: facilityId,
            name: `Test facility ${facilityId.slice(0, 8)}`,
            permissions: ["can_read_workspace", "can_write_workspace"],
            root_org_permissions: [],
            features: [],
          },
        });
        return;
      }
      if (
        method === "GET" &&
        pathname.startsWith(`/api/v1/facility/${facilityId}/organizations/`)
      ) {
        const organization = organizations.find(
          (item) =>
            pathname ===
            `/api/v1/facility/${facilityId}/organizations/${item.id}/`,
        );
        await route.fulfill({
          json: organization ?? {
            count: organizations.length,
            results: organizations,
          },
        });
        return;
      }
      if (method === "GET" && pathname === "/api/v1/organization/") {
        reads.push(url);
        const name = url.searchParams.get("name")?.toLowerCase() ?? "";
        const matching = roleOrganizations.filter((organization) =>
          organization.name.toLowerCase().includes(name),
        );
        const offset = Number(url.searchParams.get("offset") ?? 0);
        const limit = Number(url.searchParams.get("limit") ?? 14);
        await route.fulfill({
          json: {
            count: matching.length,
            results: matching.slice(offset, offset + limit),
          },
        });
        return;
      }
      if (method === "GET" && pathname.startsWith("/api/v1/organization/")) {
        const organization = roleOrganizations.find(
          (item) => pathname === `/api/v1/organization/${item.id}/`,
        );
        await route.fulfill({
          status: organization ? 200 : 404,
          json: organization ?? { detail: "Organization not found" },
        });
        return;
      }
      if (!pathname.startsWith("/api/v1/workspace/")) {
        await route.abort();
        return;
      }

      if (method === "GET") {
        reads.push(url);
      } else {
        writes.push({
          method,
          pathname,
          body: request.postData() ? request.postDataJSON() : null,
        });
        if (rejectedWrites.has(`${method} ${pathname}`)) {
          await route.fulfill({
            status: 403,
            json: { detail: "Permission denied" },
          });
          return;
        }
      }
      if (method === "GET" && pathname === "/api/v1/workspace/") {
        if (failures.list) {
          await route.fulfill({
            status: 503,
            json: { detail: "Workspace list temporarily unavailable" },
          });
          return;
        }
        const name = url.searchParams.get("name")?.toLowerCase() ?? "";
        const matching = records.filter(
          (record) =>
            (!url.searchParams.has("auth_context") ||
              record.authContext === url.searchParams.get("auth_context")) &&
            (!url.searchParams.has("facility") ||
              record.facilityId === url.searchParams.get("facility")) &&
            (!url.searchParams.has("status") ||
              record.data.status === url.searchParams.get("status")) &&
            record.data.name.toLowerCase().includes(name),
        );
        const offset = Number(url.searchParams.get("offset") ?? 0);
        const limit = Number(url.searchParams.get("limit") ?? 100);
        await route.fulfill({
          json: {
            count: matching.length,
            results: matching
              .slice(offset, offset + limit)
              .map((record) => record.data),
          },
        });
        return;
      }
      if (method === "POST" && pathname === "/api/v1/workspace/") {
        const payload = request.postDataJSON() as WorkspaceCreate;
        const created = workspace(
          payload.auth_context,
          payload.facility ?? undefined,
        );
        created.data = {
          ...created.data,
          name: payload.name,
          description: payload.description,
          template: payload.template,
          status: payload.status,
          created_by: user,
        };
        created.departmentId = payload.facility_organization ?? null;
        records.push(created);
        await route.fulfill({
          status: 201,
          json: created.data,
        });
        return;
      }
      const record = records.find((item) =>
        pathname.startsWith(`/api/v1/workspace/${item.data.id}/`),
      );
      if (
        method === "GET" &&
        pathname === `/api/v1/workspace/${options.failedId}/`
      ) {
        await route.fulfill({
          status: 500,
          json: { detail: "Workspace temporarily unavailable" },
        });
        return;
      }
      if (!record) {
        await route.fulfill({ status: 404, json: { detail: "Not found" } });
        return;
      }
      if (method === "GET" && pathname.endsWith("/get_organizations/")) {
        if (
          record.authContext !== "instance" ||
          options.isSuperuser === false
        ) {
          await route.fulfill({
            status: 403,
            json: { detail: "Permission denied" },
          });
          return;
        }
        const selected = roleOrganizations.filter((organization) =>
          organizationAssignments
            .get(record.data.id)
            ?.includes(organization.id),
        );
        await route.fulfill({
          json: { count: selected.length, results: selected },
        });
      } else if (
        method === "POST" &&
        pathname.endsWith("/set_organizations/")
      ) {
        if (
          record.authContext !== "instance" ||
          options.isSuperuser === false
        ) {
          await route.fulfill({
            status: 403,
            json: { detail: "Permission denied" },
          });
          return;
        }
        const payload = request.postDataJSON() as { organizations: string[] };
        organizationAssignments.set(record.data.id, payload.organizations);
        await route.fulfill({ json: {} });
      } else if (
        method === "GET" &&
        pathname.endsWith("/get_facility_organizations/")
      ) {
        if (record.authContext !== "facility") {
          await route.fulfill({
            status: 403,
            json: { detail: "Permission denied" },
          });
          return;
        }
        const selected = organizations.filter((org) =>
          assignments.get(record.data.id)?.includes(org.id),
        );
        await route.fulfill({
          json: { count: selected.length, results: selected },
        });
      } else if (
        method === "POST" &&
        pathname.endsWith("/set_facility_organizations/")
      ) {
        const payload = request.postDataJSON() as {
          facility_organizations: string[];
        };
        assignments.set(record.data.id, payload.facility_organizations);
        await route.fulfill({ json: {} });
      } else if (pathname === `/api/v1/workspace/${record.data.id}/`) {
        if (method === "GET") {
          // As in the backend, a detail read alone does not enforce list filters.
          await route.fulfill({ json: record.data });
        } else if (method === "PUT") {
          const payload = request.postDataJSON() as WorkspaceUpdate;
          record.data = {
            ...record.data,
            name: payload.name,
            description: payload.description,
            template: payload.template,
            status: payload.status,
          };
          await route.fulfill({ json: record.data });
        } else if (method === "DELETE") {
          records.splice(records.indexOf(record), 1);
          await route.fulfill({ status: 204 });
        } else {
          await route.abort();
        }
      } else {
        await route.abort();
      }
    },
  );

  return {
    facilityId,
    records,
    writes,
    reads,
    rejectedWrites,
    failures,
    organizations,
    assignments,
    roleOrganizations,
    organizationAssignments,
    user,
  };
}

test("instance admins can validate, create, reopen, update, and delete a workspace", async ({
  page,
}, testInfo) => {
  const api = await mockWorkspaceApi(page);
  const name = `Workspace ${faker.word.words(2)} ${faker.string.alphanumeric(6)}`;
  const description = faker.lorem.sentence();
  const template = {
    sections: [{ id: "overview", enabled: true }],
    extensions: { nested: [1, null, "value"] },
  };
  const nameField = page.getByRole("textbox", { name: "Name", exact: true });
  const templateField = page.getByRole("textbox", {
    name: "Template (JSON)",
    exact: true,
  });
  const overflowTemplate = '{"extensions":{"config":{"threshold":1e400}}}';

  await test.step("Reject malformed JSON before creating a configuration", async () => {
    await page.goto("/admin/workspaces");
    await page
      .getByRole("link", { name: "Create workspace", exact: true })
      .click();
    await nameField.fill(name);
    await page
      .getByRole("textbox", { name: "Description", exact: true })
      .fill(description);
    await openJsonEditor(page);
    for (const invalidTemplate of [
      "{ invalid JSON }",
      "[]",
      "null",
      overflowTemplate,
    ]) {
      await templateField.fill(invalidTemplate);
      if (invalidTemplate === overflowTemplate) {
        await page
          .getByRole("button", { name: "Format JSON", exact: true })
          .click();
        await expect(templateField).toHaveValue(overflowTemplate);
        await expect(
          page.getByRole("alert").filter({
            hasText:
              "Enter valid JSON with an object at the top level. Arrays, null, and other values are not supported.",
          }),
        ).toBeVisible();
      }
      await page
        .getByRole("button", { name: "Create workspace", exact: true })
        .click();
      await expect(
        page
          .getByText(
            "Enter valid JSON with an object at the top level. Arrays, null, and other values are not supported.",
            { exact: true },
          )
          .first(),
      ).toBeVisible();
      await expect(templateField).toHaveValue(invalidTemplate);
      expect(api.writes).toHaveLength(0);
    }
  });

  await test.step("System page layouts cannot be overridden in encounter configuration", async () => {
    await templateField.fill(
      JSON.stringify({
        schema_version: 1,
        pages: [
          { key: "medicines", kind: "system", title: "Replaced medications" },
        ],
      }),
    );
    await page
      .getByRole("button", { name: "Create workspace", exact: true })
      .click();
    await expect(
      page.getByText(
        "Use schema_version 1 with valid pages, unique page keys, and at most 4 columns per page with positive spans totaling at most 12. System pages allow only key, kind, and hidden.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(api.writes).toHaveLength(0);
  });

  await test.step("Create and reload preserves arbitrary nested template properties", async () => {
    await templateField.fill(JSON.stringify(template));
    await page
      .getByRole("button", { name: "Create workspace", exact: true })
      .click();
    await page.waitForURL(/\/admin\/workspaces\/[\da-f-]+\/edit$/);
    expect(api.writes).toHaveLength(1);
    expect(api.writes[0]).toMatchObject({
      method: "POST",
      pathname: "/api/v1/workspace/",
      body: {
        name,
        description,
        template,
        status: "active",
        auth_context: "instance",
        inherited: false,
      },
    });
    await page.reload();
    await openGeneralSettings(page);
    await expect(nameField).toHaveValue(name);
    await expect(templateField).toHaveValue(JSON.stringify(template, null, 2));
    await page.screenshot({
      path: testInfo.outputPath("workspace-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: testInfo.outputPath("workspace-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  });

  await test.step("Save updates the existing workspace while preserving scope", async () => {
    const updatedName = `${name} revised`;
    const updatedTemplate = {
      ...template,
      sections: [{ id: "overview", enabled: false }],
    };
    await nameField.fill(updatedName);
    await templateField.fill(JSON.stringify(updatedTemplate));
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await expect(
      page.getByText("Workspace updated", { exact: true }),
    ).toBeVisible();
    expect(api.writes).toHaveLength(2);
    expect(api.writes[1]).toMatchObject({
      method: "PUT",
      body: {
        name: updatedName,
        description,
        template: updatedTemplate,
        status: "active",
      },
    });
    expect(api.writes[1].body).not.toHaveProperty("auth_context");
    expect(api.writes[1].body).not.toHaveProperty("facility");
    await page.reload();
    await openGeneralSettings(page);
    await expect(nameField).toHaveValue(updatedName);
    await expect(templateField).toHaveValue(
      JSON.stringify(updatedTemplate, null, 2),
    );
  });

  await test.step("Delete removes the saved workspace from the list", async () => {
    await page
      .getByRole("button", { name: "Delete workspace", exact: true })
      .click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await page.waitForURL("**/admin/workspaces");
    await expect(
      page.getByRole("link", { name: `${name} revised`, exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("No workspaces found", { exact: true }),
    ).toBeVisible();
    expect(api.writes.map((write) => write.method)).toEqual([
      "POST",
      "PUT",
      "DELETE",
    ]);
  });
});

test("visual editing builds, orders, and reloads an encounter workspace", async ({
  page,
}, testInfo) => {
  const api = await mockWorkspaceApi(page);
  const requestStatusLabel = "État des demandes";
  const activeStatusLabel = "Actif traduit";
  await page.route("**/locale/en.json", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      json: {
        ...(await response.json()),
        workspace_widget_request_status: requestStatusLabel,
        active: activeStatusLabel,
        schema_select_placeholder: "Choisir {{label}}",
        workspace_config_integer_error: "Saisissez un nombre entier.",
        workspace_config_number_maximum: "Le maximum est de {{maximum}}.",
      },
    });
  });
  const name = `Clinical workspace ${faker.string.alphanumeric(8)}`;
  const tabTitle = `Ward rounds ${faker.string.alphanumeric(6)}`;
  const description = faker.lorem.sentence();
  const opaqueConfig = {
    compact: true,
    priority: 3,
    limit: { toString: "label" },
    display_code: "5",
  };
  const template = {
    schema_version: 2,
    surface: "encounter",
    pages: [
      { kind: "system", key: "immunizations", hidden: true },
      {
        kind: "custom",
        key: "rounds",
        title: tabTitle,
        icon: "layout-dashboard",
        hidden: true,
        columns: [
          {
            span: 6,
            widgets: [
              {
                type: "questionnaire_responses",
                title: "Progress notes",
                config: {
                  questionnaire_slug: "daily-progress-note",
                  limit: 1,
                  only_unstructured: true,
                  role: api.roleOrganizations[0].id,
                },
              },
              { type: "symptoms", config: opaqueConfig },
            ],
          },
          {
            span: 6,
            widgets: [
              {
                type: "service_requests",
                title: "Active requests",
                config: { status: "active" },
              },
            ],
          },
        ],
      },
    ],
  };
  const column = (label: string) =>
    page.getByRole("region", { name: label, exact: true });
  const settings = sectionSettings(page);
  const configJson = settings.getByRole("textbox", {
    name: "Widget configuration (JSON)",
    exact: true,
  });
  const create = page.getByRole("button", {
    name: "Create workspace",
    exact: true,
  });
  const showTab = page.getByRole("switch", {
    name: "Show this tab",
    exact: true,
  });

  await test.step("Start from a blank screen and name its first tab", async () => {
    await page.goto("/admin/workspaces");
    await page
      .getByRole("link", { name: "Create workspace", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /^General settings\b/ }),
    ).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
    await page
      .getByRole("textbox", { name: "Description", exact: true })
      .fill(description);
    await expect(
      page.getByRole("textbox", { name: "Template (JSON)", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "What would you like to design?" }),
    ).toBeVisible();
    await page
      .getByRole("region", { name: "Encounter screen", exact: true })
      .getByRole("button", { name: "Blank", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Overview", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Tab settings", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Tab settings",
      exact: true,
    });
    await dialog
      .getByRole("textbox", { name: "Tab name", exact: true })
      .fill(tabTitle);
    await dialog.getByText("Advanced", { exact: true }).click();
    await dialog
      .getByRole("textbox", { name: "Address in the URL", exact: true })
      .fill("rounds");
    await dialog
      .getByRole("button", { name: "Apply changes", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: tabTitle, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "One column", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: "Two columns", exact: true })
      .click();
    await expect(column("Left")).toBeVisible();
    await expect(column("Right")).toBeVisible();
  });

  await test.step("Add sections, adjust their options, and arrange them", async () => {
    await addSection(page, "Left", "Symptoms");
    await openSectionSettings(page, "Symptoms");
    await settings.getByText("Advanced configuration", { exact: true }).click();
    const invalidConfig = '{"compact":true,"limit":{"toString":';
    await configJson.fill(invalidConfig);
    await expect(configJson).toHaveValue(invalidConfig);
    await expect(configJson).toHaveAttribute("aria-invalid", "true");
    // The drawer is modal, so an invalid draft blocks Done rather than Save.
    await expect(
      settings.getByRole("button", { name: "Done", exact: true }),
    ).toBeDisabled();
    await configJson.fill(JSON.stringify(opaqueConfig));
    await expect(configJson).toHaveAttribute("aria-invalid", "false");
    await expect(
      settings.getByRole("button", { name: "Done", exact: true }),
    ).toBeEnabled();
    await closeSectionSettings(page);
    await expect(create).toBeEnabled();

    await addSection(page, "Left", "Questionnaire Responses");
    await sectionAction(page, "Questionnaire Responses", "Move up");
    await expect(
      column("Left").getByRole("article").first(),
    ).toHaveAccessibleName("Questionnaire Responses");
    await openSectionSettings(page, "Questionnaire Responses");
    await settings
      .getByRole("textbox", { name: "Title shown to users", exact: true })
      .fill("Progress notes");
    await settings
      .getByRole("textbox", { name: "Form slug", exact: true })
      .fill("daily-progress-note");
    await settings
      .getByRole("checkbox", { name: "Form responses only", exact: true })
      .check();
    await settings
      .getByRole("combobox", { name: "Author role", exact: true })
      .click();
    await page
      .getByRole("option", { name: api.roleOrganizations[0].name, exact: true })
      .click();
    const responseLimit = settings.getByRole("spinbutton", {
      name: "Latest results",
      exact: true,
    });
    await expect(responseLimit).toHaveValue("");
    for (const [invalidLimit, message] of [
      ["2.5", "Saisissez un nombre entier."],
      ["101", "Le maximum est de 100."],
    ]) {
      await responseLimit.fill(invalidLimit);
      await expect(responseLimit).toHaveValue(invalidLimit);
      await expect(
        settings.getByText(message, { exact: true }).first(),
      ).toBeVisible();
      await expect(
        settings.getByRole("button", { name: "Done", exact: true }),
      ).toBeDisabled();
    }
    await responseLimit.fill("1");
    await expect(
      settings.getByRole("button", { name: "Done", exact: true }),
    ).toBeEnabled();
    await closeSectionSettings(page);
    await expect(create).toBeEnabled();

    const leftSymptoms = column("Left").getByRole("article", {
      name: "Symptoms",
      exact: true,
    });
    const rightSymptoms = column("Right").getByRole("article", {
      name: "Symptoms",
      exact: true,
    });
    await page
      .getByRole("button", { name: "More actions for Symptoms", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Move to", exact: true }).click();
    await page.getByRole("menuitem", { name: "Right", exact: true }).click();
    await expect(leftSymptoms).toHaveCount(0);
    await expect(rightSymptoms).toBeVisible();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(leftSymptoms).toBeVisible();
    await expect(rightSymptoms).toHaveCount(0);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    await expect(leftSymptoms).toHaveCount(0);
    await expect(rightSymptoms).toBeVisible();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(leftSymptoms).toBeVisible();
    await expect(rightSymptoms).toHaveCount(0);

    await addSection(page, "Left", "Vitals");
    await sectionAction(page, "Vitals", "Remove section");
    await expect(
      column("Left").getByRole("article", { name: "Vitals", exact: true }),
    ).toHaveCount(0);

    await addSection(page, "Right", "Service Requests");
    await openSectionSettings(page, "Service Requests");
    await settings
      .getByRole("textbox", { name: "Title shown to users", exact: true })
      .fill("Active requests");
    const requestStatus = settings.getByRole("combobox", {
      name: requestStatusLabel,
      exact: true,
    });
    await expect(requestStatus).toHaveText(`Choisir ${requestStatusLabel}`);
    await requestStatus.click();
    await page
      .getByRole("option", { name: activeStatusLabel, exact: true })
      .click();
    const requestLimit = settings.getByRole("spinbutton", {
      name: "Latest results",
      exact: true,
    });
    await expect(requestLimit).toHaveValue("");
    await requestLimit.fill("5");
    await requestLimit.clear();
    await closeSectionSettings(page);

    await page
      .getByRole("button", { name: "Three columns", exact: true })
      .click();
    await expect(column("Middle")).toBeVisible();
    await page
      .getByRole("button", { name: "Two columns", exact: true })
      .click();
    await expect(column("Middle")).toHaveCount(0);
    await expect(
      column("Right").getByRole("article", {
        name: "Active requests",
        exact: true,
      }),
    ).toBeVisible();
  });

  await test.step("Hide the tab, add a built-in tab, and place it first", async () => {
    await showTab.click();
    await expect(showTab).not.toBeChecked();
    await expect(
      page.getByText("Hidden from users", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Add tab", exact: true }).click();
    await page
      .getByRole("menuitem", { name: "Immunizations", exact: true })
      .click();
    await expect(
      page.getByText("This tab is built into CARE", { exact: true }),
    ).toBeVisible();
    await showTab.click();
    await expect(showTab).not.toBeChecked();
    await page
      .getByRole("button", { name: "Move tab up", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Add a section", exact: true }),
    ).toHaveCount(0);
    await create.click();
    await page.waitForURL(/\/admin\/workspaces\/[\da-f-]+\/edit$/);
    expect(api.writes).toEqual([
      {
        method: "POST",
        pathname: "/api/v1/workspace/",
        body: {
          name,
          description,
          template,
          status: "active",
          auth_context: "instance",
          inherited: false,
        },
      },
    ]);
  });

  await test.step("Reload restores the design and the same JSON contract", async () => {
    await expect(
      page.getByRole("button", { name: /^General settings\b/ }),
    ).toHaveAttribute("aria-expanded", "false");
    await page.reload();
    await expect(
      page.getByRole("button", { name: /^General settings\b/ }),
    ).toHaveAttribute("aria-expanded", "false");
    await expect(
      page.getByRole("button", { name: "Save Changes", exact: true }),
    ).toBeDisabled();
    await expect(showTab).not.toBeChecked();
    await page.getByRole("button", { name: tabTitle, exact: true }).click();
    await expect(showTab).not.toBeChecked();
    await expect(
      page.getByRole("button", { name: "Two columns", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await openSectionSettings(page, "Active requests");
    await expect(
      settings.getByRole("combobox", { name: requestStatusLabel, exact: true }),
    ).toHaveText(activeStatusLabel);
    await expect(
      settings.getByRole("spinbutton", { name: "Latest results", exact: true }),
    ).toHaveValue("");
    await closeSectionSettings(page);
    await openSectionSettings(page, "Symptoms");
    await settings.getByText("Advanced configuration", { exact: true }).click();
    expect(JSON.parse(await configJson.inputValue())).toEqual(opaqueConfig);
    await page.screenshot({
      path: testInfo.outputPath("workspace-section-settings.png"),
      fullPage: true,
    });
    await closeSectionSettings(page);
    await openSectionSettings(page, "Progress notes");
    await expect(
      settings.getByRole("textbox", { name: "Form slug", exact: true }),
    ).toHaveValue("daily-progress-note");
    await expect(
      settings.getByRole("spinbutton", { name: "Latest results", exact: true }),
    ).toHaveValue("1");
    await expect(
      settings.getByRole("checkbox", {
        name: "Form responses only",
        exact: true,
      }),
    ).toBeChecked();
    await expect(
      settings.getByRole("combobox", { name: "Author role", exact: true }),
    ).toHaveText(api.roleOrganizations[0].name);
    await closeSectionSettings(page);
    await page.screenshot({
      path: testInfo.outputPath("workspace-studio-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(column("Left")).toBeVisible();
    await expect(column("Right")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await page.screenshot({
      path: testInfo.outputPath("workspace-studio-mobile.png"),
      fullPage: true,
    });
    await openJsonEditor(page);
    const json = page.getByRole("textbox", {
      name: "Template (JSON)",
      exact: true,
    });
    expect(JSON.parse(await json.inputValue())).toEqual(template);
    expect(api.writes).toHaveLength(1);
  });
});

test("instance organization access searches, replaces, and clears grants while preserving failed drafts", async ({
  page,
}, testInfo) => {
  const record = workspace("instance");
  const api = await mockWorkspaceApi(page, { records: [record] });
  const [original, replacement] = api.roleOrganizations;
  const access = page.getByRole("region", {
    name: "Organizations with access",
    exact: true,
  });
  const saveAccess = access.getByRole("button", {
    name: "Save access",
    exact: true,
  });
  const originalChip = access.getByRole("button", {
    name: `Remove ${original.name}`,
    exact: true,
  });
  const replacementChip = access.getByRole("button", {
    name: `Remove ${replacement.name}`,
    exact: true,
  });
  const accessPath = `/api/v1/workspace/${record.data.id}/set_organizations/`;
  const generalSettings = page.getByRole("button", {
    name: /^General settings\b/,
  });
  const descriptionField = page.getByRole("textbox", {
    name: "Description",
    exact: true,
  });

  await test.step("Search for another organization and replace the existing grant", async () => {
    await page.goto(`/admin/workspaces/${record.data.id}/edit`);
    await expect(generalSettings).toHaveAttribute("aria-expanded", "false");
    await expect(access).not.toBeVisible();
    await openGeneralSettings(page);
    await expect(originalChip).toBeVisible();
    await expect(saveAccess).toBeDisabled();
    await access
      .getByRole("button", { name: /^Search Organizations$/i })
      .click();
    const searchResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === "/api/v1/organization/" &&
        url.searchParams.get("name") === replacement.name
      );
    });
    await page
      .getByPlaceholder("Search Organizations", { exact: true })
      .fill(replacement.name);
    await searchResponse;
    await page
      .getByRole("option", { name: replacement.name, exact: true })
      .click();
    await page.keyboard.press("Escape");
    await expect(originalChip).toBeVisible();
    await expect(replacementChip).toBeVisible();
    expect(
      api.reads.some(
        (url) =>
          url.pathname === "/api/v1/organization/" &&
          url.searchParams.get("name") === replacement.name,
      ),
    ).toBe(true);
    await originalChip.click();
    await expect(originalChip).toHaveCount(0);
    const draftDescription = faker.lorem.sentence();
    await descriptionField.fill(draftDescription);
    await generalSettings.click();
    await expect(generalSettings).toHaveAttribute("aria-expanded", "false");
    await expect(access).not.toBeVisible();
    await openGeneralSettings(page);
    await expect(descriptionField).toBeVisible();
    await expect(descriptionField).toHaveValue(draftDescription);
    await expect(originalChip).toHaveCount(0);
    await expect(replacementChip).toBeVisible();
    await expect(saveAccess).toBeEnabled();
    await descriptionField.fill(record.data.description);
    await saveAccess.click();
    await expect(
      page.getByText("Workspace access saved", { exact: true }),
    ).toBeVisible();
    await expect(saveAccess).toBeDisabled();
    expect(api.writes).toEqual([
      {
        method: "POST",
        pathname: accessPath,
        body: { organizations: [replacement.id] },
      },
    ]);
    await page.reload();
    await openGeneralSettings(page);
    await expect(replacementChip).toBeVisible();
    await expect(originalChip).toHaveCount(0);
    await expect(saveAccess).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Save Changes", exact: true }),
    ).toBeDisabled();
    await access.screenshot({
      path: testInfo.outputPath("workspace-organization-access.png"),
    });
  });

  await test.step("A failed clear preserves its draft and retries with an empty organization list", async () => {
    api.rejectedWrites.add(`POST ${accessPath}`);
    await replacementChip.click();
    await expect(replacementChip).toHaveCount(0);
    const rejectedResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === accessPath &&
        response.request().method() === "POST",
    );
    await saveAccess.click();
    expect((await rejectedResponse).status()).toBe(403);
    await expect(access.getByRole("alert")).toBeVisible();
    await expect(originalChip).toHaveCount(0);
    await expect(replacementChip).toHaveCount(0);
    await expect(saveAccess).toBeEnabled();

    api.rejectedWrites.delete(`POST ${accessPath}`);
    await saveAccess.click();
    await expect(
      page.getByText("Workspace access saved", { exact: true }),
    ).toBeVisible();
    await expect(saveAccess).toBeDisabled();
    await expect(access.getByRole("alert")).toHaveCount(0);
    const clearAccess = {
      method: "POST",
      pathname: accessPath,
      body: { organizations: [] },
    };
    expect(api.writes.slice(1)).toEqual([clearAccess, clearAccess]);
    await page.reload();
    await openGeneralSettings(page);
    await expect(access).toBeVisible();
    await expect(saveAccess).toBeDisabled();
    await expect(originalChip).toHaveCount(0);
    await expect(replacementChip).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "Name", exact: true }),
    ).toHaveValue(record.data.name);
  });
});

test("facility configuration stays scoped and saves department access separately", async ({
  page,
}) => {
  const facilityId = faker.string.uuid();
  const local = workspace("facility", facilityId);
  const anotherFacility = workspace("facility", faker.string.uuid());
  const instance = workspace("instance");
  const api = await mockWorkspaceApi(page, {
    facilityId,
    records: [local, anotherFacility, instance],
  });
  const basePath = `/facility/${facilityId}/settings/workspaces`;
  const access = page.getByRole("region", {
    name: "Departments with access",
    exact: true,
  });

  await test.step("The facility list excludes instance and other facility configurations", async () => {
    await page.goto(basePath);
    await expect(
      page.getByRole("link", { name: local.data.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: anotherFacility.data.name, exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: instance.data.name, exact: true }),
    ).toHaveCount(0);
    const list = api.reads.find((url) => url.pathname === "/api/v1/workspace/");
    expect(list?.searchParams.has("auth_context")).toBe(false);
    expect(list?.searchParams.get("facility")).toBe(facilityId);
    await page
      .getByRole("link", { name: local.data.name, exact: true })
      .click();
    await openGeneralSettings(page);
  });

  await test.step("Add access without dropping existing departments or saving configuration", async () => {
    await expect(
      access.getByText(api.organizations[0].name, { exact: true }),
    ).toBeVisible();
    await access.getByRole("combobox").click();
    await page
      .getByRole("option", { name: api.organizations[1].name, exact: true })
      .click();
    await access
      .getByRole("button", { name: "Save access", exact: true })
      .click();
    await expect(
      page.getByText("Workspace access saved", { exact: true }),
    ).toBeVisible();
    expect(api.writes).toEqual([
      {
        method: "POST",
        pathname: `/api/v1/workspace/${local.data.id}/set_facility_organizations/`,
        body: {
          facility_organizations: api.organizations.map((org) => org.id),
        },
      },
    ]);
    await page.reload();
    await openGeneralSettings(page);
    for (const organization of api.organizations) {
      await expect(
        access.getByText(organization.name, { exact: true }),
      ).toBeVisible();
    }
    await expect(
      access.getByRole("button", { name: "Save access", exact: true }),
    ).toBeDisabled();
  });

  await test.step("A new configuration retains the facility scope when created", async () => {
    const name = `Facility workspace ${faker.word.words(2)} ${faker.string.alphanumeric(6)}`;
    await page.goto(basePath);
    await page
      .getByRole("link", { name: "Create workspace", exact: true })
      .click();
    await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Create workspace", exact: true })
      .click();
    await page.waitForURL(new RegExp(`${basePath}/[\\da-f-]+/edit$`));
    expect(api.writes).toHaveLength(2);
    expect(api.writes[1]).toMatchObject({
      method: "POST",
      pathname: "/api/v1/workspace/",
      body: {
        name,
        auth_context: "facility",
        facility: facilityId,
        inherited: false,
        template: {},
        status: "active",
      },
    });
    await page.reload();
    await openGeneralSettings(page);
    await expect(
      page.getByRole("textbox", { name: "Name", exact: true }),
    ).toHaveValue(name);
    await expect(access).toBeVisible();
  });
});

test("a failed workspace detail read cannot become a new workspace", async ({
  page,
}) => {
  const record = workspace("instance");
  const api = await mockWorkspaceApi(page, {
    records: [record],
    failedId: record.data.id,
  });
  await page.goto(`/admin/workspaces/${record.data.id}/edit`);
  await expect(page.getByRole("alert")).toContainText(
    "Unable to load this workspace",
  );
  await expect(
    page.getByRole("textbox", { name: "Name", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Create workspace", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Try Again", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Unable to load this workspace",
  );
  expect(api.writes).toHaveLength(0);
});

test("department workspaces validate ownership and preserve edits after a backend rejection", async ({
  page,
}) => {
  const api = await mockWorkspaceApi(page, { isSuperuser: false });
  const basePath = `/facility/${api.facilityId}/settings/workspaces`;
  const name = `Department workspace ${faker.string.alphanumeric(8)}`;
  const nameField = page.getByRole("textbox", { name: "Name", exact: true });
  const templateField = page.getByRole("textbox", {
    name: "Template (JSON)",
    exact: true,
  });
  const create = page.getByRole("button", {
    name: "Create workspace",
    exact: true,
  });

  await page.goto(basePath);
  await page
    .getByRole("link", { name: "Create workspace", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Workspace ownership", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Department workspace", exact: true })
    .click();
  await nameField.fill(name);

  await test.step("Require a department before submitting its ownership", async () => {
    await create.click();
    await expect(
      page.getByText("Select the department that owns this workspace.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(api.writes).toHaveLength(0);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Department" })
      .click();
    await page
      .getByRole("option", { name: api.organizations[0].name, exact: true })
      .click();
    await create.click();
    await page.waitForURL(new RegExp(`${basePath}/[\\da-f-]+/edit$`));
    expect(api.writes).toEqual([
      {
        method: "POST",
        pathname: "/api/v1/workspace/",
        body: {
          name,
          description: "",
          template: {},
          status: "active",
          auth_context: "facility_organization",
          facility: api.facilityId,
          facility_organization: api.organizations[0].id,
          inherited: false,
        },
      },
    ]);
  });

  await test.step("Load the editor without list membership and hide non-applicable access controls", async () => {
    api.failures.list = true;
    api.reads.splice(0);
    const accessResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
        `/api/v1/workspace/${api.records[0].data.id}/get_facility_organizations/`,
    );
    await page.reload();
    expect((await accessResponse).status()).toBe(403);
    await openGeneralSettings(page);
    await expect(nameField).toHaveValue(name);
    await expect(nameField).toBeEditable();
    await expect(
      page.getByRole("combobox", { name: "Workspace ownership", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Save Changes", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete workspace", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", {
        name: "Departments with access",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      page
        .locator(".toaster.group")
        .getByText("Permission denied", { exact: true }),
    ).toHaveCount(0);
    expect(
      api.reads.filter((url) => url.pathname === "/api/v1/workspace/"),
    ).toHaveLength(0);
    api.failures.list = false;
  });

  const updatedName = `${name} revised`;
  const updatedTemplate = { sections: [{ key: "rounds", visible: true }] };
  await test.step("A rejected save keeps inputs and can be retried after API acknowledgement", async () => {
    const pathname = `/api/v1/workspace/${api.records[0].data.id}/`;
    api.rejectedWrites.add(`PUT ${pathname}`);
    await nameField.fill(updatedName);
    await openJsonEditor(page);
    await templateField.fill(JSON.stringify(updatedTemplate));
    const save = page.getByRole("button", {
      name: "Save Changes",
      exact: true,
    });
    const rejectedResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === pathname &&
        response.request().method() === "PUT",
    );
    await save.click();
    expect((await rejectedResponse).status()).toBe(403);
    await expect(
      page.getByRole("alert").filter({
        hasText:
          "Unable to save the workspace. Your changes are still here. Please try again.",
      }),
    ).toBeVisible();
    await expect(nameField).toHaveValue(updatedName);
    await expect(templateField).toHaveValue(JSON.stringify(updatedTemplate));
    await expect(
      page.getByText("Workspace updated", { exact: true }),
    ).toHaveCount(0);
    await expect(save).toBeEnabled();

    // A later successful response is explicit. A 403 must never be treated as
    // a saved configuration or reset the pending form values.
    api.rejectedWrites.delete(`PUT ${pathname}`);
    await save.click();
    await expect(
      page.getByText("Workspace updated", { exact: true }),
    ).toBeVisible();
    const expectedUpdate = {
      method: "PUT",
      pathname,
      body: {
        name: updatedName,
        description: "",
        template: updatedTemplate,
        status: "active",
      },
    };
    expect(api.writes.slice(1)).toEqual([expectedUpdate, expectedUpdate]);
    await page.reload();
    await openGeneralSettings(page);
    await expect(nameField).toHaveValue(updatedName);
    await expect(templateField).toHaveValue(
      JSON.stringify(updatedTemplate, null, 2),
    );
  });

  await test.step("Return to the combined facility list with an edit action", async () => {
    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(
      (url) => url.pathname === basePath && !url.search,
    );
    await expect(
      page.getByRole("link", { name: updatedName, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: `Edit: ${updatedName}`, exact: true }),
    ).toBeVisible();
  });
});

test("the combined facility list uses server pagination and retains personal creation", async ({
  page,
}) => {
  const facilityId = faker.string.uuid();
  const owner = workspaceUser();
  const contexts = ["user", "facility", "facility_organization"] as const;
  const localRecords = Array.from({ length: 16 }, (_, index) => {
    const record = workspace(contexts[index % contexts.length], facilityId);
    record.data.created_by = index === 3 ? owner : workspaceUser();
    return record;
  });
  const otherFacility = workspace("user", faker.string.uuid());
  const instance = workspace("instance");
  const api = await mockWorkspaceApi(page, {
    facilityId,
    userId: owner.id,
    records: [...localRecords, otherFacility, instance],
  });
  const basePath = `/facility/${facilityId}/settings/workspaces`;

  await test.step("List all facility ownership contexts and creators with server pagination", async () => {
    await page.goto(basePath);
    for (const included of localRecords.slice(0, 4)) {
      await expect(
        page.getByRole("link", { name: included.data.name, exact: true }),
      ).toBeVisible();
    }
    for (const excluded of [otherFacility, instance]) {
      await expect(
        page.getByRole("link", { name: excluded.data.name, exact: true }),
      ).toHaveCount(0);
    }
    // Ownership contexts share one list; status is the only tabbed filter.
    await expect(page.getByRole("tablist")).toHaveCount(1);
    await expect(page.getByRole("tab")).toHaveText([
      "Active",
      "Draft",
      "Archived",
    ]);
    const firstList = api.reads.find(
      (url) => url.pathname === "/api/v1/workspace/",
    );
    expect(firstList?.searchParams.get("facility")).toBe(facilityId);
    expect(firstList?.searchParams.has("auth_context")).toBe(false);
    expect(firstList?.searchParams.has("created_by")).toBe(false);
    expect(firstList?.searchParams.get("offset")).toBe("0");
    expect(firstList?.searchParams.get("limit")).toBe("15");
    await expect(
      page.getByRole("button", { name: "Go to page 3", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Go to page 2", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: localRecords[15].data.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: localRecords[0].data.name, exact: true }),
    ).toHaveCount(0);
    expect(
      api.reads.some(
        (url) =>
          url.pathname === "/api/v1/workspace/" &&
          url.searchParams.get("offset") === "15" &&
          url.searchParams.get("limit") === "15",
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Go to page 1", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: localRecords[0].data.name, exact: true }),
    ).toBeVisible();
  });

  await test.step("Create a personal workspace through ownership selection and return to the combined list", async () => {
    await page
      .getByRole("link", { name: "Create workspace", exact: true })
      .click();
    const ownership = page.getByRole("combobox", {
      name: "Workspace ownership",
      exact: true,
    });
    await expect(ownership).toHaveText("Facility workspace");
    await ownership.click();
    await page
      .getByRole("option", { name: "Personal workspace", exact: true })
      .click();
    const name = `Personal workspace ${faker.string.alphanumeric(8)}`;
    await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Create workspace", exact: true })
      .click();
    await page.waitForURL(new RegExp(`${basePath}/[\\da-f-]+/edit$`));
    expect(api.writes[0]).toEqual({
      method: "POST",
      pathname: "/api/v1/workspace/",
      body: {
        name,
        description: "",
        template: {},
        status: "active",
        auth_context: "user",
        facility: facilityId,
        inherited: false,
      },
    });
    await expect(
      page.getByRole("button", { name: "Delete workspace", exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(
      (url) => url.pathname === basePath && !url.search,
    );
    await page.getByRole("textbox", { name: "Search", exact: true }).fill(name);
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  });

  await test.step("Direct scoped editing is not hidden by creator metadata", async () => {
    await page.goto(`${basePath}/${localRecords[0].data.id}/edit`);
    await openGeneralSettings(page);
    await expect(
      page.getByRole("textbox", { name: "Name", exact: true }),
    ).toHaveValue(localRecords[0].data.name);
    await expect(
      page.getByRole("textbox", { name: "Name", exact: true }),
    ).toBeEditable();
    await expect(
      page.getByRole("button", { name: "Save Changes", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete workspace", exact: true }),
    ).toBeVisible();
    expect(api.writes).toHaveLength(1);
  });
});

test("open workspace editor controls close when a server refresh replaces their targets", async ({
  page,
}) => {
  const record = workspace("instance");
  const initialSectionTitle = `Original summary ${faker.string.alphanumeric(6)}`;
  const replacementSectionTitle = `Updated summary ${faker.string.alphanumeric(6)}`;
  const primaryPage = {
    key: "rounds",
    kind: "custom",
    title: `Ward rounds ${faker.string.alphanumeric(6)}`,
    columns: [
      {
        span: 1,
        widgets: [{ type: "symptoms", title: initialSectionTitle }],
      },
      { span: 1, widgets: [] },
    ],
  };
  const remainingPages = ["handover", "review"].map((key) => ({
    key,
    kind: "custom",
    title: `${key} ${faker.string.alphanumeric(6)}`,
    columns: [{ span: 1, widgets: [] }],
  }));
  record.data.template = {
    schema_version: 1,
    pages: [primaryPage, ...remainingPages],
  };
  const api = await mockWorkspaceApi(page, { records: [record] });
  const detailPath = `/api/v1/workspace/${record.data.id}/`;
  // Widths that match no preset keep their numbered column names.
  const column = (number: number) =>
    page.getByRole("region", { name: `Column ${number}`, exact: true });
  const save = page.getByRole("button", { name: "Save Changes", exact: true });
  const refreshTemplate = async (template: WorkspaceRead["template"]) => {
    record.data = { ...record.data, template };
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await Promise.all([
      page.waitForResponse(
        (response) => new URL(response.url()).pathname === detailPath,
      ),
      page.evaluate(() => window.dispatchEvent(new Event("online"))),
    ]);
  };
  const updatedPage = {
    ...primaryPage,
    columns: [
      {
        span: 1,
        widgets: [{ type: "diagnosis", title: replacementSectionTitle }],
      },
      { span: 1, widgets: [] },
    ],
  };

  await page.goto(`/admin/workspaces/${record.data.id}/edit`);
  await expect(column(2)).toBeVisible();
  await expect(
    page.getByText(
      "Custom widths from JSON. Pick a layout to standardise them.",
      {
        exact: true,
      },
    ),
  ).toBeVisible();

  await test.step("Close a section menu when the section at its position is replaced", async () => {
    await column(1)
      .getByRole("button", {
        name: `More actions for ${initialSectionTitle}`,
        exact: true,
      })
      .click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await refreshTemplate({
      schema_version: 1,
      pages: [updatedPage, ...remainingPages],
    });
    await expect.soft(menu).not.toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      column(1).getByRole("article", {
        name: replacementSectionTitle,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      column(2).getByRole("article", {
        name: replacementSectionTitle,
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(save).toBeDisabled();
  });

  await test.step("Close the section picker when its destination column is removed", async () => {
    await page
      .getByRole("button", { name: "Add a section to Column 2", exact: true })
      .click();
    const picker = page.getByRole("dialog", {
      name: "Add a section",
      exact: true,
    });
    await expect(picker).toBeVisible();
    await refreshTemplate({
      schema_version: 1,
      pages: [
        { ...updatedPage, columns: updatedPage.columns.slice(0, 1) },
        ...remainingPages,
      ],
    });
    await expect.soft(picker).not.toBeVisible();
    await page.keyboard.press("Escape");
    await expect(column(2)).toHaveCount(0);
    await expect(
      column(1).getByRole("article", {
        name: replacementSectionTitle,
        exact: true,
      }),
    ).toBeVisible();
    await expect(save).toBeDisabled();
  });

  await test.step("Close removal confirmation when its tab disappears without deleting a remaining tab", async () => {
    await page.getByRole("button", { name: "Remove tab", exact: true }).click();
    const confirmation = page.getByRole("alertdialog", {
      name: "Remove tab",
      exact: true,
    });
    await expect(confirmation).toBeVisible();
    await refreshTemplate({ schema_version: 1, pages: remainingPages });
    await expect.soft(confirmation).not.toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: primaryPage.title, exact: true }),
    ).toHaveCount(0);
    for (const remaining of remainingPages) {
      await expect(
        page.getByRole("button", { name: remaining.title, exact: true }),
      ).toBeVisible();
    }
    await expect(save).toBeDisabled();
    expect(api.writes).toEqual([]);
  });
});

test("cached workspace editors refresh untouched fields and preserve unsaved edits", async ({
  page,
}) => {
  const facilityId = faker.string.uuid();
  const record = workspace("facility", facilityId);
  const api = await mockWorkspaceApi(page, { facilityId, records: [record] });
  const basePath = `/facility/${facilityId}/settings/workspaces`;
  const detailPath = `/api/v1/workspace/${record.data.id}/`;
  const accessPath = `${detailPath}get_facility_organizations/`;
  const nameField = page.getByRole("textbox", { name: "Name", exact: true });
  const descriptionField = page.getByRole("textbox", {
    name: "Description",
    exact: true,
  });
  const templateField = page.getByRole("textbox", {
    name: "Template (JSON)",
    exact: true,
  });
  const access = page.getByRole("region", {
    name: "Departments with access",
    exact: true,
  });

  await test.step("Reopening adopts fresh configuration and access instead of cached values", async () => {
    await page.goto(`${basePath}/${record.data.id}/edit`);
    await openGeneralSettings(page);
    await expect(nameField).toHaveValue(record.data.name);
    await expect(
      access.getByText(api.organizations[0].name, { exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back", exact: true }).click();

    record.data = {
      ...record.data,
      name: `Updated workspace ${faker.string.alphanumeric(8)}`,
      template: { sections: [{ key: "refreshed", visible: true }] },
    };
    api.assignments.set(
      record.data.id,
      api.organizations.map(({ id }) => id),
    );
    // Changing search obtains the refreshed list while the detail and access
    // requests retain their earlier cached responses in this browser session.
    await page
      .getByRole("textbox", { name: "Search", exact: true })
      .fill(record.data.name);
    await page
      .getByRole("link", { name: record.data.name, exact: true })
      .click();
    await openGeneralSettings(page);
    await expect.soft(nameField).toHaveValue(record.data.name);
    await expect
      .soft(templateField)
      .toHaveValue(JSON.stringify(record.data.template, null, 2));
    await expect
      .soft(access.getByText(api.organizations[1].name, { exact: true }))
      .toBeVisible();
  });

  const draftName = `Unsaved workspace ${faker.string.alphanumeric(8)}`;
  const refreshedTemplate = { sections: [{ key: "latest", visible: false }] };
  await test.step("A reconnect refresh updates untouched fields while keeping pending edits", async () => {
    await nameField.fill(draftName);
    await access
      .getByRole("button", { name: "Remove organization", exact: true })
      .first()
      .click();

    record.data = {
      ...record.data,
      name: `Another editor ${faker.string.alphanumeric(8)}`,
      description: faker.lorem.sentence(),
      template: refreshedTemplate,
    };
    api.assignments.set(record.data.id, [api.organizations[0].id]);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await Promise.all([
      page.waitForResponse(
        (response) => new URL(response.url()).pathname === detailPath,
      ),
      page.waitForResponse(
        (response) => new URL(response.url()).pathname === accessPath,
      ),
      page.evaluate(() => window.dispatchEvent(new Event("online"))),
    ]);
    await expect(nameField).toHaveValue(draftName);
    await expect(descriptionField).toHaveValue(record.data.description);
    await expect(templateField).toHaveValue(
      JSON.stringify(refreshedTemplate, null, 2),
    );
    await expect(
      access.getByText(api.organizations[0].name, { exact: true }),
    ).toHaveCount(0);
    await expect(
      access.getByText(api.organizations[1].name, { exact: true }),
    ).toBeVisible();
  });

  await test.step("Save sends the refreshed untouched fields and the pending department selection", async () => {
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await expect(
      page.getByText("Workspace updated", { exact: true }),
    ).toBeVisible();
    await access
      .getByRole("button", { name: "Save access", exact: true })
      .click();
    await expect(
      page.getByText("Workspace access saved", { exact: true }),
    ).toBeVisible();
    expect(api.writes).toEqual([
      {
        method: "PUT",
        pathname: detailPath,
        body: {
          name: draftName,
          description: record.data.description,
          template: refreshedTemplate,
          status: "active",
        },
      },
      {
        method: "POST",
        pathname: `${detailPath}set_facility_organizations/`,
        body: { facility_organizations: [api.organizations[1].id] },
      },
    ]);
  });

  await test.step("A saved field becomes pristine and adopts the next server refresh", async () => {
    const save = page.getByRole("button", {
      name: "Save Changes",
      exact: true,
    });
    await expect(save).toBeDisabled();
    record.data = {
      ...record.data,
      name: `Saved then refreshed ${faker.string.alphanumeric(8)}`,
    };
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await Promise.all([
      page.waitForResponse(
        (response) => new URL(response.url()).pathname === detailPath,
      ),
      page.evaluate(() => window.dispatchEvent(new Event("online"))),
    ]);
    await expect(nameField).toHaveValue(record.data.name);
    await expect(save).toBeDisabled();
    expect(api.writes).toHaveLength(2);
  });
});

test("workspace status filters the list and saves with the configuration", async ({
  page,
}) => {
  const active = workspace("instance");
  const draft = workspace("instance", undefined, "draft");
  const archived = workspace("instance", undefined, "archived");
  const api = await mockWorkspaceApi(page, {
    records: [active, draft, archived],
  });
  const statusTabs = page.getByRole("tablist", { name: "Status", exact: true });
  const statusField = page.getByRole("combobox", {
    name: "Status",
    exact: true,
  });
  const lastListRead = () =>
    api.reads.filter((url) => url.pathname === "/api/v1/workspace/").at(-1);

  await test.step("The list opens on active workspaces and switches by status", async () => {
    await page.goto("/admin/workspaces");
    await expect(
      statusTabs.getByRole("tab", { name: "Active", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("link", { name: active.data.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: draft.data.name, exact: true }),
    ).toHaveCount(0);
    expect(lastListRead()?.searchParams.get("status")).toBe("active");

    await statusTabs.getByRole("tab", { name: "Draft", exact: true }).click();
    await expect(
      page.getByRole("link", { name: draft.data.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: active.data.name, exact: true }),
    ).toHaveCount(0);
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("status") === "draft",
    );
    expect(lastListRead()?.searchParams.get("status")).toBe("draft");

    await statusTabs
      .getByRole("tab", { name: "Archived", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: archived.data.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: draft.data.name, exact: true }),
    ).toHaveCount(0);
  });

  await test.step("Activating a draft saves its status with the configuration", async () => {
    await page.goto(`/admin/workspaces/${draft.data.id}/edit`);
    const header = page.locator("header").filter({
      has: page.getByRole("heading", { name: /^Edit workspace/ }),
    });
    await expect(header.getByText("Draft", { exact: true })).toBeVisible();
    await openGeneralSettings(page);
    await expect(statusField).toHaveText("Draft");
    await expect(
      page.getByText(
        "Not offered on encounters yet. Keep it here while you set it up.",
        { exact: true },
      ),
    ).toBeVisible();
    await statusField.click();
    await page.getByRole("option", { name: "Active", exact: true }).click();
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await expect(
      page.getByText("Workspace updated", { exact: true }),
    ).toBeVisible();
    expect(api.writes).toHaveLength(1);
    expect(api.writes[0]).toMatchObject({
      method: "PUT",
      pathname: `/api/v1/workspace/${draft.data.id}/`,
      body: { name: draft.data.name, status: "active" },
    });
    await expect(header.getByText("Active", { exact: true })).toBeVisible();
    await page.goto("/admin/workspaces");
    await expect(
      page.getByRole("link", { name: draft.data.name, exact: true }),
    ).toBeVisible();
  });

  await test.step("New workspaces start active and can be created as drafts", async () => {
    const name = `Draft workspace ${faker.string.alphanumeric(8)}`;
    await page.goto("/admin/workspaces/create");
    await expect(statusField).toHaveText("Active");
    await expect(
      page.getByText("Available on encounters to everyone with access.", {
        exact: true,
      }),
    ).toBeVisible();
    await statusField.click();
    await page.getByRole("option", { name: "Draft", exact: true }).click();
    await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Create workspace", exact: true })
      .click();
    await page.waitForURL(/\/admin\/workspaces\/[\da-f-]+\/edit$/);
    expect(api.writes.at(-1)).toMatchObject({
      method: "POST",
      pathname: "/api/v1/workspace/",
      body: { name, status: "draft", auth_context: "instance" },
    });
    await page.goto("/admin/workspaces?status=draft");
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  });
});

test("studio shows what hides automatically without loading clinical records", async ({
  page,
}, testInfo) => {
  const record = workspace("instance");
  record.data.template = {
    schema_version: 2,
    surface: "encounter",
    pages: [
      {
        key: "rounds",
        kind: "custom",
        title: "Rounds",
        columns: [
          {
            span: 4,
            widgets: [{ type: "quick_actions", title: "Active tools" }],
          },
          {
            span: 8,
            widgets: [{ type: "history_diagnoses", title: "Patient history" }],
          },
        ],
      },
    ],
  };
  const api = await mockWorkspaceApi(page, { records: [record] });
  const clinicalRequests: string[] = [];
  page.on("request", (request) => {
    if (
      /\/api\/v1\/(patient|encounter|facility)\//.test(
        new URL(request.url()).pathname,
      )
    ) {
      clinicalRequests.push(request.url());
    }
  });
  const activeTools = page.getByRole("article", {
    name: "Active tools",
    exact: true,
  });
  const patientHistory = page.getByRole("article", {
    name: "Patient history",
    exact: true,
  });
  const hiddenNotice =
    "Hidden in this view: Requires an active encounter. Automatically hidden when closed.";

  await page.goto(`/admin/workspaces/${record.data.id}/edit`);
  await expect(
    page.getByRole("button", { name: "Side + main", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(activeTools).toBeVisible();
  await expect(
    activeTools.getByText(hiddenNotice, { exact: true }),
  ).toHaveCount(0);
  await expect(
    activeTools.getByText(
      "Requires an active encounter. Automatically hidden when closed.",
      { exact: true },
    ),
  ).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("studio-active.png"),
    fullPage: true,
  });

  await test.step("Closed encounters dim auto-hidden sections and name empty columns", async () => {
    await page
      .getByRole("button", { name: "Closed encounter", exact: true })
      .click();
    await expect(
      activeTools.getByText(hiddenNotice, { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Side", exact: true })
        .getByText("Whole column hidden in this view", { exact: true }),
    ).toBeVisible();
    await expect(patientHistory.getByText(/Hidden in this view/)).toHaveCount(
      0,
    );
    await page.screenshot({
      path: testInfo.outputPath("studio-closed.png"),
      fullPage: true,
    });
  });

  await test.step("Access levels distinguish encounter access from patient history", async () => {
    await page
      .getByRole("button", { name: "More options", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Preview with access level", exact: true })
      .click();
    await page
      .getByRole("menuitemradio", {
        name: "Encounter read-only, without patient history",
        exact: true,
      })
      .click();
    await expect(
      patientHistory.getByText(
        "You do not have permission to view this patient's clinical history",
        { exact: true },
      ),
    ).toBeVisible();
  });

  await test.step("Section settings explain intrinsic rules in plain language", async () => {
    await openSectionSettings(page, "Active tools");
    const settings = sectionSettings(page);
    await expect(
      settings.getByRole("combobox", {
        name: "Show this section",
        exact: true,
      }),
    ).toHaveText("Whenever it has something to show");
    await expect(
      settings.getByText(
        "This section always hides once the encounter is closed, even without a filter.",
        { exact: true },
      ),
    ).toBeVisible();
    await settings
      .getByRole("combobox", { name: "Show this section", exact: true })
      .click();
    await expect(
      page.getByRole("option", {
        name: "Only after the encounter is closed",
        exact: true,
      }),
    ).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape");
    await closeSectionSettings(page);
  });

  await test.step("The design fits a phone and never touches patient data", async () => {
    await page.getByRole("button", { name: "Mobile", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
    await page.screenshot({
      path: testInfo.outputPath("studio-mobile.png"),
      fullPage: true,
    });
    expect(clinicalRequests).toEqual([]);
    expect(api.writes).toEqual([]);
  });
});

test("studio validates JSON section settings and preserves unavailable tabs on archive", async ({
  page,
}) => {
  const record = workspace("instance");
  record.data.template = {
    schema_version: 1,
    pages: [{ kind: "system", key: "retired_plugin_page" }],
  };
  const api = await mockWorkspaceApi(page, { records: [record] });
  await page.goto(`/admin/workspaces/${record.data.id}/edit`);
  await expect(
    page.getByRole("alert").filter({
      hasText:
        "These system pages are currently unavailable: retired_plugin_page.",
    }),
  ).toBeVisible();
  await openJsonEditor(page);
  const json = page.getByRole("textbox", {
    name: "Template (JSON)",
    exact: true,
  });
  await json.fill(
    JSON.stringify({
      schema_version: 2,
      surface: "encounter",
      pages: [
        {
          kind: "custom",
          key: "rounds",
          title: "Rounds",
          columns: [
            {
              span: 12,
              widgets: [
                { type: "questionnaire_responses", config: { limit: 0 } },
              ],
            },
          ],
        },
      ],
    }),
  );
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(
    page.getByText(/Correct the configuration for Rounds:/),
  ).toBeVisible();
  expect(api.writes).toHaveLength(0);

  const retiredTemplate = {
    schema_version: 1,
    pages: [{ kind: "system", key: "retired_plugin_page" }],
  };
  await json.fill(JSON.stringify(retiredTemplate));
  await openGeneralSettings(page);
  await page.getByRole("combobox", { name: "Status", exact: true }).click();
  await page.getByRole("option", { name: "Archived", exact: true }).click();
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(
    page.getByText("Workspace updated", { exact: true }),
  ).toBeVisible();
  expect(api.writes).toHaveLength(1);
  expect(api.writes[0].body).toMatchObject({
    status: "archived",
    template: retiredTemplate,
  });
});

test("studio customises supported built-in tabs and starts history screens from a template", async ({
  page,
}) => {
  const record = workspace("instance");
  record.data.template = {
    schema_version: 1,
    pages: [
      { key: "medicines", kind: "system" },
      { key: "files", kind: "system" },
    ],
  };
  const api = await mockWorkspaceApi(page, { records: [record] });
  await page.goto(`/admin/workspaces/${record.data.id}/edit`);
  await expect(
    page.getByText("This tab is built into CARE", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Customise this tab", exact: true })
    .click();
  await expect(
    page.getByRole("article", { name: "Medications", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tab settings", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Tab name", exact: true })
    .fill("Medication studio");
  await page
    .getByRole("button", { name: "Apply changes", exact: true })
    .click();
  await page.getByRole("button", { name: "Files", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Customise this tab", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(
      "You can show, hide, or reorder it. Its contents are managed by CARE and can't be customised yet.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(
    page.getByText("Workspace updated", { exact: true }),
  ).toBeVisible();
  expect(api.writes[0].body).toMatchObject({
    template: {
      schema_version: 2,
      pages: [
        {
          key: "medicines",
          kind: "custom",
          title: "Medication studio",
          columns: [{ widgets: [{ type: "medications" }] }],
        },
        { key: "files", kind: "system" },
      ],
    },
  });

  await page.goto("/admin/workspaces/create");
  await page
    .getByRole("textbox", { name: "Name", exact: true })
    .fill(`History ${faker.string.alphanumeric(8)}`);
  await page
    .getByRole("region", { name: "Patient history screen", exact: true })
    .getByRole("button", { name: "Standard history", exact: true })
    .click();
  await expect(
    page.getByRole("article", {
      name: "Patient response history",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Closed encounter", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add a section to Main", exact: true })
    .click();
  const picker = page.getByRole("dialog", {
    name: "Add a section",
    exact: true,
  });
  await expect(
    picker.getByRole("button", { name: "Quick Actions", exact: true }),
  ).toBeDisabled();
  await expect(
    picker.getByRole("button", {
      name: "Patient allergy history",
      exact: true,
    }),
  ).toBeEnabled();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await page.waitForURL(/\/admin\/workspaces\/[\da-f-]+\/edit$/);
  expect(api.writes.at(-1)?.body).toMatchObject({
    template: { schema_version: 2, surface: "patient_history" },
  });
});

test("studio picks vital sign codes from observation charts and saves them as section settings", async ({
  page,
}) => {
  const record = workspace("instance");
  record.data.template = {
    schema_version: 2,
    surface: "encounter",
    pages: [
      {
        kind: "custom",
        key: "summary",
        title: "Summary",
        columns: [
          { span: 12, widgets: [{ type: "vitals", title: "Latest vitals" }] },
        ],
      },
    ],
  };
  const api = await mockWorkspaceApi(page, { records: [record] });
  await page.goto(`/admin/workspaces/${record.data.id}/edit`);
  await openSectionSettings(page, "Latest vitals");
  const drawer = sectionSettings(page);
  await expect(
    drawer.getByText("No codes selected: the standard vitals table is shown."),
  ).toBeVisible();
  const quickAdd = drawer.getByRole("group", {
    name: "Primary Parameters",
    exact: true,
  });
  await quickAdd.getByRole("button", { name: "Pulse", exact: true }).click();
  await quickAdd.getByRole("button", { name: "SpO2", exact: true }).click();
  const selected = drawer.getByRole("list", {
    name: "Vital signs to show",
    exact: true,
  });
  await expect(selected.getByRole("listitem")).toHaveText(["Pulse", "SpO2"]);
  await expect(
    quickAdd.getByRole("button", { name: "Pulse", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  // Chart entries without a code cannot become section settings.
  await drawer.getByText("More charted observations", { exact: true }).click();
  await expect(drawer.getByRole("button", { name: /TODO/ })).toHaveCount(0);
  await expect(
    drawer.getByRole("group", { name: "ABG Analysis", exact: true }),
  ).toBeVisible();
  await drawer
    .getByRole("button", { name: "Remove SpO2", exact: true })
    .click();
  await expect(selected.getByRole("listitem")).toHaveText(["Pulse"]);
  await closeSectionSettings(page);

  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(
    page.getByText("Workspace updated", { exact: true }),
  ).toBeVisible();
  expect(api.writes).toHaveLength(1);
  expect(api.writes[0].body).toMatchObject({
    template: {
      pages: [
        {
          columns: [
            {
              widgets: [
                {
                  type: "vitals",
                  title: "Latest vitals",
                  config: {
                    codes: [
                      {
                        system: "http://loinc.org",
                        code: "8867-4",
                        display: "Pulse",
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  });
});

test("studio flags full-width browsers in narrow columns and saves tab subsets as checkboxes", async ({
  page,
}) => {
  const record = workspace("instance");
  record.data.template = {
    schema_version: 2,
    surface: "encounter",
    pages: [
      {
        kind: "custom",
        key: "ward",
        title: "Ward",
        columns: [
          { span: 8, widgets: [{ type: "vitals", title: "Vitals" }] },
          { span: 4, widgets: [{ type: "medications", title: "Medicines" }] },
        ],
      },
    ],
  };
  const api = await mockWorkspaceApi(page, { records: [record] });
  await page.goto(`/admin/workspaces/${record.data.id}/edit`);
  const medicines = page.getByRole("article", {
    name: "Medicines",
    exact: true,
  });
  const hint =
    "This section has its own filters and panes. It works best in a full-width column.";
  await expect(medicines.getByText(hint)).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Vitals", exact: true }).getByText(hint),
  ).toHaveCount(0);

  // Moving it into the wide column clears the hint. The [8, 4] preset labels
  // its columns Main and Side.
  await sectionAction(page, "Medicines", "Move to");
  await page.getByRole("menuitem", { name: "Main", exact: true }).click();
  await expect(medicines.getByText(hint)).toHaveCount(0);

  await openSectionSettings(page, "Medicines");
  const drawer = sectionSettings(page);
  const tabs = drawer.getByRole("group", { name: "Tabs to show", exact: true });
  await tabs
    .getByRole("checkbox", { name: "Medicine Administration", exact: true })
    .check();
  await tabs
    .getByRole("checkbox", { name: "Prescriptions", exact: true })
    .check();
  await drawer.getByRole("combobox", { name: "Open on", exact: true }).click();
  await page
    .getByRole("option", { name: "Medicine Administration", exact: true })
    .click();
  await closeSectionSettings(page);

  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(
    page.getByText("Workspace updated", { exact: true }),
  ).toBeVisible();
  expect(api.writes).toHaveLength(1);
  expect(api.writes[0].body).toMatchObject({
    template: {
      pages: [
        {
          columns: [
            {
              widgets: [
                { type: "vitals" },
                {
                  type: "medications",
                  config: {
                    tabs: ["prescriptions", "administration"],
                    default_tab: "administration",
                  },
                },
              ],
            },
            { widgets: [] },
          ],
        },
      ],
    },
  });
});
