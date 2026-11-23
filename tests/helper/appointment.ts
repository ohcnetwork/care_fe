import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { addDays, addMonths, format, setDate } from "date-fns";

import { createTestPatient } from "tests/helper/patient";
import { expectToast } from "tests/helper/ui";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";

// Steps and seeders for scheduling: schedules, appointments and the
// public (patient) booking pages.

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// API seeders
// ---------------------------------------------------------------------------

/** One appointment session, repeated on every day of the week. */
export interface ScheduleSessionInput {
  name: string;
  slotSizeInMinutes: number;
  tokensPerSlot: number;
  /** "HH:mm:ss" */
  startTime: string;
  /** "HH:mm:ss" */
  endTime: string;
  reason?: string;
}

export interface CreateScheduleInput {
  request: APIRequestContext;
  facilityId: string;
  resourceType: "practitioner" | "healthcare_service" | "location";
  resourceId: string;
  name: string;
  /** ISO date-time; the backend rejects a start in the past. */
  validFrom: string;
  validTo: string;
  session: ScheduleSessionInput;
}

/** Creates a private schedule with one appointment session on every weekday through the API. */
export async function createScheduleViaApi({
  request,
  facilityId,
  resourceType,
  resourceId,
  name,
  validFrom,
  validTo,
  session,
}: CreateScheduleInput): Promise<{ scheduleId: string }> {
  const response = await request.post(
    `${getApiUrl()}/api/v1/facility/${facilityId}/schedule/`,
    {
      headers: getApiHeaders(),
      data: {
        name,
        resource_type: resourceType,
        resource_id: resourceId,
        is_public: false,
        valid_from: validFrom,
        valid_to: validTo,
        availabilities: [
          {
            name: session.name,
            slot_type: "appointment",
            slot_size_in_minutes: session.slotSizeInMinutes,
            tokens_per_slot: session.tokensPerSlot,
            ...(session.reason !== undefined && { reason: session.reason }),
            availability: Array.from({ length: 7 }, (_, day_of_week) => ({
              day_of_week,
              start_time: session.startTime,
              end_time: session.endTime,
            })),
          },
        ],
      },
    },
  );
  expect(response.ok(), (await response.text()).slice(0, 2000)).toBe(true);
  return { scheduleId: ((await response.json()) as { id: string }).id };
}

export interface CreateAppointmentInput {
  request: APIRequestContext;
  facilityId: string;
  /** Books for this patient; a new API patient is created when omitted. */
  patientId?: string;
  /** Name prefix of the patient created when `patientId` is omitted. */
  patientName?: string;
  /** Practitioner to book with; the signed-in admin when omitted. */
  practitionerId?: string;
  scheduleName?: string;
  sessionName?: string;
  reason?: string;
  /** Session window ("HH:mm:ss") of the one-day schedule. */
  startTime?: string;
  endTime?: string;
  /** Days from today of the booked day. */
  daysAhead?: number;
  note?: string;
}

export interface CreatedAppointment {
  appointmentId: string;
  patientId: string;
  practitionerId: string;
  scheduleId: string;
  slotId: string;
  /** The appointment's detail page. */
  path: string;
}

/** Books a practitioner appointment through the API (one-day schedule → get_slots_for_day → create_appointment). */
export async function createAppointmentViaApi({
  request,
  facilityId,
  patientId,
  patientName = "Appointment",
  practitionerId,
  scheduleName = `Appointment ${faker.string.alphanumeric(8)}`,
  sessionName = "Appointment session",
  reason = "E2E appointment",
  startTime = "01:00:00",
  endTime = "01:30:00",
  daysAhead = 2,
  note = "",
}: CreateAppointmentInput): Promise<CreatedAppointment> {
  const headers = getApiHeaders();
  const api = getApiUrl();
  let resourceId = practitionerId;
  if (!resourceId) {
    const currentUser = await request.get(
      `${api}/api/v1/users/getcurrentuser/`,
      { headers },
    );
    expect(currentUser.ok()).toBe(true);
    resourceId = ((await currentUser.json()) as { id: string }).id;
  }
  const day = format(addDays(new Date(), daysAhead), "yyyy-MM-dd");
  const { scheduleId } = await createScheduleViaApi({
    request,
    facilityId,
    resourceType: "practitioner",
    resourceId,
    name: scheduleName,
    validFrom: `${day}T00:00:00`,
    validTo: `${day}T23:59:59`,
    session: {
      name: sessionName,
      slotSizeInMinutes: 15,
      tokensPerSlot: 10,
      reason,
      startTime,
      endTime,
    },
  });
  const slotsResponse = await request.post(
    `${api}/api/v1/facility/${facilityId}/slots/get_slots_for_day/`,
    {
      headers,
      data: { resource_type: "practitioner", resource_id: resourceId, day },
    },
  );
  expect(slotsResponse.ok(), await slotsResponse.text()).toBe(true);
  const slots = (await slotsResponse.json()) as {
    results: { id: string; availability: { schedule: { id: string } } }[];
  };
  const slot = slots.results.find(
    (item) => item.availability.schedule.id === scheduleId,
  );
  expect(slot).toBeDefined();
  const bookedPatientId = patientId ?? (await createTestPatient(patientName));
  const created = await request.post(
    `${api}/api/v1/facility/${facilityId}/slots/${slot!.id}/create_appointment/`,
    { headers, data: { patient: bookedPatientId, note, tags: [] } },
  );
  expect(created.ok(), await created.text()).toBe(true);
  const appointment = (await created.json()) as { id: string };
  return {
    appointmentId: appointment.id,
    patientId: bookedPatientId,
    practitionerId: resourceId,
    scheduleId,
    slotId: slot!.id,
    path: `/facility/${facilityId}/patient/${bookedPatientId}/appointments/${appointment.id}`,
  };
}

export interface CreateBookableServiceInput {
  request: APIRequestContext;
  facilityId: string;
  serviceName?: string;
  scheduleName?: string;
  sessionName?: string;
  extraDetails?: string;
  /** Length of the schedule from now, in days. */
  days?: number;
}

export interface BookableService {
  healthcareServiceId: string;
  serviceName: string;
  scheduleId: string;
  scheduleName: string;
  /** When the schedule starts (now); pick a booking day relative to it. */
  validFrom: Date;
}

/** Creates a scheduling healthcare service with hourly slots (3 per slot, 08:00–18:00 daily) for the next week through the API. */
export async function createBookableServiceViaApi({
  request,
  facilityId,
  serviceName = `Booking clinic ${faker.string.alphanumeric(8)}`,
  scheduleName = `Consultation ${faker.string.alphanumeric(8)}`,
  sessionName = `Clinic hours ${faker.string.alphanumeric(8)}`,
  extraDetails = "Appointment booking test",
  days = 7,
}: CreateBookableServiceInput): Promise<BookableService> {
  const response = await request.post(
    `${getApiUrl()}/api/v1/facility/${facilityId}/healthcare_service/`,
    {
      headers: getApiHeaders(),
      data: {
        name: serviceName,
        extra_details: extraDetails,
        internal_type: "scheduling",
        managing_organization: null,
        locations: [],
      },
    },
  );
  expect(response.ok(), (await response.text()).slice(0, 2000)).toBe(true);
  const service = (await response.json()) as { id: string };
  const start = new Date();
  const end = new Date(start.getTime() + days * 86400000);
  const { scheduleId } = await createScheduleViaApi({
    request,
    facilityId,
    resourceType: "healthcare_service",
    resourceId: service.id,
    name: scheduleName,
    validFrom: start.toISOString(),
    validTo: end.toISOString(),
    session: {
      name: sessionName,
      slotSizeInMinutes: 60,
      tokensPerSlot: 3,
      startTime: "08:00:00",
      endTime: "18:00:00",
    },
  });
  return {
    healthcareServiceId: service.id,
    serviceName,
    scheduleId,
    scheduleName,
    validFrom: start,
  };
}

/** Signs in a new patient through the OTP API and stores the patient token for the page (public booking pages). */
export async function signInPatientViaApi({
  page,
  request,
}: {
  page: Page;
  request: APIRequestContext;
}): Promise<{ phoneNumber: string }> {
  const api = getApiUrl();
  // Development backends accept this OTP (see `send_otp` in care).
  const phoneNumber = `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`;
  const sent = await request.post(`${api}/api/v1/otp/send/`, {
    data: { phone_number: phoneNumber },
  });
  expect(sent.ok(), await sent.text()).toBe(true);
  const login = await request.post(`${api}/api/v1/otp/login/`, {
    data: { phone_number: phoneNumber, otp: "45612" },
  });
  expect(login.ok(), await login.text()).toBe(true);
  const { access } = (await login.json()) as { access: string };

  await page.addInitScript(
    ({ token, phone }) => {
      localStorage.setItem(
        "care_patient_token",
        JSON.stringify({
          token,
          phoneNumber: phone,
          createdAt: new Date().toISOString(),
        }),
      );
    },
    { token: access, phone: phoneNumber },
  );
  return { phoneNumber };
}

// ---------------------------------------------------------------------------
// UI steps
// ---------------------------------------------------------------------------

export interface ScheduleTemplateInput {
  templateName: string;
  sessionTitle: string;
  /** "HH:mm" */
  startTime: string;
  endTime: string;
  patientsPerSlot: string;
  /** Weekday button names, e.g. "Monday". */
  weekdays: readonly string[];
  /** Valid period, as months from now (mid-month to mid-month). */
  validFromMonthOffset?: number;
  validToMonthOffset?: number;
}

/** Test data for a Mon–Fri, 10 AM – 3 PM template with one auto-filled slot of 300 patients. */
export function buildWeekdayScheduleTemplate(): ScheduleTemplateInput & {
  displayTime: string;
} {
  return {
    templateName: faker.lorem.words(2),
    sessionTitle: faker.lorem.words(2),
    startTime: "10:00",
    endTime: "15:00",
    patientsPerSlot: "300",
    weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    displayTime: "10 AM - 3 PM",
  };
}

/** Fills the open schedule template form: name, valid period, weekdays and one session with auto-filled slots. */
export async function fillScheduleTemplateForm(
  page: Page,
  {
    templateName,
    sessionTitle,
    startTime,
    endTime,
    patientsPerSlot,
    weekdays,
    validFromMonthOffset = 1,
    validToMonthOffset = 2,
  }: ScheduleTemplateInput,
): Promise<void> {
  await page
    .getByRole("textbox", { name: "Template Name *" })
    .fill(templateName);

  const midMonth = (offset: number) =>
    format(addMonths(setDate(new Date(), 15), offset), "dd/MM/yyyy");
  await page.getByRole("button", { name: /^Valid Period/ }).click();
  await page
    .getByRole("textbox", { name: "Start date", exact: true })
    .fill(midMonth(validFromMonthOffset));
  await page
    .getByRole("textbox", { name: "End date", exact: true })
    .fill(midMonth(validToMonthOffset));
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  const formItemDiv = page.locator('div[data-slot="form-item"]');
  for (const day of weekdays) {
    await formItemDiv.getByRole("button", { name: day }).click();
  }

  await page
    .getByRole("textbox", { name: "Session Title *" })
    .fill(sessionTitle);
  await page.getByRole("textbox", { name: "Start Time *" }).fill(startTime);
  await page.getByRole("textbox", { name: "End Time *" }).fill(endTime);
  await page.getByRole("switch", { name: "Auto-fill slot duration" }).click();
  await page
    .getByRole("spinbutton", { name: "Patients per Slot *" })
    .fill(patientsPerSlot);
}

/** Creates a schedule template from a user's Availability tab (opened first when `username` is given). */
export async function createScheduleTemplateViaUi(
  page: Page,
  input: ScheduleTemplateInput & { facilityId: string; username?: string },
): Promise<{ scheduleId: string }> {
  return test.step(
    "appointment.schedule.create",
    async () => {
      const { facilityId, username } = input;
      if (username) {
        await page.goto(`/facility/${facilityId}/users/${username}`);
        await page.getByRole("tab", { name: "Availability" }).click();
      }
      await page.getByRole("button", { name: "Create Template" }).click();
      await fillScheduleTemplateForm(page, input);
      const created = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname ===
            `/api/v1/facility/${facilityId}/schedule/`,
      );
      await page.getByRole("button", { name: "Save" }).click();
      const response = await created;
      expect(response.ok(), await response.text()).toBe(true);
      await expectToast(page, "Schedule template created successfully");
      return { scheduleId: ((await response.json()) as { id: string }).id };
    },
    { box: true },
  );
}

export interface BookAppointmentInput {
  facilityId: string;
  patientId: string;
  /** Resource kind, as the booking sheet labels it. */
  resourceType: "Practitioner" | "Healthcare Service";
  /** Name of the practitioner or healthcare service to book with. */
  resourceName: string;
  /** Day to book: today or a day in the next calendar month, with open slots. */
  date: Date;
  /** Reason for visit; saved as the appointment's note. */
  reason?: string;
}

/** Books the first open slot of a day from the patient's "Schedule Appointment" sheet. */
export async function bookAppointmentViaUi(
  page: Page,
  {
    facilityId,
    patientId,
    resourceType,
    resourceName,
    date,
    reason,
  }: BookAppointmentInput,
): Promise<{ appointmentId: string }> {
  return test.step(
    "appointment.book",
    async () => {
      const appointmentsPath = `/facility/${facilityId}/patient/${patientId}/appointments`;
      await page.goto(appointmentsPath);
      await page
        .getByRole("button", { name: "Schedule Appointment", exact: true })
        .click();
      const booking = page.getByRole("dialog", {
        name: "Book Appointment",
        exact: true,
      });
      if (reason !== undefined) {
        const reasonInput = booking.getByRole("textbox", {
          name: /reason for visit/i,
        });
        await expect(reasonInput).toBeEditable();
        await reasonInput.fill(reason);
      }
      await booking
        .getByRole("radio", { name: resourceType, exact: true })
        .click();

      const day = format(date, "yyyy-MM-dd");
      const today = new Date();
      const slotsLoaded = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname.endsWith(
            "/slots/get_slots_for_day/",
          ) &&
          response.request().method() === "POST" &&
          response.request().postDataJSON().day === day,
      );
      if (resourceType === "Healthcare Service") {
        await booking
          .getByRole("combobox", {
            name: "Select Healthcare Service",
            exact: true,
          })
          .click();
        await page
          .getByRole("option", { name: new RegExp(escapeRegExp(resourceName)) })
          .click();
      } else {
        await booking
          .getByRole("combobox", { name: "Select Practitioner", exact: true })
          .click();
        await page
          .getByPlaceholder("Search departments and practitioners")
          .fill(resourceName);
        await page
          .getByRole("option")
          .filter({ hasText: resourceName })
          .click();
      }
      // The sheet opens on today; another day is picked from its calendar.
      if (day !== format(today, "yyyy-MM-dd")) {
        if (format(date, "yyyy-MM") !== format(today, "yyyy-MM"))
          await booking
            .getByRole("button", { name: "Next Month", exact: true })
            .click();
        await booking
          .getByRole("button", {
            name: new RegExp(`^${date.getDate()}\\s+\\d+ left$`),
          })
          .click();
      }
      expect((await slotsLoaded).ok()).toBeTruthy();

      // The picker preselects the first open slot of the day.
      const confirm = booking.getByRole("button", {
        name: "Confirm Appointment",
        exact: true,
      });
      await expect(confirm).toBeEnabled();
      const created = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname.endsWith("/create_appointment/") &&
          response.request().method() === "POST",
      );
      await confirm.click();
      const response = await created;
      expect(response.ok(), await response.text()).toBeTruthy();
      const appointmentId = ((await response.json()) as { id: string }).id;
      await expect(page).toHaveURL(
        (url) => url.pathname === `${appointmentsPath}/${appointmentId}`,
      );
      return { appointmentId };
    },
    { box: true },
  );
}
