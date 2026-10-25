import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import {
  ReferralAvailabilityCreate,
  ReferralAvailabilityRead,
  ReferralAvailabilityRetrieve,
  ReferralAvailabilityUpdate,
  ReferralCreate,
  ReferralDestinationOption,
  ReferralQuestionnaire,
  ReferralQuestionnaireResponse,
  ReferralRead,
  ReferralResponseCreate,
  ReferralRetrieve,
  ReferralUpdate,
} from "./referral";

export const referralAvailabilityApi = {
  destinations: {
    path: "/api/v1/referral_availability/destinations/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ReferralDestinationOption>>(),
  },
  list: {
    path: "/api/v1/referral_availability/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ReferralAvailabilityRead>>(),
  },
  listConfig: {
    path: "/api/v1/referral_availability_config/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ReferralAvailabilityRead>>(),
  },
  get: {
    path: "/api/v1/referral_availability/{availabilityId}/",
    method: HttpMethod.GET,
    TRes: Type<ReferralAvailabilityRetrieve>(),
  },
  create: {
    path: "/api/v1/referral_availability/",
    method: HttpMethod.POST,
    TBody: Type<ReferralAvailabilityCreate>(),
    TRes: Type<ReferralAvailabilityRetrieve>(),
  },
  update: {
    path: "/api/v1/referral_availability/{availabilityId}/",
    method: HttpMethod.PATCH,
    TBody: Type<ReferralAvailabilityUpdate>(),
    TRes: Type<ReferralAvailabilityRetrieve>(),
  },
  delete: {
    path: "/api/v1/referral_availability/{availabilityId}/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
  },
  questionnaires: {
    path: "/api/v1/referral_availability/{availabilityId}/questionnaires/",
    method: HttpMethod.GET,
    TRes: Type<{ count: number; results: ReferralQuestionnaire[] }>(),
  },
} as const;

export default {
  list: {
    path: "/api/v1/referral/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ReferralRead>>(),
  },
  assigned: {
    path: "/api/v1/referral_assigned/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ReferralRead>>(),
  },
  get: {
    path: "/api/v1/referral/{referralId}/",
    method: HttpMethod.GET,
    TRes: Type<ReferralRetrieve>(),
  },
  create: {
    path: "/api/v1/referral/",
    method: HttpMethod.POST,
    TBody: Type<ReferralCreate>(),
    TRes: Type<ReferralRetrieve>(),
  },
  update: {
    path: "/api/v1/referral/{referralId}/",
    method: HttpMethod.PATCH,
    TBody: Type<ReferralUpdate>(),
    TRes: Type<ReferralRetrieve>(),
  },
  addResponse: {
    path: "/api/v1/referral/{referralId}/questionnaire_responses/",
    method: HttpMethod.POST,
    TBody: Type<ReferralResponseCreate>(),
    TRes: Type<ReferralQuestionnaireResponse>(),
  },
  voidResponse: {
    path: "/api/v1/referral/{referralId}/questionnaire_responses/{responseId}/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
  },
  questionnaires: {
    path: "/api/v1/referral/{referralId}/questionnaires/",
    method: HttpMethod.GET,
    TRes: Type<{ count: number; results: ReferralQuestionnaire[] }>(),
  },
} as const;
