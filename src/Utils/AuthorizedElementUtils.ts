import { useSelector } from "react-redux";

export type AuthorizedForCB = (userType: string) => boolean;
export const AuthorizedFor = {
  NonReadOnlyUsers: (t: string) => !t.includes("ReadOnly"),
  Anyone: () => true,
};
export type AuthorizedElementProps = {
  /**
   * Restrict access of this button to specific roles.
   *
   * **Example:**
   * ```jsx
   * <ButtonV2 authorizedFor={(role) => !role.includes('ReadOnly')}>
   *   Delete Facility
   * </ButtonV2>
   * <ButtonV2 authorizedFor={AuthorizedFor.Admins}>
   *   Delete Facility
   * </ButtonV2>
   * ```
   */
  authorizedFor?: AuthorizedForCB | undefined;
};

export const useIsAuthorized = (authorizedFor: AuthorizedForCB) => {
  const state: any = useSelector((state) => state);
  return authorizedFor(state.currentUser.data.user_type);
};
