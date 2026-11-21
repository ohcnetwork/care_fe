import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import type { LocationRead } from "@/types/location/location";

// The settings layout is tested against isolated API fixtures, not a live backend.
test.use({ storageState: { cookies: [], origins: [] } });

function location(
  fields: Partial<LocationRead> & { name: string },
  parent?: LocationRead,
): LocationRead {
  return {
    id: faker.string.uuid(),
    status: "active",
    operational_status: "U",
    description: "",
    form: "wa",
    mode: "kind",
    inventory_usage: "none",
    has_children: false,
    has_sub_locations: false,
    has_beds: false,
    sort_index: 0,
    system_availability_status: "available",
    tags: [],
    // The API sends an empty object as the parent of a root location.
    parent: parent ?? ({} as LocationRead),
    ...fields,
  };
}

test.describe("Location settings layout", () => {
  let facilityId: string;
  let basePath: string;
  let building: LocationRead;
  let ward: LocationRead;
  let room: LocationRead;
  let bed: LocationRead;
  let store: LocationRead;
  let children: Map<string, LocationRead[]>;
  /** While set, the request for a location's beds fails. */
  let failBedList: boolean;
  /** While set, the request for one location fails with a server error. */
  let failLocation: boolean;

  const tree = (page: Page) =>
    page.getByRole("navigation", { name: "Locations", exact: true });
  const crumbs = (page: Page) =>
    page.locator("main").getByRole("navigation", { name: "breadcrumb" }).last();
  const rows = (page: Page) => page.locator('[data-slot="table-body"] tr');
  const beds = (page: Page) => page.locator('[data-cy="location-beds"]');
  const editor = (page: Page) =>
    page.getByRole("dialog", { name: "Edit Location", exact: true });

  test.beforeEach(async ({ page }) => {
    facilityId = faker.string.uuid();
    basePath = `/facility/${facilityId}/settings/locations`;

    building = location({
      name: "Main Block",
      form: "bu",
      has_children: true,
      has_sub_locations: true,
    });
    store = location({ name: "Store", form: "ro", status: "inactive" });
    ward = location(
      {
        name: "General Ward",
        has_children: true,
        has_sub_locations: true,
        has_beds: true,
        description: "Second floor, east wing",
        tags: [
          {
            id: faker.string.uuid(),
            slug: "isolation",
            display: "Isolation",
            category: "admin",
            description: "",
            priority: 100,
            status: "active",
            level_cache: 0,
            has_children: false,
            resource: "location",
            meta: {},
          },
        ] as unknown as LocationRead["tags"],
      },
      building,
    );
    room = location({ name: "Room 1", form: "ro" }, ward);
    bed = location({ name: "Bed 1", form: "bd", mode: "instance" }, ward);
    children = new Map([
      ["", [building, store]],
      [building.id, [ward]],
      [ward.id, [room, bed]],
    ]);
    const everyLocation = () => [...children.values()].flat();
    failBedList = false;
    failLocation = false;

    await page.addInitScript(() => {
      localStorage.setItem("care_access_token", "location-settings-test");
      localStorage.setItem("i18nextLng", "en");
    });
    await page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      const locationPath = `/api/v1/facility/${facilityId}/location/`;
      if (path === "/api/v1/users/getcurrentuser/") {
        await route.fulfill({
          json: {
            id: faker.string.uuid(),
            username: "location-settings",
            first_name: "Location",
            last_name: "Settings",
            user_type: "administrator",
            is_superuser: true,
            permissions: [],
            flags: [],
            organizations: [],
            facilities: [{ id: facilityId, name: "Test Hospital" }],
            preferences: {},
          },
        });
      } else if (path === `/api/v1/facility/${facilityId}/`) {
        await route.fulfill({
          json: {
            id: facilityId,
            name: "Test Hospital",
            facility_type: "Private Hospital",
            features: [],
            permissions: [],
            root_org_permissions: [],
            child_org_permissions: [],
          },
        });
      } else if (path === "/api/v1/plug_config/") {
        await route.fulfill({ json: { configs: [] } });
      } else if (path === locationPath && route.request().method() === "POST") {
        // A created location is kept, so the lists show it afterwards.
        const body = route.request().postDataJSON();
        const parent = everyLocation().find((item) => item.id === body.parent);
        const created = location(
          { name: body.name, form: body.form, mode: body.mode },
          parent,
        );
        children.set(body.parent ?? "", [
          ...(children.get(body.parent ?? "") ?? []),
          created,
        ]);
        await route.fulfill({ json: created });
      } else if (path === locationPath) {
        const params = url.searchParams;
        const mode = params.get("mode");
        const name = params.get("name")?.toLowerCase();
        if (mode === "instance" && failBedList) {
          await route.fulfill({ status: 500, json: { detail: "Failed" } });
          return;
        }
        const results = (children.get(params.get("parent") ?? "") ?? [])
          .filter((item) => !mode || item.mode === mode)
          .filter((item) => !name || item.name.toLowerCase().includes(name));
        await route.fulfill({ json: { count: results.length, results } });
      } else if (
        path.startsWith(locationPath) &&
        path.endsWith("/organizations/")
      ) {
        await route.fulfill({
          json: {
            results: path.includes(ward.id)
              ? [{ id: faker.string.uuid(), name: "Nursing" }]
              : [],
          },
        });
      } else if (
        path.startsWith(locationPath) &&
        path.endsWith("/remove_tags/")
      ) {
        // The location is read again afterwards, and now comes back untagged.
        ward.tags = [];
        await route.fulfill({ json: ward });
      } else if (path.startsWith(locationPath)) {
        const id = path.slice(locationPath.length).replace(/\/$/, "");
        const found = everyLocation().find((item) => item.id === id);
        if (failLocation) {
          await route.fulfill({ status: 500, json: { detail: "Failed" } });
          return;
        }
        if (found && route.request().method() === "PUT") {
          // Saved fields are kept, so the page shows them afterwards.
          const { name, description, status } = route.request().postDataJSON();
          Object.assign(found, { name, description, status });
        }
        await route.fulfill(
          found
            ? { json: found }
            : { status: 404, json: { detail: "Not found" } },
        );
      } else if (route.request().method() === "GET") {
        await route.fulfill({ json: { count: 0, results: [] } });
      } else {
        throw new Error(
          `Unexpected API mutation in location settings test: ${path}`,
        );
      }
    });
  });

  test("lists the top-level locations with no map view", async ({ page }) => {
    await page.goto(basePath);
    await expect(rows(page)).toHaveCount(2);
    await expect(rows(page).filter({ hasText: "Main Block" })).toBeVisible();
    // The map view is gone: the page has no List / Map switch.
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(page.getByText("Map", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Add Location" }),
    ).toBeVisible();

    // No availability, status or tags columns, and no tag editor in each row.
    await expect(page.getByRole("columnheader")).toHaveText([
      "Name",
      "Type",
      "Actions",
    ]);
    await expect(rows(page).getByRole("button", { name: /tags/i })).toHaveCount(
      0,
    );
    // A status is named only when a location is not active.
    await expect(rows(page).filter({ hasText: "Store" })).toContainText(
      "Inactive",
    );
    await expect(
      rows(page).filter({ hasText: "Main Block" }),
    ).not.toContainText("Active");

    await page.getByRole("textbox", { name: "Search by name" }).fill("store");
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).filter({ hasText: "Store" })).toBeVisible();
  });

  test("keeps the less common row actions in one menu", async ({ page }) => {
    await page.goto(basePath);
    // Main Block is first and holds a ward: it can only move down.
    await page
      .getByRole("button", { name: "More options: Main Block" })
      .click();
    await expect(page.getByRole("menuitem")).toHaveText(["Move Down"]);
    await page.keyboard.press("Escape");

    // Store is last and empty: it can move up or be deleted.
    await page.getByRole("button", { name: "More options: Store" }).click();
    await expect(page.getByRole("menuitem")).toHaveText(["Move Up", "Delete"]);
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(
      page.getByRole("alertdialog", { name: "Remove Store" }),
    ).toBeVisible();
  });

  test("opens a location from the table and from the tree", async ({
    page,
  }) => {
    await page.goto(basePath);
    await rows(page).filter({ hasText: "Main Block" }).click();
    await expect(page).toHaveURL(`${basePath}/${building.id}`);
    await expect(
      page.getByRole("heading", { name: "Main Block", level: 3 }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/^Main Block/);
    await expect(rows(page).filter({ hasText: "General Ward" })).toBeVisible();

    // A leaf has no arrow. Opening a name expands it; only the arrow collapses.
    await expect(
      tree(page).getByRole("button", { name: "Expand Store" }),
    ).toHaveCount(0);
    const wardInTree = tree(page).getByRole("button", {
      name: "General Ward",
      exact: true,
    });
    await expect(wardInTree).toBeVisible();
    await tree(page)
      .getByRole("button", { name: "Main Block", exact: true })
      .click();
    await expect(wardInTree).toBeVisible();
    await tree(page)
      .getByRole("button", { name: "Collapse Main Block" })
      .click();
    await expect(wardInTree).toBeHidden();
    await expect(page).toHaveURL(`${basePath}/${building.id}`);

    // With the tree collapsed or hidden, the name in the list is a link, so a
    // sub-location also opens from the keyboard.
    const wardLink = rows(page).getByRole("link", {
      name: "General Ward",
      exact: true,
    });
    await expect(wardLink).toHaveAttribute("href", `${basePath}/${ward.id}`);
    await wardLink.press("Enter");
    await expect(page).toHaveURL(`${basePath}/${ward.id}`);
    await expect(
      page.getByRole("heading", { name: "General Ward", level: 3 }),
    ).toBeVisible();
  });

  test("a location lists its sub-locations as rows and its beds as a grid", async ({
    page,
  }) => {
    await page.goto(`${basePath}/${ward.id}`);
    await expect(
      page.getByRole("heading", { name: "General Ward", level: 3 }),
    ).toBeVisible();
    await expect(
      tree(page).getByRole("button", { name: "General Ward", exact: true }),
    ).toHaveAttribute("aria-current", "true");

    await expect(page.getByText("Sub-locations · 1")).toBeVisible();
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).filter({ hasText: "Room 1" })).toBeVisible();
    await expect(page.getByText("Beds · 1")).toBeVisible();
    await expect(
      beds(page).getByRole("button", { name: "Bed 1", exact: true }),
    ).toBeVisible();
    await expect(beds(page).getByText("Unoccupied")).toBeVisible();

    // The search filters both at once.
    await page.getByRole("textbox", { name: "Search by name" }).fill("bed");
    await expect(rows(page)).toHaveCount(0);
    await expect(beds(page).getByRole("listitem")).toHaveCount(1);
    await page.getByRole("textbox", { name: "Search by name" }).fill("zzz");
    await expect(page.getByText("No locations found")).toBeVisible();

    await expect(
      crumbs(page).getByRole("link", { name: "Locations", exact: true }),
    ).toHaveAttribute("href", basePath);
    await crumbs(page).getByRole("link", { name: "Main Block" }).click();
    await expect(page).toHaveURL(`${basePath}/${building.id}`);
  });

  test("the open location is managed from its Edit sheet", async ({ page }) => {
    await page.goto(`${basePath}/${ward.id}`);
    const details = page.getByRole("region", { name: "General Ward" });
    await expect(details.getByText("Second floor, east wing")).toBeVisible();
    // What it is tagged with and who manages it are shown, not edited, here.
    await expect(details.getByText("Nursing", { exact: true })).toBeVisible();
    await expect(details.getByText("Isolation", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Manage/ })).toHaveCount(0);

    await details.getByRole("button", { name: "Edit", exact: true }).click();
    const name = editor(page).getByRole("textbox", { name: "Name" });
    await expect(name).toHaveValue("General Ward");
    // What it is cannot change, so the sheet names it and has no field for it.
    await expect(
      editor(page).locator('[data-slot="sheet-description"]'),
    ).toHaveText("Ward");
    await expect(
      editor(page).getByRole("combobox", { name: "Location Form" }),
    ).toHaveCount(0);
    await expect(
      editor(page).getByRole("button", { name: "Manage Tags", exact: true }),
    ).toBeVisible();
    await expect(
      editor(page).getByRole("button", { name: "Manage Organizations" }),
    ).toBeVisible();
    // It still holds a room and a bed, so it cannot be deleted.
    await expect(
      editor(page).getByRole("button", { name: "Delete", exact: true }),
    ).toHaveCount(0);

    // Update stays in the sheet's footer and saves the fields once one changes.
    // Footer buttons are pressed from the keyboard: on the dev server the
    // router devtools button floats over that corner and takes the click.
    const update = editor(page)
      .locator('[data-slot="sheet-footer"]')
      .getByRole("button", { name: "Update", exact: true });
    await expect(update).toBeDisabled();
    await name.fill("General Ward A");
    const saved = page.waitForRequest(
      (request) =>
        request.method() === "PUT" && request.url().includes(ward.id),
    );
    await update.press("Enter");
    expect((await saved).postDataJSON()).toMatchObject({
      name: "General Ward A",
      form: "wa",
      mode: "kind",
    });
    await expect(editor(page)).toBeHidden();
    // The page and the tree show what was saved.
    await expect(
      page.getByRole("heading", { name: "General Ward A", level: 3 }),
    ).toBeVisible();
    await expect(
      tree(page).getByRole("button", { name: "General Ward A", exact: true }),
    ).toBeVisible();
  });

  test("changing tags keeps the fields that are not saved yet", async ({
    page,
  }) => {
    await page.goto(`${basePath}/${ward.id}`);
    await page
      .getByRole("region", { name: "General Ward" })
      .getByRole("button", { name: "Edit", exact: true })
      .click();
    const name = editor(page).getByRole("textbox", { name: "Name" });
    await name.fill("General Ward A");

    // Tags save on their own, and the location is then read again.
    await editor(page)
      .getByRole("button", { name: "Manage Tags", exact: true })
      .click();
    const picker = page.getByRole("menu", { name: "Manage Tags" });
    const removed = page.waitForRequest(
      (request) =>
        request.method() === "POST" && request.url().endsWith("/remove_tags/"),
    );
    await picker.getByRole("menuitemcheckbox", { name: "Isolation" }).click();
    await removed;
    await page.keyboard.press("Escape");
    await expect(picker).toBeHidden();
    await expect(
      editor(page).getByRole("button", { name: "Add Tags", exact: true }),
    ).toBeVisible();

    // What was typed is still there, and can still be saved.
    await expect(name).toHaveValue("General Ward A");
    await expect(
      editor(page).getByRole("button", { name: "Update", exact: true }),
    ).toBeEnabled();
  });

  test("a failed bed request is shown, not read as an empty location", async ({
    page,
  }) => {
    failBedList = true;
    await page.goto(`${basePath}/${ward.id}`);
    // What did load stays on screen.
    await expect(rows(page).filter({ hasText: "Room 1" })).toBeVisible();
    const notice = page.getByRole("alert").filter({
      hasText: "Failed to load locations",
    });
    await expect(notice).toBeVisible();
    await expect(beds(page)).toHaveCount(0);

    failBedList = false;
    await notice.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(
      beds(page).getByRole("button", { name: "Bed 1", exact: true }),
    ).toBeVisible();
    await expect(notice).toBeHidden();
  });

  test("a location that no longer exists says so", async ({ page }) => {
    await page.goto(`${basePath}/${faker.string.uuid()}`);
    await expect(
      page.getByText("This location could not be found."),
    ).toBeVisible();
    await page
      .locator("main")
      .getByRole("link", { name: "Locations", exact: true })
      .last()
      .click();
    await expect(page).toHaveURL(basePath);
    await expect(rows(page).filter({ hasText: "Main Block" })).toBeVisible();
  });

  test("a location that fails to load can be tried again", async ({ page }) => {
    failLocation = true;
    await page.goto(`${basePath}/${ward.id}`);
    // Not the same as a missing location: it exists, the request failed.
    await expect(
      page.getByText("This location could not be loaded."),
    ).toBeVisible();
    await expect(
      page.getByText("This location could not be found."),
    ).toHaveCount(0);

    failLocation = false;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "General Ward", level: 3 }),
    ).toBeVisible();
  });

  test("a new location is added from the same sheet", async ({ page }) => {
    await page.goto(`${basePath}/${ward.id}`);
    await page.getByRole("button", { name: "Add Location" }).click();
    const sheet = page.getByRole("dialog", {
      name: "Add Location",
      exact: true,
    });
    // A new location picks what it is; it has no tags or departments yet.
    await expect(
      sheet.getByRole("combobox", { name: "Location Form" }),
    ).toBeEnabled();
    await expect(sheet.getByRole("button", { name: /Tags/ })).toHaveCount(0);
    const create = sheet.getByRole("button", { name: "Create", exact: true });
    await expect(create).toBeDisabled();

    await sheet
      .getByRole("button", { name: "Cancel", exact: true })
      .press("Enter");
    await expect(sheet).toBeHidden();

    await page.getByRole("button", { name: "Add Location" }).click();
    await sheet.getByRole("textbox", { name: "Name" }).fill("Room 2");
    const created = page.waitForRequest(
      (request) => request.method() === "POST",
    );
    await create.press("Enter");
    expect((await created).postDataJSON()).toMatchObject({
      name: "Room 2",
      form: "ro",
      mode: "kind",
      parent: ward.id,
    });
    await expect(sheet).toBeHidden();
    // The new location is listed once the sheet has closed.
    await expect(rows(page).filter({ hasText: "Room 2" })).toBeVisible();
    await expect(page.getByText("Sub-locations · 2")).toBeVisible();
  });

  test("a bed is managed like any other location", async ({ page }) => {
    await page.goto(`${basePath}/${ward.id}`);
    await beds(page)
      .getByRole("button", { name: "Bed 1", exact: true })
      .click();
    // The same sheet: its fields, tags, departments and removal.
    await expect(
      editor(page).getByRole("textbox", { name: "Name" }),
    ).toHaveValue("Bed 1");
    await expect(
      editor(page).getByRole("button", { name: "Add Tags", exact: true }),
    ).toBeVisible();
    await expect(
      editor(page).getByRole("button", { name: "Manage Organizations" }),
    ).toBeVisible();
    await expect(
      editor(page).getByRole("button", { name: "Delete", exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(`${basePath}/${ward.id}`);

    // A bed's own page shows its details and has nothing to list inside.
    await page.goto(`${basePath}/${bed.id}`);
    const details = page.getByRole("region", { name: "Bed 1" });
    await expect(details.getByText("Bed · Unoccupied")).toBeVisible();
    await expect(
      details.getByRole("button", { name: "Edit", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Location" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "Search by name" }),
    ).toHaveCount(0);
  });
});
