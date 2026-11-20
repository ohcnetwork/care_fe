// No imports: the router's search schemas load this file at startup.

export const TemplateStatuses = ["draft", "active", "retired"] as const;

export const TemplateTypes = [
  "discharge_summary",
  "patient_summary",
  "account_report",
] as const;
