import { QuestionnaireAction } from "@/types/questionnaire/actions";
import { UserReadMinimal } from "@/types/user/user";

/**
 * Action configurations — the backend's `Action` model
 * (`care/emr/resources/action/spec.py`): a named list of actions evaluated
 * for a record that is not a questionnaire. Viewsets opt in per model
 * (`EMRActionBaseViewSet`): bookings and slots run the `APPOINTMENT`
 * configurations when an appointment is created. Instance-level only for
 * now — the API rejects facility-scoped configurations.
 */

/** `ActionContextOptions` on the backend. */
export const ACTION_CONFIGURATION_CONTEXTS = [
  "APPOINTMENT",
  "PATIENT",
] as const;

export type ActionConfigurationContext =
  (typeof ACTION_CONFIGURATION_CONTEXTS)[number];

/** The registry context type each option evaluates under — what its
 *  conditions and instructions resolve against (`ACTION_CONTEXT_CLASS` on
 *  the viewsets). PATIENT is declared but no endpoint runs it yet. */
export const ACTION_CONFIGURATION_CONTEXT_TYPES: Record<
  ActionConfigurationContext,
  string
> = {
  APPOINTMENT: "Appointment",
  PATIENT: "Patient",
};

export interface ActionConfigurationBase {
  name: string;
  description?: string;
  actions: QuestionnaireAction[];
}

export interface ActionConfigurationRead extends ActionConfigurationBase {
  id: string;
  /** May also be triggered by hand on a record (`execute_action`), besides
   *  its automatic run. */
  performable: boolean;
  action_context: ActionConfigurationContext;
  facility: { id: string; name: string } | null;
}

export interface ActionConfigurationRetrieve extends ActionConfigurationRead {
  created_date: string;
  modified_date: string;
  created_by: UserReadMinimal | null;
  updated_by: UserReadMinimal | null;
}

/** `ActionConfigurationWriteSpec` — context and `performable` are set at
 *  creation only; the update spec does not carry them. */
export interface ActionConfigurationCreate extends ActionConfigurationBase {
  performable: boolean;
  action_context: ActionConfigurationContext;
  facility?: string | null;
}

export type ActionConfigurationUpdate = ActionConfigurationBase;
