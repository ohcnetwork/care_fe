import * as React from "react";

import AuthorizedChild from "@/CAREUI/misc/AuthorizedChild";

import { Button, ButtonProps } from "@/components/ui/button";

import { AuthorizedElementProps } from "@/Utils/AuthorizeFor";

const AuthorizedButton: React.FC<AuthorizedElementProps & ButtonProps> = ({
  authorizeFor,
  ...props
}) => {
  if (!authorizeFor) {
    throw new Error(
      "The 'authorizeFor' prop is required for AuthorizedButton.",
    );
  }
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

export default AuthorizedButton;
