import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { UserReadMinimal } from "@/types/user/user";

export interface TokenCategory {
  id: string;
  name: string;
  resource_type: SchedulableResourceType;
  shorthand: string;
}

export type TokenCategoryCreate = Omit<TokenCategory, "id">;

export type TokenCategoryRead = TokenCategory & {
  default: boolean;
};

/** `resource_type` is fixed at creation and not accepted on update. */
export type TokenCategoryUpdate = Omit<TokenCategoryCreate, "resource_type">;

export interface TokenCategoryRetrieveSpec extends TokenCategoryRead {
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
}
