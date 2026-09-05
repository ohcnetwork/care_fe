import * as fs from "fs";
import * as path from "path";

import { addMonths, format, subDays } from "date-fns";

const API_URL = process.env.REACT_CARE_API_URL || "http://localhost:9000";
const AUTH_FILE = path.resolve("tests/.auth/user.json");

export interface AuthHeaders {
  Authorization: string;
  "Content-Type": string;
}

export interface CurrentUser {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
}

export interface CreatedAppointment {
  id: string;
  patient: string;
  facilityId: string;
  practitionerId: string;
  note: string;
  status: string;
}

function getAccessToken(): string {
  if (!fs.existsSync(AUTH_FILE)) {
    throw new Error("Auth file not found — run Playwright setup first");
  }

  const storageState = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
  const localStorage = storageState.origins?.[0]?.localStorage ?? [];
  const tokenEntry = localStorage.find(
    (item: { name: string; value: string }) =>
      item.name === "care_access_token",
  );

  if (!tokenEntry?.value) {
    throw new Error("No access token in auth storage state");
  }

  return tokenEntry.value;
}

export function getApiHeaders(): AuthHeaders {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
  };
}

async function apiFetch<T>(
  urlPath: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${urlPath}`, {
    ...init,
    headers: {
      ...getApiHeaders(),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API ${init.method ?? "GET"} ${urlPath} failed (${response.status}): ${errorText}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/v1/users/getcurrentuser/");
}

/**
 * Creates an all-week schedule for a practitioner so slots exist for today.
 * Returns the schedule template id.
 */
export async function ensurePractitionerSchedule(options: {
  facilityId: string;
  practitionerId: string;
  templateName?: string;
}): Promise<string> {
  const templateName = options.templateName ?? `E2E Schedule ${Date.now()}`;
  const validFrom = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const validTo = format(addMonths(new Date(), 2), "yyyy-MM-dd");

  const schedule = await apiFetch<{ id: string }>(
    `/api/v1/facility/${options.facilityId}/schedule/`,
    {
      method: "POST",
      body: JSON.stringify({
        name: templateName,
        valid_from: validFrom,
        valid_to: validTo,
        resource_type: "practitioner",
        resource_id: options.practitionerId,
        is_public: false,
        availabilities: [
          {
            name: "E2E Session",
            slot_type: "appointment",
            slot_size_in_minutes: 30,
            tokens_per_slot: 10,
            reason: "Playwright E2E coverage",
            availability: [0, 1, 2, 3, 4, 5, 6].map((day_of_week) => ({
              day_of_week,
              start_time: "00:00:00",
              end_time: "23:30:00",
            })),
          },
        ],
      }),
    },
  );

  return schedule.id;
}

export async function getAvailableSlotId(options: {
  facilityId: string;
  practitionerId: string;
  day?: string;
}): Promise<string> {
  const day = options.day ?? format(new Date(), "yyyy-MM-dd");
  const slots = await apiFetch<{
    results: Array<{ id: string; allocated: number }>;
  }>(`/api/v1/facility/${options.facilityId}/slots/get_slots_for_day/`, {
    method: "POST",
    body: JSON.stringify({
      resource_type: "practitioner",
      resource_id: options.practitionerId,
      day,
    }),
  });

  const slot = slots.results.find((s) => s.allocated < 10) ?? slots.results[0];
  if (!slot) {
    throw new Error(`No slots available for practitioner on ${day}`);
  }

  return slot.id;
}

export async function createAppointmentViaApi(options: {
  facilityId: string;
  patientId: string;
  practitionerId?: string;
  note?: string;
}): Promise<CreatedAppointment> {
  const practitioner = options.practitionerId ?? (await getCurrentUser()).id;
  await ensurePractitionerSchedule({
    facilityId: options.facilityId,
    practitionerId: practitioner,
  });

  const slotId = await getAvailableSlotId({
    facilityId: options.facilityId,
    practitionerId: practitioner,
  });

  const note = options.note ?? `E2E appointment ${Date.now()}`;
  const appointment = await apiFetch<{
    id: string;
    status: string;
    patient: { id: string } | string;
  }>(
    `/api/v1/facility/${options.facilityId}/slots/${slotId}/create_appointment/`,
    {
      method: "POST",
      body: JSON.stringify({
        patient: options.patientId,
        note,
        tags: [],
      }),
    },
  );

  const patientId =
    typeof appointment.patient === "string"
      ? appointment.patient
      : appointment.patient.id;

  return {
    id: appointment.id,
    patient: patientId,
    facilityId: options.facilityId,
    practitionerId: practitioner,
    note,
    status: appointment.status,
  };
}

export function appointmentDetailUrl(appointment: CreatedAppointment): string {
  return `/facility/${appointment.facilityId}/patient/${appointment.patient}/appointments/${appointment.id}`;
}

export function appointmentPrintUrl(appointment: CreatedAppointment): string {
  return `${appointmentDetailUrl(appointment)}/print`;
}
