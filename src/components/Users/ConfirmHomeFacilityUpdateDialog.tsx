import { useState } from "react";

import ConfirmDialog from "@/components/Common/ConfirmDialog";

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
    <ConfirmDialog
      title={<span>Replace Home Facility</span>}
      show={true}
      action={"Replace"}
      onClose={handleCancel}
      onConfirm={handleSubmit}
      disabled={disable}
      variant="danger"
    >
      <div className="flex leading-relaxed text-secondary-800">
        <div>
          Are you sure you want to replace{" "}
          <strong>{previousFacilityName}</strong> with{" "}
          <strong>{newFacilityName}</strong> as home facility for user{" "}
          <strong>{userName}</strong>
          ?
          <br />
        </div>
      </div>
    </ConfirmDialog>
  );
};

export default ConfirmHomeFacilityUpdateDialog;
