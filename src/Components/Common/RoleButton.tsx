import React from "react";
import { useSelector } from "react-redux";
import Button from "@material-ui/core/Button";
import { ButtonProps } from "@material-ui/core/Button";

export type roleType = "readOnly";
export type buttonType = "html" | "materialUI";

const getDisableButton: (userType: string, disableFor: roleType) => boolean = (
  userType,
  disableFor
) => {
  switch (disableFor) {
    case "readOnly":
      if (
        userType === "StaffReadOnly" ||
        userType === "StateReadOnlyAdmin" ||
        userType === "DistrictReadOnlyAdmin"
      )
        return true;
      else return false;
    default:
      return false;
  }
};

/**
 * **Deprecated.**
 *
 * Use `ButtonV2` and set `authorizedFor` prop with desired access control.
 */
export function RoleButton(props: {
  id?: string;
  className?: string;
  handleClickCB: () => void;
  children: React.ReactNode;
  disableFor: roleType;
  disabled?: boolean;
  materialButtonProps?: ButtonProps;
  buttonType: buttonType;
}) {
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const type = currentUser.data.user_type;

  const renderHtmlButton = () => {
    return (
      <button
        id={props.id}
        className={props.className}
        onClick={props.handleClickCB}
        disabled={getDisableButton(type, props.disableFor) || props.disabled}
      >
        {props.children}
      </button>
    );
  };

  const renderMaterialUIButton = () => {
    return (
      <Button
        id={props.id}
        className={props.className}
        {...props.materialButtonProps}
        onClick={props.handleClickCB}
        disabled={getDisableButton(type, props.disableFor) || props.disabled}
      >
        {props.children}
      </Button>
    );
  };

  switch (props.buttonType) {
    case "html":
      return renderHtmlButton();
    case "materialUI":
      return renderMaterialUIButton();
  }
}
