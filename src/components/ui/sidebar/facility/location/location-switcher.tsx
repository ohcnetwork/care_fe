import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronsUpDown, MapPinIcon, X } from "lucide-react";
import { navigate, usePath } from "raviger";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useKeyboardShortcut from "use-keyboard-shortcut";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSidebar } from "@/components/ui/sidebar";
import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";

import PaginationComponent from "@/components/Common/Pagination";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import { Skeleton } from "@/components/ui/skeleton";
import { TooltipComponent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { LocationRead } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import { buildLocationPath, getLocationPath } from "@/types/location/utils";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";

export function LocationSwitcher() {
  const { t } = useTranslation();
  const { facilityId, location: extractedLocation } = useCurrentLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const [location, setLocation] = useState<LocationRead | undefined>(undefined);
  const [openDialog, setOpenDialog] = useState(false);
  const { handleMenuOpenChange } = useAppSidebar();
  const handleDialogOpenChange = (open: boolean) => {
    setOpenDialog(open);
    handleMenuOpenChange(open);
  };

  const fallbackUrl = `/facility/${facilityId}/overview`;

  useEffect(() => {
    setLocation(extractedLocation as unknown as LocationRead);
  }, [extractedLocation]);

  return (
    <Fragment>
      <LocationSelectorDialog
        facilityId={facilityId}
        location={location}
        setLocation={setLocation}
        open={openDialog}
        setOpen={handleDialogOpenChange}
        myLocations={true}
      />
      <div
        className={cn("flex min-w-0 flex-col gap-2", !isCollapsed && "px-2")}
      >
        <div className="flex min-h-8 items-center justify-between">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon-sm" : "sm"}
            onClick={() => {
              if (isMobile) setOpenMobile(false);
              navigate(fallbackUrl);
            }}
            className={cn(
              "gap-1.5 text-muted-foreground",
              !isCollapsed && "-ml-2 px-2",
            )}
            aria-label={t("home")}
            title={isCollapsed ? t("home") : undefined}
          >
            <ChevronLeft className="size-4" />
            {!isCollapsed && <span>{t("home")}</span>}
          </Button>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpenMobile(false)}
              aria-label={t("close_sidebar")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <div className="w-full">
          <TooltipComponent content={location?.name ?? t("select_location")}>
            <Button
              variant="outline"
              size={isCollapsed ? "icon-sm" : "sm"}
              className={cn(
                "w-full min-w-0 gap-2 font-normal shadow-sm",
                !isCollapsed && "h-auto justify-between py-2",
              )}
              aria-label={location?.name ?? t("select_location")}
              aria-haspopup="dialog"
              aria-expanded={openDialog}
              onClick={() => handleDialogOpenChange(true)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {isCollapsed && (
                  <MapPinIcon className="mx-auto size-4 text-muted-foreground" />
                )}
                <div className={cn("min-w-0 flex-1", isCollapsed && "hidden")}>
                  <div className="flex min-w-0 w-full flex-col items-start overflow-hidden">
                    <span className="text-xs text-muted-foreground">
                      {t("current_location")}
                    </span>
                    <span className="max-w-full truncate text-left text-sm font-medium">
                      {location?.name ?? t("select_location")}
                    </span>
                  </div>
                </div>
              </div>
              {!isCollapsed && (
                <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
              )}
            </Button>
          </TooltipComponent>
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
    if (location.has_sub_locations) {
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
              {loc.has_sub_locations ? (
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
    <CommandDialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          setSearchValue("");
          setCurrentPage(1);
        }
      }}
      title={t("select_location")}
      description={t("select_location")}
      className="md:max-w-2xl"
    >
      <Command shouldFilter={false}>
        {location && (
          <div className="shrink-0 overflow-hidden px-3 py-2">
            {getCurrentLocation()}
          </div>
        )}
        {locationLevel.length > 0 && (
          <div className="flex shrink-0 flex-row justify-between gap-1 overflow-auto bg-gray-100 p-1">
            <div className="flex flex-row gap-1 items-center">
              {locationLevel.map((level, index) => (
                <div
                  key={level.id}
                  className="flex flex-row gap-1 items-center"
                >
                  {level.has_sub_locations ? (
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
        <div className="shrink-0 border-b border-gray-100 shadow-xs">
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
        </div>
        <CommandList
          className="w-full md:max-h-[min(24rem,calc(75dvh-8rem))] scrollbar-gutter-auto"
          onWheel={(e) => {
            e.stopPropagation();
          }}
        >
          {isLoading ? (
            <div className="gap-2 flex flex-col px-2 pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <CommandEmpty>{t("no_locations_found")}</CommandEmpty>
          )}
          <CommandGroup className="px-2">
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
        <div className="flex w-full shrink-0 justify-center py-2">
          <PaginationComponent
            cPage={currentPage}
            defaultPerPage={resultsPerPage}
            data={{ totalCount: locations?.count || 0 }}
            onChange={(page: number) => setCurrentPage(page)}
          />
        </div>
      </Command>
    </CommandDialog>
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
        location.has_sub_locations
          ? handleSelect(location)
          : handleConfirmSelection(location)
      }
      className="flex items-center justify-between [&>svg:last-child]:hidden"
    >
      <div className="flex flex-col min-w-0 flex-1">
        <span className="truncate">{location.name}</span>
        {isSearching && path && (
          <span className="text-xs text-gray-500 truncate">{path}</span>
        )}
      </div>
      <div className="shrink-0">
        <Button variant="white" size="xs" className="p-2 shadow">
          <CareIcon icon="l-corner-down-left" />
          {location.has_sub_locations ? t("view_sub_locations") : t("select")}
        </Button>
      </div>
    </CommandItem>
  );
}
