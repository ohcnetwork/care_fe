import { ChevronRight, Loader2, Search, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { LocationList } from "@/types/location/location";

import { BedListing } from "./BedListing";
import { BedStatusLegend } from "./BedStatusLegend";
import { LocationBreadcrumb } from "./LocationBreadcrumb";
import { LocationCardList } from "./LocationCardList";

interface LocationNavigationProps {
  locations: LocationList[];
  beds: LocationList[];
  selectedLocation: LocationList | null;
  locationHistory: LocationList[];
  selectedBed: string | null;
  showAvailableOnly: boolean;
  searchTerm: string;
  isLoadingLocations: boolean;
  isLoadingBeds: boolean;
  hasMore: boolean;
  onLocationClick: (location: LocationList) => void;
  onBedSelect: (bedId: string) => void;
  onCheckBedStatus: (bed: LocationList) => void;
  onSearchChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onShowAvailableChange: (value: boolean) => void;
  onLoadMore: () => void;
  onGoBack: () => void;
  onClearSelection: () => void;
}

export function LocationNavigation({
  locations,
  beds,
  selectedLocation,
  locationHistory,
  selectedBed,
  showAvailableOnly,
  searchTerm,
  isLoadingLocations,
  isLoadingBeds,
  hasMore,
  onLocationClick,
  onBedSelect,
  onCheckBedStatus,
  onSearchChange,
  onSearch,
  onShowAvailableChange,
  onLoadMore,
  onGoBack,
  onClearSelection,
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
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
                <span className="font-medium">
                  {beds.find((b) => b.id === selectedBed)?.name}
                </span>
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
          onLocationClick={onLocationClick}
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
