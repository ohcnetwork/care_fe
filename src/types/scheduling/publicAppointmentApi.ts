import { HttpMethod, Type } from "@/Utils/request/api";
import {
  AppointmentCreatePublicRequest,
  AppointmentRead,
  TokenSlot,
} from "@/types/scheduling/schedule";

export default {
  getSlotsForDay: {
    path: "/api/v1/otp/slots/get_slots_for_day/",
    method: HttpMethod.POST,
    TRes: Type<{ results: TokenSlot[] }>(),
    TBody: Type<{ facility: string; user: string; day: string }>(),
  },
  getAppointments: {
    path: "/api/v1/otp/slots/get_appointments/",
    method: HttpMethod.GET,
    TRes: Type<{ results: AppointmentRead[] }>(),
  },
  createAppointment: {
    path: "/api/v1/otp/slots/{id}/create_appointment/",
    method: HttpMethod.POST,
    TRes: Type<AppointmentRead>(),
    TBody: Type<AppointmentCreatePublicRequest>(),
  },
  cancelAppointment: {
    path: "/api/v1/otp/slots/cancel_appointment/",
    method: HttpMethod.POST,
    TRes: Type<AppointmentRead>(),
    TBody: Type<{ appointment: string; patient: string }>(),
  },
} as const;
