import React, { useState } from "react";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";

interface ConfirmDialogProps {
  facilityName: string;
  userName: string;
  handleCancel: () => void;
  handleOk: () => void;
}

const UnlinkFacilityDialog = (props: ConfirmDialogProps) => {
  const { facilityName, userName, handleCancel, handleOk } = props;

  const [disable, setDisable] = useState(false);

  const handleSubmit = () => {
    handleOk();
    setDisable(true);
  };
  return (
    <ConfirmDialogV2
      title={<span>Unlink User Facility</span>}
      show={true}
      action="Delete"
      onClose={handleCancel}
      onConfirm={handleSubmit}
      disabled={disable}
      variant="danger"
    >
      <div className="flex text-gray-800 leading-relaxed">
        <div>
          Are you sure you want to unlink the facility{" "}
          <strong>{facilityName}</strong> from user <strong>{userName}</strong>?
          <br />
          The user will lose access to the facility.
        </div>
      </div>
    </ConfirmDialogV2>
  );
};

export default UnlinkFacilityDialog;
