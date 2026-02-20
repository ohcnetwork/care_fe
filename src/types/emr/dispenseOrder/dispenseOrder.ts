import { Badge } from "@/components/ui/badge";
import { BatchSuccessResponse } from "@/types/base/batch/batch";
import { PatientListRead, PatientRead } from "@/types/emr/patient/patient";
import { LocationRead } from "@/types/location/location";
import { UserReadMinimal } from "@/types/user/user";

export interface DispenseOrderBatchResponse {
  results: BatchSuccessResponse<{ order: DispenseOrderRead }>[];
}

export function extractDispenseOrderFromBatchResponse(
  response: DispenseOrderBatchResponse,
): DispenseOrderRead | undefined {
  const orders = response.results
    .map((item) => item.data?.order)
    .filter((item): item is DispenseOrderRead => !!item);
  return orders[0];
}

export enum DispenseOrderStatus {
  draft = "draft",
  in_progress = "in_progress",
  completed = "completed",
  abandoned = "abandoned",
  entered_in_error = "entered_in_error",
}

export interface DispenseOrderBase {
  id: string;
  status: DispenseOrderStatus;
  name?: string;
  note?: string;
}

export interface DispenseOrderRead extends DispenseOrderBase {
  patient: PatientRead;
  location: LocationRead;
  created_by: UserReadMinimal | null;
  created_date: string;
  modified_date: string;
}

export interface DispenseOrderList extends DispenseOrderBase {
  patient: PatientListRead;
  location: LocationRead;
  created_date: string;
  modified_date: string;
}

export interface DispenseOrderCreate extends Omit<DispenseOrderBase, "id"> {
  patient: string;
  location: string;
}

export const DISPENSE_ORDER_STATUS_STYLES: Record<
  DispenseOrderStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  [DispenseOrderStatus.draft]: "secondary",
  [DispenseOrderStatus.in_progress]: "yellow",
  [DispenseOrderStatus.completed]: "green",
  [DispenseOrderStatus.abandoned]: "secondary",
  [DispenseOrderStatus.entered_in_error]: "destructive",
};
