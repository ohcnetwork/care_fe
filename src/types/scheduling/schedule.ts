import { DayOfWeek } from "@/CAREUI/interactive/WeekdayCheckbox";

import { Badge } from "@/components/ui/badge";

import { Time } from "@/Utils/types";
import { Patient } from "@/types/emr/patient";
import { FacilityBareMinimum } from "@/types/facility/facility";
import { UserBase } from "@/types/user/user";

export type ScheduleSlotType = "appointment" | "open" | "closed";

export interface AvailabilityDateTime {
  day_of_week: DayOfWeek;
  start_time: Time;
  end_time: Time;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  valid_from: string;
  valid_to: string;
  availabilities: ScheduleAvailability[];
  created_by: UserBase;
  updated_by: UserBase;
}

type ScheduleAvailabilityBase = {
  name: string;
  reason: string;
  availability: AvailabilityDateTime[];
} & (
  | {
      slot_type: "appointment";
      slot_size_in_minutes: number;
      tokens_per_slot: number;
    }
  | {
      slot_type: "open" | "closed";
      slot_size_in_minutes: null;
      tokens_per_slot: null;
    }
);

export interface ScheduleTemplateCreateRequest {
  user: string;
  name: string;
  valid_from: string; // datetime
  valid_to: string; // datetime
  availabilities: ScheduleAvailabilityBase[];
}

export interface ScheduleTemplateUpdateRequest {
  name: string;
  valid_from: string;
  valid_to: string;
}

export type ScheduleAvailability = ScheduleAvailabilityBase & {
  id: string;
};

export type ScheduleAvailabilityCreateRequest = ScheduleAvailabilityBase;

export interface ScheduleException {
  id: string;
  reason: string;
  valid_from: string; // date in YYYY-MM-DD format
  valid_to: string; // date in YYYY-MM-DD format
  start_time: Time;
  end_time: Time;
}

export interface ScheduleExceptionCreateRequest {
  user: string; // user's id
  reason: string;
  valid_from: string;
  valid_to: string;
  start_time: Time;
  end_time: Time;
}

export interface TokenSlot {
  id: string;
  availability: {
    name: string;
    tokens_per_slot: number;
  };
  start_datetime: string; // timezone naive datetime
  end_datetime: string; // timezone naive datetime
  allocated: number;
}

export interface GetSlotsForDayResponse {
  results: TokenSlot[];
}

export interface AvailabilityHeatmapRequest {
  from_date: string;
  to_date: string;
  user: string;
}

export interface AvailabilityHeatmapResponse {
  [date: string]: { total_slots: number; booked_slots: number };
}

export const AppointmentNonCancelledStatuses = [
  "proposed",
  "pending",
  "booked",
  "arrived",
  "fulfilled",
  "noshow",
  "checked_in",
  "waitlist",
  "in_consultation",
] as const;

export const AppointmentCancelledStatuses = [
  "cancelled",
  "entered_in_error",
  "rescheduled",
] as const;

export const AppointmentStatuses = [
  ...AppointmentNonCancelledStatuses,
  ...AppointmentCancelledStatuses,
] as const;

export const AppointmentFinalStatuses: AppointmentStatus[] = [
  "fulfilled",
  "cancelled",
  "entered_in_error",
  "rescheduled",
];

export const APPOINTMENT_STATUS_COLORS = {
  proposed: "secondary",
  pending: "secondary",
  booked: "blue",
  arrived: "primary",
  fulfilled: "primary",
  noshow: "orange",
  checked_in: "green",
  waitlist: "secondary",
  in_consultation: "primary",
  cancelled: "destructive",
  entered_in_error: "destructive",
  rescheduled: "yellow",
} as const satisfies Record<
  AppointmentStatus,
  React.ComponentProps<typeof Badge>["variant"]
>;

export type AppointmentNonCancelledStatus =
  (typeof AppointmentNonCancelledStatuses)[number];

export type AppointmentCancelledStatus =
  (typeof AppointmentCancelledStatuses)[number];

export type AppointmentStatus = (typeof AppointmentStatuses)[number];

export interface Appointment {
  id: string;
  token_slot: TokenSlot;
  patient: Patient;
  booked_on: string;
  status: AppointmentNonCancelledStatus;
  reason_for_visit: string;
  user: UserBase;
  booked_by: UserBase | null; // This is null if the appointment was booked by the patient itself.
  facility: FacilityBareMinimum;
}

export interface AppointmentCreateRequest {
  patient: string;
  reason_for_visit: string;
}

export interface AppointmentUpdateRequest {
  status: Appointment["status"];
}

export interface CreateAppointmentQuestion {
  reason_for_visit: string;
  slot_id: string;
}
