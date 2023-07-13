import { useState } from "react";
import { useDispatch } from "react-redux";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { HCXActions } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import { Submit } from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import { FileUpload } from "../Patient/FileUpload";
import { HCXClaimModel } from "./models";

interface Props {
  claim: HCXClaimModel;
  show: boolean;
  onClose: () => void;
}

export default function ClaimCreatedModal({ claim, ...props }: Props) {
  const dispatch = useDispatch<any>();
  const [isMakingClaim, setIsMakingClaim] = useState(false);

  const { use } = claim;

  const handleSubmit = async () => {
    setIsMakingClaim(true);

    const res = await dispatch(HCXActions.makeClaim(claim.id ?? ""));
    if (res.data) {
      Notification.Success({ msg: `${use} requested` });
      props.onClose();
    }

    setIsMakingClaim(false);
  };
  return (
    <DialogModal
      show={props.show}
      onClose={props.onClose}
      title="Add supporting documents"
      description={`${claim.use} ID: #${claim.id?.slice(0, 5)}`}
      className="w-full max-w-screen-lg"
      titleAction={
        <Submit disabled={isMakingClaim} onClick={handleSubmit}>
          {isMakingClaim && (
            <CareIcon className="care-l-spinner animate-spin" />
          )}
          {isMakingClaim
            ? `Requesting ${use === "Claim" ? "Claim" : "Pre-Authorization"}...`
            : `Request ${use === "Claim" ? "Claim" : "Pre-Authorization"}`}
        </Submit>
      }
    >
      <div className="p-4 pt-8">
        <FileUpload type="CLAIM" claimId={claim.id!} hideBack unspecified />
      </div>
    </DialogModal>
  );
}
