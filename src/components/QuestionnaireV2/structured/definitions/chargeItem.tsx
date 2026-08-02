import { ChargeItemQuestion } from "@/components/Questionnaire/QuestionTypes/ChargeItemQuestion";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { useLegacyResponseCallback } from "./adapt";

function ChargeItemInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.encounterId || !props.facilityId) return null;
  return (
    <ChargeItemQuestion
      encounterId={props.encounterId}
      facilityId={props.facilityId}
      question={props.question}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
      errors={props.errors}
    />
  );
}

export const chargeItemDefinition: StructuredTypeDefinition<"charge_item"> = {
  type: "charge_item",
  component: ChargeItemInput,
  requires: ["encounterId", "facilityId"],
  draftPolicy: "exclude",
  buildRequests: async (chargeItems, { facilityId, questionId }) => {
    if (chargeItems.length === 0) return [];
    return [
      {
        url: `/api/v1/facility/${facilityId}/charge_item/apply_charge_item_defs/`,
        method: "POST",
        body: {
          requests: chargeItems,
        },
        reference_id: structuredReferenceId("charge_item", questionId),
      },
    ];
  },
};
