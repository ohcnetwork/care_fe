import { PatientListRead } from "@/types/emr/patient/patient";
import { LocationRead } from "@/types/location/location";

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
}

export interface DispenseOrderCreate extends Omit<DispenseOrderBase, "id"> {
  patient: string;
  location: string;
}
