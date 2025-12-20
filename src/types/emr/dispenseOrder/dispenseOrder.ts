import { BatchSuccessResponse } from "@/types/base/batch/batch";
import { PatientListRead } from "@/types/emr/patient/patient";
import { LocationRead } from "@/types/location/location";

export interface DispenseOrderBatchResponse {
  results: BatchSuccessResponse<{ order: DispenseOrderRead }>[];
}

export function extractDispenseOrderFromBatchResponse(
  response: DispenseOrderBatchResponse,
): DispenseOrderRead {
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
  patient: PatientListRead;
  location: LocationRead;
  created_date: string;
  modified_date: string;
}

export interface DispenseOrderCreate extends Omit<DispenseOrderBase, "id"> {
  patient: string;
  location: string;
}
