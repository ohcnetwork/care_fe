import { useTranslation } from "react-i18next";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import { FacilityModel } from "@/components/Facility/models";

import useAuthUser from "@/hooks/useAuthUser";

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
  const authUser = useAuthUser();

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
        district={
          authUser?.user_type === "DistrictAdmin"
            ? authUser?.district?.toString()
            : undefined
        }
        state={
          authUser?.user_type === "StateAdmin"
            ? authUser?.state?.toString()
            : undefined
        }
      />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Cancel onClick={handleCancel} />
        <Submit
          onClick={handleOk}
          disabled={!selectedFacility?.id}
          label={t("select")}
          data-testid="submit-button"
        />
      </div>
    </DialogModal>
  );
};

export default FacilitiesSelectDialog;
