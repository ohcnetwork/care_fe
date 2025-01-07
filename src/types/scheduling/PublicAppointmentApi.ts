import { Type } from "@/Utils/request/api";
import {
  Appointment,
  AppointmentCreateRequest,
  TokenSlot,
} from "@/types/scheduling/schedule";

export default {
  getSlotsForDay: {
    path: "/api/v1/otp/slots/get_slots_for_day/",
    method: "POST",
    TRes: Type<{ results: TokenSlot[] }>(),
    TBody: Type<{ facility: string; user: string; day: string }>(),
  },
  getAppointments: {
    path: "/api/v1/otp/slots/get_appointments/",
    method: "GET",
    TRes: Type<{ results: Appointment[] }>(),
  },
  createAppointment: {
    path: "/api/v1/otp/slots/{id}/create_appointment/",
    method: "POST",
    TRes: Type<Appointment>(),
    TBody: Type<AppointmentCreateRequest>(),
  },
} as const;
