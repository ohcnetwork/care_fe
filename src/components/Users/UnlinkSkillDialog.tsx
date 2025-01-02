import { useState } from "react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/components/Common/ConfirmDialog";

interface Props {
  skillName: string;
  userName: string;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function UnlinkSkillDialog(props: Props) {
  const [disabled, setDisabled] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = () => {
    props.onSubmit();
    setDisabled(true);
  };

  return (
    <ConfirmDialog
      action="Unlink"
      name="confirm-unlink-skill"
      title={t("unlink_skill")}
      variant="warning"
      onClose={props.onCancel}
      onConfirm={handleSubmit}
      disabled={disabled}
      show
      description={
        <div className="flex leading-relaxed text-secondary-800">
          <span id="unlink-skill-modal-description">
            {t("unlink_skill_confirm")} <strong>{props.skillName}</strong>{" "}
            {t("from_user")} <strong>{props.userName}</strong>?{" "}
            {t("unlink_skill_access")}
          </span>
        </div>
      }
    ></ConfirmDialog>
  );
}
