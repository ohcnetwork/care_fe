import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ConfirmDialog from "@/components/Common/ConfirmDialog";
import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import DateFormField from "@/components/Form/FormFields/DateFormField";
import DosageFormField from "@/components/Form/FormFields/DosageFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import PrescriptionDetailCard from "@/components/Medicine/PrescriptionDetailCard";
import { DosageValue, Prescription } from "@/components/Medicine/models";
import MedicineRoutes from "@/components/Medicine/routes";
import { AdministrationDosageValidator } from "@/components/Medicine/validators";

import useSlug from "@/hooks/useSlug";

import { Success } from "@/Utils/Notifications";
import dayjs from "@/Utils/dayjs";
import request from "@/Utils/request/request";
import { formatDateTime } from "@/Utils/utils";

interface Props {
  prescription: Prescription;
  onClose: (success: boolean) => void;
}

export default function AdministerMedicine({ prescription, ...props }: Props) {
  const { t } = useTranslation();
  const consultation = useSlug("consultation");
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [dosage, setDosage] = useState<DosageValue>();
  const [error, setError] = useState<string>();
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState<string>(
    dayjs().format("YYYY-MM-DDTHH:mm"),
  );

  return (
    <ConfirmDialog
      action={
        <>
          <CareIcon icon="l-syringe" className="text-lg" />
          {t("administer_medicine")}
        </>
      }
      title={t("administer_medicine")}
      description={
        <div className="text-sm font-semibold leading-relaxed text-secondary-600">
          <CareIcon icon="l-history-alt" className="pr-1" /> Last administered
          <span className="whitespace-nowrap pl-2">
            <CareIcon icon="l-clock" />{" "}
            {prescription.last_administration?.administered_date
              ? formatDateTime(
                  prescription.last_administration.administered_date,
                )
              : t("never")}
          </span>
          {prescription.dosage_type === "TITRATED" && (
            <span className="whitespace-nowrap pl-2">
              <CareIcon icon="l-syringe" /> {t("dosage")}
              {":"} {prescription.last_administration?.dosage ?? "NA"}
            </span>
          )}
          <span className="whitespace-nowrap pl-2">
            <CareIcon icon="l-user" /> Administered by:{" "}
            {prescription.last_administration?.administered_by?.username ??
              "NA"}
          </span>
        </div>
      }
      show
      onClose={() => props.onClose(false)}
      onConfirm={async () => {
        if (prescription.dosage_type === "TITRATED") {
          const error = AdministrationDosageValidator(
            prescription.base_dosage,
            prescription.target_dosage,
          )(dosage);
          setError(error);
          if (error) return;
        }

        setIsLoading(true);
        const { res } = await request(MedicineRoutes.administerPrescription, {
          pathParams: { consultation, external_id: prescription.id },
          body: {
            notes,
            dosage,
            administered_date: isCustomTime ? customTime : undefined,
          },
        });
        if (res?.ok) {
          Success({ msg: t("medicines_administered") });
        }
        setIsLoading(false);
        props.onClose(true);
      }}
      className="w-full md:max-w-4xl"
    >
      <div className="mt-4 flex flex-col gap-8">
        <PrescriptionDetailCard prescription={prescription} readonly />

        {prescription.dosage_type === "TITRATED" && (
          <DosageFormField
            name="dosage"
            label={
              t("dosage") +
              ` (${prescription.base_dosage} - ${prescription.target_dosage})`
            }
            value={dosage}
            onChange={({ value }) => setDosage(value)}
            required
            min={prescription.base_dosage}
            max={prescription.target_dosage}
            disabled={isLoading}
            error={error}
            errorClassName={error ? "block" : "hidden"}
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
            <DateFormField
              name="administered_date"
              value={customTime ? new Date(customTime) : new Date()}
              onChange={({ value }) =>
                setCustomTime(dayjs(value).format("YYYY-MM-DDTHH:mm"))
              }
              disabled={!isCustomTime}
              min={new Date(prescription.created_date)}
              max={new Date()}
              errorClassName="hidden"
              allowTime
            />
          </div>
        </div>
      </div>
    </ConfirmDialog>
  );
}
