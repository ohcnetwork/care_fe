import { RequiredFieldValidator } from "../Form/FieldValidators";
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
import { PrescriptionFormValidator } from "./validators";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";

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
          {props.prescription.dosage_type !== "PRN" && (
            <CheckBoxFormField
              label="Titrate Dosage"
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
          <div className="flex flex-wrap items-center gap-x-4">
            <SelectFormField
              className="flex-1"
              label={t("route")}
              {...field("route")}
              options={PRESCRIPTION_ROUTES}
              optionLabel={(key) => t("PRESCRIPTION_ROUTE_" + key)}
              optionValue={(key) => key}
            />
            {field("dosage_type").value === "TITRATED" ? (
              <div className="flex w-full gap-4">
                <NumericWithUnitsFormField
                  className="flex-1"
                  label="Start Dosage"
                  {...field("base_dosage", RequiredFieldValidator())}
                  required
                  units={["mg", "g", "ml", "drop(s)", "ampule(s)", "tsp"]}
                  min={0}
                />
                <NumericWithUnitsFormField
                  className="flex-1"
                  label="Target Dosage"
                  {...field("target_dosage", RequiredFieldValidator())}
                  required
                  units={["mg", "g", "ml", "drop(s)", "ampule(s)", "tsp"]}
                  min={0}
                />
              </div>
            ) : (
              <NumericWithUnitsFormField
                className="flex-1"
                label={t("dosage")}
                {...field("base_dosage", RequiredFieldValidator())}
                required={field("dosage_type").value !== "TITRATED"}
                units={["mg", "g", "ml", "drop(s)", "ampule(s)", "tsp"]}
                min={0}
              />
            )}
          </div>

          {props.prescription.dosage_type === "PRN" ? (
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

          {field("dosage_type").value === "TITRATED" && (
            <TextAreaFormField
              label="Instructions on titration"
              {...field("instruction_on_titration")}
            />
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
