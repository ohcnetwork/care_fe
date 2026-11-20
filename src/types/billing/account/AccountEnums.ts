// No imports: the router's search schemas load this file at startup.

export enum AccountStatus {
  active = "active",
  inactive = "inactive",
  entered_in_error = "entered_in_error",
  on_hold = "on_hold",
}

export enum AccountBillingStatus {
  open = "open",
  carecomplete_notbilled = "carecomplete_notbilled",
  billing = "billing",
  closed_baddebt = "closed_baddebt",
  closed_voided = "closed_voided",
  closed_completed = "closed_completed",
  closed_combined = "closed_combined",
}
