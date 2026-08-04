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
  // D2. The row is seven JSON-safe fields, and — unlike v1 — the DRAFT
  // stores the edit log, not the prefetched encounter, so a restore can no
  // longer re-PUT a stale server row over someone else's change.
  draftPolicy: "serialize",
  contract: 2,
  toRequests,
  // PRODUCT DECISION (Task 8, stated explicitly per the brief): an
  // untouched section may NOT block Save. Once the `?toDischarge` seed is
  // built through `mergePatch(..., normalizePatch)`,
  // `requiresDischargeDisposition` (`structured/types/encounter/model.ts`)
  // can only ever be true for a row nobody edited this session — an
  // already-invalid server row, or a pre-port draft. Blocking Save over
  // server data the clinician never touched — possibly on a questionnaire
  // that doesn't even carry an encounter question they meant to open —
  // would be a new, disruptive coupling this port does not introduce.
  // `blocksSaveForMissingDischargeDisposition` encodes exactly that gate
  // (`edits.length > 0`, mirroring `appointment`'s `needsSlot`); see its
  // own doc comment in model.ts for the full reasoning.
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
