import {
  Appointment,
  AppointmentCreate,
  AvailabilityHeatmap,
  ScheduleException,
  ScheduleTemplate,
  SlotAvailability,
} from "@/components/Schedule/types";

import { Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { Writable, WritableOnly } from "@/Utils/types";
import { UserBase } from "@/types/user/user";

export const ScheduleAPIs = {
  templates: {
    create: {
      path: "/api/v1/facility/{facility_id}/schedule/",
      method: "POST",
      TRes: Type<ScheduleTemplate>(),
      TBody: Type<WritableOnly<ScheduleTemplate>>(),
    },
    delete: {
      path: "/api/v1/facility/{facility_id}/schedule/{id}/",
      method: "DELETE",
      TRes: Type<void>(),
    },
    list: {
      path: "/api/v1/facility/{facility_id}/schedule/",
      method: "GET",
      TRes: Type<PaginatedResponse<ScheduleTemplate>>(),
    },
  },

  exceptions: {
    create: {
      path: "/api/v1/facility/{facility_id}/schedule_exceptions/",
      method: "POST",
      TRes: Type<ScheduleException>(),
      TBody: Type<Writable<ScheduleException>>(),
    },
    list: {
      path: "/api/v1/facility/{facility_id}/schedule_exceptions/",
      method: "GET",
      TRes: Type<PaginatedResponse<ScheduleException>>(),
    },
    delete: {
      path: "/api/v1/facility/{facility_id}/schedule_exceptions/{id}/",
      method: "DELETE",
      TRes: Type<void>(),
    },
  },

  slots: {
    availabilityHeatmap: {
      path: "/api/v1/facility/{facility_id}/slots/availability_stats/",
      method: "POST",
      TRes: Type<AvailabilityHeatmap>(),
      TBody: Type<{ from_date: string; to_date: string; resource: string }>(),
    },
    getSlotsForDay: {
      path: "/api/v1/facility/{facility_id}/slots/get_slots_for_day/",
      method: "POST",
      TRes: Type<{ results: SlotAvailability[] }>(),
      TBody: Type<{ resource: string; day: string }>(),
    },
    createAppointment: {
      path: "/api/v1/facility/{facility_id}/slots/{slot_id}/create_appointment/",
      method: "POST",
      TBody: Type<AppointmentCreate>(),
      TRes: Type<Appointment>(),
    },
  },

  appointments: {
    // TODO: rename this to available_resources (or something more accurate)
    availableDoctors: {
      path: "/api/v1/facility/{facility_id}/appointments/available_doctors/",
      method: "GET",
      TRes: Type<{ users: UserBase[] }>(),
    },
    list: {
      path: "/api/v1/facility/{facility_id}/appointments/",
      method: "GET",
      TRes: Type<PaginatedResponse<Appointment>>(),
    },
    retrieve: {
      path: "/api/v1/facility/{facility_id}/appointments/{id}/",
      method: "GET",
      TRes: Type<Appointment>(),
    },
    update: {
      path: "/api/v1/facility/{facility_id}/appointments/{id}/",
      method: "PUT",
      TBody: Type<Partial<WritableOnly<Appointment>>>(),
      TRes: Type<Appointment>(),
    },
  },
} as const;
