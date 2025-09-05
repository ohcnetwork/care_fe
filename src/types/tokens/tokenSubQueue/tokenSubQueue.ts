import { SchedulableResourceType } from "@/types/scheduling/schedule";

export enum TokenSubQueueStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface TokenSubQueue {
  id: string;
  name: string;
  status: TokenSubQueueStatus;
}

export interface TokenSubQueueCreate extends Omit<TokenSubQueue, "id"> {
  resource_type: SchedulableResourceType;
  resource_id: string;
}

export type TokenSubQueueRead = TokenSubQueue;

export interface TokenSubQueueUpdate {
  name: string;
  status: TokenSubQueueStatus;
}
