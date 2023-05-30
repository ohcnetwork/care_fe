import * as Notification from "../../Utils/Notifications";

import { Cancel, Submit } from "../Common/components/ButtonV2";
import { useCallback, useEffect, useState } from "react";

import CareIcon from "../../CAREUI/icons/CareIcon";
import { CircularProgress } from "@material-ui/core";
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

interface PreDischargeFormInterface {
  discharge_reason: string;
  discharge_notes: string;
  discharge_date: string | null;
  death_datetime: string | null;
  death_confirmed_doctor: string | null;
}

interface IProps {
  show: boolean;
  onClose: () => void;
  consultationData: ConsultationModel;
  afterSubmit?: () => void;
  discharge_reason?: string;
  discharge_notes?: string;
  discharge_date?: string | null;
  death_datetime?: string | null;
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
  discharge_date = new Date().toISOString(),
  death_datetime = null,
}: IProps) => {
  const { enable_hcx } = useConfig();
  const dispatch: any = useDispatch();
  const [preDischargeForm, setPreDischargeForm] =
    useState<PreDischargeFormInterface>({
      discharge_reason,
      discharge_notes,
      discharge_date,
      death_datetime,
      death_confirmed_doctor: null,
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

  const prescriptionActions = PrescriptionActions(consultationData.id);

  return (
    <DialogModal
      title={
        <div>
          <p>Discharge patient from CARE</p>
          <span className="mt-1 flex gap-1 text-sm text-warning-500 font-medium">
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
                consultationData?.admission_date ||
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
            <div>
              Death Date and Time
              <span className="text-danger-500">{" *"}</span>
              <input
                type="datetime-local"
                className="w-[calc(100%-5px)] focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                value={preDischargeForm.death_datetime || ""}
                required
                min={consultationData?.admission_date?.substring(0, 16)}
                max={moment(new Date()).format("YYYY-MM-DDThh:mm")}
                onChange={(e) => {
                  setPreDischargeForm((form) => {
                    return {
                      ...form,
                      death_datetime: e.target.value,
                    };
                  });
                }}
              />
            </div>
            <TextFormField
              name="death_confirmed_by"
              label="Confirmed By"
              value={preDischargeForm.death_confirmed_doctor || ""}
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
                consultationData?.admission_date ||
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
        <div className="my-5 shadow rounded p-5">
          <h2 className="mb-2">Claim Insurance</h2>
          {latestClaim ? (
            <ClaimDetailCard claim={latestClaim} />
          ) : (
            <CreateClaimCard
              consultationId={consultationData.id}
              patientId={consultationData.patient}
              use="claim"
              isCreating={isCreateClaimLoading}
              setIsCreating={setIsCreateClaimLoading}
            />
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-2 pt-4 md:justify-end">
        <Cancel onClick={onClose} />
        {isSendingDischargeApi ? (
          <CircularProgress size={20} />
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
