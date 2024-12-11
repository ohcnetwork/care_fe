import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { FacilityModel } from "@/components/Facility/models";

const ConfirmFacilityModal = ({
  username,
  currentFacility,
  homeFacility,
  handleCancel,
  handleOk,
  type,
}: {
  username: string;
  currentFacility?: FacilityModel;
  homeFacility?: FacilityModel;
  handleCancel: () => void;
  handleOk: () => void;
  type: string;
}) => {
  const { t } = useTranslation();
  const title = t(type);
  let action = "";
  let body;
  switch (type) {
    case "unlink_facility":
      action = "Unlink";
      body = (
        <div className="flex leading-relaxed text-secondary-800">
          <div>
            {t("unlink_facility_confirm")}{" "}
            <strong>{currentFacility?.name}</strong> {t("from_user")}{" "}
            <strong>{username}</strong> ?
            <br />
            {t("unlink_facility_access")}
          </div>
        </div>
      );
      break;
    case "clear_home_facility":
      action = "Clear";
      body = (
        <div className="flex leading-relaxed text-secondary-800">
          <div>
            {t("clear_home_facility_confirm")}{" "}
            <strong>{currentFacility?.name}</strong> {t("from_user")}{" "}
            <strong>{username}</strong> ?
            <br />
          </div>
        </div>
      );
      break;
    case "replace_home_facility":
      action = "Replace";
      body = (
        <div>
          {t("replace_home_facility_confirm")}{" "}
          <strong>{homeFacility?.name}</strong> {t("with")}{" "}
          <strong>{currentFacility?.name}</strong>{" "}
          {t("replace_home_facility_confirm_as")} <strong>{username}</strong>?
        </div>
      );
      break;
  }
  return (
    <ConfirmDialog
      title={<span>{title}</span>}
      show={true}
      action={action}
      onClose={handleCancel}
      onConfirm={handleOk}
      variant="danger"
    >
      <div className="flex leading-relaxed text-secondary-800">{body}</div>
    </ConfirmDialog>
  );
};

export default ConfirmFacilityModal;
