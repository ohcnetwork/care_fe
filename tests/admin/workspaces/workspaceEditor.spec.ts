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
      if (
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

  await test.step("Reject malformed JSON before creating a configuration", async () => {
    await page.goto("/admin/workspaces");
    await page
      .getByRole("link", { name: "Create workspace", exact: true })
      .click();
    await nameField.fill(name);
    await page
      .getByRole("textbox", { name: "Description", exact: true })
      .fill(description);
    for (const invalidTemplate of ["{ invalid JSON }", "[]", "null"]) {
      await templateField.fill(invalidTemplate);
      await page
        .getByRole("button", { name: "Create workspace", exact: true })
        .click();
      await expect(
        page.getByText(
          "Enter valid JSON with an object at the top level. Arrays, null, and other values are not supported.",
          { exact: true },
        ),
      ).toBeVisible();
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
        "Use schema_version 1 with valid pages, unique page keys, and columns with positive spans totaling at most 12. System pages allow only key, kind, and hidden.",
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
