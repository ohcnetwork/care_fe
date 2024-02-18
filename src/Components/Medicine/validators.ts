import { FieldError, RequiredFieldValidator } from "../Form/FieldValidators";
import { FormErrors } from "../Form/Utils";
import { Prescription } from "./models";

export const PrescriptionFormValidator = () => {
  return (form: Prescription): FormErrors<Prescription> => {
    const errors: Partial<Record<keyof Prescription, FieldError>> = {};
    errors.medicine_object = RequiredFieldValidator()(form.medicine_object);
    errors.dosage = RequiredFieldValidator()(form.dosage);
    if (form.is_prn)
      errors.indicator = RequiredFieldValidator()(form.indicator);
    if (!form.is_prn)
      errors.frequency = RequiredFieldValidator()(form.frequency);
    return errors;
  };
};

export const EditPrescriptionFormValidator = (old: Prescription) => {
  return (form: Prescription): FormErrors<Prescription> => {
    const errors = PrescriptionFormValidator()(form);

    if (comparePrescriptions(old, form)) {
      errors.$all = "No changes made";
    }

    return errors;
  };
};

const PRESCRIPTION_COMPARE_FIELDS: (keyof Prescription)[] = [
  "medicine",
  "days",
  "discontinued",
  "dosage",
  "frequency",
  "indicator",
  "is_prn",
  "max_dosage",
  "min_hours_between_doses",
  "prescription_type",
  "route",
];

export const comparePrescriptions = (a: Prescription, b: Prescription) => {
  return (
    PRESCRIPTION_COMPARE_FIELDS.every((field) => a[field] === b[field]) &&
    a.medicine_object?.id === b.medicine_object?.id
  );
};
