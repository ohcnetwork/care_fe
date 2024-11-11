import { UserModel } from "@/components/Users/models";

import { USER_TYPES, UserRole } from "@/common/constants";

export const showUserDelete = (authUser: UserModel, targetUser: UserModel) => {
  // Auth user should be higher in hierarchy than target user
  if (
    USER_TYPES.indexOf(authUser.user_type) <=
    USER_TYPES.indexOf(targetUser.user_type)
  )
    return false;

  if (
    authUser.user_type === "StateAdmin" &&
    targetUser.state_object?.id === authUser.state
  )
    return true;

  if (
    authUser.user_type === "DistrictAdmin" &&
    targetUser.district_object?.id === authUser.district
  )
    return true;

  return false;
};

export const CameraFeedPermittedUserTypes: UserRole[] = [
  "DistrictAdmin",
  "StateAdmin",
  "StateReadOnlyAdmin",
  "Doctor",
];
