// No imports: the router's search schemas load this file at startup.

export enum DeliveryOrderStatus {
  draft = "draft",
  pending = "pending",
  completed = "completed",
  abandoned = "abandoned",
  entered_in_error = "entered_in_error",
}
