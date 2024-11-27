import { useState } from "react";

import ConfirmDialog from "@/components/Common/ConfirmDialog";

interface ConfirmDialogProps {
  name: string;
  show: boolean;
  handleCancel: () => void;
  handleOk: () => void;
}

const BedDeleteDialog = (props: ConfirmDialogProps) => {
  const { name, handleCancel, handleOk } = props;

  const [disable, setDisable] = useState(false);

  const handleSubmit = () => {
    handleOk();
    setDisable(true);
  };
  return (
    <ConfirmDialog
      show={props.show}
      onClose={handleCancel}
      onConfirm={handleSubmit}
      action="Delete"
      variant="danger"
      disabled={disable}
      description={`Are you sure you want to delete bed ${name}?`}
      title="Delete Bed?"
      className="w-auto"
    />
  );
};

export default BedDeleteDialog;
