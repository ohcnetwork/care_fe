import { ChevronRight, Loader2, Search, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { LocationRead } from "@/types/location/location";

import { LocationAssociationRead } from "@/types/location/association";
import { BedListing } from "./BedListing";
import { BedStatusLegend } from "./BedStatusLegend";
import { LinkedBedListing } from "./LinkedBedListing";
import { LocationBreadcrumb } from "./LocationBreadcrumb";
import { LocationCardList } from "./LocationCardList";

interface LocationNavigationProps {
  locations: LocationRead[];
  beds: LocationRead[];
  selectedLocation: LocationRead | null;
  locationHistory: LocationRead[];
  selectedBed: LocationRead | null;
  selectedLinkedBed: LocationAssociationRead | undefined;
  showAvailableOnly: boolean;
  searchTerm: string;
  isLoadingLocations: boolean;
  isLoadingBeds: boolean;
  hasMore: boolean;
  onLocationClick: (location: LocationRead) => void;
  onBedSelect: (bed: LocationRead) => void;
  onLinkedBedSelect: (bed: LocationAssociationRead) => void;
  onCheckBedStatus: (bed: LocationRead) => void;
  onSearchChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onShowAvailableChange: (value: boolean) => void;
  onLoadMore: () => void;
  onGoBack: () => void;
  onClearSelection: () => void;
  linkedLocations: LocationAssociationRead[];
}

export function LocationNavigation({
  locations,
  beds,
  selectedLocation,
  locationHistory,
  selectedBed,
  selectedLinkedBed,
  showAvailableOnly,
  searchTerm,
  isLoadingLocations,
  isLoadingBeds,
  hasMore,
  onLocationClick,
  onBedSelect,
  onLinkedBedSelect,
  onCheckBedStatus,
  onSearchChange,
  onSearch,
  onShowAvailableChange,
  onLoadMore,
  onGoBack,
  onClearSelection,
  linkedLocations,
}: LocationNavigationProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <form onSubmit={onSearch}>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            placeholder={t("search_location")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </form>

      {linkedLocations.length > 0 && (
        <div className="space-y-2 mt-4">
          <h2 className="text-base font-semibold mt-2">
            {t("linked_locations")}
          </h2>
          <LinkedBedListing
            linkedBeds={linkedLocations}
            selectedLinkedBed={selectedLinkedBed}
            onLinkedBedSelect={onLinkedBedSelect}
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-col justify-between">
          <h2 className="text-base font-semibold mt-4">
            {t("locations_under_my_care")}
          </h2>
          <div className="flex-1">
            <LocationBreadcrumb
              selectedLocation={selectedLocation}
              locationHistory={locationHistory}
              onLocationClick={onLocationClick}
              onRootClick={onGoBack}
            />
          </div>
        </div>
        {selectedBed && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-md">
            <p className="text-sm text-green-800 flex items-center justify-between">
              <span className="font-normal">
                {t("selected_bed")}:{" "}
                <span className="font-medium">{selectedBed.name}</span>
              </span>
              {selectedBed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-950 border-gray-400 font-semibold"
                  onClick={onClearSelection}
                >
                  <XIcon className="size-4" />
                  {t("clear_selection")}
                </Button>
              )}
            </p>
          </div>
        )}

        <LocationCardList
          locations={locations}
          onLocationClick={(location) => onLocationClick(location)}
        />

        {selectedLocation && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold mt-2">{t("beds")}</h2>
              <div className="flex items-center gap-2">
                <Switch
                  id="available-only"
                  checked={showAvailableOnly}
                  onCheckedChange={onShowAvailableChange}
                />
                <Label htmlFor="available-only">
                  {t("show_available_beds_only")}
                </Label>
              </div>
            </div>

            <BedStatusLegend />
            {!isLoadingBeds && beds.length === 0 && (
              <div className="w-full mt-6 py-6 px-4 border border-gray-200 bg-gray-50 text-center text-gray-500 text-sm rounded-md">
                {t(
                  !showAvailableOnly
                    ? "no_beds_found"
                    : "no_available_beds_found",
                )}
              </div>
            )}
            <BedListing
              beds={beds}
              selectedBed={selectedBed}
              onBedSelect={onBedSelect}
              onCheckStatus={onCheckBedStatus}
            />
          </div>
        )}

        {isLoadingLocations || isLoadingBeds ? (
          <div className="flex justify-center my-4">
            <Loader2 className="size-6 animate-spin text-gray-400" />
          </div>
        ) : (
          hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={onLoadMore}
                className="text-sm"
              >
                {t("load_more")}
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
