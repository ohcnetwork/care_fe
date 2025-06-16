import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { LocationDetail } from "@/types/location/location";

export enum SupplyRequestStatus {
  draft = "draft",
  active = "active",
  suspended = "suspended",
  cancelled = "cancelled",
  processed = "processed",
  completed = "completed",
  entered_in_error = "entered_in_error",
}

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
}

export const getSupplyRequestStatusBadgeColor = (
  status: SupplyRequestStatus,
) => {
  switch (status) {
    case SupplyRequestStatus.active:
      return "bg-green-100 text-green-800";
    case SupplyRequestStatus.completed:
      return "bg-blue-100 text-blue-800";
    case SupplyRequestStatus.cancelled:
      return "bg-red-100 text-red-800";
    case SupplyRequestStatus.processed:
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getSupplyRequestPriorityBadgeColor = (
  priority: SupplyRequestPriority,
) => {
  switch (priority) {
    case SupplyRequestPriority.urgent:
      return "bg-red-100 text-red-800";
    case SupplyRequestPriority.asap:
      return "bg-orange-100 text-orange-800";
    case SupplyRequestPriority.stat:
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
};
