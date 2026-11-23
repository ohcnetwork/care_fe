import { UserRetrieveSpec } from "@/types/user/user";

export type userChildProps = {
  userData: UserRetrieveSpec;
  username: string;
  permissions?: string[];
};
