import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import DialogModal from "@/components/Common/Dialog";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import { FacilityModel } from "@/components/Facility/models";

import useAuthUser from "@/hooks/useAuthUser";

interface Props {
  show: boolean;
  handleOk: () => void;
  handleCancel: () => void;
  selectedFacility: FacilityModel | null | undefined;
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
        selected={selectedFacility ?? null}
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
        <Button onClick={handleCancel} className="gap-1" variant={"secondary"}>
          <CareIcon icon="l-times" className="text-lg" />
          {t("cancel")}
        </Button>
        <Button
          onClick={handleOk}
          variant={"primary"}
          data-testid="submit-button"
          disabled={!selectedFacility?.id}
        >
          <CareIcon icon="l-check" className="text-lg mr-1" />
          {t("select")}
        </Button>
      </div>
    </DialogModal>
  );
};

export default FacilitiesSelectDialog;
