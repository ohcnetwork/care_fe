import React from "react";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
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
    <DialogModal
      title={<FieldLabel className="text-lg">Search for Facility</FieldLabel>}
      show={show}
      onClose={handleCancel}
    >
      <FacilitySelect
        name="facilities"
        selected={selectedFacility}
        setSelected={setSelected}
        errors=""
        showAll={false}
        multiple={false}
      />
      <div className="mt-4 flex justify-between">
        <Cancel onClick={handleCancel} />
        <Submit
          onClick={handleOk}
          disabled={!selectedFacility.id}
          label="Select"
        />
      </div>
    </DialogModal>
  );
};

export default FacilitiesSelectDialog;
