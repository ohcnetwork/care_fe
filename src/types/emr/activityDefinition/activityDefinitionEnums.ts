// No imports: the router's search schemas load this file at startup.

export enum Status {
  draft = "draft",
  active = "active",
  retired = "retired",
  unknown = "unknown",
}

export enum Classification {
  laboratory = "laboratory",
  imaging = "imaging",
  surgical_procedure = "surgical_procedure",
  counselling = "counselling",
  education = "education",
}
