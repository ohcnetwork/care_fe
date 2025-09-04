import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { UserReadMinimal } from "@/types/user/user";

export interface TokenQueue {
  id: string;
  name: string;
  date: string;
  set_is_primary: boolean;
}

export interface TokenQueueCreate extends Omit<TokenQueue, "id"> {
  resource_type: SchedulableResourceType;
  resource_id: string;
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
