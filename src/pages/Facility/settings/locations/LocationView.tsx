import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MapPinOff, PenLine } from "lucide-react";
import { Fragment, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EyebrowTitle,
  Muted,
  SubsectionTitle,
} from "@/components/ui/typography";

import { TagBadges } from "@/components/Tags/TagBadges";

import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";
import { navigate } from "@/lib/router/navigate";
import { LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import { buildLocationPath } from "@/types/location/utils";

import LocationSheet from "./LocationSheet";
import { LocationChildren } from "./components/LocationChildren";

interface Props {
  id: string;
  facilityId: string;
}

/** A label beside its values; on a phone the label sits above them. */
const detailRow = "grid gap-1 sm:grid-cols-[7rem_1fr] sm:items-baseline";

/**
 * One location in settings: what it is and what it holds. Edit opens the
 * sheet that manages everything about it, the same sheet a bed opens from
 * its parent's page.
 */
export default function LocationView({ id, facilityId }: Props) {
  const { t } = useTranslation();
  const headingId = useId();
  const [isManaging, setIsManaging] = useState(false);

  const {
    data: location,
    error,
    refetch,
  } = useQuery({
    queryKey: ["location", facilityId, id],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id },
    }),
  });
  const { data: organizations } = useQuery({
    queryKey: ["location", id, "organizations"],
    queryFn: query(locationApi.getOrganizations, {
      pathParams: { facility_id: facilityId, id },
    }),
  });

  if (!location && error) {
    // A deleted location or a stale link is told apart from a request that
    // failed for another reason, which is worth trying again.
    const isMissing = error instanceof HTTPError && error.status === 404;
    return (
      <EmptyState
        className="rounded-xl border border-dashed"
        icon={<MapPinOff className="size-6 text-muted-foreground" />}
        title={t(isMissing ? "location_not_found" : "failed_to_load_location")}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {!isMissing && (
              <Button variant="outline" onClick={() => refetch()}>
                {t("retry")}
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link
                to="/facility/$facilityId/settings/locations"
                params={{ facilityId }}
              >
                {t("locations")}
              </Link>
            </Button>
          </div>
        }
      />
    );
  }

  if (!location) {
    return (
      <div role="status" className="space-y-4">
        <span className="sr-only">{t("loading")}</span>
        <Skeleton className="h-5 w-64 max-w-full" />
        <Skeleton className="h-36 w-full rounded-lg" />
      </div>
    );
  }

  const Icon = LocationTypeIcons[location.form];
  const ancestors = buildLocationPath(location).slice(0, -1);
  const parent = ancestors.at(-1);
  const departments = organizations?.results ?? [];

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to="/facility/$facilityId/settings/locations"
                params={{ facilityId }}
              >
                {t("locations")}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {ancestors.map((ancestor) => (
            <Fragment key={ancestor.id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/facility/$facilityId/settings/locations/$id"
                    params={{ facilityId, id: ancestor.id }}
                  >
                    {ancestor.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </Fragment>
          ))}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{location.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardContent className="space-y-6 p-4 md:p-6">
          <section aria-labelledby={headingId} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              {/* Eyebrow, title, then the description. */}
              <div className="min-w-0 space-y-1">
                <EyebrowTitle className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {[
                    t(`location_form__${location.form}`),
                    // Only a bed has an operational status worth reading.
                    location.mode === "instance" &&
                      t(
                        `location_operational_status__${location.operational_status}`,
                      ),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </EyebrowTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <SubsectionTitle id={headingId} className="break-words">
                    {location.name}
                  </SubsectionTitle>
                  {location.status !== "active" && (
                    <Badge variant="secondary">{t(location.status)}</Badge>
                  )}
                </div>
                {location.description && (
                  <Muted className="max-w-prose whitespace-pre-wrap">
                    {location.description}
                  </Muted>
                )}
              </div>
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() => setIsManaging(true)}
              >
                <PenLine aria-hidden="true" />
                {t("edit")}
              </Button>
            </div>

            {/* Who manages it and how it is tagged: read here, changed in Edit. */}
            {(departments.length > 0 || !!location.tags?.length) && (
              <dl className="space-y-2">
                {departments.length > 0 && (
                  <div className={detailRow}>
                    <dt className="text-sm text-muted-foreground">
                      {t("departments")}
                    </dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {departments.map((department) => (
                        <Badge
                          key={department.id}
                          variant="secondary"
                          size="sm"
                        >
                          {department.name}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                )}
                {!!location.tags?.length && (
                  <div className={detailRow}>
                    <dt className="text-sm text-muted-foreground">
                      {t("tags_proper")}
                    </dt>
                    <dd>
                      <TagBadges
                        tags={location.tags}
                        size="sm"
                        hierarchyDisplay
                        className="gap-1.5"
                      />
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </section>

          {/* A bed holds nothing, so only other locations list what is inside. */}
          {location.mode === "kind" && (
            <div className="border-t border-soft-border pt-6">
              <LocationChildren facilityId={facilityId} parent={location} />
            </div>
          )}
        </CardContent>
      </Card>

      <LocationSheet
        open={isManaging}
        onOpenChange={setIsManaging}
        facilityId={facilityId}
        location={location}
        parentId={parent?.id}
        onDeleted={() =>
          // The open location is gone: go up to where it was listed.
          parent
            ? navigate({
                to: "/facility/$facilityId/settings/locations/$id",
                params: { facilityId, id: parent.id },
              })
            : navigate({
                to: "/facility/$facilityId/settings/locations",
                params: { facilityId },
              })
        }
      />
    </div>
  );
}
