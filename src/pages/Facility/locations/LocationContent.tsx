import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bed, Eye, Loader2, Lock } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import PaginationComponent from "@/components/Common/Pagination";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import EncounterInfoCard from "@/components/Encounter/EncounterInfoCard";

import query from "@/Utils/request/query";
import { LocationRead, LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface OccupiedBedSheetProps {
  location: LocationRead;
  facilityId: string;
}

function OccupiedBedSheet({ location, facilityId }: OccupiedBedSheetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const { data: associations, isLoading } = useQuery({
    queryKey: ["location-associations", facilityId, location.id],
    queryFn: query(locationApi.listAssociations, {
      pathParams: {
        facility_external_id: facilityId,
        location_external_id: location.id,
      },
    }),
    enabled: isOpen,
  });

  const firstAssociation = associations?.results?.[0];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-col items-center justify-center py-8 h-auto">
        <div className="rounded-full bg-yellow-100 p-3 mb-3">
          <Lock className="size-6 text-yellow-700" />
        </div>
        <p className="text-sm font-medium text-gray-700">{t("occupied")}</p>
        <p className="text-xs text-gray-500 mt-1">
          {t("this_bed_is_currently_occupied")}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setIsOpen(true)}
        >
          <Eye className="size-4 mr-1" />
          {t("view_encounter")}
        </Button>
      </div>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("bed_encounter_details")}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">{t("loading")}</p>
            </div>
          ) : firstAssociation?.encounter ? (
            <EncounterInfoCard
              encounter={firstAssociation.encounter}
              facilityId={facilityId}
              disableHover={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Lock className="size-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                {t("no_encounter_associated")}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface BedCardProps {
  location: LocationRead;
  facilityId: string;
}

function BedCard({ location, facilityId }: BedCardProps) {
  const { t } = useTranslation();
  const isOccupied =
    !!location.current_encounter || location.operational_status !== "U";

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden shadow-xs h-full flex flex-col",
        isOccupied
          ? "bg-white border-gray-200"
          : "bg-green-50 border-green-200",
      )}
    >
      <div
        className={cn(
          "px-4 py-3 flex justify-between items-center",
          isOccupied
            ? "bg-blue-50 border-b border-blue-100"
            : "bg-green-100 border-b border-green-200",
        )}
      >
        <div className="flex items-center">
          <Bed
            className={cn(
              "size-4 mr-2",
              isOccupied ? "text-blue-600" : "text-green-600",
            )}
          />
          <span className="font-medium">{location.name}</span>
        </div>
        <div
          className={cn(
            "text-xs px-2 py-1 rounded-full",
            isOccupied
              ? "bg-blue-100 text-blue-800"
              : "bg-green-200 text-green-800",
          )}
        >
          {isOccupied ? t("occupied") : t("available")}
        </div>
      </div>

      <div className="h-full">
        {location.current_encounter ? (
          <EncounterInfoCard
            encounter={location.current_encounter}
            facilityId={facilityId}
            hideBorder={true}
          />
        ) : location.operational_status !== "U" ? (
          <OccupiedBedSheet location={location} facilityId={facilityId} />
        ) : (
          <div className="flex flex-col items-center justify-center py-4 h-auto">
            <p className="text-sm text-gray-600 mb-3">
              {t("ready_for_admission")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface LocationCardProps {
  location: LocationRead;
  onClick: () => void;
}

function LocationCard({ location, onClick }: LocationCardProps) {
  const { t } = useTranslation();
  const Icon =
    LocationTypeIcons[location.form as keyof typeof LocationTypeIcons];

  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <Icon className="size-4 mr-2 text-gray-600" />
          <span className="font-medium">{location.name}</span>
        </div>
        <ArrowRight className="size-4 text-gray-400" />
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {location.description}
        </p>

        <div className="flex justify-between text-sm">
          <div className="flex items-center">
            <span className="capitalize text-gray-600">
              {t(`location_form__${location.form}`)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChildLocationCardProps {
  location: LocationRead;
  onClick: () => void;
  facilityId: string;
}

function ChildLocationCard(props: ChildLocationCardProps) {
  const isBed = props.location.form === "bd";
  return isBed ? (
    <BedCard location={props.location} facilityId={props.facilityId} />
  ) : (
    <LocationCard location={props.location} onClick={props.onClick} />
  );
}

interface BreadcrumbsProps {
  location: LocationRead;
  onSelect: (location: LocationRead) => void;
}

function Breadcrumbs({ location, onSelect }: BreadcrumbsProps) {
  const { t } = useTranslation();

  const items = [];
  let current: LocationRead | undefined = location;

  while (current) {
    items.unshift(current);
    current = current.parent;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              <BreadcrumbLink
                className={cn(
                  "hover:text-primary cursor-pointer",
                  index === items.length - 1 && "font-medium text-primary",
                )}
                onClick={() => onSelect(item)}
              >
                {index === 0 ? t("locations") : item.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

interface LocationContentProps {
  facilityId: string;
  selectedLocationId: string | null;
  selectedLocation: LocationRead | null;
  searchQuery: string;
  currentPage: number;
  onLocationSelect: (location: LocationRead) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  hideBreadcrumbs?: boolean;
}

export default function LocationContent({
  facilityId,
  selectedLocationId,
  selectedLocation,
  searchQuery,
  currentPage,
  onLocationSelect,
  onSearchChange,
  onPageChange,
  hideBreadcrumbs = false,
}: LocationContentProps) {
  const { t } = useTranslation();
  const ITEMS_PER_PAGE = 12;

  const { data: children, isLoading } = useQuery({
    queryKey: [
      "locations",
      facilityId,
      "children",
      selectedLocationId,
      "kind",
      "full",
      currentPage,
      searchQuery,
    ],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: selectedLocationId || undefined,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        name: searchQuery || undefined,
        status: "active",
        ...(selectedLocationId ? {} : { mine: true, mode: "kind" }),
      },
    }),
    enabled: true,
  });

  return (
    <div className="flex-1 p-6 space-y-4 rounded-lg bg-white shadow-lg">
      <div className="flex flex-col gap-4">
        {!hideBreadcrumbs && selectedLocation && (
          <Breadcrumbs
            location={selectedLocation}
            onSelect={onLocationSelect}
          />
        )}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <h2 className="text-lg font-semibold whitespace-nowrap">
              {selectedLocation ? selectedLocation.name : t("locations")}
            </h2>
          </div>
          <div className="w-full sm:w-72 shrink-0">
            <Input
              placeholder={t("search_by_name")}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : !children?.results?.length ? (
        <Card className="col-span-full">
          <CardContent className="p-6 text-center text-gray-500">
            {searchQuery ? t("no_locations_found") : t("no_locations")}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-8">
            {/* Group locations by type (bed vs non-bed) */}
            {(() => {
              const { bedLocations, nonBedLocations } = children.results.reduce(
                (acc, location) => {
                  if (location.form === "bd") {
                    acc.bedLocations.push(location);
                  } else {
                    acc.nonBedLocations.push(location);
                  }
                  return acc;
                },
                {
                  bedLocations: [] as LocationRead[],
                  nonBedLocations: [] as LocationRead[],
                },
              );

              return (
                <>
                  {/* Non-bed locations */}
                  {nonBedLocations.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-700">
                        {t("locations")}
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {nonBedLocations.map((location) => (
                          <ChildLocationCard
                            key={location.id}
                            location={location}
                            onClick={() => onLocationSelect(location)}
                            facilityId={facilityId}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bed locations */}
                  {bedLocations.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-700">
                        {t("beds")}
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {bedLocations.map((location) => (
                          <ChildLocationCard
                            key={location.id}
                            location={location}
                            onClick={() => onLocationSelect(location)}
                            facilityId={facilityId}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className="flex w-full items-center justify-center mt-4">
            <div
              className={cn(
                "flex w-full justify-center",
                (children?.count ?? 0) > ITEMS_PER_PAGE
                  ? "visible"
                  : "invisible",
              )}
            >
              <PaginationComponent
                cPage={currentPage}
                defaultPerPage={ITEMS_PER_PAGE}
                data={{ totalCount: children?.count ?? 0 }}
                onChange={onPageChange}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
