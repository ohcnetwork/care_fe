import * as Notification from "../../Utils/Notifications";

import { Cancel, Submit } from "../Common/components/ButtonV2";
import { useCallback, useEffect, useState } from "react";

import CareIcon from "../../CAREUI/icons/CareIcon";
import CircularProgress from "../Common/components/CircularProgress";
import ClaimCard from "../HCX/ClaimCard";
import { ConsultationModel } from "./models";
import CreateClaimCard from "../HCX/CreateClaimCard";
import { DISCHARGE_REASONS } from "../../Common/constants";
import DialogModal from "../Common/Dialog";
import { FacilityModel } from "./models";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FieldLabel } from "../Form/FormFields/FormField";
import { HCXActions } from "../../Redux/actions";
import { HCXClaimModel } from "../HCX/models";
import PrescriptionBuilder from "../Medicine/PrescriptionBuilder";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import dayjs from "../../Utils/dayjs";
import { dischargePatient } from "../../Redux/actions";
import useConfig from "../../Common/hooks/useConfig";
import { useDispatch } from "react-redux";
import { useMessageListener } from "../../Common/hooks/useMessageListener";

interface PreDischargeFormInterface {
  new_discharge_reason: number | null;
  discharge_notes: string;
  discharge_date?: string;
  death_datetime?: string;
  death_confirmed_doctor?: string;
  referred_to?: number | null | undefined;
  referred_to_external?: string | null | undefined;
}

interface IProps {
  show: boolean;
  onClose: () => void;
  consultationData: ConsultationModel;
  afterSubmit?: () => void;
  new_discharge_reason?: number | null;
  discharge_notes?: string;
  discharge_date?: string;
  death_datetime?: string;
}

const DischargeModal = ({
  show,
  onClose,
  consultationData,
  afterSubmit,
  new_discharge_reason = null,
  discharge_notes = "",
  discharge_date = dayjs().format("YYYY-MM-DDTHH:mm"),
  death_datetime = dayjs().format("YYYY-MM-DDTHH:mm"),
}: IProps) => {
  const { enable_hcx } = useConfig();
  const dispatch: any = useDispatch();
  const [preDischargeForm, setPreDischargeForm] =
    useState<PreDischargeFormInterface>({
      new_discharge_reason,
      discharge_notes,
      discharge_date,
      death_datetime,
      death_confirmed_doctor: undefined,
      referred_to_external: null,
    });
  const [latestClaim, setLatestClaim] = useState<HCXClaimModel>();
  const [isCreateClaimLoading, setIsCreateClaimLoading] = useState(false);
  const [isSendingDischargeApi, setIsSendingDischargeApi] = useState(false);
  const [facility, setFacility] = useState<FacilityModel>();
  const [errors, setErrors] = useState<any>({});

  const fetchLatestClaim = useCallback(async () => {
    const res = await dispatch(
      HCXActions.claims.list({
        ordering: "-modified_date",
        use: "claim",
        consultation: consultationData.id,
      })
    );

    if (res?.data?.results?.length > 0) {
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
    if (!preDischargeForm.new_discharge_reason) {
      setErrors({
        ...errors,
        new_discharge_reason: "Please select a reason for discharge",
      });
      setIsSendingDischargeApi(false);
      return;
    }

    if (
      preDischargeForm.new_discharge_reason ==
        DISCHARGE_REASONS.find((i) => i.text == "Expired")?.id &&
      !preDischargeForm.discharge_notes.trim()
    ) {
      setErrors({
        ...errors,
        discharge_notes: "Please enter the cause of death",
      });
      setIsSendingDischargeApi(false);
      return;
    }

    const dischargeDetails = {
      ...preDischargeForm,
      discharge: value,
      discharge_date: dayjs(preDischargeForm.discharge_date).toISOString(),
    };

    if (dischargeDetails.referred_to != undefined)
      delete dischargeDetails.referred_to_external;

    if (dischargeDetails.referred_to_external != undefined)
      delete dischargeDetails.referred_to;

    const dischargeResponse = await dispatch(
      dischargePatient(
        {
          ...preDischargeForm,
          discharge: value,
          discharge_date: dayjs(preDischargeForm.discharge_date).toISOString(),
        },
        { id: consultationData.id }
      )
    );

    setIsSendingDischargeApi(false);
    if (dischargeResponse?.status === 200) {
      Notification.Success({
        msg: "Patient Discharged Successfully",
      });

      afterSubmit?.();
    }
  };

  const handleFacilitySelect = (selected: FacilityModel) => {
    setFacility(selected);
    const { id, name } = selected || {};
    const isExternal = Number(id) === -1;
    setPreDischargeForm(
      (prev) =>
        ({
          ...prev,
          referred_to: isExternal ? null : id,
          referred_to_external: isExternal ? name : null,
        } as PreDischargeFormInterface)
    );
  };

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
          value={preDischargeForm.new_discharge_reason}
          disabled={!!new_discharge_reason}
          options={DISCHARGE_REASONS}
          optionValue={({ id }) => id}
          optionLabel={({ text }) => text}
          onChange={(e) =>
            setPreDischargeForm((prev) => ({
              ...prev,
              new_discharge_reason: e.value,
            }))
          }
          error={errors?.new_discharge_reason}
        />
        {preDischargeForm.new_discharge_reason ===
          DISCHARGE_REASONS.find((i) => i.text == "Referred")?.id && (
          <>
            <FieldLabel>Referred to</FieldLabel>
            <FacilitySelect
              name="referred_to"
              setSelected={(selected) =>
                handleFacilitySelect(selected as FacilityModel)
              }
              selected={facility ?? null}
              showAll
              freeText
              multiple={false}
              errors={errors?.referred_to}
              className="mb-4"
            />
          </>
        )}
        <TextAreaFormField
          required={
            preDischargeForm.new_discharge_reason ==
            DISCHARGE_REASONS.find((i) => i.text == "Expired")?.id
          }
          label={
            {
              "3": "Cause of death",
              "1": "Discharged Advice",
            }[preDischargeForm.new_discharge_reason ?? 0] ?? "Notes"
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
        <TextFormField
          name={
            preDischargeForm.new_discharge_reason ===
            DISCHARGE_REASONS.find((i) => i.text == "Expired")?.id
              ? "death_datetime"
              : "discharge_date"
          }
          label={
            preDischargeForm.new_discharge_reason ===
            DISCHARGE_REASONS.find((i) => i.text == "Expired")?.id
              ? "Date of Death"
              : "Date and Time of Discharge"
          }
          type="datetime-local"
          value={
            preDischargeForm[
              preDischargeForm.new_discharge_reason ===
              DISCHARGE_REASONS.find((i) => i.text == "Expired")?.id
                ? "death_datetime"
                : "discharge_date"
            ]
          }
          onChange={(e) => {
            const updates: Record<string, string | undefined> = {
              discharge_date: undefined,
              death_datetime: undefined,
            };
            updates[e.name] = e.value;
            setPreDischargeForm((form) => ({ ...form, ...updates }));
          }}
          required
          min={dayjs(consultationData?.encounter_date).format(
            "YYYY-MM-DDTHH:mm"
          )}
          max={dayjs().format("YYYY-MM-DDTHH:mm")}
          error={
            preDischargeForm.new_discharge_reason ===
            DISCHARGE_REASONS.find((i) => i.text == "Expired")?.id
              ? errors?.death_datetime
              : errors?.discharge_date
          }
        />

        {preDischargeForm.new_discharge_reason ===
          DISCHARGE_REASONS.find((i) => i.text == "Recovered")?.id && (
          <>
            <div className="mb-4">
              <FieldLabel>Discharge Prescription Medications</FieldLabel>
              <PrescriptionBuilder prescription_type="DISCHARGE" />
            </div>
            <div className="mb-4">
              <FieldLabel>Discharge PRN Prescriptions</FieldLabel>
              <PrescriptionBuilder prescription_type="DISCHARGE" is_prn />
            </div>
          </>
        )}
        {preDischargeForm.new_discharge_reason ===
          DISCHARGE_REASONS.find((i) => i.text == "Expired")?.id && (
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
        )}
      </div>

      {enable_hcx && (
        // TODO: if policy and approved pre-auth exists
        <div className="my-5 rounded p-5 shadow">
          <h2 className="mb-2">Claim Insurance</h2>
          {latestClaim ? (
            <ClaimCard claim={latestClaim} />
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
