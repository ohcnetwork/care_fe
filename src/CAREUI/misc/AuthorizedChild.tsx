import { useIsAuthorized } from "../../Common/hooks/useIsAuthorized";
import { AuthorizedForCB } from "../../Utils/AuthorizeFor";

interface Props {
  children: (value: { isAuthorized: boolean }) => JSX.Element;
  authorizeFor: AuthorizedForCB;
}

const AuthorizedChild = (props: Props) => {
  const isAuthorized = useIsAuthorized(props.authorizeFor);
  return props.children({ isAuthorized });
};

export default AuthorizedChild;
