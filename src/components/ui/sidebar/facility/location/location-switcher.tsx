import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPinIcon } from "lucide-react";
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

import query from "@/Utils/request/query";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

export function LocationSwitcher() {
  const { t } = useTranslation();
  const { facilityId } = useCurrentLocation();
  const { location: extractedLocation } = useCurrentLocation();
  const { state } = useSidebar();
  const [location, setLocation] = useState<LocationList | undefined>(undefined);
  const [openDialog, setOpenDialog] = useState(false);

  const fallbackUrl = `/facility/${facilityId}/overview`;

  useEffect(() => {
    setLocation(extractedLocation as unknown as LocationList);
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
            <div className="flex items-center gap-2">
              <MapPinIcon className="size-5 text-green-600" />
              <div className="flex flex-col items-start">
                <span className="text-xs text-gray-500">
                  {t("current_location")}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {location?.name}
                </span>
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
}: {
  facilityId: string;
  location: LocationList | undefined;
  setLocation: (location: LocationList | undefined) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  navigateUrl?: (location: LocationList) => string;
  myLocations?: boolean;
}) {
  const { t } = useTranslation();
  const [locationLevel, setLocationLevel] = useState<LocationList[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = RESULTS_PER_PAGE_LIMIT;
  const path = usePath();
  const subPath =
    path?.match(/\/facility\/[^/]+\/locations\/[^/]+\/(.*)/)?.[1] || "";

  const currentParentId = locationLevel.length
    ? locationLevel[locationLevel.length - 1].id
    : "";

  const { data: locations, isLoading: isLoading } = useQuery({
    queryKey: [
      "locations",
      facilityId,
      currentParentId,
      searchValue,
      currentPage,
    ],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        ...(currentParentId !== "" && {
          parent: currentParentId,
        }),
        mode: "kind",
        ...(myLocations && !currentParentId && { mine: true }),
        ordering: "sort_index",
        ...(searchValue && { name: searchValue }),
        limit: resultsPerPage,
        offset: (currentPage - 1) * resultsPerPage,
      },
    }),
    enabled: open,
  });

  const handleSelect = (location: LocationList) => {
    if (location.has_children) {
      setLocationLevel([...locationLevel, location]);
    } else {
      handleConfirmSelection(location);
    }
    setSearchValue("");
    setCurrentPage(1);
  };

  const handleConfirmSelection = (newLocation: LocationList) => {
    const oldLocationId = location?.id;
    setLocation(newLocation);
    setLocationLevel([]);
    setOpen(false);
    setSearchValue("");
    setCurrentPage(1);
    if (newLocation.id !== oldLocationId) {
      if (navigateUrl) {
        navigate(navigateUrl(newLocation));
      } else {
        navigate(
          `/facility/${facilityId}/locations/${newLocation.id}/${subPath}`,
        );
      }
    }
  };

  const handleLocationClick = (location: LocationList) => {
    let currentLocation = location;
    const locationList = [location];
    while (currentLocation?.parent && currentLocation.parent.id) {
      locationList.unshift(currentLocation.parent);
      currentLocation = currentLocation.parent;
    }
    setLocationLevel(locationList);
    setSearchValue("");
    setCurrentPage(1);
  };

  useKeyboardShortcut(["Shift", "Enter"], () => {
    handleConfirmSelection(locationLevel[locationLevel.length - 1]);
  });

  const getCurrentLocation = () => {
    if (!location) return <></>;
    let locationList = [location];
    let currentLocation = location;
    while (currentLocation?.parent && currentLocation.parent.id) {
      locationList.unshift(currentLocation.parent);
      currentLocation = currentLocation.parent;
    }
    if (locationList.length > 0) {
      return (
        <div className="flex flex-row items-center gap-1 text-sm font-normal">
          <span className="text-gray-500">{t("current_location")}:</span>
          <div className="flex flex-row gap-1 items-center p-1 rounded-md bg-gray-100">
            {locationList.map((location, index) => (
              <div
                className="flex flex-row gap-1 items-center"
                key={location?.id}
              >
                {location.has_children ? (
                  <Button
                    variant="link"
                    className="p-0 text-nowrap h-5"
                    onClick={() => handleLocationClick(location)}
                  >
                    {location?.name}
                  </Button>
                ) : (
                  <span className="text-nowrap h-5">{location?.name}</span>
                )}
                {((index === 0 && locationList.length > 1) ||
                  (index > 0 && index < locationList.length - 1)) && (
                  <div>
                    <CareIcon icon="l-arrow-right" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return <></>;
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
        <DialogHeader>
          <DialogTitle>{getCurrentLocation()}</DialogTitle>
        </DialogHeader>
        {locationLevel.length > 0 && (
          <div className="flex flex-row justify-between gap-1 bg-gray-100 p-1">
            <div className="flex flex-row gap-1 items-center">
              {locationLevel.map((level, index) => (
                <>
                  {level.has_children ? (
                    <Button
                      key={level.id}
                      variant="link"
                      className="w-full text-nowrap text-xs border bg-gray-100 border-gray-200 rounded-md p-2"
                      onClick={() => handleLocationClick(level)}
                    >
                      {level.name}
                    </Button>
                  ) : (
                    <div
                      key={level.id}
                      className="w-full text-xs border bg-gray-100 border-gray-200 rounded-md p-2"
                    >
                      {level?.name}
                    </div>
                  )}
                  {((index === 0 && locationLevel.length > 1) ||
                    (index > 0 && index < locationLevel.length - 1)) && (
                    <CareIcon icon="l-arrow-right" />
                  )}
                </>
              ))}
            </div>
            <div className="flex flex-row gap-2">
              <Button
                variant="link"
                size="icon"
                className="p-2 w-full"
                onClick={() => {
                  setLocationLevel([]);
                  setSearchValue("");
                  setCurrentPage(1);
                }}
              >
                <CareIcon icon="l-multiply" />
                <span>{t("clear")}</span>
              </Button>
              <Button
                variant="primary"
                size="icon"
                className="p-2 w-full"
                onClick={() =>
                  handleConfirmSelection(
                    locationLevel[locationLevel.length - 1],
                  )
                }
              >
                <span>{t("done")}</span>
                <span className="flex text-xs items-center gap-1 p-1 shadow rounded-md bg-green-900">
                  {"shift"}
                  {"+"}
                  <CareIcon icon="l-corner-down-left" />
                </span>
              </Button>
            </div>
          </div>
        )}
        <Command className="pt-3 pb-2" shouldFilter={false}>
          <div className="border border-gray-200">
            <CommandInput
              className="border-0 ring-0"
              placeholder={t("search")}
              onValueChange={(value) => {
                setSearchValue(value);
                setCurrentPage(1);
              }}
              value={searchValue}
            />
            <CommandList
              className="max-h-[calc(100vh-30rem)]"
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
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        </Command>
        <div className="flex w-full justify-center mt-4">
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
}: {
  location: LocationList;
  handleSelect: (location: LocationList) => void;
  handleConfirmSelection: (location: LocationList) => void;
}) {
  const { t } = useTranslation();
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
      <span>{location.name}</span>
      <div>
        <Button variant="white" size="xs" className="p-2 mr-4 w-full shadow">
          <CareIcon icon="l-corner-down-left" />
          {location.has_children ? t("view_sub_locations") : t("select")}
        </Button>
      </div>
    </CommandItem>
  );
}
