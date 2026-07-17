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

export enum QueueTokenStatus {
  WAITING = "waiting",
  CALLED = "called",
  RECALL = "recall",
  SERVING = "serving",
  FULFILLED = "fulfilled",
  CANCELLED = "cancelled",
  ENTERED_IN_ERROR = "entered_in_error",
}

export const QUEUE_TOKEN_STATUS_COLORS = {
  [QueueTokenStatus.WAITING]: "pink",
  [QueueTokenStatus.CALLED]: "indigo",
  [QueueTokenStatus.RECALL]: "orange",
  [QueueTokenStatus.SERVING]: "green",
  [QueueTokenStatus.FULFILLED]: "green",
  [QueueTokenStatus.CANCELLED]: "destructive",
  [QueueTokenStatus.ENTERED_IN_ERROR]: "destructive",
} as const satisfies Record<
  QueueTokenStatus,
  React.ComponentProps<typeof Badge>["variant"]
>;

const TOKEN_TO_QUEUE_STATUS = {
  [TokenStatus.UNFULFILLED]: QueueTokenStatus.RECALL,
  [TokenStatus.IN_PROGRESS]: QueueTokenStatus.SERVING,
  [TokenStatus.FULFILLED]: QueueTokenStatus.FULFILLED,
  [TokenStatus.CANCELLED]: QueueTokenStatus.CANCELLED,
  [TokenStatus.ENTERED_IN_ERROR]: QueueTokenStatus.ENTERED_IN_ERROR,
  [TokenStatus.CREATED]: QueueTokenStatus.WAITING,
};

export function getQueueTokenStatus(
  token: Pick<TokenRead, "status" | "sub_queue">,
): QueueTokenStatus {
  if (token.status === TokenStatus.CREATED) {
    return token.sub_queue ? QueueTokenStatus.CALLED : QueueTokenStatus.WAITING;
  }

  return TOKEN_TO_QUEUE_STATUS[token.status];
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
