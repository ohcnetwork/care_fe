import React, { useState } from "react";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";

interface ConfirmDialogProps {
  previousFacilityName: string;
  userName: string;
  newFacilityName: string;
  handleCancel: () => void;
  handleOk: () => void;
}

const ConfirmHomeFacilityUpdateDialog = (props: ConfirmDialogProps) => {
  const {
    previousFacilityName,
    userName,
    newFacilityName,
    handleCancel,
    handleOk,
  } = props;

  const [disable, setDisable] = useState(false);

  const handleSubmit = () => {
    handleOk();
    setDisable(true);
  };
  return (
    <ConfirmDialogV2
      title={<span>Replace Home Facility</span>}
      show={true}
      action={"Replace"}
      onClose={handleCancel}
      onConfirm={handleSubmit}
      disabled={disable}
      variant="danger"
    >
      <div className="flex text-gray-800 leading-relaxed">
        <div>
          Are you sure you want to replace{" "}
          <strong>{previousFacilityName}</strong> with{" "}
          <strong>{newFacilityName}</strong> as home facility for user{" "}
          <strong>{userName}</strong>
          ?
          <br />
        </div>
      </div>
    </ConfirmDialogV2>
  );
};

export default ConfirmHomeFacilityUpdateDialog;
