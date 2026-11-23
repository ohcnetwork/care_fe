import { faker } from "@faker-js/faker";
import { expect, test, type Locator } from "@playwright/test";

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
        json: { ...facility, permissions: [], features: [] },
      });
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
  await page.getByRole("button", { name: /active filters/i }).click();
  await page.getByRole("button", { name: /tags.*walk-in/i }).click();
  await expect(row).toBeChecked();
  await expect(checkbox.locator("svg")).toHaveCSS("width", "16px");
  await row.getByText(tag.display).click();
  await expect(page).toHaveURL((url) => !url.searchParams.get("tags"));
  await expect(
    page.getByRole("button", { name: /active filters/i }),
  ).toHaveCount(0);
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
  await page.keyboard.press("Escape");
  await expect(search).toBeHidden();
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
  await expect(
    page.getByRole("button", { name: /active filters/i }),
  ).toHaveCount(0);
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
    const active = page.getByRole("button", { name: /active filters/i });
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
  await page.getByRole("button", { name: /active filters/i }).click();
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

  const active = page.getByRole("button", { name: /active filters/i });
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

  const completed = statusPicker.getByRole("menuitemcheckbox", {
    name: /^completed$/i,
  });
  await completed.click();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("status") === "completed",
  );
  await expect(count).toHaveText("1 selected");
  const search = statusPicker.getByRole("searchbox");
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
  test(`keeps the toolbar on one line and preserves Date on ${layout}`, async ({
    page,
  }) => {
    if (layout === "mobile")
      await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/facility/${facility.id}/encounters/patients/all`);
    const add = page.getByRole("button", { name: /^add filter$/i });
    const active = page.getByRole("button", { name: /active filters/i });
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

    await add.click();
    await expect(page.getByRole("option", { name: /^date$/i })).toHaveCount(0);
    await page.getByRole("option", { name: /^status$/i }).click();
    for (const name of ["Planned", "Completed"]) {
      await page.getByRole("menuitemcheckbox", { name, exact: true }).click();
    }
    // The value picker replaced the field menu, so one Escape closes it.
    await page.keyboard.press("Escape");
    await expect(add).toBeFocused();
    await expect(active).toHaveAccessibleName(/active filters\s*1/i);
    const segment = page.locator('[data-slot="filter-summary"]');
    await expect(
      segment.getByRole("button", { name: /^clear all filters$/i }),
    ).toBeVisible();
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
    await expect(
      summary.locator('[data-slot="popover-title"]').locator(".."),
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
    await expect(active).toHaveAccessibleName(/active filters\s*2/i);

    const dateBox = (await date.boundingBox())!;
    const addBox = (await add.boundingBox())!;
    expect(dateBox.y).toBeCloseTo(initialDateBox.y, 0);
    expect(dateBox.y).toBeCloseTo(addBox.y, 0);
    expect(dateBox.x).toBeGreaterThanOrEqual(addBox.x + addBox.width);
    expect(dateBox.x + dateBox.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    await clear.click();
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
    const active = page.getByRole("button", { name: /active filters/i });
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
