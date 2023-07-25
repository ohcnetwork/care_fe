import { Cancel, Submit } from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FacilityModel } from "../Facility/models";
import { useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  handleOk: () => void;
  handleCancel: () => void;
  selectedFacility: FacilityModel;
  setSelected: (e: any) => void;
}

const FacilitiesSelectDialog = (props: Props) => {
  const { show, handleOk, handleCancel, selectedFacility, setSelected } = props;
  const { t } = useTranslation();

  return (
    <DialogModal
      title={t("search_for_facility")}
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
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Cancel onClick={handleCancel} />
        <Submit
          onClick={handleOk}
          disabled={!selectedFacility.id}
          label={t("select")}
          data-testid="submit-button"
        />
      </div>
    </DialogModal>
  );
};

export default FacilitiesSelectDialog;
