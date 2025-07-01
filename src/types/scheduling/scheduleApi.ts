import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  Appointment,
  AppointmentCreateRequest,
  AppointmentUpdateRequest,
  AvailabilityHeatmapRequest,
  AvailabilityHeatmapResponse,
  ScheduleAvailability,
  ScheduleAvailabilityCreateRequest,
  ScheduleException,
  ScheduleExceptionCreateRequest,
  ScheduleTemplate,
  ScheduleTemplateCreateRequest,
  ScheduleTemplateUpdateRequest,
  TokenSlot,
} from "@/types/scheduling/schedule";
import { UserBase } from "@/types/user/user";

export default {
  /**
   * Schedule Template related APIs
   */
  templates: {
    create: {
      path: "/api/v1/facility/{facility_id}/schedule/",
      method: HttpMethod.POST,
      TRes: Type<ScheduleTemplate>(),
      TBody: Type<ScheduleTemplateCreateRequest>(),
    },
    retrieve: {
      path: "/api/v1/facility/{facility_id}/schedule/{id}/",
      method: HttpMethod.GET,
      TRes: Type<ScheduleTemplate>(),
    },
    list: {
      path: "/api/v1/facility/{facility_id}/schedule/",
      method: HttpMethod.GET,
      TRes: Type<PaginatedResponse<ScheduleTemplate>>(),
    },
    update: {
      path: "/api/v1/facility/{facility_id}/schedule/{id}/",
      method: HttpMethod.PUT,
      TBody: Type<ScheduleTemplateUpdateRequest>(),
      TRes: Type<ScheduleTemplate>(),
    },
    delete: {
      path: "/api/v1/facility/{facility_id}/schedule/{id}/",
      method: HttpMethod.DELETE,
      TBody: Type<void>(),
      TRes: Type<void>(),
    },

    /**
     * Schedule Template's Availability related APIs
     */
    availabilities: {
      create: {
        path: "/api/v1/facility/{facility_id}/schedule/{schedule_id}/availability/",
        method: HttpMethod.POST,
        TBody: Type<ScheduleAvailabilityCreateRequest>(),
        TRes: Type<ScheduleAvailability>(),
      },
      delete: {
        path: "/api/v1/facility/{facility_id}/schedule/{schedule_id}/availability/{id}/",
        method: HttpMethod.DELETE,
        TBody: Type<void>(),
        TRes: Type<void>(),
      },
    },
  },

  /**
   * Schedule Exception related APIs
   */
  exceptions: {
    create: {
      path: "/api/v1/facility/{facility_id}/schedule_exceptions/",
      method: HttpMethod.POST,
      TRes: Type<ScheduleException>(),
      TBody: Type<ScheduleExceptionCreateRequest>(),
    },
    list: {
      path: "/api/v1/facility/{facility_id}/schedule_exceptions/",
      method: HttpMethod.GET,
      TRes: Type<PaginatedResponse<ScheduleException>>(),
    },
    delete: {
      path: "/api/v1/facility/{facility_id}/schedule_exceptions/{id}/",
      method: HttpMethod.DELETE,
      TRes: Type<void>(),
      TBody: Type<void>(),
    },
  },

  /**
   * Schedule Token Slot related APIs
   */
  slots: {
    getSlotsForDay: {
      path: "/api/v1/facility/{facility_id}/slots/get_slots_for_day/",
      method: HttpMethod.POST,
      TRes: Type<{ results: TokenSlot[] }>(),
      TBody: Type<{ user: string; day: string }>(),
    },
    availabilityStats: {
      path: "/api/v1/facility/{facility_id}/slots/availability_stats/",
      method: HttpMethod.POST,
      TBody: Type<AvailabilityHeatmapRequest>(),
      TRes: Type<AvailabilityHeatmapResponse>(),
    },
    createAppointment: {
      path: "/api/v1/facility/{facility_id}/slots/{slot_id}/create_appointment/",
      method: HttpMethod.POST,
      TBody: Type<AppointmentCreateRequest>(),
      TRes: Type<Appointment>(),
    },
  },

  /**
   * Appointment Related APIs
   */
  appointments: {
    list: {
      path: "/api/v1/facility/{facility_id}/appointments/",
      method: HttpMethod.GET,
      TRes: Type<PaginatedResponse<Appointment>>(),
    },
    retrieve: {
      path: "/api/v1/facility/{facility_id}/appointments/{id}/",
      method: HttpMethod.GET,
      TRes: Type<Appointment>(),
    },
    update: {
      path: "/api/v1/facility/{facility_id}/appointments/{id}/",
      method: HttpMethod.PUT,
      TBody: Type<AppointmentUpdateRequest>(),
      TRes: Type<Appointment>(),
    },
    cancel: {
      path: "/api/v1/facility/{facility_id}/appointments/{id}/cancel/",
      method: HttpMethod.POST,
      TBody: Type<{ reason: "cancelled" | "entered_in_error" }>(),
      TRes: Type<Appointment>(),
    },
    reschedule: {
      path: "/api/v1/facility/{facility_id}/appointments/{id}/reschedule/",
      method: HttpMethod.POST,
      TBody: Type<{ new_slot: string }>(),
      TRes: Type<Appointment>(),
    },
    /**
     * Lists schedulable users for a facility
     */
    availableUsers: {
      path: "/api/v1/facility/{facility_id}/appointments/available_users/",
      method: HttpMethod.GET,
      TRes: Type<{ users: UserBase[] }>(),
    },
    /**
     * Get appointments across facilities
     */
    getAppointments: {
      path: "/api/v1/patient/{patient_id}/get_appointments/",
      method: HttpMethod.GET,
      TRes: Type<PaginatedResponse<Appointment>>(),
    },
  },
} as const;
