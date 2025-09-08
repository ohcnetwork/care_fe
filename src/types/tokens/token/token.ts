import { PatientRead } from "@/types/emr/patient/patient";
import { HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import { LocationList } from "@/types/location/location";
import {
  Appointment,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import { TokenCategoryRead } from "@/types/tokens/tokenCategory/tokenCategory";
import { TokenQueueRead } from "@/types/tokens/tokenQueue/tokenQueue";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import { UserReadMinimal } from "@/types/user/user";

export enum TokenStatus {
  UNFULFILLED = "UNFULFILLED",
  CREATED = "CREATED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FULFILLED = "FULFILLED",
  CANCELLED = "CANCELLED",
  ENTERED_IN_ERROR = "ENTERED_IN_ERROR",
}

export interface Token {
  id: string;
}

export interface TokenGenerate extends Omit<Token, "id"> {
  patient?: string;
  category: string;
  note?: string;
  sub_queue?: string;
}

export interface TokenGenerateWithQueue extends TokenGenerate {
  resource_type: SchedulableResourceType;
  resource_id: string;
  date: string;
}

export interface TokenUpdate extends Omit<Token, "id"> {
  note: string;
  status: TokenStatus;
  sub_queue?: string;
}

export interface TokenRead extends Token {
  category: TokenCategoryRead;
  sub_queue?: TokenSubQueueRead;
  note: string;
  patient?: PatientRead;
  number: number;
  status: TokenStatus;
  queue: TokenQueueRead;
}

export type TokenRetrieve = TokenRead & {
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
  booking?: Appointment;
} & (
    | {
        resource_type: SchedulableResourceType.Practitioner;
        resource: UserReadMinimal;
      }
    | {
        resource_type: SchedulableResourceType.Location;
        resource: LocationList;
      }
    | {
        resource_type: SchedulableResourceType.HealthcareService;
        resource: HealthcareServiceReadSpec;
      }
  );

export function renderTokenNumber(token: TokenRead) {
  return `${token.category.shorthand}-${token.number.toString().padStart(3, "0")}`;
}
