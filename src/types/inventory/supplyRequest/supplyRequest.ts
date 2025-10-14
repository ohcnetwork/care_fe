import { Badge } from "@/components/ui/badge";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { RequestOrderRetrieve } from "@/types/inventory/requestOrder/requestOrder";

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

export interface SupplyRequestBase {
  id: string;
  status: SupplyRequestStatus;
  quantity: number;
}

export interface SupplyRequestCreate extends Omit<SupplyRequestBase, "id"> {
  item: string; // ProductKnowledge ID
  order: string; // Request Order ID
}

export interface SupplyRequestUpsert extends Omit<SupplyRequestBase, "id"> {
  id?: string;
  item: string; // ProductKnowledge ID
  order: string; // Request Order ID
}

export interface SupplyRequestRead extends SupplyRequestBase {
  item: ProductKnowledgeBase;
  order: RequestOrderRetrieve;
}
