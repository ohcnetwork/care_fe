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
  show: boolean;
  handleCancel: () => void;
  handleOk: () => void;
}

const styles = {
  paper: {
    "max-width": "650px",
    "min-width": "400px",
  },
};

const BedDeleteDialog = (
  props: ConfirmDialogProps & WithStyles<typeof styles>
) => {
  const { name, handleCancel, handleOk, classes } = props;

  const [disable, setDisable] = useState(false);

  const handleSubmit = () => {
    handleOk();
    setDisable(true);
  };
  return (
    <Dialog open={props.show} onClose={handleCancel}>
      <DialogContent>
        <DialogContentText
          id="alert-dialog-description"
          className="text-gray-800 leading-relaxed"
        >
          <p className="inline">Are you sure you want to delete bed</p>
          <p className="inline mx-1 font-semibold capitalize break-words">
            {name}
          </p>
          <p className="inline">?</p>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <div className="flex flex-col md:flex row gap-2">
          <button
            onClick={handleCancel}
            className="btn btn-default w-full md:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="font-medium btn btn-danger w-full md:w-auto"
            disabled={disable}
          >
            Delete
          </button>
        </div>
      </DialogActions>
    </Dialog>
  );
};

export default withStyles(styles)(BedDeleteDialog);
