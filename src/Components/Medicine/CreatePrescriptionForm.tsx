import { RequiredFieldValidator } from "../Form/FieldValidators";
import Form from "../Form/Form";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import {
  DOSAGE_UNITS,
  MedicineAdministrationRecord,
  Prescription,
} from "./models";
import { useState } from "react";
import NumericWithUnitsFormField from "../Form/FormFields/NumericWithUnitsFormField";
import { useTranslation } from "react-i18next";
import MedibaseAutocompleteFormField from "./MedibaseAutocompleteFormField";
import dayjs from "../../Utils/dayjs";
import { PrescriptionFormValidator } from "./validators";
import MedicineRoutes from "./routes";
import request from "../../Utils/request/request";
import useSlug from "../../Common/hooks/useSlug";
import { Success } from "../../Utils/Notifications";

export default function CreatePrescriptionForm(props: {
  prescription: Prescription;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const consultation = useSlug("consultation");
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Form<Prescription>
      disabled={isCreating}
      defaults={props.prescription}
      onCancel={props.onDone}
      onSubmit={async (body) => {
        body["medicine"] = body.medicine_object?.id;
        delete body.medicine_object;

        setIsCreating(true);
        const { res, error } = await request(
          MedicineRoutes.createPrescription,
          {
            pathParams: { consultation },
            body,
          }
        );
        setIsCreating(false);

        if (!res?.ok) {
          return error;
        }

        Success({ msg: t("Medicine prescribed") });
        props.onDone();
      }}
      noPadding
      validate={PrescriptionFormValidator()}
      className="max-w-3xl"
    >
      {(field) => (
        <>
          <MedibaseAutocompleteFormField
            label={t("medicine")}
            {...field("medicine_object", RequiredFieldValidator())}
            required
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
              units={DOSAGE_UNITS}
              min={0}
            />
          </div>

          {props.prescription.is_prn ? (
            <>
              <TextFormField
                label={t("indicator")}
                {...field("indicator", RequiredFieldValidator())}
                required
              />
              <NumericWithUnitsFormField
                className="flex-1"
                label={t("max_dosage_24_hrs")}
                units={DOSAGE_UNITS}
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

export const PRESCRIPTION_ROUTES = [
  "ORAL",
  "IV",
  "IM",
  "SC",
  "INHALATION",
  "NASOGASTRIC",
  "INTRATHECAL",
  "TRANSDERMAL",
  "RECTAL",
] as const;
export const PRESCRIPTION_FREQUENCIES = {
  STAT: {
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) => administration),
  },
  OD: {
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "day")
      ),
  },
  HS: {
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "day")
      ),
  },
  BD: {
    slots: 2,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "day")
      ),
  },
  TID: {
    slots: 3,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "day")
      ),
  },
  QID: {
    slots: 4,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "day")
      ),
  },
  Q4H: {
    slots: 6,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "day")
      ),
  },
  QOD: {
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) => {
      const lastAdministration = administrations[0];
      if (!lastAdministration) {
        return [];
      }
      if (
        dayjs(lastAdministration.administered_date).isSame(dayjs(), "day") ||
        dayjs(lastAdministration.administered_date).isSame(
          dayjs().subtract(1, "day"),
          "day"
        )
      ) {
        return [lastAdministration];
      } else {
        return [] as MedicineAdministrationRecord[];
      }
    },
  },
  QWK: {
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        dayjs(administration.administered_date).isSame(dayjs(), "week")
      ),
  },
};
