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
    // D2: a service-request row is plain, JSON-serializable data (the wire
    // fields plus the activity-definition display object, itself plain
    // data) — no `Date`/`File`/class instance — so it round-trips through a
    // draft exactly. Mirrors `charge_item`'s identical reasoning.
    draftPolicy: "serialize",
    contract: 2,
    toRequests,
    rowSchema,
    // i18n boundary: `model.ts`'s `requiredServiceRequestFieldMisses` is the
    // pure, row-scoped decision (imports no i18next); this is the only
    // place it becomes a translated, row_id-keyed `QuestionValidationError`
    // — mirrors `charge_item`'s identical split. See that function's own
    // doc comment for why this is wired (a "correct" version of legacy's
    // never-wired `validateServiceRequestQuestion`) despite today's UI
    // having no path that can actually leave a required field blank.
    validate: (_projection, edits, questionId) =>
      requiredServiceRequestFieldMisses(edits).map((miss) => ({
        question_id: questionId,
        field_key: miss.fieldKey,
        row_id: miss.rowId,
        error: t("field_required"),
        required: true,
      })),
  };
