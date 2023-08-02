import FormField from "../Form/FormFields/FormField";
import RangeAutocompleteFormField from "../Form/FormFields/RangeAutocompleteFormField";
import {
  FieldChangeEvent,
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";

export interface BloodPressure {
  systolic: number;
  diastolic: number;
}

type Props = FormFieldBaseProps<Partial<BloodPressure>>;

export default function BloodPressureFormField(props: Props) {
  const field = useFormFieldPropsResolver(props as any);

  const handleChange = (event: FieldChangeEvent<number>) => {
    field.onChange({
      name: field.name,
      value: {
        ...field.value,
        [event.name]: event.value,
      },
    });
  };

  const map =
    !!props.value?.diastolic &&
    !!props.value.systolic &&
    meanArterialPressure(props.value as BloodPressure);

  return (
    <FormField
      field={{
        ...field,
        labelSuffix: map ? (
          <span className="font-medium">MAP: {map.toFixed(1)}</span>
        ) : undefined,
      }}
    >
      <div className="flex flex-row items-center">
        <RangeAutocompleteFormField
          name="systolic"
          placeholder="Systolic"
          start={0}
          end={250}
          step={1}
          value={field.value?.systolic}
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
        <span className="px-2 text-lg font-medium text-gray-400">/</span>
        <RangeAutocompleteFormField
          name="diastolic"
          placeholder="Diastolic"
          start={0}
          end={250}
          step={1}
          value={field.value?.diastolic}
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

export const meanArterialPressure = ({
  diastolic,
  systolic,
}: BloodPressure) => {
  return (2 * diastolic + systolic) / 3;
};
