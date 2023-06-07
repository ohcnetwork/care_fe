import React, { useState } from "react";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";

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
    <ConfirmDialogV2
      show={props.show}
      onClose={handleCancel}
      onConfirm={handleSubmit}
      action="Delete"
      variant="danger"
      disabled={disable}
      description={`Are you sure you want to delete bed ${name}?`}
      title="Delete Bed?"
      className="w-auto"
    ></ConfirmDialogV2>
  );
};

export default BedDeleteDialog;
