import { useState } from "react";
import ConfirmDialog from "../Common/ConfirmDialog";
import { Prescription } from "./models";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { Success } from "../../Utils/Notifications";
import PrescriptionDetailCard from "./PrescriptionDetailCard";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { formatDateTime } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import dayjs from "../../Utils/dayjs";
import useSlug from "../../Common/hooks/useSlug";
import request from "../../Utils/request/request";
import MedicineRoutes from "./routes";

interface Props {
  prescription: Prescription;
  onClose: (success: boolean) => void;
}

export default function AdministerMedicine({ prescription, ...props }: Props) {
  const { t } = useTranslation();
  const consultation = useSlug("consultation");
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState<string>(
    dayjs().format("YYYY-MM-DDTHH:mm")
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
        <div className="text-sm font-semibold leading-relaxed text-gray-600">
          <CareIcon icon="l-history-alt" className="pr-1" /> Last administered
          <span className="pl-1">
            {prescription.last_administered_on
              ? formatDateTime(prescription.last_administered_on)
              : t("never")}
          </span>
        </div>
      }
      show
      onClose={() => props.onClose(false)}
      onConfirm={async () => {
        setIsLoading(true);
        const { res } = await request(MedicineRoutes.administerPrescription, {
          pathParams: { consultation, external_id: prescription.id },
          body: {
            notes,
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
