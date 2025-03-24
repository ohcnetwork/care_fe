import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { LocationList } from "@/types/location/location";

interface LocationBreadcrumbProps {
  selectedLocation: LocationList | null;
  locationHistory: LocationList[];
  onLocationClick: (location: LocationList) => void;
  onGoBack: () => void;
}

export function LocationBreadcrumb({
  selectedLocation,
  locationHistory,
  onLocationClick,
  onGoBack,
}: LocationBreadcrumbProps) {
  const { t } = useTranslation();

  if (!selectedLocation) {
    return (
      <h2 className="text-sm font-semibold">
        {t("locations_under_my_care_for_immediate_transfer")}
      </h2>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1 text-sm text-gray-600">
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
            <ChevronRight className="h-4 w-4" />
          </div>
        ))}
        {locationHistory.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-gray-900 font-medium">
              {locationHistory[locationHistory.length - 1].name}
            </span>
            <ChevronRight className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="flex items-center mt-2">
        <Button
          variant="ghost"
          className="pl-0 hover:pl-2 transition-all"
          onClick={onGoBack}
        >
          <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
          {t("back")}
        </Button>
        <h2 className="text-sm font-semibold ml-2">{selectedLocation.name}</h2>
      </div>
    </>
  );
}
