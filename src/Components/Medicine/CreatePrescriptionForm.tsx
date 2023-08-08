import { FieldError, RequiredFieldValidator } from "../Form/FieldValidators";
import Form from "../Form/Form";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { MedicineAdministrationRecord, Prescription } from "./models";
import { PrescriptionActions } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { useState } from "react";
import NumericWithUnitsFormField from "../Form/FormFields/NumericWithUnitsFormField";
import { useTranslation } from "react-i18next";
import MedibaseAutocompleteFormField from "./MedibaseAutocompleteFormField";
import dayjs from "../../Utils/dayjs";

export default function CreatePrescriptionForm(props: {
  prescription: Prescription;
  create: ReturnType<typeof PrescriptionActions>["create"];
  onDone: () => void;
}) {
  const dispatch = useDispatch<any>();
  const [isCreating, setIsCreating] = useState(false);
  const { t } = useTranslation();

  return (
    <Form<Prescription>
      disabled={isCreating}
      defaults={props.prescription}
      onCancel={props.onDone}
      onSubmit={async (obj) => {
        obj["medicine"] = obj.medicine_object?.id;
        delete obj.medicine_object;

        setIsCreating(true);
        const res = await dispatch(props.create(obj));
        setIsCreating(false);
        if (res.status !== 201) {
          return res.data;
        } else {
          props.onDone();
        }
      }}
      noPadding
      validate={(form) => {
        const errors: Partial<Record<keyof Prescription, FieldError>> = {};
        errors.medicine_object = RequiredFieldValidator()(form.medicine_object);
        errors.dosage = RequiredFieldValidator()(form.dosage);
        if (form.is_prn)
          errors.indicator = RequiredFieldValidator()(form.indicator);
        if (!form.is_prn)
          errors.frequency = RequiredFieldValidator()(form.frequency);
        return errors;
      }}
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
              units={["mg", "g", "ml", "drop(s)", "ampule(s)", "tsp"]}
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

export const PRESCRIPTION_ROUTES = ["ORAL", "IV", "IM", "SC"];
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
