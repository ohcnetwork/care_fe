import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";

import { ServiceRequestInput } from "@/components/QuestionnaireV2/structured/inputs/ServiceRequestInput";

export const serviceRequestDefinition: StructuredTypeDefinition<"service_request"> =
  {
    type: "service_request",
    component: ServiceRequestInput,
    requires: ["encounterId", "facilityId"],
    subjects: ["encounter"],
    draftPolicy: "serialize",
    // No validate: the exported legacy validateServiceRequestQuestion
    // expects flat ServiceRequestReadSpec fields, but the recorded data is
    // ServiceRequestApplyActivityDefinitionForm with those fields nested
    // under `service_request` — wiring it would fail every submission.
    // (That mismatch is also why the legacy form never wired it.)
    buildRequests: async (serviceRequests, { facilityId, questionId }) =>
      serviceRequests.map((serviceRequest) => ({
        url: `/api/v1/facility/${facilityId}/service_request/apply_activity_definition/`,
        method: "POST" as const,
        body: {
          ...serviceRequest,
          service_request: {
            ...serviceRequest.service_request,
            requester: serviceRequest.service_request.requester.id,
          },
        },
        reference_id: structuredReferenceId("service_request", questionId),
      })),
  };
