import AutocompleteFormField from "@/components/Form/FormFields/Autocomplete";
import AutocompleteMultiSelectFormField from "@/components/Form/FormFields/AutocompleteMultiselect";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

interface LocationSelectProps {
  name: string;
  disabled?: boolean;
  margin?: string;
  errors?: string;
  className?: string;
  searchAll?: boolean;
  multiple?: boolean;
  facilityId: string;
  showAll?: boolean;
  selected: string | string[] | null;
  setSelected: (selected: string | string[] | null) => void;
  errorClassName?: string;
  bedIsOccupied?: boolean;
  disableOnOneOrFewer?: boolean;
}

export const LocationSelect = (props: LocationSelectProps) => {
  const { data, loading, refetch } = useQuery(
    routes.listFacilityAssetLocation,
    {
      query: {
        limit: 14,
        bed_is_occupied:
          props.bedIsOccupied === undefined ? undefined : !props.bedIsOccupied,
      },
      pathParams: {
        facility_external_id: props.facilityId,
      },
      prefetch: props.facilityId !== undefined,
    },
  );

  if (props.disableOnOneOrFewer && data && data.count <= 1) {
    props = { ...props, disabled: true };
  }

  return props.multiple ? (
    <AutocompleteMultiSelectFormField
      name={props.name}
      disabled={props.disabled}
      value={props.selected as unknown as string[]}
      options={data?.results ?? []}
      onChange={({ value }) => props.setSelected(value)}
      onQuery={(search_text) => refetch({ query: { search_text } })}
      placeholder="Search by location name"
      optionLabel={(option) => option.name}
      optionValue={(option) => option.id}
      error={props.errors}
      className={props.className}
      errorClassName={props.errorClassName}
    />
  ) : (
    <AutocompleteFormField
      name={props.name}
      disabled={props.disabled}
      value={props.selected as string}
      options={data?.results ?? []}
      onChange={({ value }) => props.setSelected(value)}
      onQuery={(search_text) => refetch({ query: { search_text } })}
      isLoading={loading}
      placeholder="Search by location name"
      optionLabel={(option) => option.name}
      optionValue={(option) => option.id}
      error={props.errors}
      className={props.className}
      errorClassName={props.errorClassName}
    />
  );
};
