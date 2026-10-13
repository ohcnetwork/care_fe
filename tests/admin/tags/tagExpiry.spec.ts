import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import {
  TagCategory,
  TagResource,
  TagStatus,
  type TagConfigRead,
  type TagConfigRequest,
} from "../../../src/types/emr/tagConfig/tagConfig";

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 1440, height: 1000 },
});

interface TagConfigWrite {
  method: string;
  body: TagConfigRequest;
}

function tagConfig(overrides: Partial<TagConfigRead> = {}): TagConfigRead {
  return {
    id: faker.string.uuid(),
    display: `Expiry ${faker.word.words(2)} ${faker.string.alphanumeric(6)}`,
    category: TagCategory.CLINICAL,
    description: faker.lorem.sentence(),
    level_cache: 0,
    cache_expiry: "2099-01-01T00:00:00Z",
    metadata: { color: "#15803D" },
    priority: 100,
    status: TagStatus.ACTIVE,
    system_generated: false,
    has_children: false,
    resource: TagResource.ENCOUNTER,
    ...overrides,
  };
}

async function mockTagConfigs(page: Page, initial: TagConfigRead[] = []) {
  const records = new Map(initial.map((record) => [record.id, record]));
  const writes: TagConfigWrite[] = [];

  await page.addInitScript(() => {
    localStorage.setItem("care_access_token", "tag-expiry-test");
  });
  // Keep every request and mutation independent of backend fixtures.
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
            id: faker.string.uuid(),
            username: "tag-expiry-admin",
            first_name: "Expiry",
            last_name: "Admin",
            user_type: "administrator",
            is_superuser: true,
            permissions: [],
            facilities: [],
            organizations: [],
            preferences: {},
            flags: [],
          },
        });
      } else if (method === "GET" && pathname === "/api/v1/plug_config/") {
        await route.fulfill({ json: { configs: [] } });
      } else if (method === "GET" && pathname === "/api/v1/organization/") {
        await route.fulfill({ json: { count: 0, results: [] } });
      } else if (method === "GET" && pathname === "/api/v1/tag_config/") {
        const parent = url.searchParams.get("parent");
        const results = [...records.values()].filter((record) =>
          parent ? record.parent?.id === parent : !record.parent,
        );
        await route.fulfill({ json: { count: results.length, results } });
      } else if (method === "POST" && pathname === "/api/v1/tag_config/") {
        const body = request.postDataJSON() as TagConfigRequest;
        writes.push({ method, body });
        const created = tagConfig({
          ...body,
          parent: undefined,
          organization: undefined,
          facility_organization: undefined,
        });
        records.set(created.id, created);
        await route.fulfill({ json: created });
      } else if (pathname.startsWith("/api/v1/tag_config/")) {
        const id = pathname.split("/").filter(Boolean).at(-1)!;
        const record = records.get(id);
        if (!record) {
          await route.fulfill({ status: 404, json: { detail: "Not found" } });
        } else if (method === "GET") {
          await route.fulfill({ json: record });
        } else if (method === "PUT") {
          const body = request.postDataJSON() as TagConfigRequest;
          writes.push({ method, body });
          const updated: TagConfigRead = {
            ...record,
            ...body,
            parent: record.parent,
            organization: record.organization,
            facility_organization: record.facility_organization,
          };
          records.set(id, updated);
          await route.fulfill({ json: updated });
        } else {
          await route.abort();
        }
      } else {
        await route.abort();
      }
    },
  );

  return { records, writes };
}

test("admins can create an automatic expiry with all duration units and allow overrides", async ({
  page,
}) => {
  const { writes } = await mockTagConfigs(page);
  const display = `Expiry ${faker.word.words(2)}`;

  await test.step("Configure automatic expiry and assignment overrides", async () => {
    await page.goto("/admin/tag_config");
    await page.getByRole("button", { name: "Add tag config" }).click();
    await page.getByRole("textbox", { name: "Display name *" }).fill(display);
    await page
      .getByRole("switch", { name: "Set expiry automatically", exact: true })
      .check();
    for (const [unit, value] of [
      ["Days", "1"],
      ["Hours", "2"],
      ["minutes", "3"],
      ["Seconds", "4"],
    ]) {
      await page
        .getByRole("spinbutton", { name: unit, exact: true })
        .fill(value);
    }
    await page
      .getByRole("switch", {
        name: "Allow changing expiry during assignment",
        exact: true,
      })
      .check();
  });

  await test.step("Save the expiry metadata with the tag config", async () => {
    await page.getByRole("button", { name: "Create tag config" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      method: "POST",
      body: {
        display,
        expiry_metadata: {
          autoset_expiry: true,
          modification_allowed: true,
          expiry_offset: { days: 1, hours: 2, minutes: 3, seconds: 4 },
        },
      },
    });
  });
});

test("editing preserves expiry and disabling automatic expiry clears its duration", async ({
  page,
}) => {
  const config = tagConfig({
    expiry_metadata: {
      autoset_expiry: true,
      modification_allowed: true,
      expiry_offset: { days: 2, hours: 3, minutes: 4, seconds: 5 },
    },
  });
  const { writes } = await mockTagConfigs(page, [config]);
  await page.goto(`/admin/tag_config/${config.id}`);

  await test.step("Saved expiry values are prefilled and survive a description edit", async () => {
    await page.getByRole("button", { name: "Edit tag", exact: true }).click();
    await expect(
      page.getByRole("switch", {
        name: "Set expiry automatically",
        exact: true,
      }),
    ).toBeChecked();
    await expect(
      page.getByRole("switch", {
        name: "Allow changing expiry during assignment",
        exact: true,
      }),
    ).toBeChecked();
    for (const [unit, value] of [
      ["Days", "2"],
      ["Hours", "3"],
      ["minutes", "4"],
      ["Seconds", "5"],
    ]) {
      await expect(
        page.getByRole("spinbutton", { name: unit, exact: true }),
      ).toHaveValue(value);
    }
    await page
      .getByRole("textbox", { name: "Description", exact: true })
      .fill(faker.lorem.sentence());
    await page.getByRole("button", { name: "Update tag config" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(writes).toHaveLength(1);
    expect(writes[0].body.expiry_metadata).toEqual(config.expiry_metadata);
  });

  await test.step("Turning off automatic expiry sends no stale offset", async () => {
    await page.getByRole("button", { name: "Edit tag", exact: true }).click();
    await page
      .getByRole("switch", { name: "Set expiry automatically", exact: true })
      .uncheck();
    await expect(
      page.getByRole("spinbutton", { name: "Days", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Update tag config" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(writes).toHaveLength(2);
    expect(writes[1].body.expiry_metadata).toEqual({
      autoset_expiry: false,
      modification_allowed: true,
    });
  });

  await test.step("Re-enabling expiry starts with an empty duration", async () => {
    await page.getByRole("button", { name: "Edit tag", exact: true }).click();
    await page
      .getByRole("switch", { name: "Set expiry automatically", exact: true })
      .check();
    for (const unit of ["Days", "Hours", "minutes", "Seconds"]) {
      await expect(
        page.getByRole("spinbutton", { name: unit, exact: true }),
      ).toHaveValue("0");
    }
  });
});

test("automatic expiry requires a positive duration made of non-negative whole numbers", async ({
  page,
}) => {
  const { writes } = await mockTagConfigs(page);
  await page.goto("/admin/tag_config");
  await page.getByRole("button", { name: "Add tag config" }).click();
  await page
    .getByRole("textbox", { name: "Display name *" })
    .fill(`Validation ${faker.word.words(2)}`);
  await page
    .getByRole("switch", { name: "Set expiry automatically", exact: true })
    .check();
  const days = page.getByRole("spinbutton", { name: "Days", exact: true });
  const submit = page.getByRole("button", { name: "Create tag config" });

  await test.step("Reject an all-zero duration", async () => {
    await submit.click();
    await expect(
      page.getByText("Enter an expiry duration greater than zero.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(writes).toHaveLength(0);
  });

  await test.step("Reject negative, fractional, and empty duration fields", async () => {
    for (const value of ["-1", "1.5", ""]) {
      await days.fill(value);
      await submit.click();
      await expect(
        page.getByText("Enter a non-negative whole number.", { exact: true }),
      ).toBeVisible();
      expect(writes).toHaveLength(0);
    }
  });

  await test.step("A corrected positive duration can be saved", async () => {
    await days.fill("1");
    await submit.click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(writes).toHaveLength(1);
    expect(writes[0].body.expiry_metadata?.expiry_offset).toMatchObject({
      days: 1,
    });
  });
});

test("disabling automatic expiry allows saving after clearing an invalid duration", async ({
  page,
}) => {
  const { writes } = await mockTagConfigs(page);
  await page.goto("/admin/tag_config");
  await page.getByRole("button", { name: "Add tag config" }).click();
  await page
    .getByRole("textbox", { name: "Display name *" })
    .fill(`Disabled expiry ${faker.word.words(2)}`);
  const automaticExpiry = page.getByRole("switch", {
    name: "Set expiry automatically",
    exact: true,
  });
  const submit = page.getByRole("button", { name: "Create tag config" });

  await test.step("An empty enabled duration prevents saving", async () => {
    await automaticExpiry.check();
    await page.getByRole("spinbutton", { name: "Days", exact: true }).fill("");
    await submit.click();
    await expect(
      page.getByText("Enter a non-negative whole number.", { exact: true }),
    ).toBeVisible();
    expect(writes).toHaveLength(0);
  });

  await test.step("Disabled expiry ignores hidden duration errors and omits the offset", async () => {
    await automaticExpiry.uncheck();
    await submit.click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(writes).toHaveLength(1);
    expect(writes[0].body.expiry_metadata).toEqual({
      autoset_expiry: false,
      modification_allowed: false,
    });
  });
});

test("archiving a child tag preserves its expiry metadata", async ({
  page,
}) => {
  const parent = tagConfig({ has_children: true });
  const child = tagConfig({
    parent,
    level_cache: 1,
    expiry_metadata: {
      autoset_expiry: true,
      modification_allowed: false,
      expiry_offset: { hours: 8 },
    },
  });
  const { writes } = await mockTagConfigs(page, [parent, child]);

  await test.step("Archive the child from its parent tag", async () => {
    await page.goto(`/admin/tag_config/${parent.id}`);
    await page
      .getByRole("row")
      .filter({ hasText: child.display })
      .getByRole("button", { name: "Archive", exact: true })
      .click();
    await page
      .getByRole("alertdialog", { name: "Archive Child Tag", exact: true })
      .getByRole("button", { name: /^Archive\b/ })
      .click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0].body).toMatchObject({
      status: TagStatus.ARCHIVED,
      metadata: child.metadata,
      expiry_metadata: child.expiry_metadata,
    });
  });
});
