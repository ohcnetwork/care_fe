// No imports: the router's search schemas load this file at startup.

export enum ResourceRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  TRANSPORTATION_TO_BE_ARRANGED = "transportation_to_be_arranged",
  TRANSFER_IN_PROGRESS = "transfer_in_progress",
  COMPLETED = "completed",
}
