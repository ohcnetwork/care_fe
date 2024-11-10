import { useCallback } from "react";

import AutoCompleteAsync from "@/components/Form/AutoCompleteAsync";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

interface AssetSelectProps {
  name: string;
  errors?: string | undefined;
  className?: string;
  facility?: string;
  is_working?: boolean;
  in_use_by_consultation?: boolean;
  is_permanent?: boolean | null;
  multiple?: boolean;
  AssetType?: number;
  asset_class?: string;
  showAll?: boolean;
  showNOptions?: number;
  selected: any;
  setSelected: (selected: any) => void;
}

export const AssetSelect = (props: AssetSelectProps) => {
  const {
    name,
    multiple,
    selected,
    setSelected,
    facility,
    is_working = true,
    in_use_by_consultation = false,
    is_permanent = null,
    showNOptions = 10,
    className = "",
    errors = "",
    asset_class = "",
  } = props;

  const AssetSearch = useCallback(
    async (text: string) => {
      const query = {
        limit: 50,
        offset: 0,
        search_text: text,
        facility,
        is_working,
        in_use_by_consultation,
        is_permanent,
        asset_class,
      } as const;

      const { data } = await request(routes.listAssets, { query });
      return data?.results;
    },
    [asset_class, facility, in_use_by_consultation, is_permanent, is_working],
  );

  return (
    <AutoCompleteAsync
      name={name}
      multiple={multiple}
      selected={selected}
      onChange={setSelected}
      fetchData={AssetSearch}
      showNOptions={showNOptions}
      optionLabel={(option: any) => option.name}
      compareBy="id"
      className={className}
      error={errors}
    />
  );
};
