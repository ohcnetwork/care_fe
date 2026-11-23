import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

const facilityId = faker.string.uuid();
const clinician = {
  id: faker.string.uuid(),
  username: "schedule-clinician",
  first_name: "Test",
  last_name: "Clinician",
  is_superuser: true,
  permissions: [],
  facilities: [],
  organizations: [],
  flags: [],
  preferences: {},
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("care_access_token", "schedule-test"),
  );
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/plug_config/")
      return route.fulfill({ json: { configs: [] } });
    if (path.startsWith("/api/v1/users/"))
      return route.fulfill({ json: clinician });
    if (path === `/api/v1/facility/${facilityId}/`)
      return route.fulfill({
        json: {
          id: facilityId,
          name: "Test facility",
          permissions: [],
          features: [],
        },
      });
    return route.fulfill({ json: { count: 0, results: [] } });
  });
});

test("editing a template can restore an unavailable type or explicitly clear it", async ({
  page,
}) => {
  let schedule = {
    id: faker.string.uuid(),
    name: "Clinic schedule",
    valid_from: "2026-01-01",
    valid_to: "2030-12-31",
    is_public: false,
    availabilities: [],
    encounter_type: "retired",
  };
  const path = `/api/v1/facility/${facilityId}/schedule/`;
  await page.route(
    (url) => url.pathname === path,
    (route) => route.fulfill({ json: { count: 1, results: [schedule] } }),
  );
  await page.route(`**${path}${schedule.id}/`, (route) => {
    if (route.request().method() === "PUT") {
      schedule = { ...schedule, ...route.request().postDataJSON() };
    }
    return route.fulfill({ json: schedule });
  });
  await page.goto(`/facility/${facilityId}/users/${clinician.username}`);
  await page.getByRole("tab", { name: "Availability" }).click();
  await page.getByRole("button", { name: "Edit Schedule Template" }).click();
  const sheet = page.getByRole("dialog");
  const type = sheet.getByRole("combobox", { name: /type of encounter/i });
  await expect(type).toHaveText(/retired.*unavailable/i);
  await type.click();
  await page.getByRole("option", { name: "Ambulatory", exact: true }).click();
  await type.click();
  await page.getByRole("option", { name: /retired.*unavailable/i }).click();
  const save = sheet.getByRole("button", { name: "Save", exact: true });
  await expect(save).toBeDisabled();

  const nextUpdate = () =>
    page.waitForRequest(
      (request) =>
        request.method() === "PUT" &&
        new URL(request.url()).pathname === `${path}${schedule.id}/`,
    );
  await sheet.getByRole("textbox", { name: /template name/i }).fill("Renamed");
  const [rename] = await Promise.all([nextUpdate(), save.click()]);
  expect(rename.postDataJSON()).not.toHaveProperty("encounter_type");

  await type.click();
  await page.getByRole("option", { name: /not specified/i }).click();
  const [clear] = await Promise.all([nextUpdate(), save.click()]);
  expect(clear.postDataJSON()).toHaveProperty("encounter_type", null);
});

test("a planned encounter starts with the appointment's type and resets an unsaved override", async ({
  page,
}) => {
  const patient = {
    id: faker.string.uuid(),
    name: "Test Patient",
    gender: "female",
    identifiers: [],
  };
  const id = faker.string.uuid();
  const now = new Date().toISOString();
  await page.route(
    `**/api/v1/facility/${facilityId}/appointments/${id}/`,
    (route) =>
      route.fulfill({
        json: {
          id,
          patient,
          status: "booked",
          tags: [],
          note: "",
          resource_type: "practitioner",
          resource: clinician,
          created_by: clinician,
          booked_on: now,
          modified_date: now,
          token_slot: {
            start_datetime: now,
            end_datetime: now,
            availability: { name: "Clinic", schedule: { encounter_type: "vr" } },
          },
        },
      }),
  );
  await page.goto(
    `/facility/${facilityId}/patient/${patient.id}/appointments/${id}`,
  );
  const planned = page.getByRole("button", {
    name: /create planned encounter/i,
  });
  await planned.click();
  const sheet = page.getByRole("dialog");
  const virtual = sheet.getByRole("button", { name: /^Virtual\b/ });
  await expect(virtual).toHaveAttribute("aria-pressed", "true");
  await sheet.getByRole("button", { name: /^Ambulatory\b/ }).click();
  await expect(virtual).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Escape");
  await planned.click();
  await expect(virtual).toHaveAttribute("aria-pressed", "true");
});
