import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { AssetClass } from "@/components/Assets/AssetTypes";
import { BedModel } from "@/components/Facility/models";
import AutoCompleteAsync from "@/components/Form/AutoCompleteAsync";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

interface BedSelectProps {
  name: string;
  error?: string | undefined;
  className?: string;
  searchAll?: boolean;
  unoccupiedOnly?: boolean;
  multiple?: boolean;
  facility?: string;
  location?: string;
  showAll?: boolean;
  showNOptions?: number;
  selected: BedModel | BedModel[] | null;
  not_occupied_by_asset_type?: AssetClass;
  setSelected: (selected: BedModel | BedModel[] | null) => void;
}

export const BedSelect = (props: BedSelectProps) => {
  const {
    name,
    multiple,
    selected,
    setSelected,
    error,
    searchAll,
    unoccupiedOnly,
    className = "",
    facility,
    location,
    showNOptions = 20,
    not_occupied_by_asset_type,
  } = props;
  const { t } = useTranslation();

  const onBedSearch = useCallback(
    async (text: string) => {
      const query = {
        limit: 50,
        offset: 0,
        search_text: text,
        all: searchAll,
        facility,
        location,
        not_occupied_by_asset_type,
      };
      const { data } = await request(routes.listFacilityBeds, { query });

      if (unoccupiedOnly) {
        return data?.results?.filter(
          (bed: BedModel) => bed?.is_occupied === false,
        );
      }

      return data?.results;
    },
    [facility, location, searchAll, unoccupiedOnly],
  );

  return (
    <AutoCompleteAsync
      id={name}
      name={name}
      multiple={multiple}
      selected={selected}
      onChange={setSelected}
      showNOptions={showNOptions}
      placeholder={t("bed_search_placeholder")}
      fetchData={onBedSearch}
      optionLabel={(option: any) => {
        if (Object.keys(option).length === 0) return "";
        return (
          `${option.name}, ${option?.location_object?.name || t("unknown")}` ||
          option?.location_object?.name
        );
      }}
      optionLabelChip={(option: any) => {
        if (Object.keys(option).length === 0) return "";
        return `${t(option?.bed_type)}` || t("unknown");
      }}
      compareBy="id"
      error={error}
      className={className}
    />
  );
};
