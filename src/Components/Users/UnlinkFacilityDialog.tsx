import React, { useState } from "react";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";

interface ConfirmDialogProps {
  facilityName: string;
  userName: string;
  isHomeFacility: boolean;
  handleCancel: () => void;
  handleOk: () => void;
}

const UnlinkFacilityDialog = (props: ConfirmDialogProps) => {
  const { facilityName, userName, isHomeFacility, handleCancel, handleOk } =
    props;

  const [disable, setDisable] = useState(false);

  const handleSubmit = () => {
    handleOk();
    setDisable(true);
  };
  return (
    <ConfirmDialogV2
      title={
        <span>
          {isHomeFacility ? "Clear Home Facility" : "Unlink User Facility"}
        </span>
      }
      show={true}
      action={isHomeFacility ? "Clear" : "Unlink"}
      onClose={handleCancel}
      onConfirm={handleSubmit}
      disabled={disable}
      variant="danger"
    >
      <div className="flex text-gray-800 leading-relaxed">
        <div>
          Are you sure you want to{" "}
          {isHomeFacility ? "clear the home facility" : "unlink the facility"}{" "}
          <strong>{facilityName}</strong> from user <strong>{userName}</strong>{" "}
          ?
          <br />
          {!isHomeFacility && "The user will lose access to the facility."}
        </div>
      </div>
    </ConfirmDialogV2>
  );
};

export default UnlinkFacilityDialog;
