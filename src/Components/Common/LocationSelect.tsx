import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { listFacilityAssetLocation } from "../../Redux/actions";
import AutocompleteFormField from "../Form/FormFields/Autocomplete";
import AutocompleteMultiSelectFormField from "../Form/FormFields/AutocompleteMultiselect";
interface LocationSelectProps {
  name: string;
  margin?: string;
  errors: string;
  className?: string;
  searchAll?: boolean;
  multiple?: boolean;
  facilityId: number | string;
  showAll?: boolean;
  selected: string | string[] | null;
  setSelected: (selected: string | string[] | null) => void;
  errorClassName?: string;
}

export const LocationSelect = (props: LocationSelectProps) => {
  const {
    name,
    multiple,
    selected,
    setSelected,
    errors,
    className = "",
    facilityId,
  } = props;
  const [locations, setLocations] = useState<{ name: string; id: string }[]>(
    []
  );
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const dispatchAction: any = useDispatch();

  const handleValueChange = (current: string[]) => {
    if (multiple) setSelected(current);
    else setSelected(current ? current[0] : "");
  };

  useEffect(() => {
    const params = {
      limit: 14,
      search_text: query,
    };
    setLoading(true);
    dispatchAction(
      listFacilityAssetLocation(params, { facility_external_id: facilityId })
    ).then(({ data }: any) => {
      setLocations(data.results);
      setLoading(false);
    });
  }, [query, facilityId]);

  return props.multiple ? (
    <AutocompleteMultiSelectFormField
      name={name}
      value={selected as unknown as string[]}
      options={locations}
      onChange={({ value }) => handleValueChange(value as unknown as string[])}
      onQuery={(query) => {
        setQuery(query);
      }}
      placeholder="Search by location name"
      optionLabel={(option) => option.name}
      optionValue={(option) => option.id}
      error={errors}
      className={className}
      errorClassName={props.errorClassName}
    />
  ) : (
    <AutocompleteFormField
      name={name}
      value={selected as string}
      options={locations}
      onChange={({ value }) => handleValueChange([value])}
      onQuery={(query) => {
        setQuery(query);
      }}
      isLoading={loading}
      placeholder="Search by location name"
      optionLabel={(option) => option.name}
      optionValue={(option) => option.id}
      error={errors}
      className={className}
      errorClassName={props.errorClassName}
    />
  );
};
