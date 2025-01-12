import { UserType } from "@/components/Users/UserFormValidations";

export type AuthorizedForCB = (userType: UserType) => boolean;

/**
 * @deprecated
 */
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

/**
 * @deprecated
 * Use permissions from backend instead
 */
export const NonReadOnlyUsers = (userType: UserType) =>
  !userType.includes("ReadOnly");

export const Anyone = () => true;
