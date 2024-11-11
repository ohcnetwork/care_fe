import { t } from "i18next";

import {
  FieldError,
  RequiredFieldValidator,
} from "@/components/Form/FieldValidators";
import { FormErrors } from "@/components/Form/Utils";
import { Prescription } from "@/components/Medicine/models";

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
        errors.base_dosage = t("inconsistent_dosage_units_error");
        errors.target_dosage = t("inconsistent_dosage_units_error");
      }
    } else {
      errors.base_dosage = RequiredFieldValidator()(form.base_dosage);
    }

    if (form.dosage_type === "PRN") {
      errors.indicator = RequiredFieldValidator()(form.indicator);

      const baseDosageValue = getDosageValue(form.base_dosage);
      const maxDosageValue = getDosageValue(form.max_dosage);

      if (
        baseDosageValue &&
        maxDosageValue &&
        baseDosageValue > maxDosageValue
      ) {
        errors.max_dosage = t("max_dosage_in_24hrs_gte_base_dosage_error");
      }
    } else {
      errors.frequency = RequiredFieldValidator()(form.frequency);
    }

    return errors;
  };
};

const getDosageValue = (dosage: string | undefined) => {
  return dosage ? Number(dosage.split(" ")[0]) : undefined;
};

export const EditPrescriptionFormValidator = (old: Prescription) => {
  return (form: Prescription): FormErrors<Prescription> => {
    const errors = PrescriptionFormValidator()(form);

    if (comparePrescriptions(old, form)) {
      errors.$all = t("no_changes_made");
    }

    return errors;
  };
};

const PRESCRIPTION_COMPARE_FIELDS: (keyof Prescription)[] = [
  "medicine",
  "days",
  "discontinued",
  "target_dosage",
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
  target_dosage: Prescription["target_dosage"],
) => {
  return (value: Prescription["base_dosage"]) => {
    const valueDosage = getDosageValue(value);
    const baseDosage = getDosageValue(base_dosage);
    const targetDosage = getDosageValue(target_dosage);

    if (!valueDosage) return t("field_required");

    if (value?.split(" ")[1] !== base_dosage?.split(" ")[1])
      return t("inconsistent_dosage_units_error");

    if (baseDosage && targetDosage) {
      const [min, max] = [baseDosage, targetDosage].sort((a, b) => a - b);

      if (!(min <= valueDosage && valueDosage <= max)) {
        return t("administration_dosage_range_error");
      }
    }
  };
};
