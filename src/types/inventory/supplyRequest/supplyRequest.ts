import { Badge } from "@/components/ui/badge";

import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { LocationDetail } from "@/types/location/location";
import { Organization } from "@/types/organization/organization";

export enum SupplyRequestStatus {
  draft = "draft",
  active = "active",
  suspended = "suspended",
  cancelled = "cancelled",
  processed = "processed",
  completed = "completed",
  entered_in_error = "entered_in_error",
}

export const SUPPLY_REQUEST_STATUS_COLORS = {
  draft: "secondary",
  active: "primary",
  suspended: "yellow",
  cancelled: "destructive",
  completed: "green",
  entered_in_error: "destructive",
  processed: "orange",
} as const satisfies Record<
  SupplyRequestStatus,
  React.ComponentProps<typeof Badge>["variant"]
>;

export enum SupplyRequestIntent {
  proposal = "proposal",
  plan = "plan",
  directive = "directive",
  order = "order",
  original_order = "original_order",
  reflex_order = "reflex_order",
  filler_order = "filler_order",
  instance_order = "instance_order",
}

export enum SupplyRequestCategory {
  central = "central",
  nonstock = "nonstock",
}

export enum SupplyRequestPriority {
  routine = "routine",
  urgent = "urgent",
  asap = "asap",
  stat = "stat",
}

export const SUPPLY_REQUEST_PRIORITY_COLORS = {
  stat: "secondary",
  urgent: "yellow",
  asap: "destructive",
  routine: "indigo",
} as const satisfies Record<SupplyRequestPriority, string>;

export enum SupplyRequestReason {
  patient_care = "patient_care",
  ward_stock = "ward_stock",
}

export interface SupplyRequestBase {
  id: string;
  status: SupplyRequestStatus;
  intent: SupplyRequestIntent;
  category: SupplyRequestCategory;
  priority: SupplyRequestPriority;
  reason: SupplyRequestReason;
  quantity: number;
}

export interface SupplyRequestCreate extends Omit<SupplyRequestBase, "id"> {
  deliver_from?: string; // Location ID
  deliver_to: string; // Location ID
  item: string; // ProductKnowledge ID
  supplier?: string; // Organization ID
}

export interface SupplyRequestUpsert extends Omit<SupplyRequestBase, "id"> {
  id?: string;
  deliver_from?: string; // Location ID
  deliver_to: string; // Location ID
  item: string; // ProductKnowledge ID
}

export interface SupplyRequestRead extends SupplyRequestBase {
  item: ProductKnowledgeBase;
  deliver_from?: LocationDetail;
  deliver_to: LocationDetail;
  supplier?: Organization;
}
