import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import React from "react";
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
  handleOk: () => void;
  handleCancel: () => void;
  selectedFacility: FacilityModel;
  setSelected: (e: any) => void;
}

const FacilitiesSelectDialog = (props: Props) => {
  const { handleOk, handleCancel, selectedFacility, setSelected } = props;
  const classes = useStyles();

  const handleEscKeyPress = (event: any) => {
    if (event.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <Dialog
      open={true}
      fullWidth={true}
      classes={{
        paperFullWidth: classes.paperFullWidth,
      }}
      onKeyDown={(e) => handleEscKeyPress(e)}
    >
      <DialogTitle
        className="font-semibold text-3xl max-w-md md:min-w-[400px]"
        id="font-semibold text-3xl"
      >
        Search for a facility
      </DialogTitle>
      <DialogContent
        classes={{
          root: classes.dialogContentRoot,
        }}
      >
        <FacilitySelect
          name="facilities"
          selected={selectedFacility}
          setSelected={setSelected}
          errors=""
          showAll={false}
          multiple={false}
          className="z-40"
        />
      </DialogContent>
      <DialogActions style={{ justifyContent: "space-between" }}>
        <Button
          className="capitalize"
          color="secondary"
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

export default FacilitiesSelectDialog;
