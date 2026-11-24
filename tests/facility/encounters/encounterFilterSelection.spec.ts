import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { waitForListRequest } from "tests/facility/services/helpers";
import { openMultiFilter } from "tests/helper/multiFilter";

const facility = { id: faker.string.uuid(), name: "Test facility" };
const group = {
  id: faker.string.uuid(),
  display: "Follow-up",
  has_children: true,
};
const child = {
  id: faker.string.uuid(),
  display: "Review required",
  parent: group,
};
const tag = { id: faker.string.uuid(), display: "Walk-in" };
const departments = ["Cardiology", "Nephrology"].map((name, index) => ({
  id: faker.string.uuid(),
  name,
  has_children: index === 0,
}));
const ward = {
  id: faker.string.uuid(),
  name: "Cardiac Ward",
  parent: departments[0],
};
const users = ["Ada", "Sam"].map((first_name) => ({
  id: faker.string.uuid(),
  first_name,
  last_name: "Clinician",
  username: first_name.toLowerCase(),
}));

const identifierConfig = (display: string, system: string, regex = "") => ({
  id: faker.string.uuid(),
  status: "active",
  config: {
    display,
    system,
    regex,
    use: "usual",
    description: "",
    required: false,
    unique: true,
    retrieve_config: {
      retrieve_with_dob: false,
      retrieve_with_year_of_birth: true,
      retrieve_with_otp: false,
    },
    auto_maintained: false,
  },
});
const phoneConfig = identifierConfig(
  "Phone Number",
  "system.care.ohc.network/patient-phone-number",
);
const abhaConfig = identifierConfig(
  "ABHA Number",
  "abdm.gov.in/abha-number",
  "\\d{14}",
);
const fullPatient = {
  id: faker.string.uuid(),
  name: "Ravi Kumar",
  phone_number: "+919876543210",
};
// Partial search results carry a temporary id; only search_retrieve returns
// the record's real one.
const partialPatient = {
  id: faker.string.uuid(),
  partial_id: "a1b2c",
  name: "Meera S",
  gender: "female",
  phone_number: "+919876500000",
};
const verifiedPatient = { id: faker.string.uuid(), name: "Meera Suresh" };

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("care_access_token", "encounter-filter-test"),
  );
  await page.route("**/api/**", (route) => {
    const { pathname, searchParams } = new URL(route.request().url());
    if (pathname === "/api/v1/users/getcurrentuser/") {
      return route.fulfill({
        json: {
          ...users[0],
          is_superuser: true,
          facilities: [facility],
          organizations: [],
          permissions: [],
          flags: [],
          preferences: {},
        },
      });
    }
    if (pathname === `/api/v1/facility/${facility.id}/`)
      return route.fulfill({
        json: {
          ...facility,
          permissions: [],
          features: [],
          patient_instance_identifier_configs: [phoneConfig, abhaConfig],
          patient_facility_identifier_configs: [],
        },
      });
    if (pathname === "/api/v1/patient/search/") {
      const { value } = route.request().postDataJSON();
      return route.fulfill({
        json:
          value === partialPatient.phone_number
            ? { partial: true, results: [partialPatient] }
            : { partial: false, results: [fullPatient] },
      });
    }
    if (pathname === "/api/v1/patient/search_retrieve/") {
      const body = route.request().postDataJSON();
      return body.year_of_birth === "1990" &&
        body.partial_id === partialPatient.partial_id
        ? route.fulfill({ json: verifiedPatient })
        : route.fulfill({ status: 400, json: { detail: "No match" } });
    }
    if (pathname === "/api/v1/plug_config/")
      return route.fulfill({ json: { configs: [] } });
    if (pathname === `/api/v1/facility/${facility.id}/organizations/`) {
      const results =
        searchParams.get("parent") === departments[0].id ? [ward] : departments;
      return route.fulfill({ json: { count: results.length, results } });
    }
    for (const org of [...departments, ward])
      if (
        pathname === `/api/v1/facility/${facility.id}/organizations/${org.id}/`
      )
        return route.fulfill({ json: org });
    if (pathname === `/api/v1/facility/${facility.id}/users/`)
      return route.fulfill({ json: { count: users.length, results: users } });
    for (const user of users)
      if (pathname === `/api/v1/users/${user.username}/`)
        return route.fulfill({ json: user });
    if (pathname === "/api/v1/tag_config/") {
      const term = searchParams.get("display")?.toLowerCase();
      const results = term
        ? [tag, child].filter((entry) =>
            entry.display.toLowerCase().includes(term),
          )
        : searchParams.get("parent") === group.id
          ? [child]
          : [group, tag];
      return route.fulfill({ json: { results, count: results.length } });
    }
    for (const entry of [tag, child]) {
      if (pathname === `/api/v1/tag_config/${entry.id}/`)
        return route.fulfill({ json: entry });
    }
    return route.fulfill({ json: { count: 0, results: [] } });
  });
});

async function clickCheckboxArea(row: Locator) {
  // Click the visible box's coordinates on the row, as a user would.
  const position = await row.evaluate((element) => {
    const box = element
      .querySelector('[data-slot="checkbox"]')!
      .getBoundingClientRect();
    const item = element.getBoundingClientRect();
    return {
      x: box.left + box.width / 2 - item.left,
      y: box.top + box.height / 2 - item.top,
    };
  });
  await row.click({ position });
}

test("adds and removes an encounter tag with the pointer", async ({ page }) => {
  await page.goto(`/facility/${facility.id}/encounters/patients/all`);
  await openMultiFilter(page, /^tags$/i);
  const row = page.getByRole("menuitemcheckbox", {
    name: tag.display,
    exact: true,
  });
  await expect(row).not.toBeChecked();
  const checkbox = row.locator('[data-slot="checkbox"]');
  await expect(checkbox).toHaveCSS("width", "20px");
  await expect(checkbox).toHaveCSS("height", "20px");
  await clickCheckboxArea(row);
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("tags") === tag.id,
  );

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^filters\b/i }).click();
  await page.getByRole("button", { name: /tags.*walk-in/i }).click();
  await expect(row).toBeChecked();
  await expect(checkbox.locator("svg")).toHaveCSS("width", "16px");
  await row.getByText(tag.display).click();
  await expect(page).toHaveURL((url) => !url.searchParams.get("tags"));
  await expect(page.getByRole("button", { name: /^filters\b/i })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: /^add filter$/i }),
  ).toBeFocused();
});

test("navigates tags from the open search field without focusing a row", async ({
  page,
}) => {
  await page.goto(`/facility/${facility.id}/encounters/patients/all`);
  await page.getByRole("button", { name: /^add filter$/i }).press("Enter");
  const filterMenu = page.getByRole("menu");
  await expect(filterMenu.getByRole("combobox")).toBeFocused();
  await page.keyboard.type("Tags");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  const search = page.getByRole("searchbox", { name: /search tags/i });
  const groupRow = page.getByRole("menuitem", { name: /follow-up/i });
  const leaf = page.getByRole("menuitemcheckbox", { name: tag.display });
  await expect(search).toBeFocused();
  await expect(groupRow).toBeVisible();
  const idleBackground = await leaf.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await page.keyboard.press("ArrowDown");
  await expect(groupRow).toHaveAttribute("data-highlighted", "");
  await page.keyboard.press("ArrowDown");
  await expect(leaf).toHaveAttribute("data-highlighted", "");
  await expect(leaf).not.toHaveCSS("background-color", idleBackground);
  await page.keyboard.press("ArrowUp");
  await expect(groupRow).toHaveAttribute("data-highlighted", "");
  await page.keyboard.press("ArrowRight");
  const childRow = page.getByRole("menuitemcheckbox", { name: child.display });
  await expect(childRow).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(search).toBeFocused();
  await page.keyboard.type("unmatched");
  await expect(page.getByText(/no tags/i)).toBeVisible();
  await expect(page.getByRole("menuitemcheckbox")).toHaveCount(0);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL((url) => !url.searchParams.has("tags"));
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Review required");
  await expect(search).toHaveValue("Review required");
  await expect(childRow).toHaveAttribute("data-highlighted", "");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("tags") === child.id,
  );
  await expect(search).toBeFocused();
  await expect(childRow).toBeChecked();
  await page.keyboard.press("Tab");
  const done = page.getByRole("button", { name: "Done", exact: true });
  await expect(done).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Clear", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(done).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(search).toBeHidden();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("tags") === child.id,
  );
  await expect(
    page.getByRole("button", { name: /^add filter$/i }),
  ).toBeFocused();
});

test("can switch fields without applying an empty picker", async ({ page }) => {
  await page.goto(`/facility/${facility.id}/encounters/patients/all`);
  await openMultiFilter(page, /^tags$/i);
  await expect(
    page.getByRole("searchbox", { name: /search tags/i }),
  ).toBeFocused();
  await page.getByRole("button", { name: /^add filter$/i }).click();
  await expect(
    page.getByRole("option", { name: /^department$/i }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /^filters\b/i })).toHaveCount(
    0,
  );
  await expect(page).toHaveURL((url) => !url.searchParams.has("tags"));
});

for (const picker of [
  {
    label: "Department",
    param: "organization",
    names: departments.map((d) => d.name),
    values: departments.map((d) => d.id),
  },
  {
    label: "Care Team",
    param: "care_team_user",
    names: ["Mine", "Sam Clinician"],
    values: users.map((u) => u.username),
  },
]) {
  test(`${picker.label} uses exclusive radio rows and clears via Remove filter`, async ({
    page,
  }) => {
    await page.goto(`/facility/${facility.id}/encounters/patients/all`);
    await openMultiFilter(page, new RegExp(`^${picker.label}$`, "i"));
    const first = page.getByRole("menuitemradio", {
      name: picker.names[0],
      exact: true,
    });
    await expect(first.locator('[data-slot="radio-group-item"]')).toBeVisible();
    await first.click();
    await expect(page).toHaveURL(
      (url) => url.searchParams.get(picker.param) === picker.values[0],
    );
    await page.keyboard.press("Escape");
    const active = page.getByRole("button", { name: /^filters\b/i });
    await active.click();
    const row = page.getByRole("group", { name: picker.label, exact: true });
    await row
      .getByRole("button", { name: new RegExp(picker.label, "i") })
      .click();
    const next = page.getByRole("menuitemradio", {
      name: picker.names[1],
      exact: true,
    });
    await next.click();
    await expect(page).toHaveURL(
      (url) => url.searchParams.get(picker.param) === picker.values[1],
    );
    await expect(next).toBeChecked();
    await next.click();
    await expect(
      page.getByRole("menuitemradio", { checked: true }),
    ).toHaveCount(1);
    await page.keyboard.press("Escape");
    await active.click();
    const remove = row.getByRole("button", { name: /remove filter/i });
    // The remove button sits inside the row, so hovering it highlights the row.
    await remove.hover();
    await expect(row).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await remove.click();
    await expect(page).toHaveURL((url) => !url.searchParams.has(picker.param));
  });
}

test("browses child departments without selecting their parent", async ({
  page,
}) => {
  await page.goto(`/facility/${facility.id}/encounters/patients/all`);
  await openMultiFilter(page, /^department$/i);
  await page.getByRole("menuitem", { name: /expand cardiology/i }).click();
  const child = page.getByRole("menuitemradio", { name: /cardiac ward/i });
  await expect(child).not.toBeChecked();
  await expect(page).toHaveURL((url) => !url.searchParams.has("organization"));
  await child.click();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("organization") === ward.id,
  );
  await expect(page.getByRole("menuitemradio", { checked: true })).toHaveCount(
    1,
  );
});

test("priority uses radio choices when adding and editing", async ({
  page,
}) => {
  await page.goto(
    `/facility/${facility.id}/encounters/patients/all?encounter_class=amb`,
  );
  const waitForPriority = (priority: string | null) =>
    waitForListRequest(
      page,
      "/encounter/",
      (params) =>
        params.get("facility") === facility.id &&
        params.get("encounter_class") === "amb" &&
        params.get("priority") === priority,
    );
  await openMultiFilter(page, /^priority$/i);
  const urgent = page.getByRole("menuitemradio", {
    name: "Urgent",
    exact: true,
  });
  await expect(urgent.locator('[data-slot="radio-group-item"]')).toBeVisible();
  await Promise.all([waitForPriority("urgent"), urgent.click()]);
  const isUrgent = (url: URL) => url.searchParams.get("priority") === "urgent";
  await expect(page).toHaveURL(isUrgent);
  await page.reload();
  await page.getByRole("button", { name: /^filters\b/i }).click();
  await page.getByRole("button", { name: /priority.*urgent/i }).click();
  await expect(urgent).toBeChecked();
  await expect(
    urgent.locator('[data-slot="radio-group-item"]'),
  ).toHaveAttribute("data-checked", "");
  await urgent.click();
  await expect(page).toHaveURL(isUrgent);
  const selected = page.getByRole("group", { name: /^selected$/i });
  await expect(selected.getByRole("menuitemradio")).toHaveText("Urgent");
  const routine = page.getByRole("menuitemradio", {
    name: "Routine",
    exact: true,
  });
  await Promise.all([waitForPriority("routine"), routine.click()]);
  await expect(selected.getByRole("menuitemradio")).toHaveText("Routine");
  await expect(urgent).not.toBeChecked();
  const clear = page.getByRole("button", { name: "Clear", exact: true });
  await Promise.all([waitForPriority(null), clear.click()]);
  await expect(page).toHaveURL(
    ({ searchParams }) =>
      searchParams.get("encounter_class") === "amb" &&
      !searchParams.has("priority"),
  );
});

test("groups selected statuses first and filters both sections without duplicates", async ({
  page,
}) => {
  await page.goto(`/facility/${facility.id}/encounters/patients/all`);
  await openMultiFilter(page, /^status$/i);
  const picker = page.getByRole("dialog", { name: "Status" });
  const rows = picker.getByRole("menuitemcheckbox");
  const selected = picker.getByRole("group", { name: /^selected$/i });
  const search = picker.getByRole("searchbox");
  const completed = picker.getByRole("menuitemcheckbox", { name: "Completed" });
  await expect(selected).toHaveCount(0);
  await completed.click();
  await expect(rows.first()).toHaveText("Completed");
  await expect(selected.getByRole("menuitemcheckbox")).toHaveText([
    "Completed",
  ]);
  await expect(completed).toHaveCount(1);

  await search.fill("planned");
  await expect(selected).toHaveCount(0);
  await search.press("Enter");
  await expect(selected.getByRole("menuitemcheckbox")).toHaveText(["Planned"]);
  await expect(search).toBeFocused();
  await search.clear();
  await expect(selected.getByRole("menuitemcheckbox")).toHaveText([
    "Planned",
    "Completed",
  ]);
  await completed.click();
  await expect(selected.getByRole("menuitemcheckbox")).toHaveText(["Planned"]);
  await expect(completed).not.toBeChecked();
  await picker.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(selected).toHaveCount(0);
});

test("status and priority open in place like the other pickers", async ({
  page,
}) => {
  await page.goto(`/facility/${facility.id}/encounters/patients/all`);
  const add = page.getByRole("button", { name: /^add filter$/i });
  await add.click();
  const status = page.getByRole("option", { name: /^status$/i });
  await expect(status).not.toHaveAttribute("aria-haspopup");
  await status.hover();
  await expect(page.getByRole("menuitemcheckbox")).toHaveCount(0);
  await status.click();
  await expect(
    page.getByRole("searchbox", { name: /search status/i }),
  ).toBeFocused();
  await page.keyboard.type("compl");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("status") === "completed",
  );
  await page.keyboard.press("Escape");
  await expect(add).toBeFocused();

  // Type a field name and press Enter, as for the other pickers.
  await page.keyboard.press("Enter");
  await page.keyboard.type("prio");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("searchbox", { name: /search priority/i }),
  ).toBeFocused();
  await page.keyboard.type("urg");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("priority") === "urgent",
  );
  await expect(
    page.getByRole("menuitemradio", { name: "Urgent", exact: true }),
  ).toBeChecked();
});

test("picker header goes back to where the picker was opened, or closes it", async ({
  page,
}) => {
  await page.goto(`/facility/${facility.id}/encounters/patients/all`);
  const add = page.getByRole("button", { name: /^add filter$/i });
  const statusField = page.getByRole("option", { name: /^status$/i });
  const priorityField = page.getByRole("option", { name: /^priority$/i });
  await openMultiFilter(page, /^status$/i);
  const statusPicker = page.getByRole("dialog", { name: "Status" });
  await expect(statusPicker.getByText("Status", { exact: true })).toBeVisible();
  await statusPicker.getByRole("button", { name: "Back" }).click();
  await expect(priorityField).toBeVisible();

  // ArrowLeft goes back only once the search is empty.
  await priorityField.click();
  const search = page.getByRole("searchbox", { name: /search priority/i });
  await expect(search).toBeFocused();
  await page.keyboard.type("u");
  await page.keyboard.press("ArrowLeft");
  await expect(search).toBeFocused();
  await page.keyboard.press("Delete");
  await page.keyboard.press("ArrowLeft");
  await expect(statusField).toBeVisible();

  await priorityField.click();
  await page
    .getByRole("menuitemradio", { name: "Urgent", exact: true })
    .click();
  const priorityPicker = page.getByRole("dialog", { name: "Priority" });
  await priorityPicker.getByRole("button", { name: "Close" }).click();
  await expect(priorityPicker).toHaveCount(0);
  await expect(add).toBeFocused();

  const active = page.getByRole("button", { name: /^filters\b/i });
  await active.click();
  const summary = page.getByRole("dialog", { name: /^active filters$/i });
  const editPriority = summary.getByRole("button", {
    name: /priority.*urgent/i,
  });
  await editPriority.click({ trial: true });
  const summaryBox = (await summary.boundingBox())!;
  await editPriority.click();
  await expect(active).toHaveAttribute("aria-expanded", "true");
  await expect(add).not.toHaveAttribute("aria-expanded", "true");
  const back = priorityPicker.getByRole("button", { name: "Back" });
  await back.click({ trial: true });
  const pickerBox = (await priorityPicker.boundingBox())!;
  expect(pickerBox.x).toBeCloseTo(summaryBox.x, 0);
  expect(pickerBox.y).toBeCloseTo(summaryBox.y, 0);
  await back.click();
  await editPriority.press("Enter");
  await priorityPicker.getByRole("button", { name: "Done" }).click();
  await expect(active).toBeFocused();
});

test("picker footer counts multi-select values but not radio choices", async ({
  page,
}) => {
  await page.goto(`/facility/${facility.id}/encounters/patients/all`);
  const add = page.getByRole("button", { name: /^add filter$/i });
  await openMultiFilter(page, /^status$/i);
  const statusPicker = page.getByRole("dialog", { name: "Status" });
  const footer = statusPicker.locator('[data-slot="filter-footer"]');
  const count = footer.getByRole("status");
  await expect(count).toHaveText("0 selected");
  await expect(statusPicker.locator('[data-slot="kbd"]')).toHaveCount(0);
  const clear = footer.getByRole("button", { name: "Clear", exact: true });
  await expect(clear).toBeDisabled();
  const search = statusPicker.getByRole("searchbox");
  await expect(search).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(footer.getByRole("button", { name: "Done" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(search).toBeFocused();

  const completed = statusPicker.getByRole("menuitemcheckbox", {
    name: /^completed$/i,
  });
  await completed.click();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("status") === "completed",
  );
  await expect(count).toHaveText("1 selected");
  await search.fill("planned");
  await statusPicker.getByRole("menuitemcheckbox", { name: "Planned" }).click();
  await expect(count).toHaveText("2 selected");
  await search.clear();
  await expect(clear).toBeEnabled();
  await clear.click();
  await expect(page).toHaveURL((url) => !url.searchParams.get("status"));
  await expect(count).toHaveText("0 selected");
  await expect(completed).not.toBeChecked();
  await expect(clear).toBeDisabled();
  await expect(clear).toBeFocused();
  await footer.getByRole("button", { name: "Done" }).click();
  await expect(statusPicker).toHaveCount(0);
  await expect(add).toBeFocused();

  await openMultiFilter(page, /^priority$/i);
  const priorityPicker = page.getByRole("dialog", { name: "Priority" });
  const radioFooter = priorityPicker.locator('[data-slot="filter-footer"]');
  const urgent = priorityPicker.getByRole("menuitemradio", { name: "Urgent" });
  await urgent.click();
  await expect(urgent).toBeChecked();
  await expect(
    radioFooter.getByText("Pick one", { exact: true }),
  ).toBeVisible();
  await expect(radioFooter).not.toContainText("1 selected");
});

for (const layout of ["desktop", "mobile"] as const) {
  test(`tabs from the field selector through the search actions on ${layout}`, async ({
    page,
  }) => {
    if (layout === "mobile")
      await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/facility/${facility.id}/encounters/patients/all`);
    const search = page.getByRole("combobox", { name: /^search visits$/i });
    const field = page.getByRole("combobox", { name: /^search field$/i });
    const clearText = page.getByRole("button", { name: /^clear search$/i });
    const scan = page.getByRole("button", { name: /^scan patient qr code$/i });
    await search.fill("Taylor");
    await expect(page.getByRole("listbox")).toContainText("Taylor");
    // Tab keeps its normal order and dismisses the suggestions.
    await page.keyboard.press("Tab");
    await expect(clearText).toBeFocused();
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await page.keyboard.press("Tab");
    await expect(scan).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: /^add filter$/i }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(scan).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(clearText).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(search).toBeFocused();
    await expect(search).toHaveValue("Taylor");
    await page.keyboard.press("Shift+Tab");
    await expect(field).toBeFocused();
  });

  test(`keeps the toolbar on one line and preserves Date on ${layout}`, async ({
    page,
  }) => {
    if (layout === "mobile")
      await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/facility/${facility.id}/encounters/patients/all`);
    const add = page.getByRole("button", { name: /^add filter$/i });
    const active = page.getByRole("button", { name: /^filters\b/i });
    const clear = page.getByRole("button", { name: /^clear all filters$/i });
    const date = page.getByRole("button", { name: /^date/i });
    await expect(date).toHaveText(/today/i);
    await expect(active).toHaveCount(0);
    await expect(clear).toHaveCount(0);
    const initialDateBox = (await date.boundingBox())!;
    await date.click();
    await page.getByRole("menuitem", { name: /^yesterday$/i }).click();
    await page.keyboard.press("Escape");
    await expect(date).toHaveText(/yesterday/i);
    const start = new URL(page.url()).searchParams.get("created_date_after");
    const end = new URL(page.url()).searchParams.get("created_date_before");
    expect(start).toBeTruthy();
    expect(end).toBeTruthy();

    // With nothing applied, Add keeps its label. On mobile it and Date split
    // their row equally.
    const labelledAdd = (await add.boundingBox())!;
    expect(labelledAdd.width).toBeGreaterThan(labelledAdd.height);
    if (layout === "mobile")
      expect(labelledAdd.width).toBeCloseTo(initialDateBox.width, 0);
    await add.click();
    await expect(page.getByRole("option", { name: /^date$/i })).toHaveCount(0);
    await page.getByRole("option", { name: /^status$/i }).click();
    for (const name of ["Planned", "Completed"]) {
      await page.getByRole("menuitemcheckbox", { name, exact: true }).click();
    }
    // The value picker replaced the field menu, so one Escape closes it.
    await page.keyboard.press("Escape");
    await expect(add).toBeFocused();
    await expect(active).toHaveAccessibleName(/^filters\s*1$/i);
    // The Filters label stays visible on every layout; Add becomes a plus
    // with a tooltip.
    const label = (await active
      .getByText("Filters", { exact: true })
      .boundingBox())!;
    expect(label.width).toBeGreaterThan(1);
    const plus = (await add.boundingBox())!;
    expect(plus.width).toBeCloseTo(plus.height, 0);
    await add.hover();
    await expect(page.locator('[data-slot="tooltip-content"]')).toHaveText(
      /^add filter$/i,
    );
    const segment = page.locator('[data-slot="filter-summary"]');
    // On mobile, Clear all lives in the Filters drawer instead.
    const segmentClear = segment.getByRole("button", {
      name: /^clear all filters$/i,
    });
    if (layout === "mobile") await expect(segmentClear).toBeHidden();
    else await expect(segmentClear).toBeVisible();
    expect((await segment.boundingBox())!.height).toBeCloseTo(
      (await add.boundingBox())!.height,
      0,
    );
    await active.click();
    const summary = page.getByRole("dialog");
    // The open popover adds hidden focus guards before its trigger.
    await expect(segment).toHaveCSS("border-left-width", "1px");
    await expect(segment).toHaveCSS("border-top-left-radius", /^[1-9]/);
    await expect(
      summary.getByRole("group", { name: /^status$/i }),
    ).toContainText(/planned.*completed/i);
    await expect(summary).toHaveAccessibleName(/^active filters$/i);
    // A popover on desktop, a drawer on mobile.
    await expect(
      summary
        .locator('[data-slot="popover-title"], [data-slot="drawer-title"]')
        .locator(".."),
    ).toHaveText(/^active filters\s*1$/i);
    // Measure after the zoom-in animation, which scales the boxes.
    await summary.evaluate((el) =>
      Promise.all(el.getAnimations().map((animation) => animation.finished)),
    );
    const clearAll = (await summary
      .getByRole("button", { name: /^clear all$/i })
      .boundingBox())!;
    const addInSummary = (await summary
      .getByRole("button", { name: /^add filter$/i })
      .boundingBox())!;
    expect(clearAll.y).toBeCloseTo(addInSummary.y, 0);
    expect(clearAll.x).toBeLessThan(addInSummary.x);
    await summary.getByRole("button", { name: /^add filter$/i }).click();
    await page.getByRole("option", { name: /^department$/i }).click();
    await page
      .getByRole("menuitemradio", { name: departments[0].name, exact: true })
      .click();
    await page.keyboard.press("Escape");
    await expect(active).toHaveAccessibleName(/^filters\s*2$/i);

    const dateBox = (await date.boundingBox())!;
    const addBox = (await add.boundingBox())!;
    // The combined search shares the line on desktop and has its own row on
    // mobile.
    const searchBox = (await page
      .locator('[data-slot="encounter-search"]')
      .boundingBox())!;
    if (layout === "mobile") expect(searchBox.y).toBeLessThan(addBox.y);
    else expect(searchBox.y).toBeCloseTo(addBox.y, 0);
    expect(dateBox.y).toBeCloseTo(initialDateBox.y, 0);
    expect(dateBox.y).toBeCloseTo(addBox.y, 0);
    expect(dateBox.x).toBeGreaterThanOrEqual(addBox.x + addBox.width);
    expect(dateBox.x + dateBox.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    if (layout === "mobile") {
      const group = page.getByRole("group", { name: /^filters$/i });
      expect((await group.boundingBox())!.width).toBeCloseTo(dateBox.width, 0);
      await active.click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /^clear all$/i })
        .click();
      // The drawer keeps its view while it slides away.
      await expect(page.locator('[data-slot="drawer-popup"]')).toHaveCount(0);
    } else await clear.click();
    await expect(active).toHaveCount(0);
    await expect(clear).toHaveCount(0);
    await expect(add).toBeVisible();
    await expect(page).toHaveURL(
      ({ searchParams }) =>
        !searchParams.has("status") &&
        !searchParams.has("organization") &&
        searchParams.get("created_date_after") === start &&
        searchParams.get("created_date_before") === end,
    );
    await expect(date).toHaveText(/yesterday/i);
  });

  test(`uses the standard checkbox when adding and editing a status on ${layout}`, async ({
    page,
  }) => {
    if (layout === "mobile")
      await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/facility/${facility.id}/encounters/patients/all`);
    await openMultiFilter(page, /^status$/i);

    const planned = page.getByRole("menuitemcheckbox", {
      name: "Planned",
      exact: true,
    });
    const completed = page.getByRole("menuitemcheckbox", {
      name: "Completed",
      exact: true,
    });
    const box = '[data-slot="checkbox"]';
    const statuses = (url: URL) => url.searchParams.get("status");
    await expect(planned.locator(box)).toHaveCSS("width", "20px");
    await clickCheckboxArea(planned);
    await expect(page).toHaveURL((url) => statuses(url) === "planned");
    await expect(planned.locator(`${box} svg`)).toHaveCSS("width", "16px");

    // Edit the saved field from the summary, rather than the add menu.
    await page.reload();
    // On mobile the modal drawer hides the toolbar from the accessibility tree.
    const active = page.getByRole("button", {
      name: /^filters\b/i,
      includeHidden: true,
    });
    await active.click();
    await page.getByRole("button", { name: /status.*planned/i }).click();
    await expect(active).toHaveAttribute("aria-expanded", "true");
    await expect(planned).toBeChecked();
    await expect(planned.locator(box)).toHaveCSS("width", "20px");
    await expect(completed.locator(box)).toHaveCSS("height", "20px");
    await expect(completed).toHaveCSS(
      "min-height",
      layout === "mobile" ? "44px" : "40px",
    );
    await completed.getByText("Completed", { exact: true }).click();
    await expect(page).toHaveURL(
      (url) => statuses(url)?.split(",").sort().join() === "completed,planned",
    );
    await planned.press("Space");
    await expect(page).toHaveURL((url) => statuses(url) === "completed");
    await page.keyboard.press("Escape");
    await expect(active).toBeFocused();
  });

  test(`selects a grouped tag from its checkbox on ${layout}`, async ({
    page,
  }) => {
    if (layout === "mobile")
      await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/facility/${facility.id}/encounters/patients/all`);
    await openMultiFilter(page, /^tags$/i);
    const trigger = page.getByRole("menuitem", { name: /Follow-up/ });
    if (layout === "mobile") await trigger.click();
    else await trigger.press("ArrowRight");
    const row = page.getByRole("menuitemcheckbox", {
      name: child.display,
      exact: true,
    });
    await expect(row).not.toBeChecked();
    await clickCheckboxArea(row);
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("tags") === child.id,
    );
  });
}

test("opens the filters in one bottom drawer on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/facility/${facility.id}/encounters/patients/all`);
  const add = page.getByRole("button", { name: /^add filter$/i });
  const drawers = page.locator('[data-slot="drawer-popup"]');

  await add.click();
  const fields = page.getByRole("dialog", { name: /^add filter$/i });
  await expect(fields).toBeVisible();
  // The search isn't focused, so the on-screen keyboard stays closed.
  await expect(fields.getByRole("searchbox")).not.toBeFocused();
  await fields.getByRole("option", { name: /^status$/i }).click();

  // The picker replaces the field list in the same drawer.
  const status = page.getByRole("dialog", { name: "Status" });
  await expect(status).toBeVisible();
  await expect(drawers).toHaveCount(1);
  await status
    .getByRole("menuitemcheckbox", { name: "Planned", exact: true })
    .click();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("status") === "planned",
  );
  await status.getByRole("button", { name: "Done" }).click();
  await expect(drawers).toHaveCount(0);
  await expect(add).toBeFocused();

  const active = page.getByRole("button", { name: /^filters\b/i });
  await active.click();
  const summary = page.getByRole("dialog", { name: /^active filters$/i });
  await expect(summary).toBeVisible();
  await summary.getByRole("button", { name: /^add filter$/i }).click();
  await expect(fields).toBeVisible();
  await fields.getByRole("button", { name: "Back" }).click();
  await expect(summary).toBeVisible();
  await summary.getByRole("button", { name: /status.*planned/i }).click();
  await expect(status).toBeVisible();
  await status.getByRole("button", { name: "Back" }).click();
  await expect(summary).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawers).toHaveCount(0);
  await expect(active).toBeFocused();

  // Date opens its own drawer.
  const date = page.getByRole("button", { name: /^date/i });
  await date.click();
  const datePicker = page.getByRole("dialog", { name: /^date$/i });
  await datePicker.getByRole("menuitem", { name: /^yesterday$/i }).click();
  await datePicker.getByRole("button", { name: "Done" }).click();
  await expect(drawers).toHaveCount(0);
  await expect(date).toHaveText(/yesterday/i);
});

test.describe("All encounters search", () => {
  const listUrl = (query = "") =>
    `/facility/${facility.id}/encounters/patients/all${query}`;
  const searchBox = (page: Page) =>
    page.getByRole("combobox", { name: /^search visits$/i });
  const chip = (page: Page) =>
    page.locator('[data-slot="encounter-search-applied"]');
  const dateNotice = (page: Page) =>
    page.getByRole("status").filter({ hasText: /date range cleared/i });

  /** Splits encounter list requests into list pages and limit=1 previews. */
  function trackEncounterRequests(page: Page) {
    const requests = {
      list: [] as URLSearchParams[],
      preview: [] as URLSearchParams[],
    };
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname !== "/api/v1/encounter/") return;
      const target =
        url.searchParams.get("limit") === "1"
          ? requests.preview
          : requests.list;
      target.push(url.searchParams);
    });
    return requests;
  }

  function trackPatientLookups(page: Page) {
    const bodies: { config: string; value: string }[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/v1/patient/search/")
        bodies.push(request.postDataJSON());
    });
    return bodies;
  }

  test("previews visit filters while typing and applies one only on Enter", async ({
    page,
  }) => {
    await page.route(
      (url) => url.pathname === "/api/v1/encounter/",
      (route) => {
        const preview =
          new URL(route.request().url()).searchParams.get("limit") === "1";
        return route.fulfill({
          json: { count: preview ? 3 : 0, results: [] },
        });
      },
    );
    const requests = trackEncounterRequests(page);
    await page.goto(listUrl());
    await expect.poll(() => requests.list.length).toBeGreaterThan(0);
    await expect(page).toHaveURL((url) =>
      url.searchParams.has("created_date_after"),
    );
    const listRequests = requests.list.length;

    await searchBox(page).pressSequentially("Taylor", { delay: 150 });
    const nameRow = page.getByRole("option", { name: /name contains taylor/i });
    await expect(nameRow).toContainText("3 visits");
    await expect(
      page.getByRole("option", { name: /visit id contains taylor/i }),
    ).toContainText("3 visits");
    // Previews carry the applied filters but never change the list.
    expect(
      requests.preview.some(
        (params) =>
          params.get("name") === "Taylor" && params.has("created_date_after"),
      ),
    ).toBe(true);
    expect(requests.list).toHaveLength(listRequests);
    expect(requests.list.some((params) => params.has("name"))).toBe(false);

    await searchBox(page).press("Enter");
    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get("name") === "Taylor" &&
        !url.searchParams.get("external_identifier"),
    );
    await expect(searchBox(page)).toHaveValue("");
    await expect(chip(page)).toHaveText(/name: taylor/i);
    await expect
      .poll(() =>
        requests.list.some((params) => params.get("name") === "Taylor"),
      )
      .toBe(true);

    await chip(page)
      .getByRole("button", { name: "Remove name filter" })
      .click();
    await expect(page).toHaveURL((url) => !url.searchParams.has("name"));
  });

  test("never looks up an incomplete phone number", async ({ page }) => {
    const lookups = trackPatientLookups(page);
    await page.goto(listUrl());
    await searchBox(page).pressSequentially("98765", { delay: 150 });
    const phoneRow = page.getByRole("option", { name: /phone number 98765/i });
    await expect(phoneRow).toHaveAttribute("aria-disabled", "true");
    await expect(phoneRow).toContainText("Enter the full phone number");
    // The visit group leads until a complete identifier is detected.
    await expect(page.getByRole("option").first()).toContainText(
      /visit id contains 98765/i,
    );
    await searchBox(page).press("Enter");
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("external_identifier") === "98765",
    );
    expect(lookups).toHaveLength(0);
  });

  test("in Auto, a full phone number offers only the phone lookup", async ({
    page,
  }) => {
    // Like a facility with many configs: some without a format rule, and the
    // phone config listed last.
    const hospitalId = identifierConfig("Hospital ID", "example.org/hospital");
    const tmhId = identifierConfig("TMH ID", "example.org/tmh");
    await page.route(`**/api/v1/facility/${facility.id}/`, (route) =>
      route.fulfill({
        json: {
          ...facility,
          permissions: [],
          features: [],
          patient_instance_identifier_configs: [tmhId, abhaConfig],
          patient_facility_identifier_configs: [hospitalId, phoneConfig],
        },
      }),
    );
    await page.goto(listUrl());

    await searchBox(page).pressSequentially("+919846404232", { delay: 20 });
    const patientRows = page
      .getByRole("group", { name: /look up a patient/i })
      .getByRole("option");
    await expect(patientRows).toHaveCount(1);
    await expect(patientRows).toContainText(/phone number \+91 98464 04232/i);
    await expect(page.getByRole("option").first()).toContainText(
      /phone number/i,
    );

    // Without a format match, a partly typed phone number leads with its
    // hint; then configs without a rule, usable ones before disabled ones.
    await searchBox(page).fill("");
    await searchBox(page).pressSequentially("98464", { delay: 20 });
    await expect(patientRows.first()).toContainText(/phone number 98464/i);
    await expect(patientRows.first()).toHaveAttribute("aria-disabled", "true");
    await expect(patientRows.nth(1)).toContainText(/tmh id 98464/i);
    await expect(patientRows.last()).toHaveAttribute("aria-disabled", "true");
  });

  test("shows the phone country in Auto once a number is typed", async ({
    page,
  }) => {
    await page.goto(listUrl());
    // The open dropdown hides the rest of the page from the a11y tree.
    const country = (name: string) =>
      page.locator(`[data-slot="encounter-search"] [aria-label="${name}"]`);
    const india = country("Phone country: India (+91)");
    await searchBox(page).pressSequentially("Ravi", { delay: 50 });
    await expect(india).toBeHidden();

    await searchBox(page).fill("");
    await searchBox(page).pressSequentially("98765", { delay: 50 });
    await expect(india).toBeVisible();
    await expect(page.getByText(/^auto$/i)).toBeVisible();

    // A number with its own code shows that code's country.
    await searchBox(page).fill("");
    await searchBox(page).pressSequentially("+4", { delay: 50 });
    await expect(india).toBeVisible();
    await searchBox(page).pressSequentially("4 7400 123456", { delay: 50 });
    await expect(country("Phone country: United Kingdom (+44)")).toBeVisible();
    await expect(page.getByRole("option").first()).toContainText(
      /phone number \+44 7400 123456/i,
    );
  });

  test("looks up a phone number in the picked country", async ({ page }) => {
    const lookups = trackPatientLookups(page);
    await page.goto(listUrl());
    await searchBox(page).pressSequentially("phone:", { delay: 50 });
    await page
      .getByRole("button", { name: "Phone country: India (+91)" })
      .click();
    await page.getByPlaceholder("Search country...").fill("United Kingdom");
    await page.getByRole("option", { name: /united kingdom \+44/i }).click();
    await expect(
      page.getByRole("button", { name: "Phone country: United Kingdom (+44)" }),
    ).toBeVisible();
    await expect(searchBox(page)).toBeFocused();

    await searchBox(page).pressSequentially("07400 123456", { delay: 50 });
    await expect(page.getByRole("option")).toContainText(
      /phone number \+44 7400 123456/i,
    );
    await searchBox(page).press("Enter");
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
    expect(lookups).toEqual([
      { config: phoneConfig.id, value: "+447400123456", page_size: 20 },
    ]);
  });

  test("looks up a complete phone on Enter, and Undo restores the dates", async ({
    page,
  }) => {
    const lookups = trackPatientLookups(page);
    await page.goto(listUrl("?name=Kumar"));
    await expect(page).toHaveURL((url) =>
      url.searchParams.has("created_date_after"),
    );
    const before = new URL(page.url()).searchParams;

    await searchBox(page).pressSequentially("9876543210", { delay: 150 });
    // Detection puts the lookup first; typing alone never searches. Auto
    // reads the number in the default country and shows its code.
    await expect(page.getByRole("option").first()).toContainText(
      /phone number \+91 98765 43210/i,
    );
    expect(lookups).toHaveLength(0);
    await searchBox(page).press("Enter");
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
    expect(lookups).toEqual([
      { config: phoneConfig.id, value: "+919876543210", page_size: 20 },
    ]);
    await page.getByRole("option", { name: fullPatient.name }).click();

    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get("patient_filter") === fullPatient.id &&
        url.searchParams.get("patient_name") === fullPatient.name &&
        !url.searchParams.has("created_date_after") &&
        !url.searchParams.has("created_date_before"),
    );
    await expect(dateNotice(page)).toContainText(
      "The name filter still applies.",
    );
    await expect(
      chip(page).filter({ hasText: fullPatient.name }),
    ).toBeVisible();

    await dateNotice(page).getByRole("button", { name: "Undo" }).click();
    await expect(page).toHaveURL(
      (url) =>
        !url.searchParams.has("patient_filter") &&
        url.searchParams.get("created_date_after") ===
          before.get("created_date_after") &&
        url.searchParams.get("created_date_before") ===
          before.get("created_date_before"),
    );
    await expect(dateNotice(page)).toHaveCount(0);

    // Removing the patient is not Undo: the default dates resume.
    await searchBox(page).pressSequentially("9876543210", { delay: 150 });
    await searchBox(page).press("Enter");
    await page.getByRole("option", { name: fullPatient.name }).click();
    await expect(dateNotice(page)).toBeVisible();
    await chip(page)
      .filter({ hasText: fullPatient.name })
      .getByRole("button", { name: "Remove patient" })
      .click();
    await expect(page).toHaveURL(
      (url) =>
        !url.searchParams.has("patient_filter") &&
        url.searchParams.has("created_date_after"),
    );
    await expect(dateNotice(page)).toHaveCount(0);
  });

  test("verifies a partial record and filters by its full record's id", async ({
    page,
  }) => {
    const retrievals: Record<string, string>[] = [];
    page.on("request", (request) => {
      if (
        new URL(request.url()).pathname === "/api/v1/patient/search_retrieve/"
      )
        retrievals.push(request.postDataJSON());
    });
    await page.goto(listUrl());
    await searchBox(page).pressSequentially("9876500000", { delay: 150 });
    await searchBox(page).press("Enter");
    await page.getByRole("option", { name: /meera s/i }).click();

    const year = page.getByRole("textbox", { name: /year of birth/i });
    await year.fill("1985");
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByRole("alert")).toHaveText(
      /year of birth doesn't match/i,
    );
    await expect(page).toHaveURL(
      (url) => !url.searchParams.has("patient_filter"),
    );

    await year.fill("1990");
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get("patient_filter") === verifiedPatient.id &&
        url.searchParams.get("patient_name") === verifiedPatient.name,
    );
    expect(page.url()).not.toContain(partialPatient.id);
    expect(retrievals.at(-1)).toMatchObject({
      partial_id: partialPatient.partial_id,
      year_of_birth: "1990",
    });
  });

  test("keeps a bookmarked patient_filter without patient_name", async ({
    page,
  }) => {
    const requests = trackEncounterRequests(page);
    await page.goto(
      listUrl(`?patient_filter=${fullPatient.id}&status=planned`),
    );
    await expect(chip(page)).toHaveText(/^patient$/i);
    await expect
      .poll(() =>
        requests.list.some(
          (params) =>
            params.get("patient_filter") === fullPatient.id &&
            !params.has("created_date_after"),
        ),
      )
      .toBe(true);
    // The empty state offers one way out per filter, without extra queries.
    const empty = page.getByText(
      "No visits match this date range and these filters",
    );
    await expect(empty).toBeVisible();
    for (const name of ["Remove Status filter", "Remove patient"])
      await expect(
        page.locator('[data-slot="card"]').getByRole("button", { name }),
      ).toBeVisible();
  });

  test("a scanner's Enter applies the patient; a typed Enter filters visits", async ({
    page,
  }) => {
    const scanned = faker.string.uuid();
    await page.goto(listUrl());
    await searchBox(page).click();
    // A handheld scanner types the whole code at once, then Enter.
    await page.keyboard.type(scanned);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get("patient_filter") === scanned &&
        !url.searchParams.has("name") &&
        !url.searchParams.has("external_identifier"),
    );
    await expect(chip(page)).toContainText("Scanned patient");
    await expect(chip(page)).toContainText(
      "Identity not verified by this scan",
    );

    await chip(page).getByRole("button", { name: "Remove patient" }).click();
    await searchBox(page).pressSequentially(scanned, { delay: 150 });
    await searchBox(page).press("Enter");
    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get("name") === scanned &&
        !url.searchParams.has("patient_filter"),
    );
  });

  test("reaches the field selector from the keyboard and reads prefixes", async ({
    page,
  }) => {
    await page.goto(listUrl());
    const field = page.getByRole("combobox", { name: /^search field$/i });
    await searchBox(page).focus();
    await page.keyboard.press("Shift+Tab");
    await expect(field).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", { name: "Visit ID" })).toBeVisible();
    await page.keyboard.press("v");
    await page.keyboard.press("Enter");
    await expect(field).toHaveText(/visit id/i);
    await expect(searchBox(page)).toBeFocused();
    await expect(searchBox(page)).toHaveAccessibleDescription(
      /searching visit id/i,
    );

    // Backspace in an empty input returns to Auto; prefixes pick a field.
    await page.keyboard.press("Backspace");
    await expect(field).toHaveText(/auto/i);
    await searchBox(page).pressSequentially("phone:", { delay: 50 });
    await expect(field).toHaveText(/phone number/i);
    // The phone field shows its country, preselected as in PhoneInput.
    await expect(
      page.getByRole("button", { name: "Phone country: India (+91)" }),
    ).toBeVisible();
    await expect(searchBox(page)).toHaveValue("");
    await searchBox(page).pressSequentially("12345", { delay: 50 });
    // With a field chosen, only its row shows.
    await expect(page.getByRole("option")).toHaveCount(1);
  });
});
