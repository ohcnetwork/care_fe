import { useState } from "react";

import ConfirmDialog from "@/components/Common/ConfirmDialog";

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
    <ConfirmDialog
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
      <div className="flex leading-relaxed text-secondary-800">
        <div>
          Are you sure you want to{" "}
          {isHomeFacility ? "clear the home facility" : "unlink the facility"}{" "}
          <strong>{facilityName}</strong> from user <strong>{userName}</strong>{" "}
          ?
          <br />
          {!isHomeFacility && "The user will lose access to the facility."}
        </div>
      </div>
    </ConfirmDialog>
  );
};

export default UnlinkFacilityDialog;
