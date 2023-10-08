import { useState } from "react";
import Form from "../Form/Form";
import { Prescription } from "./models";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import * as Notification from "../../Utils/Notifications";
import useSlug from "../../Common/hooks/useSlug";
import { RequiredFieldValidator } from "../Form/FieldValidators";
import { useTranslation } from "react-i18next";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import NumericWithUnitsFormField from "../Form/FormFields/NumericWithUnitsFormField";
import {
  PRESCRIPTION_FREQUENCIES,
  PRESCRIPTION_ROUTES,
} from "./CreatePrescriptionForm";
import TextFormField from "../Form/FormFields/TextFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { EditPrescriptionFormValidator } from "./validators";

interface Props {
  initial: Prescription;
  onDone: (created: boolean) => void;
}

const handleSubmit = async (
  consultation_external_id: string,
  oldObj: Prescription,
  { discontinued_reason, ...newObj }: Prescription
) => {
  const discontinue = await request(routes.discontinuePrescription, {
    pathParams: { consultation_external_id, external_id: oldObj.id },
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

  const { res } = await request(routes.createPrescription, {
    pathParams: { consultation_external_id },
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

          <div className="flex items-center gap-4">
            <SelectFormField
              className="flex-1"
              label={t("route")}
              {...field("route")}
              options={PRESCRIPTION_ROUTES}
              optionLabel={(key) => t("PRESCRIPTION_ROUTE_" + key)}
              optionValue={(key) => key}
            />
            <NumericWithUnitsFormField
              className="flex-1"
              label={t("dosage")}
              {...field("dosage", RequiredFieldValidator())}
              required
              units={["mg", "g", "ml", "drop(s)", "ampule(s)", "tsp"]}
              min={0}
            />
          </div>

          {props.initial.is_prn ? (
            <>
              <TextFormField
                label={t("indicator")}
                {...field("indicator", RequiredFieldValidator())}
                required
              />
              <TextFormField
                label={t("max_dosage_24_hrs")}
                type="number"
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

          <TextAreaFormField label={t("notes")} {...field("notes")} />
        </>
      )}
    </Form>
  );
}
