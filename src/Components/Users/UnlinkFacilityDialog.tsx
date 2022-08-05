import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@material-ui/core";

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
    <Dialog open={true} onClose={handleCancel}>
      <DialogContent>
        <div className="md:min-w-[400px] max-w-[650px]">
          <DialogContentText
            id="alert-dialog-description"
            className="flex text-gray-800 leading-relaxed sm:min-w-[400px]"
          >
            <div>
              Are you sure you want to unlink the facility{" "}
              <strong>{facilityName}</strong> from user{" "}
              <strong>{userName}</strong>? The user will lose access to the
              facility.
            </div>
          </DialogContentText>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="primary">
          Cancel
        </Button>
        <button
          onClick={handleSubmit}
          className="font-medium btn btn-danger"
          disabled={disable}
        >
          Delete
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default UnlinkFacilityDialog;
