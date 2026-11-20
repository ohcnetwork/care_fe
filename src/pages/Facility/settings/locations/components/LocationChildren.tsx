import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EyebrowTitle, Muted } from "@/components/ui/typography";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";

import { navigate } from "@/lib/router/navigate";
import { locationChildrenQuery } from "@/pages/Facility/locations/bed-board/locationQueries";
import LocationSheet from "@/pages/Facility/settings/locations/LocationSheet";
import { useLocationActions } from "@/pages/Facility/settings/locations/useLocationActions";
import { LocationRead } from "@/types/location/location";

import { BedGrid } from "./BedGrid";
import { SubLocationTable } from "./SubLocationTable";

interface LocationChildrenProps {
  facilityId: string;
  /** The location whose contents are listed. Leave out for the top of the facility. */
  parent?: LocationRead;
}

/**
 * What a location holds: the locations inside it as a list to open, and its
 * beds as a grid. Everything is loaded, so the search filters as you type.
 */
export function LocationChildren({
  facilityId,
  parent,
}: LocationChildrenProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  // `null` is closed; without a location it adds one; with one it manages it.
  const [sheet, setSheet] = useState<{ location?: LocationRead } | null>(null);
  const [toDelete, setToDelete] = useState<LocationRead | null>(null);
  const { remove, move, refresh } = useLocationActions(facilityId);

  const parentId = parent?.id ?? "";
  const { data: subLocationList, isLoading: isLoadingSubLocations } = useQuery(
    locationChildrenQuery(facilityId, parentId, "kind"),
  );
  const { data: bedList, isLoading: isLoadingBeds } = useQuery({
    ...locationChildrenQuery(facilityId, parentId, "instance"),
    // Beds sit inside a location, never at the top of the facility.
    enabled: !!parent,
  });
  const subLocations = subLocationList?.results ?? [];
  const beds = bedList?.results ?? [];

  const term = search.trim().toLowerCase();
  const matches = (location: LocationRead) =>
    !term || location.name.toLowerCase().includes(term);
  const shownSubLocations = subLocations.filter(matches);
  const shownBeds = beds.filter(matches);
  const isEmpty = subLocations.length + beds.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder={t("search_by_name")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full sm:w-72"
        />
        <Button variant="primary" onClick={() => setSheet({})}>
          <Plus aria-hidden="true" />
          {t("add_location")}
        </Button>
      </div>

      {isLoadingSubLocations || isLoadingBeds ? (
        <div role="status" className="space-y-2">
          <span className="sr-only">{t("loading")}</span>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isEmpty ? (
        <EmptyState
          className="rounded-xl border border-dashed"
          icon={<MapPin className="size-6 text-muted-foreground" />}
          title={t(parent ? "no_child_locations_found" : "no_locations_found")}
        />
      ) : shownSubLocations.length + shownBeds.length === 0 ? (
        <Muted className="py-6 text-center">{t("no_locations_found")}</Muted>
      ) : (
        <>
          {shownSubLocations.length > 0 && (
            <section className="space-y-2">
              {parent && (
                <EyebrowTitle className="text-muted-foreground">
                  {t("sub_locations")} · {subLocations.length}
                </EyebrowTitle>
              )}
              <SubLocationTable
                locations={shownSubLocations}
                onOpen={(location) =>
                  navigate({
                    to: "/facility/$facilityId/settings/locations/$id",
                    params: { facilityId, id: location.id },
                  })
                }
                onManage={(location) => setSheet({ location })}
                onMove={
                  term
                    ? undefined
                    : (location, direction) =>
                        move(subLocations, location, direction)
                }
                onDelete={setToDelete}
              />
            </section>
          )}
          {shownBeds.length > 0 && (
            <section className="space-y-2">
              <EyebrowTitle className="text-muted-foreground">
                {t("beds")} · {beds.length}
              </EyebrowTitle>
              <BedGrid
                beds={shownBeds}
                onManage={(bed) => setSheet({ location: bed })}
                onMove={
                  term
                    ? undefined
                    : (bed, direction) => move(beds, bed, direction)
                }
                onDelete={setToDelete}
              />
            </section>
          )}
        </>
      )}

      <LocationSheet
        open={!!sheet}
        onOpenChange={(open) => {
          if (open) return;
          setSheet(null);
          // A new bed or sub-location changes what the parent holds.
          refresh();
        }}
        facilityId={facilityId}
        location={sheet?.location}
        parentId={parent?.id}
      />
      <ConfirmActionDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("remove_name", { name: toDelete?.name })}
        description={t("are_you_sure_want_to_delete", { name: toDelete?.name })}
        confirmText={t("remove")}
        onConfirm={() => toDelete && remove(toDelete)}
        variant="destructive"
      />
    </div>
  );
}
