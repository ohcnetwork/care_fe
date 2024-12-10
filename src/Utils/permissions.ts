import { UserModel } from "@/components/Users/models";

import { USER_TYPES, UserRole } from "@/common/constants";

const checkIfStateOrDistrictAdminInSameLocation = (
  authUser: UserModel,
  targetUser: UserModel,
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

export const showUserDelete = (authUser: UserModel, targetUser: UserModel) => {
  // Auth user should be higher in hierarchy than target user
  // User can't delete their own account
  if (
    USER_TYPES.indexOf(authUser.user_type) <=
      USER_TYPES.indexOf(targetUser.user_type) ||
    authUser.username === targetUser.username
  )
    return false;

  return checkIfStateOrDistrictAdminInSameLocation(authUser, targetUser);
};

export const showUserPasswordReset = (
  authUser: UserModel,
  targetUser: UserModel,
) => {
  return authUser.username === targetUser.username;
};

export const showAvatarEdit = (authUser: UserModel, targetUser: UserModel) => {
  return authUser.username === targetUser.username || authUser.is_superuser;
};
export const editUserPermissions = (
  authUser: UserModel,
  targetUser: UserModel,
) => {
  if (authUser.username === targetUser.username || authUser.is_superuser)
    return true;
  return checkIfStateOrDistrictAdminInSameLocation(authUser, targetUser);
};
export const CameraFeedPermittedUserTypes: UserRole[] = [
  "DistrictAdmin",
  "StateAdmin",
  "StateReadOnlyAdmin",
  "Doctor",
];
