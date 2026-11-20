import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

const patient = {
  id: "patient-1",
  name: "Portal Patient",
  gender: "male",
  date_of_birth: "1990-01-01",
  phone_number: "+919999999999",
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "care_patient_token",
      JSON.stringify({
        token: "test-token",
        phoneNumber: "+919999999999",
        createdAt: new Date().toISOString(),
      }),
    );
  });
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/otp/patient/") {
      await route.fulfill({ json: { count: 1, results: [patient] } });
      return;
    }
    await route.fulfill({ json: { count: 0, results: [] } });
  });
});

test("patient list failure does not offer a new profile", async ({ page }) => {
  await page.route("**/api/v1/otp/patient/", (route) =>
    route.fulfill({ status: 500, json: { detail: "error" } }),
  );
  await page.goto("/patient/home");
  await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
  await expect(page).toHaveURL(/\/patient\/home/);
});

test("a failed prescription is not shown as an endless loading state", async ({
  page,
}) => {
  await page.route("**/api/v1/otp/medication_prescription/missing/", (route) =>
    route.fulfill({ status: 404, json: { detail: "not found" } }),
  );
  await page.goto("/patient/records/prescriptions/missing");
  await expect(page.getByRole("alert")).toBeVisible();
});

test("a failed records request is not presented as an empty list", async ({ page }) => {
  await page.route("**/api/v1/otp/medication_prescription/**", (route) =>
    route.fulfill({ status: 500, json: { detail: "error" } }),
  );
  await page.goto("/patient/records");
  await expect(page.getByRole("alert")).toBeVisible();
});

test("void observations are excluded from report details", async ({ page }) => {
  await page.route("**/api/v1/otp/diagnostic_report/report-1/", (route) =>
    route.fulfill({
      json: {
        id: "report-1",
        created_date: "2026-01-01T10:00:00Z",
        created_by: { first_name: "Test", last_name: "Doctor" },
        observations: [
          { id: "void", status: "entered_in_error", value: { value: "999" }, observation_definition: { title: "Void result" } },
          { id: "valid", status: "final", value: { value: "10" }, observation_definition: { title: "Valid result" } },
        ],
      },
    }),
  );
  await page.goto("/patient/records/reports/report-1");
  await expect(page.getByText("Valid result")).toBeVisible();
  await expect(page.getByText("Void result")).toHaveCount(0);
});

test("facility booking loads subsequent pages", async ({ page }) => {
  await page.route("**/api/v1/getallfacilities/**", (route) => {
    const offset = Number(new URL(route.request().url()).searchParams.get("offset") ?? 0);
    return route.fulfill({
      json: {
        count: 2,
        results: [{ id: `facility-${offset}`, name: offset ? "Second facility" : "First facility" }],
      },
    });
  });
  await page.goto("/nearby_facilities");
  await expect(page.getByText("First facility")).toBeVisible();
  await expect(page.getByText("Second facility")).toBeVisible();
});

test("practitioner booking loads subsequent pages", async ({ page }) => {
  await page.route("**/api/v1/facility/facility-1/schedulable_users/**", (route) => {
    const offset = Number(new URL(route.request().url()).searchParams.get("offset") ?? 0);
    return route.fulfill({
      json: {
        count: 2,
        results: [{
          id: `doctor-${offset}`,
          first_name: offset ? "Second" : "First",
          last_name: "Doctor",
        }],
      },
    });
  });
  await page.goto("/patient/book/facility-1");
  await expect(page.getByText("First Doctor")).toBeVisible();
  await expect(page.getByText("Second Doctor")).toBeVisible();
});

test("patient sign-out clears the selected profile and session", async ({ page }) => {
  await page.goto("/patient/profile");
  await page.evaluate(() => localStorage.setItem("care_selected_patient", "patient-1"));
  await page.getByRole("button", { name: /sign out/i }).first().click();
  await expect.poll(() =>
    page.evaluate(() => [
      localStorage.getItem("care_patient_token"),
      localStorage.getItem("care_selected_patient"),
    ]),
  ).toEqual([null, null]);
});

test("a reschedule with an unavailable appointment cannot create a new booking", async ({
  page,
}) => {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  let created = 0;
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/otp/patient/") {
      return route.fulfill({ json: { count: 1, results: [patient] } });
    }
    if (path.endsWith("/get_slots_for_day/")) {
      return route.fulfill({
        json: {
          results: [{
            id: "slot-1",
            start_datetime: start.toISOString(),
            end_datetime: end.toISOString(),
            allocated: 0,
            availability: { name: "Morning", tokens_per_slot: 10 },
          }],
        },
      });
    }
    if (path.endsWith("/schedulable_users/doctor-1/")) {
      return route.fulfill({ json: { id: "doctor-1", first_name: "Doctor", last_name: "One" } });
    }
    if (path.endsWith("/create_appointment/")) created++;
    return route.fulfill({ json: { count: 0, results: [] } });
  });
  await page.goto("/facility/facility-1/appointments/doctor-1/reschedule/missing");
  await page.getByRole("button", { name: /continue/i }).waitFor();
  await page.getByRole("button", { name: start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("button", { name: /reschedule/i })).toBeDisabled();
  expect(created).toBe(0);
});
