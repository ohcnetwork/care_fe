import * as Notification from "../../Utils/Notifications.js";

import ButtonV2 from "../Common/components/ButtonV2";
import DateFormField from "../Form/FormFields/DateFormField";
import DialogModal from "../Common/Dialog";
import TextFormField from "../Form/FormFields/TextFormField";
import { useState } from "react";
import routes from "../../Redux/api.js";
import request from "../../Utils/request/request.js";
import { AbhaNumberModel } from "./types/abha.js";

interface IProps {
  consultationId: string;
  abha?: AbhaNumberModel;
  show: boolean;
  onClose: () => void;
}

const LinkCareContextModal = ({
  consultationId,
  abha,
  show,
  onClose,
}: IProps) => {
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [isLinkingCareContext, setIsLinkingCareContext] = useState(false);

  return (
    <DialogModal
      title="Link Care Context using demographics"
      show={show}
      onClose={onClose}
    >
      <div className="flex items-center justify-between">
        <TextFormField
          value={abha?.name}
          onChange={() => null}
          disabled
          label="Name"
          name="name"
          error=""
        />
        <TextFormField
          value={abha?.gender}
          onChange={() => null}
          disabled
          label="Gender"
          name="gender"
          error=""
        />
      </div>
      <DateFormField
        name="dob"
        label="Date of Birth"
        value={abha?.date_of_birth ? new Date(abha?.date_of_birth) : undefined}
        onChange={() => null}
        disabled
        required
      />

      <div>
        <span className="items-center text-xs text-secondary-800">
          <input
            type="checkbox"
            checked={acceptedDisclaimer}
            onChange={(e) => {
              setAcceptedDisclaimer(e.target.checked);
            }}
            className="mr-2 rounded border-secondary-700 shadow-sm ring-0 ring-offset-0"
          />
          I declare that the data of the patient is voluntarily provided by the
          patient (or guardian or nominee of the patient).
        </span>
      </div>

      <div className="mt-6 flex items-center justify-end">
        <ButtonV2
          onClick={async () => {
            setIsLinkingCareContext(true);
            const { res } = await request(routes.abha.linkCareContext, {
              body: {
                consultation: consultationId,
                name: abha?.name,
                gender: abha?.gender,
                dob: abha?.date_of_birth,
              },
              reattempts: 0,
            });
            if (res?.status === 202) {
              Notification.Success({
                msg: "Care Context sucessfully linked!",
              });
            }
            setIsLinkingCareContext(false);
            onClose();
          }}
          disabled={!acceptedDisclaimer}
          loading={isLinkingCareContext}
        >
          Link Care Context
        </ButtonV2>
      </div>
    </DialogModal>
  );
};

export default LinkCareContextModal;
