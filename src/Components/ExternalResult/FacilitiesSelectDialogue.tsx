import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { WithStyles, withStyles } from "@mui/styles";
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

  const handleEscKeyPress = (event: any) => {
    if (event.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <Dialog
      open={true}
      classes={{
        paper: classes.paper,
      }}
      onKeyDown={(e) => handleEscKeyPress(e)}
    >
      <DialogTitle className="font-semibold" id="font-semibold">
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
          color="error"
          onClick={() => handleCancel()}
        >
          Cancel
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
