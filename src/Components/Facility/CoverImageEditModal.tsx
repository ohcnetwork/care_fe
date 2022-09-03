import { Modal } from "@material-ui/core";

interface CoverImageUploadModalProps {
  open: boolean;
  onCloseCB: () => void | undefined;
}

export function CoverImageUploadModal(props: CoverImageUploadModalProps) {
  return (
    <Modal
      open={props.open}
      onClose={props.onCloseCB}
      aria-labelledby="Notify This Facility"
      aria-describedby="Type a message and notify this facility"
    >
      <div></div>
    </Modal>
  );
}
