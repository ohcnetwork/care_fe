import { DayOfWeek } from "@/CAREUI/interactive/WeekdayCheckbox";

import { Badge } from "@/components/ui/badge";

import { Time } from "@/Utils/types";
import { PatientOTPRead } from "@/types/auth/otp";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { FacilityBareMinimum } from "@/types/facility/facility";
import { UserReadMinimal } from "@/types/user/user";

export type ScheduleSlotType = "appointment" | "open" | "closed";

export interface AvailabilityDateTime {
  day_of_week: DayOfWeek;
  start_time: Time;
  end_time: Time;
}

export interface ScheduleBase {
  name: string;
  valid_from: string;
  valid_to: string;
  availabilities: ScheduleAvailabilityRead[];
}

export interface ScheduleRead extends ScheduleBase {
  id: string;
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
}

export interface ScheduleCreate extends Omit<ScheduleBase, "availabilities"> {
  facility: string;
  user: string;
  availabilities: ScheduleAvailabilityBase[];
}

export type ScheduleUpdate = Omit<ScheduleBase, "availabilities">;

export interface ScheduleAvailabilityBase {
  name: string;
  reason: string;
  availability: AvailabilityDateTime[];
  slot_type: ScheduleSlotType;
  slot_size_in_minutes: number | null;
  tokens_per_slot: number | null;
  create_tokens: boolean;
}

export interface ScheduleAvailabilityRead extends ScheduleAvailabilityBase {
  id: string;
}

export interface ScheduleAvailabilityCreate extends ScheduleAvailabilityBase {
  schedule: string;
}

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

export interface AppointmentBase {
  id: string;
  token_slot: TokenSlot;
  patient: PatientOTPRead;
  booked_on: string;
  status: AppointmentStatus;
  note: string;
  user: UserReadMinimal;
  booked_by: UserReadMinimal | null; // This is null if the appointment was booked by the patient itself.
  facility: FacilityBareMinimum;
}

export interface AppointmentRead extends AppointmentBase {
  tags: TagConfig[];
  updated_by?: UserReadMinimal | null;
  created_by?: UserReadMinimal | null;
  modified_date: string;
  created_date: string;
}

export interface AppointmentCreateRequest {
  patient: string;
  note: string;
  tags: string[];
}

export interface AppointmentCreatePublicRequest {
  patient: string;
  note: string;
}

export interface AppointmentUpdateRequest {
  status: AppointmentStatus;
  note: string;
}

export interface CreateAppointmentQuestion {
  note: string;
  slot_id: string;
  tags: string[];
}

export interface AppointmentCancelRequest {
  reason: AppointmentCancelledStatus;
  note?: string;
}

export interface AppointmentRescheduleRequest {
  new_slot: string;
  previous_booking_note: string;
  new_booking_note: string;
  tags: string[];
}

export interface PublicSlotsForDayRequest {
  facility: string;
  user: string;
  day: string;
}

export const getUserFromLocalStorage = (): UserReadMinimal => {
  return JSON.parse(localStorage.getItem("user") ?? "{}");
};

export const storeUserInLocalStorage = (user: UserReadMinimal) => {
  localStorage.setItem("user", JSON.stringify(user));
};
