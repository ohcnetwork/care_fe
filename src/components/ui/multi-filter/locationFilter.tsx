import { useTranslation } from "react-i18next";

import LocationMultiSelect from "@/components/Location/LocationMultiSelect";
import { LocationRead } from "@/types/location/location";

import FilterHeader from "./filterHeader";
import { FilterConfig, FilterValues } from "./utils/Utils";

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

  return (
    <div className="p-0">
      {handleBack && <FilterHeader label={filter.label} onBack={handleBack} />}
      <div className="max-h-[50vh]">
        <LocationMultiSelect
          facilityId={facilityId}
          value={selectedLocations}
          onChange={(locations) => onFilterChange(filter.key, locations)}
        />
      </div>
    </div>
  );
}
