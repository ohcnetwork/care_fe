import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenStatus } from "@/types/tokens/token/token";
import { UserReadMinimal } from "@/types/user/user";

export interface TokenQueue {
  id: string;
  name: string;
  date: string;
  is_primary: boolean;
}

export interface TokenQueueCreate
  extends Omit<TokenQueue, "id" | "is_primary"> {
  resource_type: SchedulableResourceType;
  resource_id: string;
  set_is_primary: boolean;
}

export interface TokenQueueRead extends TokenQueue {
  system_generated: boolean;
}

export interface TokenQueueUpdate {
  name: string;
}

export interface TokenQueueRetrieveSpec extends TokenQueueRead {
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
}

export interface TokenQueueSummary {
  [categoryName: string]: {
    [status in TokenStatus]: number;
  };
}
