import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { sanitizeNote } from "./adapt";

import { ProcedureInput } from "@/components/QuestionnaireV2/structured/inputs/ProcedureInput";

import type { ProcedureOccurrence } from "@/types/emr/procedure/procedure";

/** The backend accepts at most one occurrence form and rejects blank text. */
function sanitizeOccurrence({
  occurrence_datetime,
  occurrence_period,
  occurrence_string,
}: ProcedureOccurrence = {}): ProcedureOccurrence {
  const description = occurrence_string?.trim();
  if (description) return { occurrence_string: description };
  if (occurrence_datetime) return { occurrence_datetime };
  if (occurrence_period) return { occurrence_period };
  return {};
}

export const procedureDefinition: StructuredTypeDefinition<"procedure"> = {
  type: "procedure",
  component: ProcedureInput,
  requires: ["patientId", "encounterId"],
  subjects: ["encounter"],
  draftPolicy: "serialize",
  buildRequests: async (
    procedures,
    { patientId, encounterId, questionId, path },
  ) => {
    if (!patientId || !encounterId || procedures.length === 0) return [];
    return [
      {
        url: `/api/v1/patient/${patientId}/procedure/upsert/`,
        method: "POST",
        body: {
          datapoints: procedures.map((procedure) => ({
            ...procedure,
            note: sanitizeNote(procedure.note),
            occurrence: sanitizeOccurrence(procedure.occurrence),
            encounter: encounterId,
          })),
        },
        reference_id: structuredReferenceId("procedure", questionId, path),
      },
    ];
  },
};
