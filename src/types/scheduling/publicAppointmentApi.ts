import { HttpMethod, Type } from "@/Utils/request/api";
import {
  AppointmentCreatePublicRequest,
  AppointmentRead,
  PublicSlotsForDayRequest,
  TokenSlot,
} from "@/types/scheduling/schedule";

export default {
  getSlotsForDay: {
    path: "/api/v1/otp/slots/get_slots_for_day/",
    method: HttpMethod.POST,
    TRes: Type<{ results: TokenSlot[] }>(),
    TBody: Type<PublicSlotsForDayRequest>(),
  },
  list: {
    path: "/api/v1/otp/slots/get_appointments/",
    method: HttpMethod.GET,
    TRes: Type<{ results: AppointmentRead[] }>(),
  },
  create: {
    path: "/api/v1/otp/slots/{slotId}/create_appointment/",
    method: HttpMethod.POST,
    TRes: Type<AppointmentRead>(),
    TBody: Type<AppointmentCreatePublicRequest>(),
  },
  cancel: {
    path: "/api/v1/otp/slots/cancel_appointment/",
    method: HttpMethod.POST,
    TRes: Type<AppointmentRead>(),
    TBody: Type<{ appointment: string; patient: string }>(),
  },
} as const;
