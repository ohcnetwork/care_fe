import moment from "moment";
import { FieldError, RequiredFieldValidator } from "../Form/FieldValidators";
import Form from "../Form/Form";
import { createFormContext } from "../Form/FormContext";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { MedicineAdministrationRecord, Prescription } from "./models";
import { PrescriptionActions } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { useState } from "react";

const prescriptionFormContext = createFormContext<Prescription>();

export default function PrescriptionForm(props: {
  prescription: Prescription;
  create: ReturnType<typeof PrescriptionActions>["create"];
  onDone: () => void;
}) {
  const dispatch = useDispatch<any>();
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Form
      disabled={isCreating}
      context={prescriptionFormContext}
      defaults={props.prescription}
      onCancel={props.onDone}
      onSubmit={async (obj) => {
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

        if (!form.medicine) {
          errors.medicine = "Required";
        }

        if (!form.dosage) {
          errors.dosage = "Required";
        }

        if (form.is_prn) {
          if (!form.indicator) {
            errors.indicator = "Required";
          }
        } else {
          if (!form.frequency) {
            errors.frequency = "Required";
          }
        }

        return errors;
      }}
    >
      {(field) => (
        <>
          <TextFormField
            label="Medicine"
            {...field("medicine", RequiredFieldValidator())}
            required
          />
          <div className="flex gap-4 items-center">
            <SelectFormField
              className="flex-1"
              label="Route"
              {...field("route")}
              options={Object.entries(PRESCRIPTION_ROUTES)}
              optionLabel={([_, { name }]) => name}
              optionValue={([key]) => key}
            />
            <TextFormField
              className="flex-1"
              label="Dosage"
              type="number"
              {...field("dosage", RequiredFieldValidator())}
              required
            />
          </div>

          {props.prescription.is_prn ? (
            <>
              <TextFormField
                label="Indicator"
                {...field("indicator", RequiredFieldValidator())}
                required
              />
              <TextFormField
                label="Max. dosage in 24 hours"
                type="number"
                {...field("max_dosage")}
              />
              <SelectFormField
                label="Min. time b/w consecutive doses"
                {...field("min_hours_between_doses")}
                options={[1, 2, 3, 6, 12, 24]}
                optionLabel={(hours) => `${hours} hrs.`}
                optionValue={(hours) => hours}
              />
            </>
          ) : (
            <div className="flex gap-4 items-center">
              <SelectFormField
                className="flex-1"
                label="Frequency"
                {...field("frequency", RequiredFieldValidator())}
                required
                options={Object.entries(PRESCRIPTION_FREQUENCIES)}
                optionLabel={([_, { name }]) => name}
                optionValue={([key]) => key}
              />
              <TextFormField
                className="flex-1"
                label="Days"
                type="number"
                {...field("days")}
              />
            </div>
          )}

          <TextAreaFormField label="Notes" {...field("notes")} />
        </>
      )}
    </Form>
  );
}

export const PRESCRIPTION_ROUTES = {
  ORAL: { name: "Oral" },
  IV: { name: "IV" },
  IM: { name: "IM" },
  SC: { name: "S/C" },
};

export const PRESCRIPTION_FREQUENCIES = {
  STAT: {
    name: "Imediately",
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) => administration),
  },
  OD: {
    name: "Once daily",
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        moment(administration.administered_date).isSame(moment(), "day")
      ),
  },
  HS: {
    name: "Night only",
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        moment(administration.administered_date).isSame(moment(), "day")
      ),
  },
  BD: {
    name: "Twice daily",
    slots: 2,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        moment(administration.administered_date).isSame(moment(), "day")
      ),
  },
  TID: {
    name: "8th hourly",
    slots: 3,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        moment(administration.administered_date).isSame(moment(), "day")
      ),
  },
  QID: {
    name: "6th hourly",
    slots: 4,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        moment(administration.administered_date).isSame(moment(), "day")
      ),
  },
  Q4H: {
    name: "4th hourly",
    slots: 6,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        moment(administration.administered_date).isSame(moment(), "day")
      ),
  },
  QOD: {
    name: "Alternate day",
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) => {
      const lastAdministration = administrations[0];
      if (!lastAdministration) {
        return [];
      }
      if (
        moment(lastAdministration.administered_date).isSame(moment(), "day") ||
        moment(lastAdministration.administered_date).isSame(
          moment().subtract(1, "day"),
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
    name: "Once a week",
    slots: 1,
    completed: (administrations: MedicineAdministrationRecord[]) =>
      administrations.filter((administration) =>
        moment(administration.administered_date).isSame(moment(), "week")
      ),
  },
};
