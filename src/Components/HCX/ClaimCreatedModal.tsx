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
      title={
        claim.use === "Pre-Authorization"
          ? "Pre-Authorization requested successfully"
          : "Claim created successfully"
      }
      className="w-full max-w-screen-md"
      description="Upload the relevant documents"
    >
      <FileUpload type="CLAIM" claimId={claim.id!} hideBack audio unspecified />
    </DialogModal>
  );
}
