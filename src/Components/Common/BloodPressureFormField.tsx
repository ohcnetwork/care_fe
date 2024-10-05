import { useTranslation } from "react-i18next";
import { FieldValidator } from "../Form/FieldValidators";
import FormField from "../Form/FormFields/FormField";
import RangeAutocompleteFormField from "../Form/FormFields/RangeAutocompleteFormField";
import {
  FieldChangeEvent,
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";
import { BloodPressure } from "../Patient/models";

type Props = FormFieldBaseProps<BloodPressure | null>;

export default function BloodPressureFormField(props: Props) {
  const { t } = useTranslation();
  const field = useFormFieldPropsResolver(props);
  const map = meanArterialPressure(props.value)?.toFixed();

  const handleChange = (event: FieldChangeEvent<number>) => {
    const bp = {
      systolic: field.value?.systolic,
      diastolic: field.value?.diastolic,
    };
    bp[event.name as keyof BloodPressure] = event.value;
    field.handleChange(Object.values(bp).filter(Boolean).length ? bp : null);
  };

  return (
    <FormField
      field={{
        ...field,
        labelSuffix: map && <span className="font-medium">MAP: {map}</span>,
      }}
    >
      <div className="flex flex-row items-center">
        <RangeAutocompleteFormField
          name="systolic"
          placeholder={t("systolic")}
          start={0}
          end={250}
          step={1}
          value={field.value?.systolic ?? undefined}
          onChange={handleChange}
          labelClassName="hidden"
          errorClassName="hidden"
          thresholds={[
            {
              value: 0,
              label: "Low",
              className: "hidden md:block text-danger-500",
            },
            {
              value: 100,
              label: "Normal",
              className: "hidden md:block text-primary-500",
            },
            {
              value: 140,
              label: "High",
              className: "hidden md:block text-warning-500",
            },
          ]}
        />
        <span className="px-2 text-lg font-medium text-secondary-400">/</span>
        <RangeAutocompleteFormField
          name="diastolic"
          placeholder={t("diastolic")}
          start={0}
          end={250}
          step={1}
          value={field.value?.diastolic ?? undefined}
          onChange={handleChange}
          labelClassName="hidden"
          errorClassName="hidden"
          thresholds={[
            {
              value: 0,
              label: "Low",
              className: "hidden md:block text-danger-500",
            },
            {
              value: 50,
              label: "Normal",
              className: "hidden md:block text-primary-500",
            },
            {
              value: 90,
              label: "High",
              className: "hidden md:block text-warning-500",
            },
          ]}
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

export const BloodPressureValidator: FieldValidator<BloodPressure> = (bp) => {
  if (Object.values(bp).every((v) => v == null)) {
    return;
  }
  if (bp.diastolic == null) {
    return "Diastolic is missing. Either specify both or clear both.";
  }
  if (bp.systolic == null) {
    return "Systolic is missing. Either specify both or clear both.";
  }
};
