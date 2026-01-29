import { useTranslation } from "react-i18next";

import LocationMultiSelect from "@/components/Location/LocationMultiSelect";
import { LocationRead } from "@/types/location/location";

import FilterHeader from "./filterHeader";
import { FilterConfig, FilterValues } from "./utils/Utils";

interface LocationValue {
  id: string;
  name: string;
}

export default function RenderLocationFilter({
  filter,
  selectedLocations,
  onFilterChange,
  handleBack,
  facilityId,
}: {
  filter: FilterConfig;
  selectedLocations: LocationRead[];
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  handleBack?: () => void;
  facilityId?: string;
}) {
  const { t } = useTranslation();

  if (!facilityId) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        {t("facility_required_for_location_filter")}
      </div>
    );
  }

  // Convert LocationRead[] to LocationValue[] for LocationMultiSelect
  const value: LocationValue[] = selectedLocations.map((loc) => ({
    id: loc.id,
    name: loc.name,
  }));

  const handleChange = (newValue: LocationValue[]) => {
    // Convert LocationValue[] back to LocationRead[] format
    const locations = newValue.map(
      (v) =>
        ({
          id: v.id,
          name: v.name,
          status: "active",
          operational_status: "O",
          description: "",
          form: "ro",
          mode: "instance",
          has_children: false,
          sort_index: 0,
        }) as LocationRead,
    );
    onFilterChange(filter.key, locations);
  };

  return (
    <div className="p-0">
      {handleBack && <FilterHeader label={filter.label} onBack={handleBack} />}
      <div className="max-h-[50vh]">
        <LocationMultiSelect
          facilityId={facilityId}
          value={value}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
