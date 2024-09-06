import { useTranslation } from "react-i18next";
import { FieldValidator } from "../Form/FieldValidators";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import FormField from "../Form/FormFields/FormField";
import RangeAutocompleteFormField from "../Form/FormFields/RangeAutocompleteFormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";
import { BloodPressure } from "../Patient/models";

type Props = FormFieldBaseProps<BloodPressure | null>;

export default function BloodPressureFormField(props: Props) {
  const { t } = useTranslation();
  const field = useFormFieldPropsResolver(props);

  const handleChange = (bp: BloodPressure) => {
    if (Object.values(bp).every((v) => (v ?? false) === false)) {
      field.handleChange(null);
      return;
    }

    field.handleChange(bp);
  };

  const map = meanArterialPressure(props.value);

  return (
    <FormField
      field={{
        ...field,
        labelSuffix: map && <span className="font-medium">MAP: {map}</span>,
      }}
    >
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div className="flex items-center gap-4 whitespace-nowrap">
          <CheckBoxFormField
            label={t("not_measurable")}
            labelClassName="text-sm"
            value={field.value?.systolic_not_measurable}
            name="systolic_not_measurable"
            onChange={({ value }) => {
              const bp = field.value ?? {};
              bp.systolic_not_measurable = value;
              if (value) {
                bp.systolic = null;
              }
              field.handleChange(bp);
            }}
            errorClassName="hidden"
          />
          <RangeAutocompleteFormField
            name="systolic"
            disabled={field.value?.systolic_not_measurable}
            placeholder={t("systolic")}
            start={0}
            end={250}
            step={1}
            value={field.value?.systolic ?? undefined}
            onChange={({ value }) => {
              const bp = field.value ?? {};
              bp.systolic_not_measurable = false;
              bp.systolic = value;
              handleChange(bp);
            }}
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
        </div>
        <span className="hidden px-2 text-lg font-medium text-secondary-400 md:block">
          /
        </span>
        <div className="flex items-center gap-4 whitespace-nowrap">
          <CheckBoxFormField
            label={t("not_measurable")}
            labelClassName="text-sm"
            value={field.value?.diastolic_not_measurable}
            name="diastolic_not_measurable"
            onChange={({ value }) => {
              const bp = field.value ?? {};
              bp.diastolic_not_measurable = value;
              if (value) {
                bp.diastolic = null;
              }
              field.handleChange(bp);
            }}
            errorClassName="hidden"
          />
          <RangeAutocompleteFormField
            name="diastolic"
            disabled={field.value?.diastolic_not_measurable}
            placeholder={t("diastolic")}
            start={0}
            end={250}
            step={1}
            value={field.value?.diastolic ?? undefined}
            onChange={({ value }) => {
              const bp = field.value ?? {};
              bp.diastolic_not_measurable = false;
              bp.diastolic = value;
              handleChange(bp);
            }}
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
      </div>
    </FormField>
  );
}

export const meanArterialPressure = (bp?: BloodPressure | null) => {
  if (bp?.diastolic == null || bp?.systolic == null) {
    return;
  }
  return ((2 * bp.diastolic + bp.systolic) / 3).toFixed();
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
