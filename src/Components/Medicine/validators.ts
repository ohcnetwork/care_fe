import { FieldError, RequiredFieldValidator } from "../Form/FieldValidators";
import { FormErrors } from "../Form/Utils";
import { Prescription } from "./models";

export const PrescriptionFormValidator = () => {
  return (form: Prescription): FormErrors<Prescription> => {
    const errors: Partial<Record<keyof Prescription, FieldError>> = {};
    errors.medicine_object = RequiredFieldValidator()(form.medicine_object);
    if (form.dosage_type === "TITRATED") {
      errors.base_dosage = RequiredFieldValidator()(form.base_dosage);
      errors.target_dosage = RequiredFieldValidator()(form.target_dosage);
      if (
        form.base_dosage &&
        form.target_dosage &&
        form.base_dosage.split(" ")[1] !== form.target_dosage.split(" ")[1]
      ) {
        errors.base_dosage = "Unit must be same as target dosage's unit";
        errors.target_dosage = "Unit must be same as base dosage's unit";
      }
    } else errors.base_dosage = RequiredFieldValidator()(form.base_dosage);
    if (form.dosage_type === "PRN")
      errors.indicator = RequiredFieldValidator()(form.indicator);
    if (form.dosage_type !== "PRN")
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
  "base_dosage",
  "frequency",
  "indicator",
  "dosage_type",
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

export const AdministrationDosageValidator = (
  base_dosage: Prescription["base_dosage"],
  target_dosage: Prescription["target_dosage"]
) => {
  return (value: Prescription["base_dosage"]) => {
    const getDosageValue = (dosage: string | undefined) => {
      return dosage ? Number(dosage.split(" ")[0]) : undefined;
    };

    const valueDosage = getDosageValue(value);
    const baseDosage = getDosageValue(base_dosage);
    const targetDosage = getDosageValue(target_dosage);

    if (!valueDosage) return "This field is required";

    if (value?.split(" ")[1] !== base_dosage?.split(" ")[1])
      return "Unit must be the same as start and target dosage's unit";

    if (
      baseDosage &&
      targetDosage &&
      (valueDosage < baseDosage || valueDosage > targetDosage)
    )
      return "Dosage should be between start and target dosage";
  };
};
