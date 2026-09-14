import type { TFunction } from "i18next";

import { ActionConfigurationContext } from "@/types/actions/actionConfiguration";

const CONTEXT_LABEL_KEYS: Record<ActionConfigurationContext, string> = {
  APPOINTMENT: "action_context_appointment",
  PATIENT: "action_context_patient",
};

const CONTEXT_HINT_KEYS: Record<ActionConfigurationContext, string> = {
  APPOINTMENT: "action_context_appointment_hint",
  PATIENT: "action_context_patient_hint",
};

export function actionContextLabel(
  context: ActionConfigurationContext,
  t: TFunction,
): string {
  return t(CONTEXT_LABEL_KEYS[context]);
}

/** When the backend evaluates configurations of this context — said on the
 *  form so an author knows what they are automating. */
export function actionContextHint(
  context: ActionConfigurationContext,
  t: TFunction,
): string {
  return t(CONTEXT_HINT_KEYS[context]);
}
