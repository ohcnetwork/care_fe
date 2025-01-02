import { Button, ButtonProps } from "@headlessui/react";

import AuthorizedChild from "@/CAREUI/misc/AuthorizedChild";

import { AuthorizedElementProps } from "@/Utils/AuthorizeFor";

export const AuthorizedButton: React.FC<
  AuthorizedElementProps & ButtonProps
> = ({ authorizeFor = () => true, ...props }) => {
  return (
    <AuthorizedChild authorizeFor={authorizeFor}>
      {({ isAuthorized }) => (
        <Button {...props} disabled={props.disabled || !isAuthorized}>
          {props.children}
        </Button>
      )}
    </AuthorizedChild>
  );
};
