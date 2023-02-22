import DialogModal from "../Common/Dialog";
import { FileUpload } from "../Patient/FileUpload";
import { HCXClaimModel } from "./models";

interface Props {
  claim: HCXClaimModel;
  show: boolean;
  onClose: () => void;
}

export default function ClaimCreatedModal({ claim, ...props }: Props) {
  return (
    <DialogModal
      show={props.show}
      onClose={props.onClose}
      title="Add supporting documents"
      description={`${claim.use} ID: #${claim.id}`}
      className="w-full max-w-screen-md"
    >
      <FileUpload type="CLAIM" claimId={claim.id!} hideBack unspecified />
    </DialogModal>
  );
}
