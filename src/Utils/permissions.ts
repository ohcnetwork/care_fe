import { UserModel } from "@/components/Users/models";

import { UserBase } from "@/types/user/user";

// To do: Rewrite to check if belongs to same org and in higher
// hierarchy
/* const checkIfStateOrDistrictAdminInSameLocation = (
  authUser: UserBaseModel,
  targetUser: UserBaseModel,
) => {
  const hasLocation = Boolean(
    targetUser.state_object || targetUser.district_object,
  );

  const isStateAdminOfSameState =
    authUser.user_type === "StateAdmin" &&
    targetUser.state_object?.id === authUser.state;

  const isDistrictAdminOfSameDistrict =
    authUser.user_type === "DistrictAdmin" &&
    targetUser.district_object?.id === authUser.district;

  return (
    hasLocation && (isStateAdminOfSameState || isDistrictAdminOfSameDistrict)
  );
};
  */
export const showUserDelete = (authUser: UserModel, targetUser: UserBase) => {
  // Auth user should be higher in hierarchy than target user
  // User can't delete their own account
  /*   if (
    USER_TYPES.indexOf(authUser.user_type) <=
      USER_TYPES.indexOf(targetUser.user_type) ||
    authUser.username === targetUser.username
  )
    return false; */
  // To do: check above
  //return checkIfStateOrDistrictAdminInSameLocation(authUser, targetUser);
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
  if (authUser.username === targetUser.username) return true;
  return false;
  // To do: check above
  //return checkIfStateOrDistrictAdminInSameLocation(authUser, targetUser);
};
