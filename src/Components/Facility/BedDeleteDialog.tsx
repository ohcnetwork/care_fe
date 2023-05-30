import React, { useState } from "react";
import DialogModal from "../Common/Dialog";

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
    <DialogModal
      show={props.show}
      onClose={handleCancel}
      title
      fixedWidth={false}
    >
      <div>
        <div
          id="alert-dialog-description"
          className="text-gray-800 leading-relaxed"
        >
          <p className="inline">Are you sure you want to delete bed</p>
          <p className="inline mx-1 font-semibold capitalize break-words">
            {name}
          </p>
          <p className="inline">?</p>
        </div>
      </div>
      <div>
        <div className="flex flex-col md:flex-row gap-2 w-full md:justify-end mt-6">
          <button
            onClick={handleCancel}
            className="btn btn-default w-full md:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="font-medium btn btn-danger w-full md:w-auto"
            disabled={disable}
          >
            Delete
          </button>
        </div>
      </div>
    </DialogModal>
  );
};

export default BedDeleteDialog;
