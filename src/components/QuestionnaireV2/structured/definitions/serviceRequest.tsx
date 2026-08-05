import { t } from "i18next";

import { ServiceRequestEditor } from "@/components/QuestionnaireV2/structured/types/serviceRequest/ServiceRequestEditor";
import {
  requiredServiceRequestFieldMisses,
  rowSchema,
  toRequests,
} from "@/components/QuestionnaireV2/structured/types/serviceRequest/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

export const serviceRequestDefinition: StructuredTypeDefinition<"service_request"> =
  {
    type: "service_request",
    component: ServiceRequestEditor,
    requires: ["encounterId", "facilityId"],
    subjects: ["encounter"],
    // Service-request rows contain only plain JSON-serializable data, so they
    // can be restored from drafts without losing type information.
    draftPolicy: "serialize",
    contract: 2,
    toRequests,
    rowSchema,
    // i18n boundary: `requiredServiceRequestFieldMisses` stays pure; this
    // definition turns its misses into translated, row-scoped errors.
    validate: (_projection, edits, questionId) =>
      requiredServiceRequestFieldMisses(edits).map((miss) => ({
        question_id: questionId,
        field_key: miss.fieldKey,
        row_id: miss.rowId,
        error: t("field_required"),
        required: true,
      })),
  };
