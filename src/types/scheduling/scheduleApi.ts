import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  AppointmentCancelRequest,
  AppointmentCreateRequest,
  AppointmentRead,
  AppointmentRescheduleRequest,
  AppointmentUpdateRequest,
  AvailabilityHeatmapRequest,
  AvailabilityHeatmapResponse,
  GetSlotsForDayResponse,
  ScheduleAvailability,
  ScheduleAvailabilityCreateRequest,
  ScheduleException,
  ScheduleExceptionCreateRequest,
  ScheduleTemplate,
  ScheduleTemplateCreateRequest,
  ScheduleTemplateUpdateRequest,
} from "@/types/scheduling/schedule";
import { UserReadMinimal } from "@/types/user/user";

export default {
  /**
   * Schedule Template related APIs
   */
  templates: {
    create: {
      path: "/api/v1/facility/{facilityId}/schedule/",
      method: HttpMethod.POST,
      TRes: Type<ScheduleTemplate>(),
      TBody: Type<ScheduleTemplateCreateRequest>(),
    },
    retrieve: {
      path: "/api/v1/facility/{facilityId}/schedule/{id}/",
      method: HttpMethod.GET,
      TRes: Type<ScheduleTemplate>(),
    },
    list: {
      path: "/api/v1/facility/{facilityId}/schedule/",
      method: HttpMethod.GET,
      TRes: Type<PaginatedResponse<ScheduleTemplate>>(),
    },
    update: {
      path: "/api/v1/facility/{facilityId}/schedule/{id}/",
      method: HttpMethod.PUT,
      TBody: Type<ScheduleTemplateUpdateRequest>(),
      TRes: Type<ScheduleTemplate>(),
    },
    delete: {
      path: "/api/v1/facility/{facilityId}/schedule/{id}/",
      method: HttpMethod.DELETE,
      TBody: Type<void>(),
      TRes: Type<void>(),
    },

    /**
     * Schedule Template's Availability related APIs
     */
    availabilities: {
      create: {
        path: "/api/v1/facility/{facilityId}/schedule/{scheduleId}/availability/",
        method: HttpMethod.POST,
        TBody: Type<ScheduleAvailabilityCreateRequest>(),
        TRes: Type<ScheduleAvailability>(),
      },
      delete: {
        path: "/api/v1/facility/{facilityId}/schedule/{scheduleId}/availability/{id}/",
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
      path: "/api/v1/facility/{facilityId}/schedule_exceptions/",
      method: HttpMethod.POST,
      TRes: Type<ScheduleException>(),
      TBody: Type<ScheduleExceptionCreateRequest>(),
    },
    list: {
      path: "/api/v1/facility/{facilityId}/schedule_exceptions/",
      method: HttpMethod.GET,
      TRes: Type<PaginatedResponse<ScheduleException>>(),
    },
    delete: {
      path: "/api/v1/facility/{facilityId}/schedule_exceptions/{id}/",
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
      path: "/api/v1/facility/{facilityId}/slots/get_slots_for_day/",
      method: HttpMethod.POST,
      TRes: Type<GetSlotsForDayResponse>(),
      TBody: Type<{ user: string; day: string }>(),
    },
    availabilityStats: {
      path: "/api/v1/facility/{facilityId}/slots/availability_stats/",
      method: HttpMethod.POST,
      TBody: Type<AvailabilityHeatmapRequest>(),
      TRes: Type<AvailabilityHeatmapResponse>(),
    },
    createAppointment: {
      path: "/api/v1/facility/{facilityId}/slots/{slotId}/create_appointment/",
      method: HttpMethod.POST,
      TBody: Type<AppointmentCreateRequest>(),
      TRes: Type<AppointmentRead>(),
    },
  },

  /**
   * Appointment Related APIs
   */
  appointments: {
    list: {
      path: "/api/v1/facility/{facilityId}/appointments/",
      method: HttpMethod.GET,
      TRes: Type<PaginatedResponse<AppointmentRead>>(),
    },
    get: {
      path: "/api/v1/facility/{facilityId}/appointments/{id}/",
      method: HttpMethod.GET,
      TRes: Type<AppointmentRead>(),
    },
    update: {
      path: "/api/v1/facility/{facilityId}/appointments/{id}/",
      method: HttpMethod.PUT,
      TBody: Type<AppointmentUpdateRequest>(),
      TRes: Type<AppointmentRead>(),
    },
    cancel: {
      path: "/api/v1/facility/{facilityId}/appointments/{id}/cancel/",
      method: HttpMethod.POST,
      TBody: Type<AppointmentCancelRequest>(),
      TRes: Type<AppointmentRead>(),
    },
    reschedule: {
      path: "/api/v1/facility/{facilityId}/appointments/{id}/reschedule/",
      method: HttpMethod.POST,
      TBody: Type<AppointmentRescheduleRequest>(),
      TRes: Type<AppointmentRead>(),
    },
    /**
     * Lists schedulable users for a facility
     */
    availableUsers: {
      path: "/api/v1/facility/{facilityId}/appointments/available_users/",
      method: HttpMethod.GET,
      TRes: Type<{ users: UserReadMinimal[] }>(),
    },
    /**
     * Get appointments across facilities
     */
    getAppointments: {
      path: "/api/v1/patient/{patientId}/get_appointments/",
      method: HttpMethod.GET,
      TRes: Type<PaginatedResponse<AppointmentRead>>(),
    },

    // Tag-related endpoints
    setTags: {
      path: "/api/v1/facility/{facilityId}/appointments/{external_id}/set_tags/",
      method: HttpMethod.POST,
      TRes: Type<AppointmentRead>(),
      TBody: Type<{ tags: string[] }>(),
    },
    removeTags: {
      path: "/api/v1/facility/{facilityId}/appointments/{external_id}/remove_tags/",
      method: HttpMethod.POST,
      TRes: Type<AppointmentRead>(),
      TBody: Type<{ tags: string[] }>(),
    },
  },
} as const;
