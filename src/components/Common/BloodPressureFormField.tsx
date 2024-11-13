import { useTranslation } from "react-i18next";

import { FieldValidator } from "@/components/Form/FieldValidators";
import FormField from "@/components/Form/FormFields/FormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import {
  FieldChangeEvent,
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";
import { BloodPressure } from "@/components/Patient/models";

type Props = FormFieldBaseProps<BloodPressure | null>;

export default function BloodPressureFormField(props: Props) {
  const { t } = useTranslation();
  const field = useFormFieldPropsResolver(props);
  const map = meanArterialPressure(props.value)?.toFixed();

  const handleChange = (event: FieldChangeEvent<string>) => {
    const value = event.value ? parseInt(event.value, 10) : "";
    const bp = {
      systolic: field.value?.systolic,
      diastolic: field.value?.diastolic,
    };
    bp[event.name as keyof BloodPressure] = value || undefined;
    field.handleChange(Object.values(bp).filter(Boolean).length ? bp : null);
  };

  return (
    <FormField
      field={{
        ...field,
        labelSuffix: map && <span className="font-medium">MAP: {map}</span>,
      }}
    >
      <div className="flex flex-row items-center" id="bloodPressure">
        <TextFormField
          className="w-full"
          type="number"
          name="systolic"
          placeholder={t("systolic")}
          value={field.value?.systolic?.toString() ?? ""}
          autoComplete="off"
          onChange={handleChange}
          min={0}
          max={250}
          step={1}
          labelClassName="hidden"
          errorClassName="hidden"
        />
        <span className="px-2 pt-2 text-2xl font-medium text-secondary-400">
          /
        </span>
        <TextFormField
          className="w-full"
          type="number"
          name="diastolic"
          placeholder={t("diastolic")}
          value={field.value?.diastolic?.toString() ?? ""}
          autoComplete="off"
          onChange={handleChange}
          min={0}
          max={250}
          step={1}
          labelClassName="hidden"
          errorClassName="hidden"
        />
      </div>
    </FormField>
  );
}

export const meanArterialPressure = (bp?: BloodPressure | null) => {
  if (bp?.diastolic == null || bp?.systolic == null) {
    return;
  }
  return (2 * bp.diastolic + bp.systolic) / 3;
};

export const BloodPressureValidator: FieldValidator<BloodPressure> = (
  bp,
  t,
) => {
  if (Object.values(bp).every((v) => v == null)) {
    return;
  }
  if (bp.systolic == null || bp.diastolic == null) {
    return t("blood_pressure_error.missing");
  }
  if (bp.systolic > 250 || bp.diastolic > 250) {
    return t("blood_pressure_error.exceed");
  }
  if (bp.systolic < bp.diastolic) {
    return t("blood_pressure_error.systolic_less_than_diastolic");
  }
};
