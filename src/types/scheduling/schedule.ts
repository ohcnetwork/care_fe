import { DayOfWeek } from "@/CAREUI/interactive/WeekdayCheckbox";

import { Badge } from "@/components/ui/badge";

import { Time } from "@/Utils/types";
import { formatName } from "@/Utils/utils";
import { ChargeItemDefinitionRead } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { PatientRead } from "@/types/emr/patient/patient";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { FacilityBareMinimum } from "@/types/facility/facility";
import { HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import { LocationList } from "@/types/location/location";
import { buildLocationHierarchy } from "@/types/location/utils";
import { TokenRead } from "@/types/tokens/token/token";
import { UserReadMinimal } from "@/types/user/user";

export enum AvailabilitySlotType {
  Appointment = "appointment",
  Open = "open",
  Closed = "closed",
}

export enum SchedulableResourceType {
  Practitioner = "practitioner",
  Location = "location",
  HealthcareService = "healthcare_service",
}

export const SCHEDULABLE_RESOURCE_TYPE_COLORS = {
  practitioner: "blue",
  location: "green",
  healthcare_service: "yellow",
} as const satisfies Record<SchedulableResourceType, string>;

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
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
  charge_item_definition: ChargeItemDefinitionRead;
  revisit_charge_item_definition: ChargeItemDefinitionRead;
  revisit_allowed_days: number;
}

type ScheduleAvailabilityBase = {
  name: string;
  reason: string;
  availability: AvailabilityDateTime[];
} & (
  | {
      slot_type: AvailabilitySlotType.Appointment;
      slot_size_in_minutes: number;
      tokens_per_slot: number;
    }
  | {
      slot_type: AvailabilitySlotType.Open | AvailabilitySlotType.Closed;
      slot_size_in_minutes: null;
      tokens_per_slot: null;
    }
);

export interface ScheduleTemplateCreateRequest {
  name: string;
  valid_from: string; // datetime
  valid_to: string; // datetime
  availabilities: ScheduleAvailabilityBase[];
  resource_type: SchedulableResourceType;
  resource_id: string;
}
export interface ScheduleTemplateSetChargeItemDefinitionRequest {
  charge_item_definition: string;
  re_visit_allowed_days: number;
  re_visit_charge_item_definition: string | null;
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
  resource_type: SchedulableResourceType;
  resource_id: string;
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
  resource_type: SchedulableResourceType;
  resource_id: string;
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

export type Appointment = {
  id: string;
  token_slot: TokenSlot;
  patient: PatientRead;
  booked_on: string;
  status: AppointmentNonCancelledStatus;
  note: string;
  booked_by: UserReadMinimal | null; // This is null if the appointment was booked by the patient itself.
  facility: FacilityBareMinimum;
  token: TokenRead | null;
} & (
  | {
      resource_type: SchedulableResourceType.Practitioner;
      resource: UserReadMinimal;
    }
  | {
      resource_type: SchedulableResourceType.Location;
      resource: LocationList;
    }
  | {
      resource_type: SchedulableResourceType.HealthcareService;
      resource: HealthcareServiceReadSpec;
    }
);

export type AppointmentRead = Appointment & {
  tags: TagConfig[];
  updated_by: UserReadMinimal | null;
  created_by: UserReadMinimal;
  modified_date: string;
  associated_encounter?: EncounterRead;
};

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
  status: Appointment["status"];
  note: string;
}

export interface CreateAppointmentQuestion {
  note: string;
  slot_id: string;
  tags: string[];
}

export interface AppointmentCancelRequest {
  reason: "cancelled" | "entered_in_error";
  note?: string;
}

export interface AppointmentRescheduleRequest {
  new_slot: string;
  previous_booking_note: string;
  new_booking_note: string;
  tags: string[];
}

export const getUserFromLocalStorage = (): UserReadMinimal => {
  return JSON.parse(localStorage.getItem("user") ?? "{}");
};

export const storeUserInLocalStorage = (user: UserReadMinimal) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const nameFromAppointment = (appointment: Appointment) => {
  switch (appointment.resource_type) {
    case SchedulableResourceType.Practitioner:
      return formatName(appointment.resource);
    case SchedulableResourceType.Location:
      return buildLocationHierarchy(appointment.resource, " > ");
    case SchedulableResourceType.HealthcareService:
      return appointment.resource.name;
    default:
      return "-";
  }
};
