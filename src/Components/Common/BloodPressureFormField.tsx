import { useTranslation } from "react-i18next";
import { properRoundOf } from "../../Utils/utils";
import { FieldValidator } from "../Form/FieldValidators";
import FormField from "../Form/FormFields/FormField";
import RangeAutocompleteFormField from "../Form/FormFields/RangeAutocompleteFormField";
import {
  FieldChangeEvent,
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";
import { BloodPressure } from "../Patient/models";

type Props = FormFieldBaseProps<BloodPressure>;

export default function BloodPressureFormField(props: Props) {
  const { t } = useTranslation();
  const field = useFormFieldPropsResolver(props);

  const handleChange = (event: FieldChangeEvent<number>) => {
    const value: BloodPressure = {
      ...field.value,
      [event.name]: event.value,
    };
    field.onChange({ name: field.name, value });
  };

  const map = props.value && meanArterialPressure(props.value);

  return (
    <FormField
      field={{
        ...field,
        labelSuffix: map ? (
          <span className="font-medium">MAP: {map}</span>
        ) : undefined,
      }}
    >
      <div className="flex flex-row items-center">
        <RangeAutocompleteFormField
          name="systolic"
          placeholder={t("systolic")}
          start={0}
          end={400}
          step={1}
          value={field.value?.systolic}
          onChange={handleChange}
          labelClassName="hidden"
          errorClassName="hidden"
          thresholds={[
            {
              value: 0,
              label: t("low"),
              className: "hidden md:block text-danger-500",
            },
            {
              value: 100,
              label: t("normal"),
              className: "hidden md:block text-primary-500",
            },
            {
              value: 140,
              label: t("high"),
              className: "hidden md:block text-warning-500",
            },
          ]}
        />
        <span className="px-2 text-lg font-medium text-secondary-400">/</span>
        <RangeAutocompleteFormField
          name="diastolic"
          placeholder={t("diastolic")}
          start={0}
          end={400}
          step={1}
          value={field.value?.diastolic}
          onChange={handleChange}
          labelClassName="hidden"
          errorClassName="hidden"
          thresholds={[
            {
              value: 0,
              label: t("low"),
              className: "hidden md:block text-danger-500",
            },
            {
              value: 50,
              label: t("normal"),
              className: "hidden md:block text-primary-500",
            },
            {
              value: 90,
              label: t("high"),
              className: "hidden md:block text-warning-500",
            },
          ]}
        />
      </div>
    </FormField>
  );
}

export const meanArterialPressure = ({
  diastolic,
  systolic,
}: BloodPressure) => {
  if (diastolic != null && systolic != null) {
    return properRoundOf((2 * diastolic + systolic) / 3);
  }
};

export const BloodPressureValidator: FieldValidator<BloodPressure> = (bp) => {
  if (Object.values(bp).some((v) => v == null)) {
    return "blood_pressure_missing_attrs";
  }
};
