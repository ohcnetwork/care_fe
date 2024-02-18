import { AuthorizedForCB } from "../../Utils/AuthorizeFor";
import useAuthUser from "./useAuthUser";

export const useIsAuthorized = (authorizeFor: AuthorizedForCB) => {
  const authUser = useAuthUser();
  return authorizeFor(authUser.user_type);
};
