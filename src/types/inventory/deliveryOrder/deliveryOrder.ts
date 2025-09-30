import { Badge } from "@/components/ui/badge";
import { LocationDetail } from "@/types/location/location";
import { Organization } from "@/types/organization/organization";

export enum DeliveryOrderStatus {
  draft = "draft",
  pending = "pending",
  completed = "completed",
  abandoned = "abandoned",
  entered_in_error = "entered_in_error",
}

export const DELIVERY_ORDER_STATUS_COLORS = {
  draft: "gray",
  pending: "yellow",
  completed: "green",
  abandoned: "destructive",
  entered_in_error: "gray",
} as const satisfies Record<
  DeliveryOrderStatus,
  React.ComponentProps<typeof Badge>["variant"]
>;

export interface DeliveryOrder {
  status: DeliveryOrderStatus;
  name: string;
  note?: string;
}

export interface DeliveryOrderCreate extends DeliveryOrder {
  supplier?: string;
  origin?: string;
  destination: string;
}

export interface DeliveryOrderUpdate extends DeliveryOrder {
  id: string;
  supplier?: string;
  origin?: string;
  destination: string;
}

export interface DeliveryOrderRetrieve extends DeliveryOrder {
  id: string;
  created_date: string;
  modified_date: string;
  origin?: LocationDetail;
  destination: LocationDetail;
  supplier?: Organization;
}
