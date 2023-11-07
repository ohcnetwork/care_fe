import { useState } from "react";

import ButtonV2 from "@/Components/Common/components/ButtonV2";
import DialogModal from "@/Components/Common/Dialog";
import DateFormField from "@/Components/Form/FormFields/DateFormField";
import TextFormField from "@/Components/Form/FormFields/TextFormField";
import { PatientModel } from "@/Components/Patient/models";
import * as Notification from "@/Utils/Notifications.js";
import request from "@/Utils/request/request.js";

import routes from "@/Redux/api.js";

interface IProps {
  consultationId: string;
  patient: PatientModel;
  show: boolean;
  onClose: () => void;
}

const LinkCareContextModal = ({
  consultationId,
  patient,
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
          value={patient?.abha_number_object?.name}
          onChange={() => null}
          disabled
          label="Name"
          name="name"
          error=""
        />
        <TextFormField
          value={patient?.abha_number_object?.gender}
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
        value={
          patient?.abha_number_object?.date_of_birth
            ? new Date(patient?.abha_number_object?.date_of_birth)
            : undefined
        }
        onChange={() => null}
        disabled
        required
      />

      <div>
        <span className="items-center text-xs text-gray-800">
          <input
            type="checkbox"
            checked={acceptedDisclaimer}
            onChange={(e) => {
              setAcceptedDisclaimer(e.target.checked);
            }}
            className="mr-2 rounded border-gray-700 shadow-sm ring-0 ring-offset-0"
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
                name: patient?.abha_number_object?.name,
                gender: patient?.abha_number_object?.gender,
                dob: patient?.abha_number_object?.date_of_birth,
              },
              reattempts: 0,
            });
            if (res?.status === 202) {
              Notification.Success({
                msg: "Care Context sucessfully linked!",
              });
            } else {
              Notification.Error({
                msg: "Error in linking Care Context!",
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
