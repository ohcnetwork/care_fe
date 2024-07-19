import * as Notification from "../../Utils/Notifications";

import CareIcon from "../../CAREUI/icons/CareIcon";
import DialogModal from "../Common/Dialog";
import { FileUpload } from "../Patient/FileUpload";
import { HCXCommunicationModel } from "./models";
import { Submit } from "../Common/components/ButtonV2";
import { useState } from "react";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";

interface Props {
  communication: HCXCommunicationModel;
  show: boolean;
  onClose: () => void;
}

export default function SendCommunicationModal({
  communication,
  ...props
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);

    const { res } = await request(routes.hcxSendCommunication, {
      body: {
        communication: communication.id,
      },
    });

    if (res?.ok) {
      Notification.Success({ msg: "Message Sent" });
      props.onClose();
    }

    setIsLoading(false);
  };

  return (
    <DialogModal
      show={props.show}
      onClose={props.onClose}
      title="Add supporting documents"
      className="w-full max-w-screen-lg"
      titleAction={
        <Submit disabled={isLoading} onClick={handleSubmit}>
          {isLoading && <CareIcon icon="l-spinner" className="animate-spin" />}
          {isLoading ? "Sending Message" : "Send Message"}
        </Submit>
      }
    >
      <div className="p-4 pt-8">
        <FileUpload
          type="COMMUNICATION"
          communicationId={communication.id}
          hideBack
          unspecified
        />
      </div>
    </DialogModal>
  );
}
