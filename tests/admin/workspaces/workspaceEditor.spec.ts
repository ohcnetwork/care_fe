import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import type { UserReadMinimal } from "../../../src/types/user/user";
import type {
  WorkspaceAuthContext,
  WorkspaceCreate,
  WorkspaceRead,
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
    if (!(await templateField.isVisible())) {
      await page.getByRole("button", { name: "JSON", exact: true }).click();
    }
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
      body: { name: updatedName, description, template: updatedTemplate },
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
  const pageTitle = `Ward rounds ${faker.string.alphanumeric(6)}`;
  const description = faker.lorem.sentence();
  const opaqueConfig = {
    compact: true,
    priority: 3,
    limit: { toString: "label" },
    display_code: "5",
  };
  const template = {
    schema_version: 1,
    pages: [
      { kind: "system", key: "medicines", hidden: true },
      {
        kind: "custom",
        key: "rounds",
        title: pageTitle,
        icon: "layout-dashboard",
        hidden: true,
        columns: [
          {
            span: 1,
            widgets: [
              {
                type: "service_requests",
                title: "Active requests",
                config: { status: "active" },
              },
            ],
          },
          {
            span: 1,
            widgets: [
              {
                type: "questionnaire_responses",
                title: "Progress notes",
                config: {
                  questionnaire_slug: "daily-progress-note",
                  limit: 1,
                  only_unstructured: true,
                },
              },
              {
                type: "symptoms",
                config: opaqueConfig,
              },
            ],
          },
        ],
      },
    ],
  };
  const column = (index: number) =>
    page.getByRole("region", { name: `Column ${index}`, exact: true });
  const inspector = page.getByRole("region", {
    name: "Widget settings",
    exact: true,
  });
  const addWidget = async (columnIndex: number, label: string) => {
    await column(columnIndex)
      .getByRole("button", { name: "Add widget", exact: true })
      .click();
    const library = page.getByRole("dialog", {
      name: "Add widget",
      exact: true,
    });
    await library
      .getByRole("textbox", { name: "Search widgets", exact: true })
      .fill(label);
    await library.getByRole("button", { name: label, exact: true }).click();
    await expect(library).not.toBeVisible();
  };
  const configJson = inspector.getByRole("textbox", {
    name: "Widget configuration (JSON)",
    exact: true,
  });

  await test.step("Start an empty workspace with a custom page and two columns", async () => {
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
    await page
      .getByRole("button", { name: "Create custom page", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Add custom page",
      exact: true,
    });
    await dialog
      .getByRole("textbox", { name: "Page title", exact: true })
      .fill(pageTitle);
    await dialog
      .getByRole("textbox", { name: "Page key", exact: true })
      .fill("rounds");
    await dialog
      .getByRole("button", { name: "Add custom page", exact: true })
      .click();
    await expect(column(1)).toBeVisible();
    await page.getByRole("button", { name: "Add column", exact: true }).click();
    await expect(column(2)).toBeVisible();
  });

  await test.step("Configure clinical widgets and edit their layout", async () => {
    await addWidget(1, "Symptoms");
    await inspector
      .getByText("Advanced configuration", { exact: true })
      .click();
    const invalidConfig = '{"compact":true,"limit":{"toString":';
    await configJson.fill(invalidConfig);
    await expect(configJson).toHaveValue(invalidConfig);
    await expect(configJson).toHaveAttribute("aria-invalid", "true");
    await expect(
      page.getByRole("button", { name: "Create workspace", exact: true }),
    ).toBeDisabled();
    await configJson.fill(JSON.stringify(opaqueConfig));
    await expect(configJson).toHaveAttribute("aria-invalid", "false");
    await expect(
      page.getByRole("button", { name: "Create workspace", exact: true }),
    ).toBeEnabled();

    await addWidget(1, "Questionnaire Responses");
    await column(1)
      .getByRole("button", {
        name: "Move Questionnaire Responses up",
        exact: true,
      })
      .click();
    await column(1)
      .getByRole("button", {
        name: "Configure Questionnaire Responses",
        exact: true,
      })
      .first()
      .click();
    await inspector
      .getByRole("textbox", { name: "Display title", exact: true })
      .fill("Progress notes");
    await inspector
      .getByRole("textbox", { name: "Form slug", exact: true })
      .fill("daily-progress-note");
    await inspector
      .getByRole("checkbox", { name: "Form responses only", exact: true })
      .check();
    const responseLimit = inspector.getByRole("spinbutton", {
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
        inspector.getByText(message, { exact: true }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Create workspace", exact: true }),
      ).toBeDisabled();
    }
    await responseLimit.fill("1");
    await expect(
      page.getByRole("button", { name: "Create workspace", exact: true }),
    ).toBeEnabled();

    const originalSymptoms = column(1)
      .getByRole("button", { name: "Configure Symptoms", exact: true })
      .first();
    const movedSymptoms = column(2)
      .getByRole("button", { name: "Configure Symptoms", exact: true })
      .first();
    await column(1)
      .getByRole("button", { name: "Move Symptoms to column", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Column 2", exact: true }).click();
    await expect(originalSymptoms).toHaveCount(0);
    await expect(movedSymptoms).toBeVisible();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(originalSymptoms).toBeVisible();
    await expect(movedSymptoms).toHaveCount(0);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    await expect(originalSymptoms).toHaveCount(0);
    await expect(movedSymptoms).toBeVisible();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(originalSymptoms).toBeVisible();
    await expect(movedSymptoms).toHaveCount(0);

    await addWidget(1, "Vitals");
    await column(1)
      .getByRole("button", { name: "Remove Vitals", exact: true })
      .click();
    await expect(
      column(1).getByRole("button", { name: "Configure Vitals", exact: true }),
    ).toHaveCount(0);

    await addWidget(2, "Service Requests");
    await inspector
      .getByRole("textbox", { name: "Display title", exact: true })
      .fill("Active requests");
    const requestStatus = inspector.getByRole("combobox", {
      name: requestStatusLabel,
      exact: true,
    });
    await expect(requestStatus).toHaveText(`Choisir ${requestStatusLabel}`);
    await requestStatus.click();
    await page
      .getByRole("option", { name: activeStatusLabel, exact: true })
      .click();
    const requestLimit = inspector.getByRole("spinbutton", {
      name: "Latest results",
      exact: true,
    });
    await expect(requestLimit).toHaveValue("");
    await requestLimit.fill("5");
    await requestLimit.clear();
    const addColumn = page.getByRole("button", {
      name: "Add column",
      exact: true,
    });
    await addColumn.click();
    await addColumn.click();
    await expect(column(4)).toBeVisible();
    await expect(addColumn).toBeDisabled();
    await expect(column(5)).toHaveCount(0);
    await column(4)
      .getByRole("button", { name: "Remove column 4", exact: true })
      .click();
    await expect(addColumn).toBeEnabled();
    await column(3)
      .getByRole("button", { name: "Remove column 3", exact: true })
      .click();
    await expect(column(3)).toHaveCount(0);
    await column(2)
      .getByRole("button", { name: "Move column 2 left", exact: true })
      .click();
    await expect(
      column(1)
        .getByRole("button", {
          name: "Configure Active requests",
          exact: true,
        })
        .first(),
    ).toBeVisible();
    await expect(
      column(2)
        .getByRole("button", {
          name: "Configure Progress notes",
          exact: true,
        })
        .first(),
    ).toBeVisible();
  });

  await test.step("Add a fixed system page, hide it, and place it first", async () => {
    await page
      .getByRole("checkbox", {
        name: "Show in encounter navigation",
        exact: true,
      })
      .uncheck();
    await page
      .getByRole("button", { name: "Add system page", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Medications", exact: true })
      .click();
    await page
      .getByRole("checkbox", {
        name: "Show in encounter navigation",
        exact: true,
      })
      .uncheck();
    await page
      .getByRole("button", { name: "Move page up", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Add column", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Create workspace", exact: true })
      .click();
    await page.waitForURL(/\/admin\/workspaces\/[\da-f-]+\/edit$/);
    expect(api.writes).toEqual([
      {
        method: "POST",
        pathname: "/api/v1/workspace/",
        body: {
          name,
          description,
          template,
          auth_context: "instance",
          inherited: false,
        },
      },
    ]);
  });

  await test.step("Reload restores the visual settings and the same JSON contract", async () => {
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
    await expect(
      page.getByRole("checkbox", {
        name: "Show in encounter navigation",
        exact: true,
      }),
    ).not.toBeChecked();
    await page.getByRole("button", { name: pageTitle, exact: true }).click();
    await expect(
      page.getByRole("checkbox", {
        name: "Show in encounter navigation",
        exact: true,
      }),
    ).not.toBeChecked();
    await column(1)
      .getByRole("button", { name: "Configure Active requests", exact: true })
      .first()
      .click();
    await expect(
      inspector.getByRole("combobox", {
        name: requestStatusLabel,
        exact: true,
      }),
    ).toHaveText(activeStatusLabel);
    await expect(
      inspector.getByRole("spinbutton", {
        name: "Latest results",
        exact: true,
      }),
    ).toHaveValue("");
    await column(2)
      .getByRole("button", { name: "Configure Symptoms", exact: true })
      .first()
      .click();
    await inspector
      .getByText("Advanced configuration", { exact: true })
      .click();
    expect(JSON.parse(await configJson.inputValue())).toEqual(opaqueConfig);
    await page.screenshot({
      path: testInfo.outputPath("workspace-config-fields-desktop.png"),
      fullPage: true,
    });
    await column(2)
      .getByRole("button", { name: "Configure Progress notes", exact: true })
      .first()
      .click();
    await expect(
      inspector.getByRole("textbox", { name: "Form slug", exact: true }),
    ).toHaveValue("daily-progress-note");
    await expect(
      inspector.getByRole("spinbutton", {
        name: "Latest results",
        exact: true,
      }),
    ).toHaveValue("1");
    await expect(
      inspector.getByRole("checkbox", {
        name: "Form responses only",
        exact: true,
      }),
    ).toBeChecked();
    await page.screenshot({
      path: testInfo.outputPath("workspace-visual-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(column(1)).toBeVisible();
    await expect(column(2)).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await page.screenshot({
      path: testInfo.outputPath("workspace-visual-mobile.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "JSON", exact: true }).click();
    const json = page.getByRole("textbox", {
      name: "Template (JSON)",
      exact: true,
    });
    await expect(json).toBeVisible();
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
    if (!(await templateField.isVisible())) {
      await page.getByRole("button", { name: "JSON", exact: true }).click();
    }
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
      body: { name: updatedName, description: "", template: updatedTemplate },
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
    await expect(page.getByRole("tab")).toHaveCount(0);
    const firstList = api.reads.find(
      (url) => url.pathname === "/api/v1/workspace/",
    );
    expect(firstList?.searchParams.get("facility")).toBe(facilityId);
    expect(firstList?.searchParams.has("auth_context")).toBe(false);
    expect(firstList?.searchParams.has("created_by")).toBe(false);
    expect(firstList?.searchParams.get("offset")).toBe("0");
    expect(firstList?.searchParams.get("limit")).toBe("15");
    await expect(
      page.getByRole("button", { name: "3", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "2", exact: true }).click();
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
    await page.getByRole("button", { name: "1", exact: true }).click();
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
  const initialWidgetTitle = `Original summary ${faker.string.alphanumeric(6)}`;
  const replacementWidgetTitle = `Updated summary ${faker.string.alphanumeric(6)}`;
  const primaryPage = {
    key: "rounds",
    kind: "custom",
    title: `Ward rounds ${faker.string.alphanumeric(6)}`,
    columns: [
      {
        span: 1,
        widgets: [{ type: "symptoms", title: initialWidgetTitle }],
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
        widgets: [{ type: "diagnosis", title: replacementWidgetTitle }],
      },
      { span: 1, widgets: [] },
    ],
  };

  await page.goto(`/admin/workspaces/${record.data.id}/edit`);
  await expect(column(2)).toBeVisible();

  await test.step("Close a move menu when the widget at its position is replaced", async () => {
    await column(1)
      .getByRole("button", {
        name: `Move ${initialWidgetTitle} to column`,
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
      column(1)
        .getByRole("button", {
          name: `Configure ${replacementWidgetTitle}`,
          exact: true,
        })
        .first(),
    ).toBeVisible();
    await expect(
      column(2).getByRole("button", {
        name: `Configure ${replacementWidgetTitle}`,
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(save).toBeDisabled();
  });

  await test.step("Close the widget library when its destination column is removed", async () => {
    await column(2)
      .getByRole("button", { name: "Add widget", exact: true })
      .click();
    const library = page.getByRole("dialog", {
      name: "Add widget",
      exact: true,
    });
    await expect(library).toBeVisible();
    await refreshTemplate({
      schema_version: 1,
      pages: [
        { ...updatedPage, columns: updatedPage.columns.slice(0, 1) },
        ...remainingPages,
      ],
    });
    await expect.soft(library).not.toBeVisible();
    await page.keyboard.press("Escape");
    await expect(column(2)).toHaveCount(0);
    await expect(
      column(1)
        .getByRole("button", {
          name: `Configure ${replacementWidgetTitle}`,
          exact: true,
        })
        .first(),
    ).toBeVisible();
    await expect(save).toBeDisabled();
  });

  await test.step("Close removal confirmation when its page disappears without deleting a remaining page", async () => {
    await page
      .getByRole("button", { name: "Remove page", exact: true })
      .click();
    const confirmation = page.getByRole("alertdialog", {
      name: "Remove page",
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
