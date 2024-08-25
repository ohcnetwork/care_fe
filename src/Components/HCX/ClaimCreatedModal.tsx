import * as Notification from "../../Utils/Notifications";

import CareIcon from "../../CAREUI/icons/CareIcon";
import DialogModal from "../Common/Dialog";
import { FileUpload } from "../Files/FileUpload";
import { HCXClaimModel } from "./models";
import { Submit } from "../Common/components/ButtonV2";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import { useState } from "react";

interface Props {
  claim: HCXClaimModel;
  show: boolean;
  onClose: () => void;
}

export default function ClaimCreatedModal({ claim, ...props }: Props) {
  const [isMakingClaim, setIsMakingClaim] = useState(false);

  const { use } = claim;

  const handleSubmit = async () => {
    setIsMakingClaim(true);

    const { res } = await request(routes.hcx.claims.makeClaim, {
      body: { claim: claim.id },
    });

    if (res?.ok) {
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
            <CareIcon icon="l-spinner" className="animate-spin" />
          )}
          {isMakingClaim
            ? `Requesting ${use === "Claim" ? "Claim" : "Pre-Authorization"}...`
            : `Request ${use === "Claim" ? "Claim" : "Pre-Authorization"}`}
        </Submit>
      }
    >
      <div className="p-4 pt-8">
        <FileUpload type="CLAIM" claimId={claim.id} />
      </div>
    </DialogModal>
  );
}
