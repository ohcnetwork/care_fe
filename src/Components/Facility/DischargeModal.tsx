import * as Notification from "../../Utils/Notifications";

import { Cancel, Submit } from "../Common/components/ButtonV2";
import { useCallback, useEffect, useState } from "react";

import CareIcon from "../../CAREUI/icons/CareIcon";
import ClaimDetailCard from "../HCX/ClaimDetailCard";
import { ConsultationModel } from "./models";
import CreateClaimCard from "../HCX/CreateClaimCard";
import { DISCHARGE_REASONS } from "../../Common/constants";
import DateFormField from "../Form/FormFields/DateFormField";
import DialogModal from "../Common/Dialog";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { FieldLabel } from "../Form/FormFields/FormField";
import { HCXActions, PrescriptionActions } from "../../Redux/actions";
import { HCXClaimModel } from "../HCX/models";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { dischargePatient } from "../../Redux/actions";
import moment from "moment";
import useConfig from "../../Common/hooks/useConfig";
import { useDispatch } from "react-redux";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import PrescriptionBuilder from "../Medicine/PrescriptionBuilder";
import CircularProgress from "../Common/components/CircularProgress";

interface PreDischargeFormInterface {
  discharge_reason: string;
  discharge_notes: string;
  discharge_date?: string;
  death_datetime?: string;
  death_confirmed_doctor?: string;
}

interface IProps {
  show: boolean;
  onClose: () => void;
  consultationData: ConsultationModel;
  afterSubmit?: () => void;
  discharge_reason?: string;
  discharge_notes?: string;
  discharge_date?: string;
  death_datetime?: string;
}

const DischargeModal = ({
  show,
  onClose,
  consultationData,
  afterSubmit = () => {
    onClose();
    window.location.reload();
  },
  discharge_reason = "",
  discharge_notes = "",
  discharge_date = moment().format("YYYY-MM-DDTHH:mm"),
  death_datetime = moment().format("YYYY-MM-DDTHH:mm"),
}: IProps) => {
  const { enable_hcx } = useConfig();
  const dispatch: any = useDispatch();
  const [preDischargeForm, setPreDischargeForm] =
    useState<PreDischargeFormInterface>({
      discharge_reason,
      discharge_notes,
      discharge_date,
      death_datetime,
      death_confirmed_doctor: undefined,
    });
  const [latestClaim, setLatestClaim] = useState<HCXClaimModel>();
  const [isCreateClaimLoading, setIsCreateClaimLoading] = useState(false);
  const [isSendingDischargeApi, setIsSendingDischargeApi] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const fetchLatestClaim = useCallback(async () => {
    const res = await dispatch(
      HCXActions.claims.list({
        ordering: "-modified_date",
        use: "claim",
        consultation: consultationData.id,
      })
    );

    if (res.data?.results?.length) {
      setLatestClaim(res.data.results[0]);
      if (isCreateClaimLoading)
        Notification.Success({ msg: "Fetched Claim Approval Results" });
    } else {
      setLatestClaim(undefined);
      if (isCreateClaimLoading)
        Notification.Success({ msg: "Error Fetched Claim Approval Results" });
    }
    setIsCreateClaimLoading(false);
  }, [consultationData.id, dispatch]);

  useEffect(() => {
    fetchLatestClaim();
  }, [fetchLatestClaim]);

  useMessageListener((data) => {
    if (
      data.type === "MESSAGE" &&
      (data.from === "claim/on_submit" || data.from === "preauth/on_submit") &&
      data.message === "success"
    ) {
      fetchLatestClaim();
    }
  });

  const handlePatientDischarge = async (value: boolean) => {
    setIsSendingDischargeApi(true);
    if (!preDischargeForm.discharge_reason) {
      setErrors({
        ...errors,
        discharge_reason: "Please select a reason for discharge",
      });
      setIsSendingDischargeApi(false);
      return;
    }

    if (
      preDischargeForm.discharge_reason == "EXP" &&
      !preDischargeForm.discharge_notes.trim()
    ) {
      setErrors({
        ...errors,
        discharge_notes: "Please enter the cause of death",
      });
      setIsSendingDischargeApi(false);
      return;
    }

    const dischargeResponse = await dispatch(
      dischargePatient(
        {
          ...preDischargeForm,
          discharge: value,
          discharge_date: moment(preDischargeForm.discharge_date).toISOString(
            true
          ),
        },
        { id: consultationData.id }
      )
    );

    setIsSendingDischargeApi(false);
    if (dischargeResponse?.status === 200) {
      // TODO: check this later
      //   const dischargeData = Object.assign({}, patientData);
      //   dischargeData["discharge"] = value;
      //   setPatientData(dischargeData);

      Notification.Success({
        msg: "Patient Discharged Successfully",
      });

      afterSubmit();
    }
  };

  const handleDateChange = (e: FieldChangeEvent<Date>) => {
    setPreDischargeForm((form) => {
      return {
        ...form,
        discharge_date: e.value.toString(),
      };
    });
  };

  const prescriptionActions = PrescriptionActions(consultationData.id ?? "");

  return (
    <DialogModal
      title={
        <div>
          <p>Discharge patient from CARE</p>
          <span className="mt-1 flex gap-1 text-sm font-medium text-warning-500">
            <CareIcon className="care-l-exclamation-triangle text-base" />
            <p>Caution: this action is irreversible.</p>
          </span>
        </div>
      }
      show={show}
      onClose={onClose}
      className="md:max-w-3xl"
    >
      <div className="mt-6 flex flex-col">
        <SelectFormField
          required
          label="Reason"
          name="discharge_reason"
          id="discharge_reason"
          value={preDischargeForm.discharge_reason}
          disabled={!!discharge_reason}
          options={DISCHARGE_REASONS}
          optionValue={({ id }) => id}
          optionLabel={({ text }) => text}
          onChange={(e) =>
            setPreDischargeForm((prev) => ({
              ...prev,
              discharge_reason: e.value,
            }))
          }
          error={errors?.discharge_reason}
        />
        <TextAreaFormField
          required={preDischargeForm.discharge_reason == "EXP"}
          label={
            preDischargeForm.discharge_reason == "EXP"
              ? "Cause of death"
              : preDischargeForm.discharge_reason === "REC"
              ? "Discharged Advice"
              : "Notes"
          }
          name="discharge_notes"
          value={preDischargeForm.discharge_notes}
          onChange={(e) =>
            setPreDischargeForm((prev) => ({
              ...prev,
              discharge_notes: e.value,
            }))
          }
          error={errors?.discharge_notes}
        />
        {preDischargeForm.discharge_reason === "REC" && (
          <div>
            <DateFormField
              label="Discharge Date"
              name="discharge_date"
              value={moment(preDischargeForm?.discharge_date).toDate()}
              min={moment(
                consultationData?.admission_date ??
                  consultationData?.created_date
              ).toDate()}
              disableFuture={true}
              required
              onChange={handleDateChange}
            />

            <div className="mb-4">
              <FieldLabel>Discharge Prescription Medications</FieldLabel>
              <PrescriptionBuilder
                actions={prescriptionActions}
                prescription_type="DISCHARGE"
              />
            </div>
            <div className="mb-4">
              <FieldLabel>Discharge PRN Prescriptions</FieldLabel>
              <PrescriptionBuilder
                actions={prescriptionActions}
                prescription_type="DISCHARGE"
                is_prn
              />
            </div>
          </div>
        )}
        {preDischargeForm.discharge_reason === "EXP" && (
          <div>
            <TextFormField
              name="death_datetime"
              label="Death Date and Time"
              type="datetime-local"
              value={preDischargeForm.death_datetime}
              onChange={(e) => {
                setPreDischargeForm((form) => {
                  return {
                    ...form,
                    death_datetime: e.value,
                  };
                });
              }}
              required
              min={moment(consultationData?.admission_date).format(
                "YYYY-MM-DDTHH:mm"
              )}
              max={moment().format("YYYY-MM-DDTHH:mm")}
            />
            <TextFormField
              name="death_confirmed_by"
              label="Confirmed By"
              value={preDischargeForm.death_confirmed_doctor ?? ""}
              onChange={(e) => {
                setPreDischargeForm((form) => {
                  return {
                    ...form,
                    death_confirmed_doctor: e.value,
                  };
                });
              }}
              required
              placeholder="Attending Doctor's Name and Designation"
            />
          </div>
        )}
        {["REF", "LAMA"].includes(preDischargeForm.discharge_reason) && (
          <div>
            <DateFormField
              label="Date of Discharge"
              name="discharge_date"
              value={moment(preDischargeForm.discharge_date).toDate()}
              min={moment(
                consultationData?.admission_date ??
                  consultationData?.created_date
              ).toDate()}
              disableFuture={true}
              required
              onChange={handleDateChange}
            />
          </div>
        )}
      </div>

      {enable_hcx && (
        // TODO: if policy and approved pre-auth exists
        <div className="my-5 rounded p-5 shadow">
          <h2 className="mb-2">Claim Insurance</h2>
          {latestClaim ? (
            <ClaimDetailCard claim={latestClaim} />
          ) : (
            <CreateClaimCard
              consultationId={consultationData.id ?? ""}
              patientId={consultationData.patient ?? ""}
              use="claim"
              isCreating={isCreateClaimLoading}
              setIsCreating={setIsCreateClaimLoading}
            />
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-4 md:flex-row md:justify-end">
        <Cancel onClick={onClose} />
        {isSendingDischargeApi ? (
          <CircularProgress />
        ) : (
          <Submit
            onClick={() => handlePatientDischarge(false)}
            label="Confirm Discharge"
            autoFocus
          />
        )}
      </div>
    </DialogModal>
  );
};

export default DischargeModal;
