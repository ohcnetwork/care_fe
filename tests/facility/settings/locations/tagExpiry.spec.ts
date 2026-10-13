import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import {
  TagCategory,
  TagResource,
  TagStatus,
  type TagConfig,
  type TagUpdateRequest,
} from "../../../../src/types/emr/tagConfig/tagConfig";
import type { LocationDetail } from "../../../../src/types/location/location";

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 1440, height: 1000 },
  timezoneId: "UTC",
});

interface TagWrite {
  operation: "set" | "remove";
  body: TagUpdateRequest;
}

async function mockLocationTags(
  page: Page,
  modificationAllowed = false,
  expiry = "2099-01-02T12:30:00Z",
  options: {
    assignedTag?: Partial<TagConfig>;
    initiallyAssigned?: boolean;
  } = {},
) {
  const facilityId = faker.string.uuid();
  const tag: TagConfig = {
    id: faker.string.uuid(),
    display: `Location expiry ${faker.word.words(2)} ${faker.string.alphanumeric(6)}`,
    category: TagCategory.ADMIN,
    description: faker.lorem.sentence(),
    level_cache: 0,
    cache_expiry: "2099-01-01T00:00:00Z",
    metadata: { color: "#15803D" },
    expiry_metadata: {
      autoset_expiry: true,
      modification_allowed: modificationAllowed,
      expiry_offset: { hours: 8 },
    },
    priority: 100,
    status: TagStatus.ACTIVE,
    system_generated: false,
    has_children: false,
    resource: TagResource.LOCATION,
    facility: facilityId,
  };
  const assignedTag: TagConfig = { ...tag, expiry, ...options.assignedTag };
  const location: LocationDetail = {
    id: faker.string.uuid(),
    name: `Expiry location ${faker.word.words(2)}`,
    description: "",
    status: "active",
    operational_status: "O",
    form: "ro",
    mode: "kind",
    has_children: false,
    organizations: [],
    sort_index: 0,
    system_availability_status: "available",
    tags: options.initiallyAssigned ? [assignedTag] : [],
  };
  const locationPath = `/api/v1/facility/${facilityId}/location/`;
  const detailPath = `${locationPath}${location.id}/`;
  const writes: TagWrite[] = [];

  await page.addInitScript(() => {
    localStorage.setItem("care_access_token", "location-tag-expiry-test");
  });
  // Mock every request, including writes, to avoid remote backend changes.
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      const method = request.method();

      if (method === "GET" && pathname === "/api/v1/users/getcurrentuser/") {
        await route.fulfill({
          json: {
            id: faker.string.uuid(),
            username: "location-expiry-admin",
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
      } else if (
        method === "GET" &&
        pathname === `/api/v1/facility/${facilityId}/`
      ) {
        await route.fulfill({
          json: {
            id: facilityId,
            name: `Facility ${faker.word.words(2)}`,
            permissions: [
              "can_read_facility_location",
              "can_write_facility_location",
            ],
            root_org_permissions: [],
            features: [],
          },
        });
      } else if (method === "GET" && pathname === detailPath) {
        await route.fulfill({ json: location });
      } else if (
        method === "GET" &&
        (pathname === locationPath ||
          pathname === `${detailPath}organizations` ||
          pathname.startsWith(`/api/v1/facility/${facilityId}/organizations/`))
      ) {
        await route.fulfill({ json: { count: 0, results: [] } });
      } else if (method === "GET" && pathname === "/api/v1/tag_config/") {
        await route.fulfill({ json: { count: 1, results: [tag] } });
      } else if (
        method === "POST" &&
        (pathname === `${detailPath}set_tags/` ||
          pathname === `${detailPath}remove_tags/`)
      ) {
        const operation = pathname.endsWith("set_tags/") ? "set" : "remove";
        writes.push({
          operation,
          body: request.postDataJSON() as TagUpdateRequest,
        });
        location.tags = operation === "set" ? [assignedTag] : [];
        await route.fulfill({ json: location });
      } else {
        await route.abort();
      }
    },
  );

  return {
    tag,
    expiry,
    writes,
    url: `/facility/${facilityId}/settings/locations/${location.id}`,
  };
}

async function selectAvailableTag(page: Page, display: string) {
  await page.getByRole("button", { name: "Add Tags", exact: true }).click();
  await page.getByRole("menu").getByText(display, { exact: true }).click();
}

test("location tag updates send object requests and render the returned expiry", async ({
  page,
}) => {
  const { tag, expiry, writes, url } = await mockLocationTags(page);
  const badge = page
    .locator('[data-slot="badge"]')
    .filter({ hasText: tag.display });
  await page.goto(url);
  await expect(page.locator("time[datetime]")).toHaveCount(0);

  await test.step("Use the configured expiry when assigning a tag", async () => {
    await selectAvailableTag(page, tag.display);
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toEqual({
      operation: "set",
      body: { tags: [{ tag: tag.id }] },
    });
    await expect(page.getByRole("dialog", { name: "Tag expiry" })).toHaveCount(
      0,
    );
    await page.keyboard.press("Escape");
    const expiryTime = badge.locator(`time[datetime="${expiry}"]`);
    await expect(expiryTime).toBeVisible();
    await expect(expiryTime).toContainText("Expires");
    await expect(expiryTime).toHaveAttribute("aria-label", /Expires.*2099/);
  });

  await test.step("Remove tags with the new request shape", async () => {
    await page
      .getByRole("button", { name: "Manage Tags", exact: true })
      .click();
    await page
      .getByRole("menu")
      .getByText(tag.display, { exact: true })
      .click();
    await expect.poll(() => writes.length).toBe(2);
    expect(writes[1]).toEqual({
      operation: "remove",
      body: { tags: [{ tag: tag.id }] },
    });
    await page.keyboard.press("Escape");
    await expect(badge.locator(`time[datetime="${expiry}"]`)).toHaveCount(0);
  });
});

test("past tag expiry is rendered as expired with its accessible date", async ({
  page,
}) => {
  const { tag, expiry, url } = await mockLocationTags(
    page,
    false,
    "2000-01-02T12:30:00Z",
  );
  const badge = page
    .locator('[data-slot="badge"]')
    .filter({ hasText: tag.display });
  await page.goto(url);
  await expect(page.locator("time[datetime]")).toHaveCount(0);

  await test.step("Render the expired timestamp returned by the tag update", async () => {
    await selectAvailableTag(page, tag.display);
    await page.keyboard.press("Escape");
    const expiryTime = badge.locator(`time[datetime="${expiry}"]`);
    await expect(expiryTime).toBeVisible();
    await expect(expiryTime).toHaveText("Expired 02 Jan");
    await expect(expiryTime).toHaveAttribute(
      "aria-label",
      "Expired 02 Jan 2000, 12:30 PM",
    );
  });
});

for (const expiry of ["2099-01-02T12:30:00Z", null, "invalid-expiry"]) {
  test(`the expired flag keeps a location tag visible with ${expiry === null ? "no timestamp" : expiry === "invalid-expiry" ? "an invalid timestamp" : "a future timestamp"}`, async ({
    page,
  }) => {
    const { tag, writes, url } = await mockLocationTags(
      page,
      false,
      "2099-01-02T12:30:00Z",
      {
        assignedTag: { expired: true, expiry },
        initiallyAssigned: true,
      },
    );

    await test.step("Show the server's expired status without removing the tag", async () => {
      await page.goto(url);
      const badge = page
        .locator('[data-slot="badge"]')
        .filter({ hasText: tag.display });
      await expect(badge).toBeVisible();
      if (expiry === "2099-01-02T12:30:00Z") {
        const expiryTime = badge.locator(`time[datetime="${expiry}"]`);
        await expect(expiryTime).toHaveText("Expired 02 Jan");
        await expect(expiryTime).toHaveAttribute(
          "aria-label",
          "Expired 02 Jan 2099, 12:30 PM",
        );
      } else {
        await expect(badge.getByText("Expired", { exact: true })).toBeVisible();
        await expect(badge.locator("time")).toHaveCount(0);
      }
      await expect(
        page.getByRole("button", { name: "Manage Tags", exact: true }),
      ).toBeVisible();
      expect(writes).toHaveLength(0);
    });

    await test.step("Keep the expired tag selected and show its status in tag management", async () => {
      await page
        .getByRole("button", { name: "Manage Tags", exact: true })
        .click();
      const menu = page.getByRole("menu");
      await expect(menu.getByText(tag.display, { exact: true })).toBeVisible();
      await expect(menu.getByRole("checkbox", { checked: true })).toHaveCount(
        1,
      );
      if (expiry === "2099-01-02T12:30:00Z") {
        const expiryTime = menu.locator(`time[datetime="${expiry}"]`);
        await expect(expiryTime).toHaveText("Expired 02 Jan");
        await expect(expiryTime).toHaveAttribute(
          "aria-label",
          "Expired 02 Jan 2099, 12:30 PM",
        );
      } else {
        await expect(menu.getByText("Expired", { exact: true })).toBeVisible();
        await expect(menu.locator("time")).toHaveCount(0);
      }
      expect(writes).toHaveLength(0);
    });
  });
}

for (const expiry of [null, "invalid-expiry"]) {
  test(`an unflagged location tag with ${expiry === null ? "no" : "an invalid"} timestamp has no expiry status`, async ({
    page,
  }) => {
    const { tag, writes, url } = await mockLocationTags(
      page,
      false,
      "2099-01-02T12:30:00Z",
      {
        assignedTag: { expiry },
        initiallyAssigned: true,
      },
    );

    await test.step("Keep the tag visible without inventing an expiry status", async () => {
      await page.goto(url);
      const badge = page
        .locator('[data-slot="badge"]')
        .filter({ hasText: tag.display });
      await expect(badge).toBeVisible();
      await expect(badge).toHaveText(tag.display);
      await expect(badge.locator("time")).toHaveCount(0);
      expect(writes).toHaveLength(0);
    });
  });
}

test("expiry assignment can be cancelled or use the configured duration", async ({
  page,
}) => {
  const { tag, writes, url } = await mockLocationTags(page, true);
  await page.goto(url);

  await test.step("Cancel without assigning the tag", async () => {
    await selectAvailableTag(page, tag.display);
    const dialog = page.getByRole("dialog", {
      name: "Tag expiry",
      exact: true,
    });
    await expect(
      dialog.getByRole("checkbox", { name: "Set custom expiry" }),
    ).not.toBeChecked();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    expect(writes).toHaveLength(0);
    await page.keyboard.press("Escape");
  });

  await test.step("Keep automatic expiry without sending a custom offset", async () => {
    await selectAvailableTag(page, tag.display);
    await page
      .getByRole("dialog", { name: "Tag expiry", exact: true })
      .getByRole("button", { name: "Apply tag", exact: true })
      .click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0].body).toEqual({
      tags: [{ tag: tag.id }],
    });
  });
});

test("a custom assignment expiry validates whole numbers and sends the selected offset", async ({
  page,
}) => {
  const { tag, writes, expiry, url } = await mockLocationTags(page, true);
  const badge = page
    .locator('[data-slot="badge"]')
    .filter({ hasText: tag.display });
  await page.goto(url);
  await selectAvailableTag(page, tag.display);
  const dialog = page.getByRole("dialog", { name: "Tag expiry", exact: true });
  await dialog.getByRole("checkbox", { name: "Set custom expiry" }).check();
  const hours = dialog.getByRole("spinbutton", { name: "Hours", exact: true });
  const apply = dialog.getByRole("button", { name: "Apply tag", exact: true });

  await test.step("Invalid durations do not send a tag update", async () => {
    await expect(hours).toHaveValue("8");
    await hours.fill("0");
    await apply.click();
    await expect(dialog.getByRole("alert")).toHaveText(
      "Enter an expiry duration greater than zero.",
    );
    for (const value of ["-1", "1.5"]) {
      await hours.fill(value);
      await apply.click();
      await expect(dialog.getByRole("alert")).toHaveText(
        "Enter a non-negative whole number.",
      );
      expect(writes).toHaveLength(0);
    }
  });

  await test.step("Send the custom duration and display the assigned expiry", async () => {
    await hours.fill("12");
    await dialog
      .getByRole("spinbutton", { name: "minutes", exact: true })
      .fill("30");
    await apply.click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toEqual({
      operation: "set",
      body: {
        tags: [
          {
            tag: tag.id,
            expiry_offset: { days: 0, hours: 12, minutes: 30, seconds: 0 },
          },
        ],
      },
    });
    await page.keyboard.press("Escape");
    await expect(badge.locator(`time[datetime="${expiry}"]`)).toBeVisible();
  });
});
