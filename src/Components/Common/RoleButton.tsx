import id from "date-fns/esm/locale/id/index.js";
import React from "react";
import { useSelector } from "react-redux";

// role types to manage button disable functionality
// readOnly = all user types with read only access
export type roleType = "readOnly";

/*
Component to render button "enable" or "disable" based
on user role
*/

// Decide whether to disable button or not
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

export function RoleButton(props: {
  id?: string;
  className?: string;
  handleClickCB: () => void;
  children: React.ReactNode;
  disableFor: roleType;
}) {
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const type = currentUser.data.user_type;

  return (
    <button
      id={props.id}
      className={props.className}
      onClick={props.handleClickCB}
      disabled={getDisableButton(type, props.disableFor)}
    >
      {props.children}
    </button>
  );
}
