import React from "react";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

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
   * <AuthorizedButton authorizedFor={(role) => !role.includes('ReadOnly')}>
   *   Delete Facility
   * </AuthorizedButton>
   * <AuthorizedButton authorizedFor={AuthorizeFor.Admins}>
   *   Delete Facility
   * </AuthorizedButton>
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
    return <ErrorPage />;
  }
};
