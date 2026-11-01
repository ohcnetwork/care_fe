import { UserRead } from "@/types/user/user";

export type userChildProps = {
  userData: UserRead;
  username: string;
  permissions?: string[];
};
