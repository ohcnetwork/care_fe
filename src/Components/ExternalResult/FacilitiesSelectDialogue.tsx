import React from "react";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import { FieldLabel } from "../Form/FormFields/FormField";

interface Props {
  show: boolean;
  handleOk: () => void;
  handleCancel: () => void;
  selectedFacility: FacilityModel;
  setSelected: (e: any) => void;
}

const FacilitiesSelectDialog = (props: Props) => {
  const { show, handleOk, handleCancel, selectedFacility, setSelected } = props;

  return (
    <ConfirmDialogV2
      action={"Continue"}
      title={<FieldLabel className="text-lg">Search for Facility</FieldLabel>}
      show={show}
      variant={"primary"}
      disabled={!selectedFacility}
      onClose={handleCancel}
      onConfirm={handleOk}
    >
      <FacilitySelect
        name="facilities"
        selected={selectedFacility}
        setSelected={setSelected}
        errors=""
        showAll={false}
        multiple={false}
      />
    </ConfirmDialogV2>
  );
};

export default FacilitiesSelectDialog;
