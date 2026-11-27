import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { BreadcrumbLink, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { CareUIPageTitle } from "@/components/ui/typography";

import Page from "@/components/Common/Page";
import { LocationPathBreadcrumb } from "@/components/Location/LocationPathBreadcrumb";
import { LocationTreeLayout } from "@/components/Location/LocationTreeLayout";
import { LocationTreeNode } from "@/components/Location/LocationTreeNode";
import { LocationTreeSearch } from "@/components/Location/LocationTreeSearch";
import { LocationTreeSkeleton } from "@/components/Location/LocationTreeSkeleton";

import query from "@/Utils/request/query";
import { navigate } from "@/lib/router/navigate";
import { locationChildrenQuery } from "@/pages/Facility/locations/bed-board/locationQueries";
import { LocationRead } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import { buildLocationPath } from "@/types/location/utils";

import LocationView from "./LocationView";
import { LocationChildren } from "./components/LocationChildren";

interface LocationSettingsProps {
  facilityId: string;
  locationId?: string;
}

// The top of the list and each location are separate routes, so the page
// remounts between them: the open branches live outside it.
const expandedLocationsAtom = atom<ReadonlySet<string>>(new Set<string>());

export default function LocationSettings({
  facilityId,
  locationId,
}: LocationSettingsProps) {
  const { t } = useTranslation();
  const [expandedLocations, setExpandedLocations] = useAtom(
    expandedLocationsAtom,
  );

  const { data: topLocations } = useQuery(
    locationChildrenQuery(facilityId, "", "kind"),
  );
  const { data: selectedLocation } = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
    enabled: !!locationId,
  });

  useEffect(() => {
    if (!selectedLocation) return;
    const path = buildLocationPath(selectedLocation).map(({ id }) => id);
    setExpandedLocations((previous) =>
      path.every((id) => previous.has(id))
        ? previous
        : new Set([...previous, ...path]),
    );
  }, [selectedLocation, setExpandedLocations]);

  const setExpanded = (id: string, expanded: boolean) =>
    setExpandedLocations((previous) => {
      const next = new Set(previous);
      if (expanded) next.add(id);
      else next.delete(id);
      return next;
    });

  const openLocation = (location: LocationRead) =>
    navigate({
      to: "/facility/$facilityId/settings/locations/$id",
      params: { facilityId, id: location.id },
    });

  const ancestors = selectedLocation
    ? buildLocationPath(selectedLocation).slice(0, -1)
    : [];

  return (
    <Page
      title={selectedLocation?.name ?? t("locations")}
      hideTitleOnPage
      className="p-0"
    >
      <div className="container mx-auto space-y-4 pt-4">
        <CareUIPageTitle>{t("locations")}</CareUIPageTitle>

        <LocationTreeLayout
          className="overflow-clip rounded-lg border border-border bg-card shadow-xs md:h-[calc(100svh-9rem)]"
          tree={
            <LocationTreeSearch facilityId={facilityId} onSelect={openLocation}>
              <nav aria-label={t("locations")}>
                {!topLocations ? (
                  <LocationTreeSkeleton />
                ) : topLocations.results.length ? (
                  <ul>
                    {topLocations.results.map((location) => (
                      <LocationTreeNode
                        key={location.id}
                        location={location}
                        facilityId={facilityId}
                        selectedLocationId={locationId}
                        isExpanded={(id) => expandedLocations.has(id)}
                        onToggle={setExpanded}
                        onSelect={(selected) => {
                          openLocation(selected);
                          if (selected.has_sub_locations)
                            setExpanded(selected.id, true);
                        }}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="p-2 text-sm text-muted-foreground">
                    {t("no_locations_available")}
                  </p>
                )}
              </nav>
            </LocationTreeSearch>
          }
        >
          {(sidebarToggle) => (
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-11 min-w-0 shrink-0 items-center gap-2 border-b border-border px-4">
                {sidebarToggle}
                <LocationPathBreadcrumb
                  root={
                    locationId ? (
                      <BreadcrumbLink asChild>
                        <Link
                          to="/facility/$facilityId/settings/locations"
                          params={{ facilityId }}
                        >
                          {t("locations")}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{t("locations")}</BreadcrumbPage>
                    )
                  }
                  ancestors={ancestors}
                  current={selectedLocation}
                  getHref={(ancestor) =>
                    `/facility/${facilityId}/settings/locations/${ancestor.id}`
                  }
                  onOpen={openLocation}
                />
              </div>
              <div className="min-h-0 flex-1 p-4 md:overflow-y-auto md:p-6">
                {locationId ? (
                  <LocationView
                    key={locationId}
                    id={locationId}
                    facilityId={facilityId}
                  />
                ) : (
                  <LocationChildren facilityId={facilityId} />
                )}
              </div>
            </div>
          )}
        </LocationTreeLayout>
      </div>
    </Page>
  );
}
