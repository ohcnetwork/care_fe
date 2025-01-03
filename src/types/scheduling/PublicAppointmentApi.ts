import {
  Appointment,
  AppointmentCreate,
  SlotAvailability,
} from "@/components/Schedule/types";

import { Type } from "@/Utils/request/api";

export default {
  getSlotsForDay: {
    path: "/api/v1/otp/slots/get_slots_for_day/",
    method: "POST",
    TRes: Type<{ results: SlotAvailability[] }>(),
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
    TBody: Type<AppointmentCreate>(),
  },
} as const;
