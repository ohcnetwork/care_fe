import { HttpMethod, Type } from "@/Utils/request/types";
import {
  AppointmentCreatePublicRequest,
  PublicAppointment,
  SchedulableResourceType,
  TokenSlot,
} from "@/types/scheduling/schedule";

export default {
  getSlotsForDay: {
    path: "/api/v1/otp/slots/get_slots_for_day/",
    method: HttpMethod.POST,
    TRes: Type<{ results: TokenSlot[] }>(),
    TBody: Type<{
      facility: string;
      resource_type: SchedulableResourceType;
      resource_id: string;
      day: string;
    }>(),
  },
  getAppointments: {
    path: "/api/v1/otp/slots/get_appointments/",
    method: HttpMethod.GET,
    TRes: Type<{ results: PublicAppointment[] }>(),
  },
  createAppointment: {
    path: "/api/v1/otp/slots/{id}/create_appointment/",
    method: HttpMethod.POST,
    TRes: Type<PublicAppointment>(),
    TBody: Type<AppointmentCreatePublicRequest>(),
  },
  cancelAppointment: {
    path: "/api/v1/otp/slots/cancel_appointment/",
    method: HttpMethod.POST,
    TRes: Type<PublicAppointment>(),
    TBody: Type<{ appointment: string; patient: string }>(),
  },
} as const;
