import { Badge } from "@/components/ui/badge";
import { PatientListRead } from "@/types/emr/patient/patient";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { LocationDetail } from "@/types/location/location";
import { Organization } from "@/types/organization/organization";
import { UserReadMinimal } from "@/types/user/user";

export enum DeliveryOrderStatus {
  draft = "draft",
  pending = "pending",
  completed = "completed",
  abandoned = "abandoned",
  entered_in_error = "entered_in_error",
}

export const DELIVERY_ORDER_STATUS_COLORS = {
  draft: "secondary",
  pending: "yellow",
  completed: "green",
  abandoned: "destructive",
  entered_in_error: "destructive",
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
  extensions: Record<string, unknown>;
  patient?: string;
}

export interface DeliveryOrderUpdate extends DeliveryOrder {
  id: string;
  supplier?: string;
  origin?: string;
  destination: string;
  extensions?: Record<string, unknown>;
}

export interface DeliveryOrderRetrieve extends DeliveryOrder {
  id: string;
  created_date: string;
  created_by: UserReadMinimal;
  modified_date: string;
  origin?: LocationDetail;
  destination: LocationDetail;
  supplier?: Organization;
  tags: TagConfig[];
  extensions?: Record<string, unknown>;
  patient?: PatientListRead;
  patient_invoice_id?: string;
}
