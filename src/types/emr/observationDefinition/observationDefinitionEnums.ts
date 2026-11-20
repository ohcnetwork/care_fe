// No imports: the router's search schemas load this file at startup.

export enum ObservationDefinitionCategory {
  SOCIAL_HISTORY = "social_history",
  VITAL_SIGNS = "vital_signs",
  IMAGING = "imaging",
  LABORATORY = "laboratory",
  PROCEDURE = "procedure",
  SURVEY = "survey",
  EXAM = "exam",
  THERAPY = "therapy",
  ACTIVITY = "activity",
}

export enum ObservationDefinitionStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  RETIRED = "retired",
  UNKNOWN = "unknown",
}
