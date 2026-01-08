import { HttpMethod, Type } from "@/Utils/request/types";

import {
  CloseSessionRequest,
  CounterListResponse,
  OpenSessionRequest,
  SessionListResponse,
  SessionResponse,
} from "./cashSession";

export default {
  openSession: {
    path: "/api/care_odoo/facility/{facilityId}/cash-session/",
    method: HttpMethod.POST,
    TRes: Type<SessionResponse>(),
    TBody: Type<OpenSessionRequest>(),
  },
  closeSession: {
    path: "/api/care_odoo/facility/{facilityId}/cash-session/close/",
    method: HttpMethod.PUT,
    TRes: Type<SessionResponse>(),
    TBody: Type<CloseSessionRequest>(),
  },
  getCurrentSession: {
    path: "/api/care_odoo/facility/{facilityId}/cash-session/current/",
    method: HttpMethod.POST,
    TRes: Type<SessionResponse>(),
    TBody: Type<{
      counter_x_care_id: string;
    }>(),
  },
  listSessions: {
    path: "/api/care_odoo/facility/{facilityId}/cash-session/",
    method: HttpMethod.GET,
    TRes: Type<SessionListResponse>(),
  },
  listCounters: {
    path: "/api/care_odoo/facility/{facilityId}/cash-session/counters/",
    method: HttpMethod.GET,
    TRes: Type<CounterListResponse>(),
  },
} as const;
