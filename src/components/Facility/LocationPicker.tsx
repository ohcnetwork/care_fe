import { Map, Marker, ZoomControl } from "pigeon-maps";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  isGettingLocation?: boolean;
  onGetCurrentLocation?: () => void;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationSelect,
  isGettingLocation,
  onGetCurrentLocation,
}: LocationPickerProps) {
  const { t } = useTranslation();
  // Default to TVM
  const position: [number, number] = [
    latitude ?? 8.5241391,
    longitude ?? 76.9366376,
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t("location_details")}</h3>
        {onGetCurrentLocation && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGetCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center gap-2"
            data-cy="get-location-button"
          >
            {isGettingLocation ? (
              <>
                <CareIcon icon="l-spinner" className="h-4 w-4 animate-spin" />
                {t("getting_location")}
              </>
            ) : (
              <>
                <CareIcon icon="l-location-point" className="h-4 w-4" />
                {t("get_current_location")}
              </>
            )}
          </Button>
        )}
      </div>
      <div className="h-[400px] w-full rounded-lg border overflow-hidden">
        <Map
          height={400}
          center={position}
          defaultZoom={15}
          onClick={({ latLng: [lat, lng] }) => onLocationSelect(lat, lng)}
        >
          <ZoomControl />
          {latitude && longitude && (
            <Marker width={40} anchor={position} onClick={() => {}} />
          )}
        </Map>
      </div>
      <p className="text-sm text-gray-500">
        {t("click_on_map_to_select_location")}
      </p>
    </div>
  );
}
