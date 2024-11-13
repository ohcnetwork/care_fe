import { UserModel } from "@/components/Users/models";

import { USER_TYPES, UserRole } from "@/common/constants";

const checkIfStateOrDistrictAdminInSameDistrict = (
  authUser: UserModel,
  targetUser: UserModel,
) => {
  return (
    (authUser.user_type === "StateAdmin" &&
      targetUser.state_object?.id === authUser.state) ||
    (authUser.user_type === "DistrictAdmin" &&
      targetUser.district_object?.id === authUser.district)
  );
};

export const showUserDelete = (authUser: UserModel, targetUser: UserModel) => {
  // Auth user should be higher in hierarchy than target user
  if (
    USER_TYPES.indexOf(authUser.user_type) <=
    USER_TYPES.indexOf(targetUser.user_type)
  )
    return false;

  return checkIfStateOrDistrictAdminInSameDistrict(authUser, targetUser);
};

export const showUserPasswordReset = (
  authUser: UserModel,
  targetUser: UserModel,
) => {
  if (authUser.username === targetUser.username) return true;

  // Auth user should be higher in hierarchy than target user
  if (
    USER_TYPES.indexOf(authUser.user_type) <=
    USER_TYPES.indexOf(targetUser.user_type)
  )
    return false;

  return checkIfStateOrDistrictAdminInSameDistrict(authUser, targetUser);
};

export const CameraFeedPermittedUserTypes: UserRole[] = [
  "DistrictAdmin",
  "StateAdmin",
  "StateReadOnlyAdmin",
  "Doctor",
];
