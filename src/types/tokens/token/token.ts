import { Badge } from "@/components/ui/badge";
import { EncounterListRead } from "@/types/emr/encounter/encounter";
import { PatientListRead } from "@/types/emr/patient/patient";
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

export const TokenActiveStatuses: TokenStatus[] = [
  TokenStatus.UNFULFILLED,
  TokenStatus.CREATED,
  TokenStatus.IN_PROGRESS,
];

export const TokenFinalStatuses: TokenStatus[] = [
  TokenStatus.FULFILLED,
  TokenStatus.CANCELLED,
  TokenStatus.ENTERED_IN_ERROR,
];

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

export enum QueueTokenStatus {
  WAITING = "waiting",
  CALLED = "called",
  RECALL = "recall",
  SERVING = "serving",
}

export const QUEUE_TOKEN_STATUS_COLORS = {
  [QueueTokenStatus.WAITING]: "pink",
  [QueueTokenStatus.CALLED]: "indigo",
  [QueueTokenStatus.RECALL]: "orange",
  [QueueTokenStatus.SERVING]: "green",
} as const satisfies Record<
  QueueTokenStatus,
  React.ComponentProps<typeof Badge>["variant"]
>;

export function getQueueTokenStatus(
  token: Pick<TokenRead, "status" | "sub_queue">,
): QueueTokenStatus {
  if (token.status === TokenStatus.CREATED) {
    return token.sub_queue ? QueueTokenStatus.CALLED : QueueTokenStatus.WAITING;
  }

  if (token.status === TokenStatus.UNFULFILLED) {
    return QueueTokenStatus.RECALL;
  }

  return QueueTokenStatus.SERVING;
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
  sub_queue: string | null;
}

export interface TokenRead extends Token {
  category: TokenCategoryRead;
  sub_queue?: TokenSubQueueRead;
  note: string;
  patient?: PatientListRead;
  number: number;
  status: TokenStatus;
  queue: TokenQueueRead;
}

export type TokenRetrieve = TokenRead & {
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
  booking?: Appointment;
  encounter?: EncounterListRead;
} & ScheduleResource;

export function renderTokenNumber(token: TokenRead) {
  return `${token.category.shorthand}-${token.number.toString().padStart(3, "0")}`;
}
