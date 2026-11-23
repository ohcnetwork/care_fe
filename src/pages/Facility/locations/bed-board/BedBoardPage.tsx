import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

import { navigate } from "@/lib/router/navigate";
import { LocationRead } from "@/types/location/location";

import { BedBoard } from "./BedBoard";
import { BedBoardTree } from "./BedBoardTree";
import { locationQuery, myLocationsQuery } from "./locationQueries";
import { useLocationsWithBeds } from "./useLocationsWithBeds";

interface BedBoardPageProps {
  facilityId: string;
  locationId?: string;
}

/** Find patients by where they are: the user's locations and their beds. */
export default function BedBoardPage({
  facilityId,
  locationId,
}: BedBoardPageProps) {
  const { t } = useTranslation();
  const [treeOpen, setTreeOpen] = useState(false);

  const { data: myLocations, isLoading: isLoadingMyLocations } = useQuery(
    myLocationsQuery(facilityId),
  );
  // Reception, stores and the like hold no beds: leave them out of the board.
  const { locations: roots, isLoading: isCheckingBeds } = useLocationsWithBeds(
    facilityId,
    myLocations?.results,
  );
  const isLoading = isLoadingMyLocations || isCheckingBeds;
  const { data: selectedLocation } = useQuery({
    ...locationQuery(facilityId, locationId ?? ""),
    enabled: !!locationId,
  });
  const inUse = roots.filter((root) => root.status === "active");
  const firstRootId = isLoading
    ? undefined
    : (inUse.find((root) => root.has_beds) ?? inUse[0] ?? roots[0])?.id;

  // Open the first location in use that has beds instead of an empty board.
  useEffect(() => {
    if (!locationId && firstRootId) {
      navigate({
        to: "/facility/$facilityId/encounters/locations/$locationId",
        params: { facilityId, locationId: firstRootId },
        replace: true,
      });
    }
  }, [facilityId, locationId, firstRootId]);

  const openLocation = (location: LocationRead) => {
    setTreeOpen(false);
    navigate({
      to: "/facility/$facilityId/encounters/locations/$locationId",
      params: { facilityId, locationId: location.id },
    });
  };

  if (!locationId) {
    return isLoading || firstRootId ? (
      <div role="status" className="space-y-4 py-4">
        <span className="sr-only">{t("loading")}</span>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    ) : (
      <p className="py-16 text-center text-sm text-muted-foreground">
        {t(
          myLocations?.results.length
            ? "no_locations_with_beds"
            : "no_locations_assigned_to_you",
        )}
      </p>
    );
  }

  const tree = (
    <BedBoardTree
      facilityId={facilityId}
      roots={roots}
      selectedLocationId={locationId}
      selectedLocation={
        selectedLocation?.id === locationId ? selectedLocation : undefined
      }
      onSelect={openLocation}
    />
  );

  return (
    <div className="flex items-start gap-4 py-4">
      {(isLoading || roots.length > 0) && (
        <aside className="hidden max-h-[calc(100svh-7rem)] w-64 shrink-0 overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-xs md:sticky md:top-0 md:block">
          <h2 className="p-2 text-sm font-semibold">{t("locations")}</h2>
          {isLoading ? (
            <div role="status" className="space-y-2 p-2">
              <span className="sr-only">{t("loading")}</span>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-36" />
            </div>
          ) : (
            tree
          )}
        </aside>
      )}
      <BedBoard
        key={locationId}
        facilityId={facilityId}
        locationId={locationId}
        onOpenLocation={openLocation}
        leading={
          roots.length > 0 && (
            <Button
              variant="outline"
              className="w-full justify-between md:hidden"
              onClick={() => setTreeOpen(true)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <MapPin aria-hidden="true" />
                <span className="truncate">{t("change_location")}</span>
              </span>
              <ChevronsUpDown
                className="text-muted-foreground"
                aria-hidden="true"
              />
            </Button>
          )
        }
      />
      <Sheet open={treeOpen} onOpenChange={setTreeOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>{t("locations")}</SheetTitle>
          </SheetHeader>
          <SheetBody>{tree}</SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
