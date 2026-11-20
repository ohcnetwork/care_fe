// No imports: the router's search schemas load this file at startup.

export enum PrescriptionStatus {
  // Prescription awaiting dispense
  active = "active",
  // The order moved to dispense state
  completed = "completed",
  // The order was cancelled
  cancelled = "cancelled",
}
