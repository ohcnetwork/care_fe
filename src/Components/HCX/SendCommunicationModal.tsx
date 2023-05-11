import * as Notification from "../../Utils/Notifications";

import CareIcon from "../../CAREUI/icons/CareIcon";
import DialogModal from "../Common/Dialog";
import { FileUpload } from "../Patient/FileUpload";
import { HCXActions } from "../../Redux/actions";
import { HCXCommunicationModel } from "./models";
import { Submit } from "../Common/components/ButtonV2";
import { useDispatch } from "react-redux";
import { useState } from "react";

interface Props {
  communication: HCXCommunicationModel;
  show: boolean;
  onClose: () => void;
}

export default function SendCommunicationModal({
  communication,
  ...props
}: Props) {
  const dispatch = useDispatch<any>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);

    const res = await dispatch(HCXActions.sendCommunication(communication.id!));
    if (res.data) {
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
          {isLoading && <CareIcon className="care-l-spinner animate-spin" />}
          {isLoading ? "Sending Message" : "Send Message"}
        </Submit>
      }
    >
      <div className="p-4 pt-8">
        <FileUpload
          type="COMMUNICATION"
          communicationId={communication.id!}
          hideBack
          unspecified
        />
      </div>
    </DialogModal>
  );
}
