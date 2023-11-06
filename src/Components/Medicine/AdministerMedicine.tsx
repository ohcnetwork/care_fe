import { useState } from "react";
import { PrescriptionActions } from "../../Redux/actions";
import ConfirmDialog from "../Common/ConfirmDialog";
import { Prescription } from "./models";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { Success } from "../../Utils/Notifications";
import { useDispatch } from "react-redux";
import PrescriptionDetailCard from "./PrescriptionDetailCard";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { formatDateTime } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import dayjs from "../../Utils/dayjs";
import NumericWithUnitsFormField from "../Form/FormFields/NumericWithUnitsFormField";

interface Props {
  prescription: Prescription;
  actions: ReturnType<ReturnType<typeof PrescriptionActions>["prescription"]>;
  onClose: (success: boolean) => void;
}

export default function AdministerMedicine({ prescription, ...props }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [dosage, setDosage] = useState<string | undefined>();
  const [error, setError] = useState<string>();
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState<string>(
    dayjs().format("YYYY-MM-DDTHH:mm")
  );

  return (
    <ConfirmDialog
      action={
        <>
          <CareIcon className="care-l-syringe text-lg" />
          {t("administer_medicine")}
        </>
      }
      title={t("administer_medicine")}
      description={
        <div className="text-sm font-semibold leading-relaxed text-gray-600">
          <CareIcon className="care-l-history-alt pr-1" /> Last administered
          <span className="whitespace-nowrap pl-2">
            <CareIcon className="care-l-clock" />{" "}
            {prescription.last_administration?.administered_date
              ? formatDateTime(
                  prescription.last_administration.administered_date
                )
              : t("never")}
          </span>
          {prescription.dosage_type === "TITRATED" && (
            <span className="whitespace-nowrap pl-2">
              <CareIcon className="care-l-syringe" /> {t("dosage")}
              {":"} {prescription.last_administration?.dosage ?? "NA"}
            </span>
          )}
          <span className="whitespace-nowrap pl-2">
            <CareIcon className="care-l-user" /> Administered by:{" "}
            {prescription.last_administration?.administered_by?.username ??
              "NA"}
          </span>
        </div>
      }
      show
      onClose={() => props.onClose(false)}
      onConfirm={async () => {
        if (!dosage && prescription.dosage_type === "TITRATED") {
          setError("This field is required");
          return;
        }
        if (
          (prescription.dosage_type === "TITRATED" &&
            Number(dosage?.split(" ")[0]) <
              Number(prescription.base_dosage?.split(" ")[0])) ||
          Number(dosage?.split(" ")[0]) >
            Number(prescription.target_dosage?.split(" ")[0])
        ) {
          setError("Dosage should be between start and target dosage");
          return;
        }

        setIsLoading(true);
        const res = await dispatch(
          props.actions.administer({
            notes,
            dosage,
            administered_date: isCustomTime ? customTime : undefined,
          })
        );
        if (res.status === 201) {
          Success({ msg: t("medicines_administered") });
        }
        setIsLoading(false);
        props.onClose(true);
      }}
      className="w-full md:max-w-4xl"
    >
      <div className="mt-4 flex flex-col">
        <div className="mb-8">
          <PrescriptionDetailCard
            prescription={prescription}
            readonly
            actions={props.actions}
          />
        </div>
        {prescription.dosage_type === "TITRATED" && (
          <NumericWithUnitsFormField
            name="dosage"
            label={
              t("dosage") +
              ` (${prescription.base_dosage} - ${prescription.target_dosage})`
            }
            value={dosage}
            onChange={({ value }) => setDosage(value)}
            required
            units={["mg", "g", "ml", "drop(s)", "ampule(s)", "tsp"]}
            min={prescription.base_dosage}
            max={prescription.target_dosage}
            disabled={isLoading}
            error={error}
          />
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <TextAreaFormField
            label={t("administration_notes")}
            className="w-full"
            name="administration_notes"
            placeholder={t("add_notes")}
            value={notes}
            onChange={({ value }) => setNotes(value)}
            errorClassName="hidden"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-2 lg:max-w-min">
            <CheckBoxFormField
              label="Administer for a time in the past"
              labelClassName="whitespace-nowrap"
              name="is_custom_time"
              value={isCustomTime}
              onChange={({ value }) => {
                setIsCustomTime(value);
                if (!value) {
                  setCustomTime(dayjs().format("YYYY-MM-DDTHH:mm"));
                }
              }}
              errorClassName="hidden"
            />
            <TextFormField
              name="administered_date"
              type="datetime-local"
              value={customTime}
              onChange={({ value }) => setCustomTime(value)}
              disabled={!isCustomTime}
              min={dayjs(prescription.created_date).format("YYYY-MM-DDTHH:mm")}
              max={dayjs().format("YYYY-MM-DDTHH:mm")}
            />
          </div>
        </div>
      </div>
    </ConfirmDialog>
  );
}
