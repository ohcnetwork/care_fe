import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocationList } from "@/types/location/location";

interface LocationBreadcrumbProps {
  selectedLocation: LocationList | null;
  locationHistory: LocationList[];
  onLocationClick: (location: LocationList) => void;
  onRootClick: () => void;
}

export function LocationBreadcrumb({
  selectedLocation,
  locationHistory,
  onLocationClick,
  onRootClick,
}: LocationBreadcrumbProps) {
  const { t } = useTranslation();

  if (!selectedLocation) {
    return (
      <h2 className="text-sm font-semibold mt-4">
        {t("locations_under_my_care_for_immediate_transfer")}
      </h2>
    );
  }

  return (
    <div className="flex items-center gap-1 text-sm text-gray-600 mt-4">
      <div className="flex items-center gap-1">
        <span
          className="hover:text-gray-900 cursor-pointer"
          onClick={onRootClick}
        >
          {t("locations")}
        </span>
        <ChevronRight className="size-4" />
      </div>
      {locationHistory.slice(0, -1).map((_loc, _index) => (
        <div key={_loc.id} className="flex items-center gap-1">
          <span
            className="hover:text-gray-900 cursor-pointer"
            onClick={() => {
              const newHistory = locationHistory.slice(0, _index + 1);
              const lastLocation = newHistory[newHistory.length - 1];
              onLocationClick(lastLocation);
            }}
          >
            {_loc.name}
          </span>
          <ChevronRight className="size-4" />
        </div>
      ))}
      {locationHistory.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-gray-900 font-medium">
            {locationHistory[locationHistory.length - 1].name}
          </span>
          <ChevronRight className="size-4" />
        </div>
      )}
    </div>
  );
}
