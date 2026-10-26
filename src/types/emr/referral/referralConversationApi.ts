import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import {
  ReferralConversationMessage,
  ReferralConversationThread,
} from "./referralConversation";

export default {
  createThread: {
    path: "/api/v1/referral/{referralId}/thread/",
    method: HttpMethod.POST,
    TBody: Type<{ title?: string }>(),
    TRes: Type<ReferralConversationThread>(),
  },
  list: {
    path: "/api/v1/referral/{referralId}/notes/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ReferralConversationMessage>>(),
  },
  get: {
    path: "/api/v1/referral/{referralId}/notes/{messageId}/",
    method: HttpMethod.GET,
    TRes: Type<ReferralConversationMessage>(),
  },
  create: {
    path: "/api/v1/referral/{referralId}/notes/",
    method: HttpMethod.POST,
    TBody: Type<{ message: string }>(),
    TRes: Type<ReferralConversationMessage>(),
  },
  update: {
    path: "/api/v1/referral/{referralId}/notes/{messageId}/",
    method: HttpMethod.PUT,
    TBody: Type<{ message: string }>(),
    TRes: Type<ReferralConversationMessage>(),
  },
} as const;
