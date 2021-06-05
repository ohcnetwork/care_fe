import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@material-ui/core";
import { WithStyles, withStyles } from "@material-ui/styles";

interface ConfirmDialogProps {
  name: string;
  handleCancel: () => void;
  handleOk: () => void;
}

const styles = {
  paper: {
    "max-width": "650px",
    "min-width": "400px",
  },
};

const UserDeleteDialog = (
  props: ConfirmDialogProps & WithStyles<typeof styles>
) => {
  const { name, handleCancel, handleOk, classes } = props;

  const [disable, setDisable] = useState(false);

  const handleSubmit = () => {
    handleOk();
    setDisable(true);
  };
  return (
    <Dialog
      open={true}
      classes={{
        paper: classes.paper,
      }}
      onClose={handleCancel}
    >
      <DialogContent>
        <DialogContentText
          id="alert-dialog-description"
          className="flex text-gray-800 leading-relaxed"
        >
          <div className="flex">
            Are you sure you want to delete user{" "}
            <p className="mx-1 font-semibold capitalize">{name}</p> ?
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

export default withStyles(styles)(UserDeleteDialog);
