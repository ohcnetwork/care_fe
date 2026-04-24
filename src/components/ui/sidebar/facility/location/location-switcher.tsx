import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPinIcon, X } from "lucide-react";
import { navigate, usePath } from "raviger";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useKeyboardShortcut from "use-keyboard-shortcut";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";

import PaginationComponent from "@/components/Common/Pagination";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import { TooltipComponent } from "@/components/ui/tooltip";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { LocationRead } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import { buildLocationPath, getLocationPath } from "@/types/location/utils";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";

export function LocationSwitcher() {
  const { t } = useTranslation();
  const { facilityId, location: extractedLocation } = useCurrentLocation();
  const { state } = useSidebar();
  const [location, setLocation] = useState<LocationRead | undefined>(undefined);
  const [openDialog, setOpenDialog] = useState(false);

  const fallbackUrl = `/facility/${facilityId}/overview`;

  useEffect(() => {
    setLocation(extractedLocation as unknown as LocationRead);
  }, [extractedLocation]);

  if (state === "collapsed") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(fallbackUrl)}
        className="w-8 h-8"
      >
        <CareIcon icon="l-home-alt" />
      </Button>
    );
  }

  return (
    <Fragment>
      <LocationSelectorDialog
        facilityId={facilityId}
        location={location}
        setLocation={setLocation}
        open={openDialog}
        setOpen={setOpenDialog}
        myLocations={true}
      />
      <div className="flex flex-col items-start gap-4">
        <Button variant="ghost" onClick={() => navigate(fallbackUrl)}>
          <CareIcon icon="l-arrow-left" />
          <span className="underline underline-offset-2">{t("home")}</span>
        </Button>

        <div className="w-full px-2">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between gap-3 py-6 px-2 rounded-md bg-white border border-gray-200"
            onClick={() => setOpenDialog(true)}
          >
            <div className="flex min-w-0 items-center gap-2">
              <MapPinIcon className="size-5 text-green-600" />
              <div className="min-w-0 flex-1">
                <TooltipComponent
                  content={location?.name}
                  className="hidden lg:block max-w-xs"
                >
                  <div className="flex min-w-0 flex-col items-start">
                    <span className="text-xs text-gray-500">
                      {t("current_location")}
                    </span>
                    <span className="w-full truncate text-left text-sm font-medium text-gray-900">
                      {location?.name}
                    </span>
                  </div>
                </TooltipComponent>
              </div>
            </div>
            <CareIcon icon="l-sort" />
          </Button>
          <Separator className="mt-4" />
        </div>
      </div>
    </Fragment>
  );
}

export function LocationSelectorDialog({
  facilityId,
  location,
  setLocation,
  open,
  setOpen,
  navigateUrl,
  myLocations = false,
  onLocationSelect,
}: {
  facilityId: string;
  location: LocationRead | undefined;
  setLocation: (location: LocationRead | undefined) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  navigateUrl?: (location: LocationRead) => string;
  myLocations?: boolean;
  onLocationSelect?: (location: LocationRead) => void;
}) {
  const { t } = useTranslation();
  const [locationLevel, setLocationLevel] = useState<LocationRead[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = RESULTS_PER_PAGE_LIMIT;
  const path = usePath();
  const subPath =
    path?.match(/\/facility\/[^/]+\/locations\/[^/]+\/(.*)/)?.[1] || "";

  const currentParentId = locationLevel.length
    ? locationLevel[locationLevel.length - 1].id
    : "";

  const { data: locations, isLoading } = useQuery({
    queryKey: [
      "locations",
      facilityId,
      currentParentId,
      searchValue,
      currentPage,
    ],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        mode: "kind",
        limit: resultsPerPage,
        offset: (currentPage - 1) * resultsPerPage,
        parent: !searchValue && currentParentId ? currentParentId : undefined,
        mine:
          myLocations && !currentParentId && !searchValue ? true : undefined,
        name: searchValue || undefined,
      },
    }),
    enabled: open,
  });

  const handleSelect = (location: LocationRead) => {
    if (location.has_children) {
      setLocationLevel(buildLocationPath(location));
    } else {
      handleConfirmSelection(location);
    }
    setSearchValue("");
    setCurrentPage(1);
  };

  const handleConfirmSelection = (newLocation: LocationRead) => {
    setLocation(newLocation);
    setLocationLevel([]);
    setOpen(false);
    setSearchValue("");
    setCurrentPage(1);
    if (onLocationSelect) {
      onLocationSelect(newLocation);
    } else if (navigateUrl) {
      navigate(navigateUrl(newLocation));
    } else {
      navigate(
        `/facility/${facilityId}/locations/${newLocation.id}/${subPath}`,
      );
    }
  };

  const handleLocationClick = (location: LocationRead) => {
    setLocationLevel(buildLocationPath(location));
    setSearchValue("");
    setCurrentPage(1);
  };

  useKeyboardShortcut(
    ["Shift", "Enter"],
    () => {
      if (open && locationLevel.length > 0) {
        handleConfirmSelection(locationLevel[locationLevel.length - 1]);
      }
    },
    { ignoreInputFields: false },
  );

  const getCurrentLocation = () => {
    if (!location) return null;

    const locationList = buildLocationPath(location);

    return (
      <div className="flex flex-row items-center gap-1 text-sm font-normal flex-wrap">
        <span className="text-gray-500">{t("current_location")}:</span>
        <div className="flex flex-row gap-1 items-center p-2 rounded-md bg-gray-100 flex-wrap overflow-hidden">
          {locationList.map((loc, index) => (
            <div
              className="flex flex-row gap-1 items-center truncate max-w-xs"
              key={loc.id}
            >
              {loc.has_children ? (
                <Button
                  variant="link"
                  className="p-0 text-nowrap h-5 justify-start overflow-hidden"
                  onClick={() => handleLocationClick(loc)}
                >
                  <span className="text-nowrap h-5 truncate">{loc.name}</span>
                </Button>
              ) : (
                <span className="text-nowrap h-5 truncate">{loc.name}</span>
              )}
              {index < locationList.length - 1 && (
                <CareIcon icon="l-arrow-right" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          setSearchValue("");
          setCurrentPage(1);
        }
      }}
    >
      <DialogContent className="p-3 min-w-[calc(50vw)]">
        <DialogHeader className="overflow-hidden">
          <DialogTitle>{getCurrentLocation()}</DialogTitle>
        </DialogHeader>
        {locationLevel.length > 0 && (
          <div className="flex flex-row justify-between gap-1 bg-gray-100 p-1 overflow-auto">
            <div className="flex flex-row gap-1 items-center">
              {locationLevel.map((level, index) => (
                <div
                  key={level.id}
                  className="flex flex-row gap-1 items-center"
                >
                  {level.has_children ? (
                    <Button
                      variant="link"
                      className="w-full text-nowrap text-xs border bg-gray-100 border-gray-200 rounded-md p-2"
                      onClick={() => handleLocationClick(level)}
                    >
                      {level.name}
                    </Button>
                  ) : (
                    <div className="w-full text-xs border bg-gray-100 border-gray-200 rounded-md p-2">
                      {level.name}
                    </div>
                  )}
                  {index < locationLevel.length - 1 && (
                    <CareIcon icon="l-arrow-right" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-row gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setLocationLevel([]);
                  setSearchValue("");
                  setCurrentPage(1);
                }}
                aria-label={t("clear")}
              >
                <X />
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  handleConfirmSelection(
                    locationLevel[locationLevel.length - 1],
                  )
                }
              >
                <span>{t("select")}</span>
                <ShortcutBadge actionId="submit-action" />
              </Button>
            </div>
          </div>
        )}
        <Command className="pt-3" shouldFilter={false}>
          <div className="border border-gray-200">
            <CommandInput
              className="border-0 ring-0 sm:text-sm text-base"
              placeholder={t("search")}
              onValueChange={(value) => {
                setSearchValue(value);
                setCurrentPage(1);
              }}
              value={searchValue}
              autoFocus
            />
            <CommandList
              onWheel={(e) => {
                e.stopPropagation();
              }}
            >
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="ml-2 text-sm text-gray-500">
                      {t("loading")}
                    </span>
                  </div>
                ) : (
                  t("no_locations_found")
                )}
              </CommandEmpty>
              <CommandGroup>
                {locations?.results.map((location) => (
                  <LocationCommandItem
                    key={location.id}
                    location={location}
                    handleSelect={handleSelect}
                    handleConfirmSelection={handleConfirmSelection}
                    isSearching={!!searchValue}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        </Command>
        <div className="flex w-full justify-center">
          <PaginationComponent
            cPage={currentPage}
            defaultPerPage={resultsPerPage}
            data={{ totalCount: locations?.count || 0 }}
            onChange={(page: number) => setCurrentPage(page)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LocationCommandItem({
  location,
  handleSelect,
  handleConfirmSelection,
  isSearching = false,
}: {
  location: LocationRead;
  handleSelect: (location: LocationRead) => void;
  handleConfirmSelection: (location: LocationRead) => void;
  isSearching?: boolean;
}) {
  const { t } = useTranslation();
  const path = isSearching ? getLocationPath(location, " > ", true) : "";

  return (
    <CommandItem
      key={location.id}
      value={location.id}
      onSelect={() =>
        location.has_children
          ? handleSelect(location)
          : handleConfirmSelection(location)
      }
      className="flex items-start sm:items-center justify-between"
    >
      <div className="flex flex-col min-w-0">
        <span className="truncate">{location.name}</span>
        {isSearching && path && (
          <span className="text-xs text-gray-500 truncate">{path}</span>
        )}
      </div>
      <div>
        <Button variant="white" size="xs" className="p-2 mr-4 w-full shadow">
          <CareIcon icon="l-corner-down-left" />
          {location.has_children ? t("view_sub_locations") : t("select")}
        </Button>
      </div>
    </CommandItem>
  );
}
