import * as Notification from "../../Utils/Notifications.js";

import ButtonV2 from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import { PatientModel } from "../Patient/models";
import TextFormField from "../Form/FormFields/TextFormField";
import { useDispatch } from "react-redux";
import { useState } from "react";
import {
  MultiSelectFormField,
  SelectFormField,
} from "../Form/FormFields/SelectFormField.js";
import { ABDM_CONSENT_PURPOSE, ABDM_HI_TYPE } from "../../Common/constants.js";
import DateRangeFormField from "../Form/FormFields/DateRangeFormField.js";
import dayjs from "dayjs";
import { consentActions } from "../../Redux/actions.js";
import { navigate } from "raviger";

const getDate = (value: any) =>
  value && dayjs(value).isValid() && dayjs(value).toDate();

interface IProps {
  patient: PatientModel;
  show: boolean;
  onClose: () => void;
}

export default function FetchRecordsModal({ patient, show, onClose }: IProps) {
  const [purpose, setPurpose] = useState<string>("CAREMGT");
  const [fromDate, setFromDate] = useState<Date>(
    dayjs().subtract(30, "day").toDate()
  );
  const [toDate, setToDate] = useState<Date>(dayjs().toDate());
  const [isMakingConsentRequest, setIsMakingConsentRequest] = useState(false);
  const [hiTypes, setHiTypes] = useState<string[]>([]);

  const dispatch = useDispatch<any>();

  return (
    <DialogModal title="Fetch Records over ABDM" show={show} onClose={onClose}>
      <TextFormField
        value={patient?.abha_number_object?.health_id as string}
        onChange={() => null}
        disabled
        label="Patient Identifier"
        name="health_id"
        error=""
      />
      <SelectFormField
        label="Purpose of Request"
        errorClassName="hidden"
        id="purpose"
        name="purpose"
        className="mb-6"
        options={ABDM_CONSENT_PURPOSE}
        optionLabel={(o) => o.label}
        optionValue={(o) => o.value}
        value={purpose}
        onChange={({ value }) => setPurpose(value)}
        required
      />

      <DateRangeFormField
        name="health_records_range"
        id="health_records_range"
        value={{
          start: getDate(fromDate),
          end: getDate(toDate),
        }}
        onChange={(e) => {
          setFromDate(e.value.start!);
          setToDate(e.value.end!);
        }}
        label="Health Records range"
        required
      />

      <MultiSelectFormField
        name="hiTypes"
        options={ABDM_HI_TYPE}
        label="Health Information Types"
        placeholder="Select One or More HI Types"
        value={hiTypes}
        optionLabel={(option) => option.label}
        optionValue={(option) => option.value}
        onChange={(e) => setHiTypes(e.value)}
        required
      />

      <div className="mt-6 flex items-center justify-end">
        <ButtonV2
          onClick={async () => {
            setIsMakingConsentRequest(true);
            const res = await dispatch(
              consentActions.create({
                patient_health_id: patient?.abha_number_object
                  ?.health_id as string,
                hi_types: hiTypes,
                purpose,
                from_time: fromDate,
                to_time: toDate,
              })
            );

            if (res.status === 201) {
              Notification.Success({
                msg: "Consent requested successfully!",
              });

              navigate(
                `/facility/${patient.facility}/patient/${patient.id}/consultation/${patient.last_consultation?.id}/abdm`
              );
            } else {
              Notification.Error({
                msg: "Error while requesting consent!",
              });
            }
            setIsMakingConsentRequest(false);
            onClose();
          }}
          loading={isMakingConsentRequest}
        >
          Request Consent
        </ButtonV2>
      </div>
    </DialogModal>
  );
}
