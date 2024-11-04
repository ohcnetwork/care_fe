import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { useTranslation } from "react-i18next";

const ConfirmSkillsModal = ({
  username,
  currentSkillName,
  handleCancel,
  handleOk,
}: {
  username: string;
  currentSkillName?: string;
  handleCancel: () => void;
  handleOk: () => void;
}) => {
  const { t } = useTranslation();
  const title = t("unlink_skill");
  const body = (
    <span>
      {t("unlink_skill_confirm")} <strong>{currentSkillName}</strong>{" "}
      {t("from_user")} <strong>{username}</strong>? {t("unlink_skill_access")}
    </span>
  );
  return (
    <ConfirmDialog
      title={<span>{title}</span>}
      show={true}
      action={"Unlink"}
      onClose={handleCancel}
      onConfirm={handleOk}
      variant="danger"
    >
      <div className="flex leading-relaxed text-secondary-800">{body}</div>
    </ConfirmDialog>
  );
};

export default ConfirmSkillsModal;
