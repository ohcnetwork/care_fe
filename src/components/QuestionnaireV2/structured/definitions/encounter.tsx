import { t } from "i18next";

import { EncounterEditor } from "@/components/QuestionnaireV2/structured/types/encounter/EncounterEditor";
import {
  blocksSaveForMissingDischargeDisposition,
  toRequests,
} from "@/components/QuestionnaireV2/structured/types/encounter/model";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";

function EncounterInput(props: StructuredInputProps) {
  if (!props.encounterId || !props.facilityId) return null;
  return <EncounterEditor {...props} />;
}

export const encounterDefinition: StructuredTypeDefinition<"encounter"> = {
  type: "encounter",
  component: EncounterInput,
  requires: ["encounterId", "facilityId"],
  subjects: ["encounter"],
  // The row is seven JSON-safe fields. Drafts store the edit log, not the
  // prefetched encounter, so restore cannot re-PUT a stale server row.
  draftPolicy: "serialize",
  contract: 2,
  toRequests,
  // An untouched section must not block Save; the error only applies after
  // the clinician edits the encounter. If no default discharge disposition is
  // configured, touched discharged inpatient rows require the clinician to
  // choose one before saving.
  validate: (projection, edits, questionId) =>
    blocksSaveForMissingDischargeDisposition(projection[0], edits)
      ? [
          {
            question_id: questionId,
            field_key: "hospitalization.discharge_disposition",
            error: t("field_required"),
            required: true,
          },
        ]
      : [],
};
