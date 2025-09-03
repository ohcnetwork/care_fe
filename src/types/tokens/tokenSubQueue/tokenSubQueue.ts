import { SchedulableResourceType } from "@/types/scheduling/schedule";

export interface TokenSubQueue {
  id: string;
  name: string;
}

export interface TokenSubQueueCreate extends Omit<TokenSubQueue, "id"> {
  resource_type: SchedulableResourceType;
  resource_id: string;
}

export type TokenSubQueueRead = TokenSubQueue;

export interface TokenSubQueueUpdate {
  name: string;
}
