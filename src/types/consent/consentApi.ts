import { HttpMethod, Type } from "@/Utils/request/api";
import {
  ConsentListResponse,
  ConsentModel,
  CreateConsentRequest,
  UpdateConsentRequest,
  VerificationType,
} from "@/types/consent/consent";

export default {
  create: {
    method: HttpMethod.POST,
    path: "/api/v1/patient/{patientId}/consent/",
    TRes: Type<ConsentModel>(),
    TBody: Type<CreateConsentRequest>(),
  },
  list: {
    method: HttpMethod.GET,
    path: "/api/v1/patient/{patientId}/consent/",
    TRes: Type<ConsentListResponse>(),
  },
  retrieve: {
    method: HttpMethod.GET,
    path: "/api/v1/patient/{patientId}/consent/{id}/",
    TRes: Type<ConsentModel>(),
  },
  update: {
    method: HttpMethod.PUT,
    path: "/api/v1/patient/{patientId}/consent/{id}/",
    TRes: Type<ConsentModel>(),
    TBody: Type<UpdateConsentRequest>(),
  },
  delete: {
    method: HttpMethod.DELETE,
    path: "/api/v1/patient/{patientId}/consent/{id}/",
  },
  addVerification: {
    method: HttpMethod.POST,
    path: "/api/v1/patient/{patientId}/consent/{id}/add_verification/",
    TRes: Type<ConsentModel>(),
    TBody: Type<{ verification_type: VerificationType }>(),
  },
  removeVerification: {
    method: HttpMethod.POST,
    path: "/api/v1/patient/{patientId}/consent/{id}/remove_verification/",
    TRes: Type<ConsentModel>(),
    TBody: Type<{ verification_id: string }>(),
  },
  upsert: {
    method: HttpMethod.POST,
    path: "/api/v1/patient/{patientId}/consent/upsert/",
    TRes: Type<ConsentModel>(),
    TBody: Type<CreateConsentRequest>(),
  },
};
