import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import type { LocationRead } from "@/types/location/location";

// The bed board is tested against isolated API fixtures, not a live backend.
test.use({ storageState: { cookies: [], origins: [] } });

type Encounter = NonNullable<LocationRead["current_encounter"]>;

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

function bed(
  parent: LocationRead,
  fields: Partial<LocationRead> & { name: string },
) {
  return location({ form: "bd", mode: "instance", ...fields }, parent);
}

function encounter(patientName: string, fields: Partial<Encounter> = {}) {
  return {
    id: faker.string.uuid(),
    status: "in_progress",
    encounter_class: "imp",
    priority: "urgent",
    period: { start: "2026-11-17T09:00:00Z" },
    patient: {
      id: faker.string.uuid(),
      name: patientName,
      gender: "female",
      year_of_birth: 1972,
      date_of_birth: null,
      deceased_datetime: null,
      phone_number: "+919876543210",
    },
    care_team: [
      {
        member: {
          id: faker.string.uuid(),
          first_name: "Meera",
          last_name: "Rao",
          username: "meera",
        },
        role: { display: "Doctor" },
      },
    ],
    tags: [],
    ...fields,
  } as unknown as Encounter;
}

test.describe("Bed board", () => {
  let facilityId: string;
  let basePath: string;
  /** Locations of the user's departments: what `mine=true` returns. */
  let roots: LocationRead[];
  let children: Map<string, LocationRead[]>;
  /** Every `parent`/`mode` pair that the page asked the location list for. */
  let childRequests: { parent: string; mode: string; limit: string }[];
  /** Query strings of the facility-wide list of locations that hold beds. */
  let withBedsRequests: string[];
  /** An older backend does not know the `has_beds` filter and ignores it. */
  let backendFiltersByFlag: boolean;

  let oldWing: LocationRead;
  let ward: LocationRead;
  let icu: LocationRead;
  let room: LocationRead;
  let annexe: LocationRead;
  let store: LocationRead;
  let annexeRoom: LocationRead;
  /** No beds and nothing below: the flags alone rule it out. */
  let reception: LocationRead;
  /** Sub-locations two levels deep, and not one bed among them. */
  let stores: LocationRead;
  let coldStore: LocationRead;
  let asha: Encounter;

  const everyLocation = () => [...roots, ...[...children.values()].flat()];
  const board = (page: Page) => page.locator('[data-cy="bed-board"]');
  const tree = (page: Page) =>
    page.locator("aside").getByRole("navigation", { name: "Locations" });
  /** A state filter chip, named by its label and its count. */
  const chip = (page: Page, name: string) =>
    board(page)
      .getByRole("group", { name: "Filter beds" })
      .getByRole("button", { name, exact: true });
  const tile = (page: Page, bedName: string) =>
    board(page)
      .locator('[data-cy="bed-tile"]')
      .filter({ has: page.getByText(bedName, { exact: true }) });

  test.beforeEach(async ({ page }) => {
    facilityId = faker.string.uuid();
    basePath = `/facility/${facilityId}/encounters/locations`;
    childRequests = [];
    withBedsRequests = [];
    backendFiltersByFlag = true;

    // The first locations hold no beds or are out of use, so the page must
    // not open on them.
    reception = location({ name: "Reception" });
    stores = location({
      name: "Stores",
      has_children: true,
      has_sub_locations: true,
    });
    coldStore = location(
      { name: "Cold Store", has_children: true, has_sub_locations: true },
      stores,
    );
    oldWing = location({
      name: "Old Wing",
      status: "inactive",
      has_children: true,
      has_beds: true,
    });
    ward = location({
      name: "General Ward",
      has_children: true,
      has_sub_locations: true,
      has_beds: true,
    });
    icu = location({ name: "ICU", has_children: true, has_beds: true });
    room = location(
      { name: "Room 1", form: "ro", has_children: true, has_beds: true },
      ward,
    );
    annexe = location(
      { name: "Annexe", has_children: true, has_sub_locations: true },
      ward,
    );
    store = location({ name: "Store", form: "ro" }, ward);
    annexeRoom = location(
      { name: "Annexe Room", form: "ro", has_children: true, has_beds: true },
      annexe,
    );
    asha = encounter("Asha Menon");

    roots = [reception, stores, oldWing, ward, icu];
    children = new Map([
      [
        ward.id,
        [
          room,
          annexe,
          store,
          bed(ward, { name: "A-1", current_encounter: asha }),
          bed(ward, { name: "A-2" }),
          bed(ward, { name: "A-3", operational_status: "C" }),
          bed(ward, { name: "A-4", operational_status: "H" }),
          bed(ward, { name: "A-5", status: "inactive" }),
          bed(ward, { name: "A-6", operational_status: "O" }),
          // A patient on a bed that is out of use, with a bare encounter.
          bed(ward, {
            name: "A-7",
            status: "inactive",
            current_encounter: encounter("Sparse Patient", {
              care_team: [],
              period: {},
              priority: "routine",
            }),
          }),
        ],
      ],
      [
        room.id,
        [
          bed(room, {
            name: "R1-1",
            current_encounter: encounter("Bala Nair"),
          }),
          bed(room, { name: "R1-2" }),
        ],
      ],
      [annexe.id, [annexeRoom]],
      [annexeRoom.id, [bed(annexeRoom, { name: "AX-1" })]],
      [oldWing.id, [bed(oldWing, { name: "OW-1" })]],
      [icu.id, [bed(icu, { name: "ICU-1" })]],
      [stores.id, [coldStore]],
      [coldStore.id, [location({ name: "Shelf" }, coldStore)]],
    ]);

    await page.addInitScript(() => {
      localStorage.setItem("care_access_token", "bed-board-test");
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
            username: "bed-board",
            first_name: "Bed",
            last_name: "Board",
            user_type: "nurse",
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
      } else if (path === locationPath) {
        const params = url.searchParams;
        let results: LocationRead[];
        if (params.has("mine")) {
          results = roots;
        } else if (!params.has("parent")) {
          withBedsRequests.push(url.search);
          results = everyLocation().filter(
            (item) => item.mode === params.get("mode"),
          );
          if (backendFiltersByFlag && params.get("has_beds") === "true") {
            results = results.filter((item) => item.has_beds);
          }
        } else {
          const parent = params.get("parent") ?? "";
          const mode = params.get("mode") ?? "";
          childRequests.push({
            parent,
            mode,
            limit: params.get("limit") ?? "",
          });
          results = (children.get(parent) ?? []).filter(
            (child) => child.mode === mode,
          );
        }
        const offset = Number(params.get("offset") ?? 0);
        const limit = Number(params.get("limit") ?? 200);
        await route.fulfill({
          json: {
            count: results.length,
            results: results.slice(offset, offset + limit),
          },
        });
      } else if (
        path.startsWith(locationPath) &&
        !path.includes("/association/")
      ) {
        const id = path.slice(locationPath.length).replace(/\/$/, "");
        const found = everyLocation().find((item) => item.id === id);
        await route.fulfill(
          found
            ? { json: found }
            : { status: 404, json: { detail: "Not found" } },
        );
      } else if (route.request().method() === "GET") {
        await route.fulfill({ json: { count: 0, results: [] } });
      } else {
        throw new Error(`Unexpected API mutation in bed board test: ${path}`);
      }
    });
  });

  test("opens the first location in use and shows its beds with counts", async ({
    page,
  }) => {
    await page.goto(basePath);
    await expect(page).toHaveURL(`${basePath}/${ward.id}`);
    await expect(
      board(page).getByRole("heading", { name: "General Ward" }),
    ).toBeVisible();
    // Seven beds of its own and two in Room 1.
    await expect(chip(page, "All 9")).toHaveAttribute("aria-pressed", "true");
    await expect(chip(page, "Occupied 3")).toBeVisible();
    await expect(chip(page, "Reserved 1")).toBeVisible();
    await expect(chip(page, "Free 2")).toBeVisible();
    await expect(chip(page, "Unavailable 3")).toBeVisible();
    await expect(board(page).locator('[data-cy="bed-tile"]')).toHaveCount(9);
    await expect(
      tree(page).getByRole("button", { name: /^General Ward/ }),
    ).toHaveAttribute("aria-current", "true");
    // Going back does not return to the empty start URL.
    expect(await page.evaluate(() => history.length)).toBeLessThanOrEqual(2);
  });

  test("requests only what the location flags say exists", async ({ page }) => {
    await page.goto(`${basePath}/${ward.id}`);
    await expect(tile(page, "R1-2")).toBeVisible();
    const asked = (parent: LocationRead, mode: string) =>
      childRequests.some(
        (request) => request.parent === parent.id && request.mode === mode,
      );
    expect(asked(ward, "kind")).toBe(true);
    expect(asked(ward, "instance")).toBe(true);
    expect(asked(room, "instance")).toBe(true);
    // Room 1 has no sub-locations; Annexe and Store have no beds.
    expect(asked(room, "kind")).toBe(false);
    expect(asked(annexe, "instance")).toBe(false);
    expect(asked(store, "instance")).toBe(false);
    expect(asked(store, "kind")).toBe(false);

    // Which branches lead to a bed comes from one list of the locations that
    // hold beds, not from a walk down each branch.
    // (The dev server mounts every component twice, which repeats the request,
    // so this checks what was asked and not how often.)
    expect(withBedsRequests.length).toBeGreaterThan(0);
    for (const search of withBedsRequests) {
      const withBeds = new URLSearchParams(search);
      expect(withBeds.get("has_beds")).toBe("true");
      expect(withBeds.get("mode")).toBe("kind");
    }
    for (const bedless of [reception, stores, coldStore]) {
      expect(
        childRequests.some((request) => request.parent === bedless.id),
      ).toBe(false);
    }
  });

  test("leaves out locations that do not lead to a bed", async ({ page }) => {
    await page.goto(`${basePath}/${ward.id}`);
    await expect(tile(page, "A-1")).toBeVisible();
    await expect(
      tree(page).getByRole("button", { name: /^General Ward/ }),
    ).toBeVisible();
    // No beds and nothing below; and a branch with no bed anywhere in it.
    await expect(tree(page).getByText("Reception")).toHaveCount(0);
    await expect(tree(page).getByText("Stores")).toHaveCount(0);
    // Store, a room of the ward with no beds, is on neither the tree nor the board.
    await expect(page.getByText("Store", { exact: true })).toHaveCount(0);

    // A link to such a place says so and offers no way further down.
    await page.goto(`${basePath}/${stores.id}`);
    await expect(
      board(page).getByRole("heading", { name: "Stores" }),
    ).toBeVisible();
    await expect(
      board(page).getByText("There are no beds in this location."),
    ).toBeVisible();
    await expect(
      board(page).getByRole("navigation", { name: "More areas" }),
    ).toHaveCount(0);
    await expect(board(page).getByText("Cold Store")).toHaveCount(0);
  });

  test("still leaves them out when the backend ignores the has_beds filter", async ({
    page,
  }) => {
    backendFiltersByFlag = false;
    await page.goto(`${basePath}/${ward.id}`);
    await expect(tile(page, "A-1")).toBeVisible();
    await expect(
      tree(page).getByRole("button", { name: /^General Ward/ }),
    ).toBeVisible();
    await expect(tree(page).getByText("Reception")).toHaveCount(0);
    await expect(tree(page).getByText("Stores")).toHaveCount(0);
    await expect(
      board(page)
        .getByRole("navigation", { name: "More areas" })
        .getByRole("button"),
    ).toHaveText(["Annexe"]);
  });

  test("an occupied bed shows the patient, the encounter and where to go", async ({
    page,
  }) => {
    await page.goto(`${basePath}/${ward.id}`);

    const occupied = tile(page, "A-1");
    await expect(occupied).toHaveAttribute("data-state", "patient");
    await expect(
      occupied.getByRole("heading", { name: "Asha Menon" }),
    ).toBeVisible();
    await expect(occupied.getByText("Meera Rao")).toBeVisible();
    // The exact admission time and how long ago that was.
    await expect(
      occupied.getByText(/\d{2}\/11\/2026, \d{2}:\d{2} [AP]M/),
    ).toBeVisible();
    await expect(occupied.getByText("In Progress")).toBeVisible();
    await expect(occupied.getByText("Inpatient")).toBeVisible();
    await expect(occupied.getByText("Urgent")).toBeVisible();

    await expect(
      occupied.getByRole("link", { name: "View Encounter" }),
    ).toHaveAttribute(
      "href",
      `/facility/${facilityId}/patient/${asha.patient.id}/encounter/${asha.id}/updates`,
    );
    await expect(
      occupied.getByRole("link", { name: "Patient Home" }),
    ).toHaveAttribute(
      "href",
      new RegExp(`^/facility/${facilityId}/patients/home\\?.*partial_id=`),
    );
    // Patient Home stays clickable: the stretched encounter link does not cover it.
    // Polled, because the tile can still be settling into the page layout.
    await expect
      .poll(() =>
        occupied
          .getByRole("link", { name: "Patient Home" })
          .evaluate((link) => {
            const box = link.getBoundingClientRect();
            return (
              document.elementFromPoint(
                box.x + box.width / 2,
                box.y + box.height / 2,
              ) === link
            );
          }),
      )
      .toBe(true);
    // Anywhere else on the tile opens the encounter.
    const box = (await occupied.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(
      `/facility/${facilityId}/patient/${asha.patient.id}/encounter/${asha.id}/updates`,
    );
  });

  test("a bed without a patient says why", async ({ page }) => {
    await page.goto(`${basePath}/${ward.id}`);

    await expect(tile(page, "A-2")).toHaveAttribute("data-state", "free");
    await expect(
      tile(page, "A-2").getByText("Free", { exact: true }),
    ).toBeVisible();
    await expect(
      tile(page, "A-2").getByText("Ready for admission"),
    ).toBeVisible();
    for (const [name, reason] of [
      ["A-3", "Closed"],
      ["A-4", "Housekeeping"],
      ["A-5", "Inactive"],
    ]) {
      await expect(tile(page, name)).toHaveAttribute(
        "data-state",
        "unavailable",
      );
      await expect(tile(page, name).getByText("Unavailable")).toBeVisible();
      await expect(
        tile(page, name).getByText(reason, { exact: true }),
      ).toBeVisible();
    }

    // A patient on an out-of-use bed stays visible, and a bare encounter renders.
    const sparse = tile(page, "A-7");
    await expect(sparse).toHaveAttribute("data-state", "patient");
    await expect(
      sparse.getByRole("heading", { name: "Sparse Patient" }),
    ).toBeVisible();
    await expect(sparse.getByText("Inactive")).toBeVisible();
    await expect(sparse.getByText(/\d{2}\/\d{2}\/\d{4}/)).toHaveCount(0);

    // A bed assigned to an encounter, with the patient not on it yet, is
    // reserved, and who it is held for can be looked up.
    const reserved = tile(page, "A-6");
    await expect(reserved).toHaveAttribute("data-state", "reserved");
    await expect(reserved.getByText("Reserved", { exact: true })).toBeVisible();
    await expect(
      reserved.getByText("Held for a patient who is not on the bed yet."),
    ).toBeVisible();
    await expect(reserved.getByText("Occupied")).toHaveCount(0);
    await reserved.getByRole("button", { name: "View Encounter" }).click();
    await expect(
      page.getByRole("dialog").getByText("No encounter associated"),
    ).toBeVisible();
  });

  test("filters the loaded beds by state and by bed or patient name", async ({
    page,
  }) => {
    await page.goto(`${basePath}/${ward.id}`);
    const tiles = board(page).locator('[data-cy="bed-tile"]');
    await expect(tiles).toHaveCount(9);
    const requestsBefore = childRequests.length;

    await chip(page, "Free 2").click();
    await expect(chip(page, "Free 2")).toHaveAttribute("aria-pressed", "true");
    await expect(tiles).toHaveCount(2);
    await expect(tile(page, "A-2")).toBeVisible();
    await expect(tile(page, "R1-2")).toBeVisible();
    // The chips keep counting every bed, not only the filtered ones.
    await expect(chip(page, "All 9")).toBeVisible();

    await chip(page, "Occupied 3").click();
    await expect(tiles).toHaveCount(3);
    await chip(page, "Reserved 1").click();
    await expect(tiles).toHaveCount(1);
    await expect(tile(page, "A-6")).toBeVisible();
    await chip(page, "Unavailable 3").click();
    await expect(tiles).toHaveCount(3);
    // Pressing the active chip again keeps it on.
    await chip(page, "Unavailable 3").click();
    await expect(tiles).toHaveCount(3);
    await chip(page, "All 9").click();
    await expect(tiles).toHaveCount(9);

    const search = board(page).getByRole("searchbox", {
      name: "Search beds or patients",
    });
    await search.fill("  bALa ");
    await expect(tiles).toHaveCount(1);
    await expect(tile(page, "R1-1")).toBeVisible();
    // Only Room 1 has a match, so the ward's own section is gone.
    await expect(board(page).getByRole("region", { name: "Beds" })).toHaveCount(
      0,
    );
    await expect(
      board(page).getByRole("region", { name: "Room 1" }),
    ).toBeVisible();

    await search.fill("a-3");
    await expect(tiles).toHaveCount(1);
    await expect(tile(page, "A-3")).toBeVisible();

    await search.fill("nobody");
    await expect(tiles).toHaveCount(0);
    await expect(
      board(page).getByText("No beds match your search or filter."),
    ).toBeVisible();
    // Filtering works on what is loaded: no new requests.
    expect(childRequests.length).toBe(requestsBefore);
  });

  test("lists rooms with beds as sections and deeper areas as links", async ({
    page,
  }) => {
    await page.goto(`${basePath}/${ward.id}`);
    const roomSection = board(page).getByRole("region", { name: "Room 1" });
    await expect(roomSection.getByText("2 beds · 1 free")).toBeVisible();
    await expect(roomSection.locator('[data-cy="bed-tile"]')).toHaveCount(2);

    const moreAreas = board(page).getByRole("navigation", {
      name: "More areas",
    });
    await expect(moreAreas.getByRole("button")).toHaveText(["Annexe"]);
    // Annexe has no beds of its own but leads to some, so it is offered.
    // Store leads to none, so it is not.
    await expect(board(page).getByText("Store")).toHaveCount(0);

    await moreAreas.getByRole("button", { name: "Annexe" }).click();
    await expect(page).toHaveURL(`${basePath}/${annexe.id}`);
    await expect(chip(page, "All 1")).toBeVisible();
    await expect(
      board(page)
        .getByRole("region", { name: "Annexe Room" })
        .getByText("1 bed · 1 free"),
    ).toBeVisible();

    await board(page).getByRole("button", { name: "Annexe Room" }).click();
    await expect(page).toHaveURL(`${basePath}/${annexeRoom.id}`);
    await expect(tile(page, "AX-1")).toBeVisible();
  });

  test("a deep link expands the tree path, and the arrow only expands or collapses", async ({
    page,
  }) => {
    await page.goto(`${basePath}/${annexeRoom.id}`);
    const selected = tree(page).getByRole("button", { name: /^Annexe Room/ });
    await expect(selected).toHaveAttribute("aria-current", "true");
    await expect(
      board(page).getByRole("navigation", { name: "breadcrumb" }),
    ).toHaveText(/General Ward.*Annexe/);
    // Out-of-use locations stay in the tree, labelled.
    await expect(
      tree(page).getByRole("button", { name: /^Old Wing Inactive/ }),
    ).toBeVisible();
    // The marker tells which locations hold beds.
    await expect(
      tree(page)
        .getByRole("button", { name: /^General Ward/ })
        .getByRole("img", { name: "Has beds" }),
    ).toBeVisible();
    // A leaf has nothing to expand.
    await expect(
      tree(page).getByRole("button", { name: "Expand ICU" }),
    ).toHaveCount(0);

    await tree(page)
      .getByRole("button", { name: "Collapse General Ward" })
      .click();
    await expect(selected).toBeHidden();
    await expect(page).toHaveURL(`${basePath}/${annexeRoom.id}`);
    await tree(page)
      .getByRole("button", { name: "Expand General Ward" })
      .click();
    await expect(selected).toBeVisible();

    await board(page)
      .getByRole("navigation", { name: "breadcrumb" })
      .getByRole("button", { name: "General Ward" })
      .click();
    await expect(page).toHaveURL(`${basePath}/${ward.id}`);
  });

  test("on a phone the tree opens from a drawer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${basePath}/${ward.id}`);
    await expect(tile(page, "A-1")).toBeVisible();
    await expect(page.locator("aside")).toBeHidden();

    await page.getByRole("button", { name: "Change location" }).click();
    const drawer = page.getByRole("dialog", { name: "Locations" });
    await expect(
      drawer.getByRole("button", { name: /^General Ward/ }),
    ).toHaveAttribute("aria-current", "true");
    await drawer.getByRole("button", { name: /^ICU/ }).click();
    await expect(drawer).toBeHidden();
    await expect(page).toHaveURL(`${basePath}/${icu.id}`);
    await expect(
      board(page).getByRole("heading", { name: "ICU" }),
    ).toBeVisible();
  });

  test("long names do not overflow a narrow screen", async ({ page }) => {
    const longName = faker.string.alpha(90);
    children.get(ward.id)!.push(
      bed(ward, {
        name: longName,
        current_encounter: encounter(faker.string.alpha(90)),
      }),
    );
    ward.name = `Ward ${faker.string.alpha(90)}`;
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`${basePath}/${ward.id}`);
      await expect(tile(page, longName)).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
  });

  test("loads a large ward 100 beds at a time until it has them all", async ({
    page,
  }) => {
    children.set(
      ward.id,
      Array.from({ length: 205 }, (_, index) =>
        bed(ward, { name: `B-${index + 1}` }),
      ),
    );
    ward.has_sub_locations = false;
    await page.goto(`${basePath}/${ward.id}`);
    await expect(chip(page, "All 205")).toBeVisible();
    await expect(chip(page, "Free 205")).toBeVisible();
    await expect(tile(page, "B-205")).toBeVisible();
    const bedRequests = childRequests.filter(
      (request) => request.parent === ward.id && request.mode === "instance",
    );
    expect(bedRequests.map((request) => request.limit)).toEqual([
      "100",
      "100",
      "100",
    ]);
  });

  test("a link to a missing location or to a bed itself still renders", async ({
    page,
  }) => {
    await page.goto(`${basePath}/${faker.string.uuid()}`);
    await expect(
      page.getByText("This location could not be found."),
    ).toBeVisible();
    await expect(
      tree(page).getByRole("button", { name: /^ICU/ }),
    ).toBeVisible();

    const ashasBed = children
      .get(ward.id)!
      .find((item) => item.name === "A-1")!;
    await page.goto(`${basePath}/${ashasBed.id}`);
    await expect(
      board(page).getByRole("heading", { name: "A-1" }),
    ).toBeVisible();
    await expect(
      tile(page, "A-1").getByRole("heading", { name: "Asha Menon" }),
    ).toBeVisible();
  });

  test("the location's beds page shows the board without the tree", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/locations/${ward.id}/beds`);
    await expect(chip(page, "All 9")).toBeVisible();
    await expect(tile(page, "R1-1")).toBeVisible();
    await expect(tree(page)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Change location" }),
    ).toHaveCount(0);

    await board(page).getByRole("button", { name: "Room 1" }).click();
    await expect(page).toHaveURL(
      `/facility/${facilityId}/locations/${room.id}/beds`,
    );
    await expect(chip(page, "All 2")).toBeVisible();
  });

  test("says so when the user has no locations, or none with beds", async ({
    page,
  }) => {
    roots = [reception, stores];
    await page.goto(basePath);
    await expect(
      page.getByText("None of your locations have beds."),
    ).toBeVisible();

    roots = [];
    await page.goto(basePath);
    await expect(
      page.getByText("No locations are assigned to your departments yet."),
    ).toBeVisible();
  });
});
