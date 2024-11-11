import React from "react";

import Error404 from "@/components/ErrorPages/404";

import useAuthUser from "@/hooks/useAuthUser";

import { UserRole } from "@/common/constants";

export type AuthorizedForCB = (userType: UserRole) => boolean;

interface AuthorizeUserRouteProps {
  userTypes: UserRole[];
  children: React.ReactNode;
}

export type AuthorizedElementProps = {
  /**
   * Restrict access of this button to specific roles.
   *
   * **Example:**
   * ```jsx
   * <ButtonV2 authorizedFor={(role) => !role.includes('ReadOnly')}>
   *   Delete Facility
   * </ButtonV2>
   * <ButtonV2 authorizedFor={AuthorizeFor.Admins}>
   *   Delete Facility
   * </ButtonV2>
   * ```
   */
  authorizeFor?: AuthorizedForCB | undefined;
};

export const NonReadOnlyUsers = (userType: UserRole) =>
  !userType.includes("ReadOnly");

export const Anyone = () => true;

export default function (userTypes: UserRole[]) {
  return (userType: UserRole) => userTypes.includes(userType);
}

export const AuthorizeUserRoute: React.FC<AuthorizeUserRouteProps> = ({
  userTypes,
  children,
}) => {
  const authUser = useAuthUser();
  if (userTypes.includes(authUser.user_type)) {
    return <>{children}</>;
  } else {
    return <Error404 />;
  }
};
