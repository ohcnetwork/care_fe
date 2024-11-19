import useAuthUser from "@/hooks/useAuthUser";

import { AuthorizedForCB } from "@/Utils/AuthorizeFor";

export const useIsAuthorized = (authorizeFor: AuthorizedForCB) => {
  const authUser = useAuthUser();
  return authorizeFor(authUser.user_type);
};
