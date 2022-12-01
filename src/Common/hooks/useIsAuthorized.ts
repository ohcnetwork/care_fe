import { useSelector } from "react-redux";
import { AuthorizedForCB } from "../../Utils/AuthorizeFor";

export const useIsAuthorized = (authorizeFor: AuthorizedForCB) => {
  const state: any = useSelector((state) => state);
  return authorizeFor(state.currentUser.data.user_type);
};
