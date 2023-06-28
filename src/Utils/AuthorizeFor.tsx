import { UserRole } from "../Common/constants";

export type AuthorizedForCB = (userType: UserRole) => boolean;
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
