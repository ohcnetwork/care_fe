import { useState } from "react";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";

interface Props {
  skillName: string;
  userName: string;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function UnlinkSkillDialog(props: Props) {
  const [disabled, setDisabled] = useState(false);

  const handleSubmit = () => {
    props.onSubmit();
    setDisabled(true);
  };

  return (
    <ConfirmDialogV2
      action="Unlink"
      title="Unlink Skill"
      variant="warning"
      onClose={props.onCancel}
      onConfirm={handleSubmit}
      disabled={disabled}
      show
      description={
        <span>
          Are you sure you want to unlink the skill{" "}
          <strong>{props.skillName}</strong> from user{" "}
          <strong>{props.userName}</strong>? the user will not have the skill
          associated anymore.
        </span>
      }
    ></ConfirmDialogV2>
  );
}
