
export type ExtractPathParamKeys<Path extends string> =
  Path extends `${string}{${infer Param}}${infer Rest}`
  ? Param | ExtractPathParamKeys<Rest>
  : never;


export type PathParamsObject<R extends { path: string }> = {
  [K in ExtractPathParamKeys<R["path"]>]: string;
};

export type QueryParamsObject<R extends { TQuery?: Record<string, any> }> =
  R["TQuery"] extends Record<string, any> ? R["TQuery"] : Record<string, never>;

// Centralized key map, will be use in case of type and mutationroute key
export const OfflineKeyMap = {
  create_patient: "create_patient",
  update_patient: "update_patient",
  create_encounter: "create_encounter",
  mark_encounter_as_complete: "mark_encounter_as_complete",
  create_resource_request: "create_resource_request",
  update_resource_request: "update_resource_request",
  assign_user_to_patient: "assign_user_to_patient",
  remove_user_from_patient: "remove_user_from_patient",
  create_appointment: "create_appointment",
  reschedule_appointment: "reschedule_appointment",
  update_appointment_status: "update_appointment_status",
  cancel_appointment: "cancel_appointment",
  non_structured_questionnaire: "non_structured_questionnaire",
  update_encounter_questionnaire: "update_encounter_questionnaire",
  structured_questionnair: "structured_questionnair",
  allergy_intolerance: "allergy_intolerance",
  diagnosis: "diagnosis",
  medication_request: "medication_request",
  medication_statement: "medication_statement",
  symptom: "symptom",
  encounter: "encounter",
  appointment: "appointment",
  files: "files",
  time_of_death: "time_of_death",
  charge_item: "charge_item",
  service_request: "service_request",
} as const;


export type OfflineKey = (typeof OfflineKeyMap)[keyof typeof OfflineKeyMap];
