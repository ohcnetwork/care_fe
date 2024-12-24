import { DayOfWeekValue } from "@/CAREUI/interactive/WeekdayCheckbox";

import { Time } from "@/Utils/types";
import { UserBase } from "@/types/user/base";

export interface ScheduleTemplate {
  readonly id: string;
  resource_type: "user";
  resource: string;
  name: string;
  valid_from: string;
  valid_to: string;
  availabilities: {
    readonly id: string;
    name: string;
    slot_type: "appointment" | "open" | "closed";
    slot_size_in_minutes: number;
    tokens_per_slot: number;
    readonly create_tokens: boolean;
    reason: string;
    availability: {
      day_of_week: DayOfWeekValue;
      start_time: Time;
      end_time: Time;
    }[];
  }[];
  readonly create_by: UserBase;
  readonly updated_by: UserBase;
}

export const ScheduleSlotTypes = ["open", "appointment", "closed"] as const;

export type ScheduleAvailability = ScheduleTemplate["availabilities"][number];

export interface ScheduleException {
  readonly id: string;
  resource: string; // UUID of the resource
  reason: string;
  valid_from: string; // date in YYYY-MM-DD format
  valid_to: string; // date in YYYY-MM-DD format
  start_time: Time; // time in HH:MM format
  end_time: Time; // time in HH:MM format
}

export interface SlotAvailability {
  readonly id: string;
  readonly availability: {
    readonly name: string;
    readonly tokens_per_slot: number;
  };
  readonly start_datetime: string;
  readonly end_datetime: string;
  readonly allocated: number;
}

export interface AppointmentCreate {
  patient: string;
  reason_for_visit: string;
}

interface AppointmentPatient {
  readonly id: string;
  readonly name: string;
  readonly gender: number;
  readonly date_of_birth: string | null;
  readonly year_of_birth: string | null;
  readonly address: string;
  readonly pincode: string;
}

export interface Appointment {
  readonly id: string;
  readonly token_slot: SlotAvailability;
  readonly patient: AppointmentPatient;
  readonly booked_on: string;
  /**
   * This is null if the appointment was booked by the patient itself.
   */
  readonly booked_by: UserBase | null;
  status:
    | "proposed"
    | "pending"
    | "booked"
    | "arrived"
    | "fulfilled"
    | "cancelled"
    | "noshow"
    | "entered_in_error"
    | "checked_in"
    | "waitlist"
    | "in_consultation";
  readonly reason_for_visit: string;
  readonly resource: UserBase;
}

export interface AvailabilityHeatmap {
  [date: string]: { total_slots: number; booked_slots: number };
}
