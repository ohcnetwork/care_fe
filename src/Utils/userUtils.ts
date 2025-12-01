import { UserBase } from "@/types/user/user";

export const formatUserName = (
  user: Pick<UserBase, "prefix" | "first_name" | "last_name" | "suffix">,
): string => {
  const parts = [
    user.prefix,
    user.first_name,
    user.last_name,
    user.suffix,
  ].filter(Boolean);

  return parts.join(" ");
};
