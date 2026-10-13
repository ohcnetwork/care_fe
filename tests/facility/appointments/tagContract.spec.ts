import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import type {
  AppointmentCreateRequest,
  AppointmentRescheduleRequest,
} from "../../../src/types/scheduling/schedule";

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 1440, height: 1000 },
  timezoneId: "UTC",
});

async function mockAppointmentApi(page: Page) {
  const facilityId = faker.string.uuid();
  const patientId = faker.string.uuid();
  const appointmentId = faker.string.uuid();
  const user = {
    id: faker.string.uuid(),
    username: `appointment-user-${faker.string.alphanumeric(6)}`,
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    user_type: "administrator",
    is_superuser: true,
    permissions: [],
    facilities: [],
    organizations: [],
    preferences: {},
    flags: [],
  };
  const facility = {
    id: facilityId,
    name: faker.company.name(),
    permissions: [
      "can_list_booking",
      "can_write_booking",
      "can_reschedule_booking",
    ],
    root_org_permissions: [],
    features: [],
  };
  const patient = {
    id: patientId,
    name: faker.person.fullName(),
    gender: "female",
    phone_number: "+919999999999",
    year_of_birth: 1990,
    date_of_birth: "1990-01-01",
    created_date: "2035-01-01T08:00:00Z",
    modified_date: "2035-01-01T08:00:00Z",
    instance_tags: [],
    facility_tags: [],
    instance_identifiers: [],
    facility_identifiers: [],
    permissions: [],
  };
  const location = {
    id: faker.string.uuid(),
    name: `Consultation room ${faker.string.alphanumeric(6)}`,
    mode: "kind",
    form: "ro",
    status: "active",
    operational_status: "O",
    system_availability_status: "available",
    has_children: false,
    organizations: [],
    tags: [],
  };
  const tag = {
    id: faker.string.uuid(),
    display: `Booking tag ${faker.string.alphanumeric(6)}`,
    category: "clinical",
    description: faker.lorem.sentence(),
    priority: 100,
    status: "active",
    system_generated: false,
    has_children: false,
    resource: "token_booking",
    metadata: {},
    expiry_metadata: {
      autoset_expiry: true,
      modification_allowed: true,
      expiry_offset: { days: 7 },
    },
    level_cache: 0,
    cache_expiry: "2099-01-01T00:00:00Z",
  };
  const availability = {
    id: faker.string.uuid(),
    name: `Morning clinic ${faker.string.alphanumeric(6)}`,
    tokens_per_slot: 5,
    slot_type: "appointment",
    slot_size_in_minutes: 30,
    schedule: { id: faker.string.uuid(), name: faker.word.words(2) },
  };
  const nextSlot = {
    id: faker.string.uuid(),
    start_datetime: "2035-01-15T10:00:00Z",
    end_datetime: "2035-01-15T10:30:00Z",
    allocated: 0,
    availability,
  };
  const appointment = {
    id: appointmentId,
    token_slot: {
      ...nextSlot,
      id: faker.string.uuid(),
      start_datetime: "2035-01-15T09:00:00Z",
      end_datetime: "2035-01-15T09:30:00Z",
    },
    resource: location,
    resource_type: "location",
    booked_on: "2035-01-01T08:00:00Z",
    status: "booked",
    note: faker.lorem.sentence(),
    facility,
    token: null,
    booked_by: user,
    created_by: user,
    updated_by: user,
    modified_date: "2035-01-01T08:00:00Z",
    patient,
    tags: [tag],
  };
  const bookings: AppointmentCreateRequest[] = [];
  const reschedules: AppointmentRescheduleRequest[] = [];

  await page.clock.setFixedTime(new Date("2035-01-15T08:00:00Z"));
  await page.addInitScript(() => {
    localStorage.setItem("care_access_token", "appointment-tag-contract-test");
    localStorage.setItem("care_schedule_service_type", '"location"');
  });
  // Intercept reads and writes to keep the contract checks independent of backend data.
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const method = request.method();
      const empty = { count: 0, results: [] };

      if (path === "/api/v1/users/getcurrentuser/") {
        await route.fulfill({ json: user });
      } else if (path === "/api/v1/plug_config/") {
        await route.fulfill({ json: { configs: [] } });
      } else if (path === `/api/v1/facility/${facilityId}/`) {
        await route.fulfill({ json: facility });
      } else if (path === "/api/v1/patient/search_retrieve/") {
        await route.fulfill({ json: patient });
      } else if (path === `/api/v1/patient/${patientId}/`) {
        await route.fulfill({ json: patient });
      } else if (path === `/api/v1/facility/${facilityId}/location/`) {
        await route.fulfill({ json: { count: 1, results: [location] } });
      } else if (path === "/api/v1/tag_config/") {
        await route.fulfill({ json: { count: 1, results: [tag] } });
      } else if (path.endsWith("/get_slots_for_day/")) {
        await route.fulfill({ json: { results: [nextSlot] } });
      } else if (path.endsWith("/availability_stats/")) {
        await route.fulfill({
          json: { "2035-01-15": { total_slots: 5, booked_slots: 0 } },
        });
      } else if (path.endsWith("/create_appointment/") && method === "POST") {
        bookings.push(request.postDataJSON() as AppointmentCreateRequest);
        await route.fulfill({ json: appointment });
      } else if (path === "/api/v1/batch_requests/" && method === "POST") {
        const body = request.postDataJSON() as {
          requests: Array<{
            reference_id: string;
            body: AppointmentRescheduleRequest;
          }>;
        };
        const reschedule = body.requests.find(
          (item) => item.reference_id === "reschedule-appointment",
        );
        if (reschedule) reschedules.push(reschedule.body);
        await route.fulfill({
          json: {
            results: body.requests.map((item) => ({
              reference_id: item.reference_id,
              status_code: 200,
              data: { ...appointment, token_slot: nextSlot },
            })),
          },
        });
      } else if (
        path === `/api/v1/facility/${facilityId}/appointments/${appointmentId}/`
      ) {
        await route.fulfill({ json: appointment });
      } else if (method === "GET") {
        await route.fulfill({ json: empty });
      } else {
        await route.abort();
      }
    },
  );
  return {
    facilityId,
    patientId,
    appointmentId,
    tag,
    location,
    nextSlot,
    bookings,
    reschedules,
  };
}

test("booking sends selected tag objects without an expiry override", async ({
  page,
}) => {
  const { facilityId, patientId, tag, location, bookings } =
    await mockAppointmentApi(page);
  await page.goto(
    `/facility/${facilityId}/patients/home?year_of_birth=1990&partial_id=${patientId.slice(0, 5)}&action=schedule`,
  );
  const sheet = page.getByRole("dialog");

  await test.step("Choose a resource, a nonempty tag selection, and an available slot", async () => {
    await sheet.getByText("Select location...", { exact: true }).click();
    await page.getByRole("option", { name: location.name }).click();
    await sheet.getByRole("button", { name: /^Add Tags$/i }).click();
    await page
      .getByRole("menu")
      .getByText(tag.display, { exact: true })
      .click();
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).not.toBeVisible();
    await expect(
      sheet.getByRole("button", { name: /^Confirm appointment$/i }),
    ).toBeEnabled();
  });

  await test.step("Submit the booking with the configured expiry preserved", async () => {
    await sheet.getByRole("button", { name: /^Confirm appointment$/i }).click();
    await expect.poll(() => bookings.length).toBe(1);
    expect(bookings[0]).toMatchObject({
      patient: patientId,
      tags: [{ tag: tag.id }],
    });
    expect(bookings[0].tags[0]).not.toHaveProperty("expiry_offset");
    await expect(page).toHaveURL(/appointments\//);
  });
});

test("rescheduling carries existing tags as objects without an expiry override", async ({
  page,
}) => {
  const { facilityId, patientId, appointmentId, tag, nextSlot, reschedules } =
    await mockAppointmentApi(page);
  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`,
  );

  await test.step("Open rescheduling for an appointment with an assigned tag", async () => {
    await page
      .getByRole("button", { name: /^Check[- ]in/i })
      .locator("..")
      .getByRole("button")
      .last()
      .click();
    await page.getByRole("menuitem", { name: /^Reschedule$/i }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: /^Continue$/i })
      .click();
    await expect(
      page.getByRole("dialog").getByText(tag.display, { exact: true }).first(),
    ).toBeVisible();
  });

  await test.step("Send the replacement slot and tagged request objects", async () => {
    const submit = page
      .getByRole("dialog")
      .getByRole("button", { name: /^Reschedule$/i });
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect.poll(() => reschedules.length).toBe(1);
    expect(reschedules[0]).toMatchObject({
      new_slot: nextSlot.id,
      tags: [{ tag: tag.id }],
    });
    expect(reschedules[0].tags[0]).not.toHaveProperty("expiry_offset");
  });
});
