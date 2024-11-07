import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";

export const ROUTE_TO_FACILITY_OPTIONS = {
  10: "Outpatient/Emergency Room",
  20: "Referred from another facility",
  30: "Internal Transfer within the facility",
};

export type RouteToFacility = keyof typeof ROUTE_TO_FACILITY_OPTIONS;

export const keys = Object.keys(ROUTE_TO_FACILITY_OPTIONS).map((key) =>
  parseInt(key),
) as RouteToFacility[];

type Props = FormFieldBaseProps<keyof typeof ROUTE_TO_FACILITY_OPTIONS>;

export default function RouteToFacilitySelect(props: Props) {
  const field = useFormFieldPropsResolver(props);

  return (
    <SelectFormField
      {...field}
      options={keys}
      optionLabel={(key) => ROUTE_TO_FACILITY_OPTIONS[key]}
    />
  );
}
