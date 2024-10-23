import { useState } from "react";
import Form from "../Form/Form";
import { Prescription } from "./models";
import request from "../../Utils/request/request";
import * as Notification from "../../Utils/Notifications";
import useSlug from "@/common/hooks/useSlug";
import { RequiredFieldValidator } from "../Form/FieldValidators";
import { useTranslation } from "react-i18next";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import {
  PRESCRIPTION_FREQUENCIES,
  PRESCRIPTION_ROUTES,
} from "./CreatePrescriptionForm";
import TextFormField from "../Form/FormFields/TextFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { EditPrescriptionFormValidator } from "./validators";
import MedicineRoutes from "./routes";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import DosageFormField from "../Form/FormFields/DosageFormField";

interface Props {
  initial: Prescription;
  onDone: (created: boolean) => void;
}

const handleSubmit = async (
  consultation_external_id: string,
  oldObj: Prescription,
  { discontinued_reason, ...newObj }: Prescription,
) => {
  const discontinue = await request(MedicineRoutes.discontinuePrescription, {
    pathParams: {
      consultation: consultation_external_id,
      external_id: oldObj.id,
    },
    body: {
      discontinued_reason: discontinued_reason
        ? `Edit: ${discontinued_reason}`
        : "Edited",
    },
  });

  if (discontinue.res?.status !== 200) {
    Notification.Error({
      msg: "Failed to discontinue previous prescription",
    });
    return;
  }

  const { res } = await request(MedicineRoutes.createPrescription, {
    pathParams: { consultation: consultation_external_id },
    body: {
      ...newObj,
      // Forcing the medicine to be the same as the old one
      medicine: oldObj.medicine_object?.id,
      medicine_old: oldObj.medicine_old,
    },
  });

  return res?.status === 201;
};

export default function EditPrescriptionForm(props: Props) {
  const consultation = useSlug("consultation");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  return (
    <Form<Prescription>
      disabled={isLoading}
      defaults={props.initial}
      onCancel={() => props.onDone(false)}
      onSubmit={async (obj) => {
        setIsLoading(true);
        const success = await handleSubmit(consultation, props.initial, obj);
        setIsLoading(false);

        if (success) {
          props.onDone(true);
          Notification.Success({ msg: "Prescription edited successfully" });
        } else {
          Notification.Error({ msg: "Failed to edit prescription" });
        }
      }}
      noPadding
      validate={EditPrescriptionFormValidator(props.initial)}
    >
      {(field) => (
        <>
          <TextAreaFormField
            label={t("reason_for_edit")}
            {...field("discontinued_reason")}
          />

          {props.initial.dosage_type !== "PRN" && (
            <CheckBoxFormField
              label={t("titrate_dosage")}
              name="Titrate Dosage"
              value={field("dosage_type").value === "TITRATED"}
              onChange={(e) => {
                if (e.value) {
                  field("dosage_type").onChange({
                    name: "dosage_type",
                    value: "TITRATED",
                  });
                } else {
                  field("dosage_type").onChange({
                    name: "dosage_type",
                    value: "REGULAR",
                  });
                }
              }}
            />
          )}

          <div className="flex items-center gap-4">
            <SelectFormField
              className="flex-1"
              label={t("route")}
              {...field("route")}
              options={PRESCRIPTION_ROUTES}
              optionLabel={(key) => t("PRESCRIPTION_ROUTE_" + key)}
              optionValue={(key) => key}
            />
            {field("dosage_type").value === "TITRATED" ? (
              <div className="flex w-full flex-[2] gap-4">
                <DosageFormField
                  className="flex-1"
                  label={t("start_dosage")}
                  {...field("base_dosage", RequiredFieldValidator())}
                  required
                  min={0}
                />
                <DosageFormField
                  className="flex-1"
                  label={t("target_dosage")}
                  {...field("target_dosage", RequiredFieldValidator())}
                  required
                  min={0}
                />
              </div>
            ) : (
              <DosageFormField
                className="flex-1"
                label={t("dosage")}
                {...field("base_dosage", RequiredFieldValidator())}
                required={field("dosage_type").value !== "TITRATED"}
                min={0}
              />
            )}
          </div>

          {props.initial.dosage_type === "PRN" ? (
            <>
              <TextFormField
                label={t("indicator")}
                {...field("indicator", RequiredFieldValidator())}
                required
              />
              <DosageFormField
                className="flex-1"
                label={t("max_dosage_24_hrs")}
                min={0}
                {...field("max_dosage")}
              />
              <SelectFormField
                label={t("min_time_bw_doses")}
                {...field("min_hours_between_doses")}
                options={[1, 2, 3, 6, 12, 24]}
                optionLabel={(hours) => `${hours} hrs.`}
                optionValue={(hours) => hours}
                position="above"
              />
            </>
          ) : (
            <div className="flex items-center gap-4">
              <SelectFormField
                position="above"
                className="flex-1"
                label={t("frequency")}
                {...field("frequency", RequiredFieldValidator())}
                required
                options={Object.entries(PRESCRIPTION_FREQUENCIES)}
                optionLabel={([key]) =>
                  t("PRESCRIPTION_FREQUENCY_" + key.toUpperCase())
                }
                optionValue={([key]) => key}
              />
              <TextFormField
                className="flex-1"
                label={t("days")}
                type="number"
                min={0}
                {...field("days")}
              />
            </div>
          )}

          {field("dosage_type").value === "TITRATED" && (
            <TextAreaFormField
              label={t("instruction_on_titration")}
              {...field("instruction_on_titration")}
            />
          )}

          <TextAreaFormField label={t("notes")} {...field("notes")} />
        </>
      )}
    </Form>
  );
}
