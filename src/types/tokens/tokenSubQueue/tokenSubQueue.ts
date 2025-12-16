import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenReadMinimal } from "@/types/tokens/token/token";

export enum TokenSubQueueStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

interface TokenSubQueue {
  id: string;
  name: string;
  status: TokenSubQueueStatus;
}

export interface TokenSubQueueCreate extends Omit<TokenSubQueue, "id"> {
  resource_type: SchedulableResourceType;
  resource_id: string;
}

export interface TokenSubQueueRead extends TokenSubQueue {
  current_token: TokenReadMinimal | null;
}

export interface TokenSubQueueUpdate {
  name: string;
  status: TokenSubQueueStatus;
}
