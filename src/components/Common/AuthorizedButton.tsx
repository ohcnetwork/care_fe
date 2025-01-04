import * as React from "react";

import AuthorizedChild from "@/CAREUI/misc/AuthorizedChild";

import { Button, ButtonProps } from "@/components/ui/button";

import { AuthorizedElementProps, AuthorizedForCB } from "@/Utils/AuthorizeFor";

type AuthorizedButtonProps = Omit<AuthorizedElementProps, "authorizeFor"> & {
  authorizeFor: AuthorizedForCB;
} & ButtonProps;

const AuthorizedButton: React.FC<AuthorizedButtonProps> = (props) => {
  return (
    <AuthorizedChild authorizeFor={props.authorizeFor}>
      {({ isAuthorized }) => (
        <Button {...props} disabled={props.disabled || !isAuthorized}>
          {props.children}
        </Button>
      )}
    </AuthorizedChild>
  );
};

export default AuthorizedButton;
