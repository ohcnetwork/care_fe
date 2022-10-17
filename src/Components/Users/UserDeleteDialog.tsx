import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@material-ui/core";

interface ConfirmDialogProps {
  name: string;
  handleCancel: () => void;
  handleOk: () => void;
}

const UserDeleteDialog = (props: ConfirmDialogProps) => {
  const { name, handleCancel, handleOk } = props;

  const [disable, setDisable] = useState(false);

  const handleSubmit = () => {
    handleOk();
    setDisable(true);
  };
  return (
    <Dialog open={true} maxWidth={"md"} onClose={handleCancel}>
      <DialogContent>
        <DialogContentText
          id="alert-dialog-description"
          className="flex text-gray-800 leading-relaxed"
        >
          <div className="justify-center">
            Are you sure you want to delete user <strong>{name}</strong> ?
          </div>
        </DialogContentText>
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

export default UserDeleteDialog;
