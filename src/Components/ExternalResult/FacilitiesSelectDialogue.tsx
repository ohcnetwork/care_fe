import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { WithStyles, withStyles } from "@material-ui/styles";
import React from "react";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";

interface Props {
  handleOk: () => void;
  handleCancel: () => void;
  selectedFacility: FacilityModel;
  setSelected: (e: any) => void;
}

const styles = {
  paper: {
    "max-width": "650px",
    "min-width": "400px",
  },
};

const FacilitiesSelectDialog = (props: Props & WithStyles<typeof styles>) => {
  const { handleOk, handleCancel, classes, selectedFacility, setSelected } =
    props;
  return (
    <Dialog
      open={true}
      classes={{
        paper: classes.paper,
      }}
    >
      <DialogTitle
        className=" font-semibold text-3xl"
        id="font-semibold text-3xl"
      >
        Search for a facility
      </DialogTitle>
      <DialogContent>
        <FacilitySelect
          name="facilities"
          selected={selectedFacility}
          setSelected={setSelected}
          errors=""
          showAll={false}
          multiple={false}
        />
      </DialogContent>
      <DialogActions style={{ justifyContent: "space-between" }}>
        <Button
          className="capitalize"
          color="secondary"
          onClick={() => handleCancel()}
        >
          Cancel Creation
        </Button>
        <Button
          onClick={handleOk}
          color="primary"
          variant="contained"
          disabled={!selectedFacility?.name || !selectedFacility}
          startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withStyles(styles)(FacilitiesSelectDialog);
