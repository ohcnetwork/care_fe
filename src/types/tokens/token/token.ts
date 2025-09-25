import { Badge } from "@/components/ui/badge";
import { PatientRead } from "@/types/emr/patient/patient";
import {
  Appointment,
  SchedulableResourceType,
  ScheduleResource,
} from "@/types/scheduling/schedule";
import { TokenCategoryRead } from "@/types/tokens/tokenCategory/tokenCategory";
import { TokenQueueRead } from "@/types/tokens/tokenQueue/tokenQueue";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import { UserReadMinimal } from "@/types/user/user";

export enum TokenStatus {
  UNFULFILLED = "UNFULFILLED",
  CREATED = "CREATED",
  IN_PROGRESS = "IN_PROGRESS",
  FULFILLED = "FULFILLED",
  CANCELLED = "CANCELLED",
  ENTERED_IN_ERROR = "ENTERED_IN_ERROR",
}

export const TOKEN_STATUS_COLORS = {
  UNFULFILLED: "secondary",
  CREATED: "blue",
  IN_PROGRESS: "yellow",
  FULFILLED: "green",
  CANCELLED: "destructive",
  ENTERED_IN_ERROR: "destructive",
} as const satisfies Record<
  TokenStatus,
  React.ComponentProps<typeof Badge>["variant"]
>;

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
  sub_queue: string | null;
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
} & ScheduleResource;

export function renderTokenNumber(token: TokenRead) {
  return `${token.category.shorthand}-${token.number.toString().padStart(3, "0")}`;
}
