import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";
import React, { useState } from "react";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  paperFullWidth: {
    overflowY: "visible",
  },
  dialogContentRoot: {
    overflowY: "visible",
  },
});

interface Props {
  username: string;
  handleOk: (
    username: string,
    facility: FacilityModel | FacilityModel[] | null
  ) => void;
  handleCancel: () => void;
}

const LinkFacilityDialog = (props: Props) => {
  const { username, handleOk, handleCancel } = props;
  const [facility, setFacility] = useState<any>(null);
  const classes = useStyles();

  const okClicked = () => {
    handleOk(username, facility);
  };

  const cancelClicked = () => {
    handleCancel();
  };

  return (
    <Dialog
      open={true}
      onClose={cancelClicked}
      classes={{
        paper: classes.paperFullWidth,
      }}
    >
      <DialogTitle id="alert-dialog-title">
        Link new facility to {username}
      </DialogTitle>
      <DialogContent
        classes={{
          root: classes.dialogContentRoot,
        }}
      >
        <div className="md:min-w-[400px]">
          <FacilitySelect
            multiple={false}
            name="facility"
            showAll={false} // Show only facilities that user has access to link (not all facilities)
            showNOptions={8}
            selected={facility}
            setSelected={setFacility}
            errors=""
            className="z-40"
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={cancelClicked} color="secondary">
          Cancel
        </Button>
        <Button
          color="primary"
          disabled={!facility}
          onClick={okClicked}
          autoFocus
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LinkFacilityDialog;
