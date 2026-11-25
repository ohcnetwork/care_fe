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
  const fields = page.getByRole("dialog", { name: /^add filter$/i });
  await expect(fields.getByRole("combobox")).toBeFocused();
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
  // Enter expands the group in place; focus stays in the search.
  await page.keyboard.press("Enter");
  const childRow = page.getByRole("menuitemcheckbox", { name: child.display });
  await expect(childRow).toBeVisible();
  await expect(groupRow).toHaveAttribute("aria-expanded", "true");
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
  await expect(childRow).toBeVisible();
  // Enter picks the first match.
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
    // Picking a radio applies it and closes the picker.
    await expect(first).toBeHidden();
    const active = page.getByRole("button", { name: /^filters\b/i });
    const row = page.getByRole("group", { name: picker.label, exact: true });
    const edit = row.getByRole("button", {
      name: new RegExp(picker.label, "i"),
    });
    await active.click();
    await edit.click();
    const next = page.getByRole("menuitemradio", {
      name: picker.names[1],
      exact: true,
    });
    await next.click();
    await expect(page).toHaveURL(
      (url) => url.searchParams.get(picker.param) === picker.values[1],
    );
    await expect(next).toBeHidden();
    // Reopened, only the new choice is checked.
    await active.click();
    await edit.click();
    await expect(next).toBeChecked();
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
  // Only the child is applied, and picking it closes the picker.
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("organization") === ward.id,
  );
  await expect(child).toBeHidden();
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
  // Picking a radio applies it and closes the picker.
  await expect(urgent).toBeHidden();
  await page.reload();
  const active = page.getByRole("button", { name: /^filters\b/i });
  await active.click();
  await page.getByRole("button", { name: /priority.*urgent/i }).click();
  await expect(urgent).toBeChecked();
  await expect(
    urgent.locator('[data-slot="radio-group-item"]'),
  ).toHaveAttribute("data-checked", "");
  // Picking the current choice again keeps it, and closes.
  await urgent.click();
  await expect(urgent).toBeHidden();
  await expect(page).toHaveURL(isUrgent);
  await active.click();
  await page.getByRole("button", { name: /priority.*urgent/i }).click();
  const selected = page.getByRole("group", { name: /^selected$/i });
  await expect(selected.getByRole("menuitemradio")).toHaveText("Urgent");
  const routine = page.getByRole("menuitemradio", {
    name: "Routine",
    exact: true,
  });
  await Promise.all([waitForPriority("routine"), routine.click()]);
  await expect(routine).toBeHidden();
  await active.click();
  await page.getByRole("button", { name: /priority.*routine/i }).click();
  await expect(selected.getByRole("menuitemradio")).toHaveText("Routine");
  await expect(urgent).not.toBeChecked();
  // Clear removes the choice but keeps the picker open for another.
  const clear = page.getByRole("button", { name: "Clear", exact: true });
  await Promise.all([waitForPriority(null), clear.click()]);
  await expect(page).toHaveURL(
    ({ searchParams }) =>
      searchParams.get("encounter_class") === "amb" &&
      !searchParams.has("priority"),
  );
  await expect(routine).toBeVisible();
  await expect(routine).not.toBeChecked();
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
  // Enter picks the radio, which closes the picker and returns focus.
  await expect(
    page.getByRole("searchbox", { name: /search priority/i }),
  ).toBeHidden();
  await expect(add).toBeFocused();
});

test("edits and adds filters inside one open popover", async ({ page }) => {
  await page.goto(`/facility/${facility.id}/encounters/patients/all`);
  const add = page.getByRole("button", { name: /^add filter$/i });
  const active = page.getByRole("button", { name: /^filters\b/i });
  const fields = page.getByRole("dialog", { name: /^add filter$/i });
  const picker = page.getByRole("dialog", { name: "Status" });
  const summary = page.getByRole("dialog", { name: /^active filters$/i });
  // A marker set on the element survives only if it is never remounted.
  const mark = (dialog: Locator, value: string) =>
    dialog.evaluate((el, v) => {
      (el as HTMLElement).dataset.probe = v;
    }, value);

  await add.click();
  await mark(fields, "add");
  await page.getByRole("option", { name: /^status$/i }).click();
  await expect(picker).toHaveAttribute("data-probe", "add");
  await picker
    .getByRole("menuitemcheckbox", { name: "Planned", exact: true })
    .click();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("status") === "planned",
  );
  // Add filter over its picker returns to the field list, in place.
  await add.click();
  await expect(fields).toHaveAttribute("data-probe", "add");
  await expect(page.getByRole("option", { name: /^priority$/i })).toBeVisible();
  await expect(active).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(fields).toHaveCount(0);
  await expect(active).toHaveAccessibleName(/^filters\s*1$/i);

  await active.click();
  await mark(summary, "summary");
  const editStatus = summary.getByRole("button", { name: /status.*planned/i });
  await editStatus.click();
  await expect(picker).toHaveAttribute("data-probe", "summary");
  await expect(picker.getByRole("searchbox")).toBeFocused();
  await picker.getByRole("button", { name: "Back" }).click();
  await expect(summary).toHaveAttribute("data-probe", "summary");
  await editStatus.click();
  await picker.getByRole("button", { name: "Done" }).click();
  await expect(picker).toHaveCount(0);
  await expect(active).toBeFocused();
});

test("keeps the picker in place while the first filter is applied", async ({
  page,
}) => {
  await page.goto(`/facility/${facility.id}/encounters/patients/all`);
  const add = page.getByRole("button", { name: /^add filter$/i });
  const active = page.getByRole("button", { name: /^filters\b/i });
  await openMultiFilter(page, /^status$/i);
  const picker = page.getByRole("dialog", { name: "Status" });
  // Measure after the zoom-in animation, which scales the box.
  await picker.evaluate((el) =>
    Promise.all(el.getAnimations().map((animation) => animation.finished)),
  );
  const pickerBefore = (await picker.boundingBox())!;
  const addBefore = (await add.boundingBox())!;
  await picker
    .getByRole("menuitemcheckbox", { name: "Planned", exact: true })
    .click();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("status") === "planned",
  );
  // The toolbar waits for the picker to close before it shows Filters, so
  // neither Add filter nor the picker anchored to it moves.
  await expect(active).toHaveCount(0);
  const addAfter = (await add.boundingBox())!;
  expect(addAfter.x).toBeCloseTo(addBefore.x, 0);
  expect(addAfter.width).toBeCloseTo(addBefore.width, 0);
  const pickerAfter = (await picker.boundingBox())!;
  expect(pickerAfter.x).toBeCloseTo(pickerBefore.x, 0);
  expect(pickerAfter.y).toBeCloseTo(pickerBefore.y, 0);
  await picker.getByRole("button", { name: "Done" }).click();
  await expect(picker).toHaveCount(0);
  await expect(active).toHaveAccessibleName(/^filters\s*1$/i);
  await expect(add).toBeFocused();
  expect((await add.boundingBox())!.width).toBeLessThan(addBefore.width);
});

for (const origin of ["Add filter", "Active filters"] as const) {
  test(`a picker opened from ${origin} fades out without showing ${origin}`, async ({
    page,
  }) => {
    await page.goto(`/facility/${facility.id}/encounters/patients/all`);
    const popup = page.locator('[data-slot="popover-content"]');
    const picker = page.getByRole("dialog", { name: "Priority" });
    await openMultiFilter(page, /^priority$/i);
    let choice = "Urgent";
    if (origin === "Active filters") {
      await picker.getByRole("menuitemradio", { name: "Urgent" }).click();
      await expect(popup).toHaveCount(0);
      await page.getByRole("button", { name: /^filters\b/i }).click();
      await page.getByRole("button", { name: /priority.*urgent/i }).click();
      choice = "Routine";
    }
    await expect(picker).toBeVisible();
    // Record each view the popover shows, by its name, until it has gone.
    await page.evaluate(() => {
      const views = new Set<string>();
      const record = () => {
        const content = document.querySelector('[data-slot="popover-content"]');
        if (content)
          views.add(content.getAttribute("aria-label") ?? "Active filters");
      };
      record();
      new MutationObserver(record).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
      });
      (window as unknown as { popoverViews: Set<string> }).popoverViews = views;
    });
    await picker.getByRole("menuitemradio", { name: choice }).click();
    await expect(popup).toHaveCount(0);
    const views = await page.evaluate(() => [
      ...(window as unknown as { popoverViews: Set<string> }).popoverViews,
    ]);
    expect(views).toEqual(["Priority"]);
  });
}

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
  const priorityPicker = page.getByRole("dialog", { name: "Priority" });
  // Close shuts the picker without picking.
  await priorityPicker.getByRole("button", { name: "Close" }).click();
  await expect(priorityPicker).toHaveCount(0);
  await expect(add).toBeFocused();
  await expect(page).toHaveURL((url) => !url.searchParams.has("priority"));
  // Picking a radio closes it too.
  await openMultiFilter(page, /^priority$/i);
  await priorityPicker
    .getByRole("menuitemradio", { name: "Urgent", exact: true })
    .click();
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
  await priorityPicker.getByRole("button", { name: "Close" }).click();
  await expect(active).toBeFocused();
});

test("picker footer counts multi-select values; radio pickers close on pick", async ({
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
  // A radio picker has no count and no Done: picking closes it.
  await expect(
    radioFooter.getByText("Pick one", { exact: true }),
  ).toBeVisible();
  await expect(radioFooter.getByRole("status")).toHaveCount(0);
  await expect(radioFooter.getByRole("button", { name: "Done" })).toHaveCount(
    0,
  );
  await priorityPicker.getByRole("menuitemradio", { name: "Urgent" }).click();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("priority") === "urgent",
  );
  await expect(priorityPicker).toHaveCount(0);
  await expect(add).toBeFocused();
});

for (const layout of ["desktop", "mobile"] as const) {
  test(`tabs from patient search through both identifier actions on ${layout}`, async ({
    page,
  }) => {
    if (layout === "mobile")
      await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/facility/${facility.id}/encounters/patients/all`);
    const search = page.getByPlaceholder(/search by patient name/i);
    const group = page.getByRole("group", { name: /^filter by identifier$/i });
    const scan = group.getByRole("button", { name: /scan/i });
    const identifier = group.getByRole("combobox");
    await search.fill("Taylor");
    const suggestions = page.getByRole("listbox").filter({ hasText: "Taylor" });
    await expect(suggestions).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(scan).toBeFocused();
    await expect(suggestions).toHaveCount(0);
    await page.keyboard.press("Tab");
    await expect(identifier).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: /^add filter$/i }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(identifier).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(scan).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(search).toBeFocused();
    await expect(search).toHaveValue("Taylor");
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
      summary.locator('[data-slot="filter-summary-heading"]'),
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
    // Groups expand in place on every layout.
    await page.getByRole("menuitem", { name: /Follow-up/ }).click();
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
  // Picking a preset closes it; there is no Done.
  await expect(datePicker.getByRole("button", { name: "Done" })).toHaveCount(0);
  await datePicker.getByRole("menuitem", { name: /^yesterday$/i }).click();
  await expect(drawers).toHaveCount(0);
  await expect(date).toHaveText(/yesterday/i);
});

test("the Date menu closes on a preset or an applied custom range", async ({
  page,
}) => {
  await page.goto(`/facility/${facility.id}/encounters/patients/all`);
  const date = page.getByRole("button", { name: /^date/i });
  const menu = page.locator('[data-slot="dropdown-menu-content"]');
  const yesterday = page.getByRole("menuitem", { name: /^yesterday$/i });

  await date.click();
  await yesterday.click();
  await expect(menu).toHaveCount(0);
  await expect(date).toHaveText(/yesterday/i);
  await expect(date).toBeFocused();

  // The current preset again closes without a change.
  const before = page.url();
  await date.click();
  await yesterday.click();
  await expect(menu).toHaveCount(0);
  expect(page.url()).toBe(before);

  // Opening the custom range is not a pick: the calendar stays open, and
  // Apply closes it without switching back to the presets on the way out.
  await date.click();
  await page.getByRole("menuitem", { name: /custom date range/i }).click();
  const inputs = page.locator('[data-slot="date-range-picker"] input');
  await expect(inputs.first()).toBeVisible();
  await inputs.first().fill("01/01/2026");
  await inputs.nth(1).fill("10/01/2026");
  await page.getByRole("button", { name: /^apply$/i }).click();
  await expect(yesterday).toHaveCount(0);
  await expect(menu).toHaveCount(0);
  await expect(page).toHaveURL(
    ({ searchParams }) =>
      searchParams.get("created_date_after") === "2026-01-01" &&
      searchParams.get("created_date_before") === "2026-01-10",
  );
});
