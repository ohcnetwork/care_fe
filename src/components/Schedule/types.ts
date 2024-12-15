import { DayOfWeekValue } from "@/CAREUI/interactive/WeekdayCheckbox";

import { PatientModel } from "@/components/Patient/models";

import { Time, WritableOnly } from "@/Utils/types";

export interface ScheduleResourceUser {
  readonly id: string;
  readonly name: string;
}

export type ScheduleResource = ScheduleResourceUser;

export interface ScheduleTemplate {
  readonly id: string;
  readonly resource: ScheduleResource;
  name: string;
  valid_from: string;
  valid_to: string;
  availability: ScheduleAvailability[];
}

export interface ScheduleTemplateCreate extends WritableOnly<ScheduleTemplate> {
  doctor_username: string;
}

export const ScheduleSlotTypes = ["Open", "Appointment"] as const;

export interface ScheduleAvailability {
  readonly id: string;
  name: string;
  reason: string; // TODO: integrate this
  slot_type: (typeof ScheduleSlotTypes)[number];
  slot_size_in_minutes: number;
  tokens_per_slot: number;
  days_of_week: DayOfWeekValue[];
  start_time: Time;
  end_time: Time;
}

export interface ScheduleException {
  readonly id: string;
  name: string;
  is_available: boolean;
  reason: string;
  valid_from: string;
  valid_to: string;
  start_time: Time;
  end_time: Time;
  slot_type?: (typeof ScheduleSlotTypes)[number];
  slot_size_in_minutes?: number;
  tokens_per_slot?: number;
}

export interface ScheduleExceptionCreate
  extends WritableOnly<ScheduleException> {
  doctor_username: string;
}

export interface TokenSlot {
  readonly id: string;
  readonly start_datetime: string;
  readonly end_datetime: string;
  readonly resource: ScheduleResourceUser;
  readonly tokens_count: number;
  readonly tokens_remaining: number;
}

export interface AppointmentCreate {
  patient: string;
  doctor_username: string;
  slot_start: TokenSlot["start_datetime"];
  reason_for_visit: string;
}

export interface Appointment {
  readonly id: string;
  readonly patient: PatientModel;
  readonly reason_for_visit: string;
  readonly resource: ScheduleResourceUser;
  readonly token_slot: TokenSlot;
}
