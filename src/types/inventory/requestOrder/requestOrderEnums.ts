// No imports: the router's search schemas load this file at startup.

export enum RequestOrderStatus {
  draft = "draft",
  pending = "pending",
  completed = "completed",
  abandoned = "abandoned",
  entered_in_error = "entered_in_error",
}

export enum RequestOrderPriority {
  routine = "routine",
  urgent = "urgent",
  asap = "asap",
  stat = "stat",
}
