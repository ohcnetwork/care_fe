import { useState } from "react";

export default function useConfirmedAction(action: () => Promise<void>) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  return {
    requestConfirmation: () => setShowConfirmation(true),
    submit: action,

    confirmationProps: {
      onClose: () => setShowConfirmation(false),
      show: showConfirmation,
      onConfirm: action,
      action: "Submit",
    },
  };
}
