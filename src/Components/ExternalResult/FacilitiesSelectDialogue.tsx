import React from "react";
import ButtonV2 from "../Common/components/ButtonV2";
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
        <ButtonV2 onClick={handleCancel} variant="secondary">
          Cancel
        </ButtonV2>
        <ButtonV2
          onClick={handleOk}
          variant="primary"
          disabled={!selectedFacility.id}
        >
          Continue
        </ButtonV2>
      </div>
    </DialogModal>
  );
};

export default FacilitiesSelectDialog;
