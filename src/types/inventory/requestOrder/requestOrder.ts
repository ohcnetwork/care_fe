import { Badge } from "@/components/ui/badge";
import { LocationDetail } from "@/types/location/location";
import { Organization } from "@/types/organization/organization";

export enum RequestOrderStatus {
  draft = "draft",
  pending = "pending",
  in_progress = "in_progress",
  completed = "completed",
  abandoned = "abandoned",
  entered_in_error = "entered_in_error",
}

export enum RequestOrderIntent {
  proposal = "proposal",
  plan = "plan",
  directive = "directive",
  order = "order",
  original_order = "original_order",
  reflex_order = "reflex_order",
  filler_order = "filler_order",
  instance_order = "instance_order",
}

export const REQUEST_ORDER_STATUS_COLORS = {
  draft: "gray",
  pending: "yellow",
  in_progress: "green",
  completed: "green",
  abandoned: "destructive",
  entered_in_error: "gray",
} as const satisfies Record<
  RequestOrderStatus,
  React.ComponentProps<typeof Badge>["variant"]
>;

export enum RequestOrderCategory {
  central = "central",
  nonstock = "nonstock",
}

export enum RequestOrderPriority {
  routine = "routine",
  urgent = "urgent",
  asap = "asap",
  stat = "stat",
}

export const REQUEST_ORDER_PRIORITY_COLORS = {
  stat: "secondary",
  urgent: "yellow",
  asap: "destructive",
  routine: "indigo",
} as const satisfies Record<RequestOrderPriority, string>;

export enum RequestOrderReason {
  patient_care = "patient_care",
  ward_stock = "ward_stock",
}

export interface RequestOrder {
  status: RequestOrderStatus;
  name: string;
  note?: string;
  intent: RequestOrderIntent;
  category: RequestOrderCategory;
  priority: RequestOrderPriority;
  reason: RequestOrderReason;
}

export interface RequestOrderCreate extends RequestOrder {
  supplier?: string;
  origin?: string;
  destination: string;
}

export interface RequestOrderUpdate extends RequestOrder {
  id: string;
  supplier?: string;
  origin?: string;
  destination: string;
}

export interface RequestOrderRetrieve extends RequestOrder {
  id: string;
  created_date: string;
  modified_date: string;
  origin?: LocationDetail;
  destination: LocationDetail;
  supplier?: Organization;
}
