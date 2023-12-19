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
import DateFormField from "../Form/FormFields/DateFormField.js";
import request from "../../Utils/request/request.js";
import routes from "../../Redux/api";
import { useMessageListener } from "../../Common/hooks/useMessageListener.js";
import CircularProgress from "../Common/components/CircularProgress.js";
import CareIcon from "../../CAREUI/icons/CareIcon.js";
import { classNames } from "../../Utils/utils.js";

const getDate = (value: any) =>
  value && dayjs(value).isValid() && dayjs(value).toDate();

interface IProps {
  patient: PatientModel;
  show: boolean;
  onClose: () => void;
}

export default function FetchRecordsModal({ patient, show, onClose }: IProps) {
  const [idVerificationStatus, setIdVerificationStatus] = useState<
    "pending" | "in-progress" | "verified" | "failed"
  >("pending");
  const [purpose, setPurpose] = useState<string>("CAREMGT");
  const [fromDate, setFromDate] = useState<Date>(
    dayjs().subtract(30, "day").toDate()
  );
  const [toDate, setToDate] = useState<Date>(dayjs().toDate());
  const [isMakingConsentRequest, setIsMakingConsentRequest] = useState(false);
  const [hiTypes, setHiTypes] = useState<string[]>([]);
  const [expiryDate, setExpiryDate] = useState<Date>(
    dayjs().add(5, "minutes").toDate()
  );
  const [errors, setErrors] = useState<any>({});

  const dispatch = useDispatch<any>();

  useMessageListener((data) => {
    if (data.type === "MESSAGE" && data.from === "patients/on_find") {
      if (
        data.message?.patient?.id === patient?.abha_number_object?.health_id
      ) {
        setIdVerificationStatus("verified");
        setErrors({
          ...errors,
          health_id: "",
        });
      }
    }
  });

  return (
    <DialogModal title="Fetch Records over ABDM" show={show} onClose={onClose}>
      <div className="flex items-center gap-3">
        <TextFormField
          value={patient?.abha_number_object?.health_id as string}
          onChange={() => null}
          disabled
          label="Patient Identifier"
          name="health_id"
          error={errors.health_id}
          className="flex-1"
        />

        <ButtonV2
          onClick={async () => {
            const { res } = await request(routes.findPatient, {
              body: {
                id: patient?.abha_number_object?.health_id,
              },
              reattempts: 0,
            });

            if (res?.status) {
              setIdVerificationStatus("in-progress");
            }
          }}
          loading={idVerificationStatus === "in-progress"}
          ghost={idVerificationStatus === "verified"}
          disabled={idVerificationStatus === "verified"}
          className={classNames(
            "mt-1.5 !py-3",
            idVerificationStatus === "verified" &&
              "disabled:cursor-auto disabled:bg-transparent disabled:text-primary-600"
          )}
        >
          {idVerificationStatus === "in-progress" && (
            <CircularProgress className="!h-5 !w-5 !text-gray-500" />
          )}
          {idVerificationStatus === "verified" && (
            <CareIcon className="care-l-check" />
          )}
          {
            {
              pending: "Verify Patient",
              "in-progress": "Verifying",
              verified: "Verified",
              failed: "Retry",
            }[idVerificationStatus]
          }
        </ButtonV2>
      </div>
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
        name="hi_types"
        options={ABDM_HI_TYPE}
        label="Health Information Types"
        placeholder="Select One or More HI Types"
        value={hiTypes}
        optionLabel={(option) => option.label}
        optionValue={(option) => option.value}
        onChange={(e) => setHiTypes(e.value)}
        required
      />

      <DateFormField
        name="expiry_date"
        id="expiry_date"
        value={getDate(expiryDate)}
        onChange={(e) => setExpiryDate(e.value!)}
        label="Consent Expiry Date"
        required
        disablePast
      />

      <div className="mt-6 flex items-center justify-end">
        <ButtonV2
          onClick={async () => {
            if (idVerificationStatus !== "verified") {
              setErrors({
                ...errors,
                health_id: "Please verify the patient identifier",
              });

              return;
            }

            setIsMakingConsentRequest(true);
            const res = await dispatch(
              consentActions.create({
                patient_abha: patient?.abha_number_object?.health_id as string,
                hi_types: hiTypes,
                purpose,
                from_time: fromDate,
                to_time: toDate,
                expiry: expiryDate,
              })
            );

            if (res.status === 201) {
              Notification.Success({
                msg: "Consent requested successfully!",
              });

              navigate(
                `/facility/${patient.facility}/abdm` ??
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
