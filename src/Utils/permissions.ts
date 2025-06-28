import { UserModel } from "@/components/Users/models";

import { UserBase } from "@/types/user/user";

export const showUserDelete = (authUser: UserModel, targetUser: UserBase) => {
  // Auth user should be higher in hierarchy than target user
  // User can't delete their own account
  if (authUser.username === targetUser.username) return false;
  return false;
};

export const showUserPasswordReset = (
  authUser: UserModel,
  targetUser: UserBase,
) => {
  return authUser.username === targetUser.username;
};

export const showAvatarEdit = (authUser: UserModel, targetUser: UserBase) => {
  return authUser.username === targetUser.username || authUser.is_superuser;
};

export const editUserPermissions = (
  authUser: UserModel,
  targetUser: UserBase,
) => {
  return authUser.username === targetUser.username;
};
