import { ReactNode } from "react";

import useAuthUser from "@/hooks/useAuthUser";
import { useIsAuthorized } from "@/hooks/useIsAuthorized";
import useSlug from "@/hooks/useSlug";

import { AuthorizedForCB } from "@/Utils/AuthorizeFor";

interface Props {
  children: (value: { isAuthorized: boolean }) => JSX.Element;
  authorizeFor: AuthorizedForCB;
}

const AuthorizedChild = (props: Props) => {
  const isAuthorized = useIsAuthorized(props.authorizeFor);
  return props.children({ isAuthorized });
};

export default AuthorizedChild;

export const AuthorizedForConsultationRelatedActions = (props: {
  children: ReactNode;
}) => {
  const me = useAuthUser();
  const facilityId = useSlug("facility");

  if (
    me.home_facility_object?.id === facilityId ||
    me.user_type === "DistrictAdmin" ||
    me.user_type === "StateAdmin"
  ) {
    return props.children;
  }

  return null;
};
