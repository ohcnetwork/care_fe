import { ImagePlus, PhoneOutgoing, Trash2 } from "lucide-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { cn } from "@/lib/utils";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";

import FacilityDeleteDialog from "@/components/Facility/FacilityDeleteDialog";
import { FacilityMapsLink } from "@/components/Facility/FacilityMapLink";

import { FeatureBadge } from "@/pages/Facility/Utils";
import EditFacilitySheet from "@/pages/Organization/components/EditFacilitySheet";
import {
  FACILITY_FEATURE_TYPES,
  type FacilityRead,
} from "@/types/facility/facility";
import { renderGeoOrganizations } from "@/types/organization/organization";

interface FacilitySettingsOverviewProps {
  facility: FacilityRead;
  actions: ReactNode;
  settingsActions?: ReactNode;
  canDelete: boolean;
  canUpdateFacility: boolean;
  onEditCoverImage: () => void;
}

export function FacilitySettingsOverview({
  facility,
  actions,
  settingsActions,
  canDelete,
  canUpdateFacility,
  onEditCoverImage,
}: FacilitySettingsOverviewProps) {
  const { t } = useTranslation();
  const organizations = facility.geo_organization
    ? renderGeoOrganizations(facility.geo_organization)
    : [];
  const features =
    facility.features?.filter((feature) =>
      FACILITY_FEATURE_TYPES.some(({ id }) => id === feature),
    ) ?? [];
  const phoneNumber = facility.phone_number
    ? formatPhoneNumberIntl(String(facility.phone_number))
    : undefined;

  return (
    <div className="space-y-6">
      <section aria-label={facility.name} data-cy="facility-settings-header">
        <Card className="overflow-hidden">
          <div
            className="relative h-48 border-b border-border bg-muted sm:h-40"
            data-cy="facility-cover"
          >
            {facility.read_cover_image_url ? (
              <>
                <img
                  src={facility.read_cover_image_url}
                  alt={facility.name}
                  className="h-full w-full object-cover"
                  data-cy="facility-cover-image"
                />
                {canUpdateFacility && (
                  <Button
                    variant="outline"
                    className="absolute right-4 bottom-4"
                    onClick={onEditCoverImage}
                  >
                    <ImagePlus aria-hidden="true" />
                    {t("edit_cover_photo")}
                  </Button>
                )}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("facility_settings_cover_empty")}
                </p>
                {canUpdateFacility && (
                  <Button
                    variant="ghost"
                    className="underline underline-offset-4"
                    onClick={onEditCoverImage}
                  >
                    <ImagePlus aria-hidden="true" />
                    {t("facility_settings_add_cover")}
                  </Button>
                )}
              </div>
            )}
          </div>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="min-w-0 flex-1 basis-64 space-y-2">
              <h2 className="break-words text-2xl leading-tight font-semibold">
                {facility.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge
                  variant="secondary"
                  className="max-w-full whitespace-normal"
                >
                  {facility.facility_type}
                </Badge>
                {facility.geo_organization && (
                  <span className="break-words">
                    {t("facility_settings_part_of", {
                      organization: facility.geo_organization.name,
                    })}
                  </span>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex w-full flex-wrap gap-4 sm:w-auto">
                {actions}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div
        className={cn(
          "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]",
          // The flexible second row keeps the delete card directly below details.
          canDelete && "lg:grid-rows-[auto_1fr]",
        )}
      >
        <section aria-labelledby="facility-details-heading" className="min-w-0">
          <Card>
            <CardHeader className="border-b border-border py-4">
              <CardTitle>
                <h2
                  id="facility-details-heading"
                  className="text-base font-semibold"
                >
                  {t("facility_details")}
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-0">
              <dl className="divide-y divide-border [&>div]:grid [&>div]:gap-2 [&>div]:py-4 sm:[&>div]:grid-cols-[10rem_minmax(0,1fr)] sm:[&>div]:gap-6 [&_dd]:min-w-0 [&_dd]:break-words [&_dd]:leading-6 [&_dt]:text-muted-foreground">
                <div>
                  <dt>{t("address")}</dt>
                  <dd className="space-y-2">
                    <p className="whitespace-pre-wrap">
                      {facility.address || t("not_specified")}
                    </p>
                    {facility.latitude && facility.longitude && (
                      // Offset ghost padding and border so labels align with other values.
                      <FacilityMapsLink
                        latitude={facility.latitude}
                        longitude={facility.longitude}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "-mb-1.5 -ml-3.25 text-foreground underline underline-offset-4",
                        )}
                      />
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{t("mobile_number")}</dt>
                  <dd>
                    {phoneNumber ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-my-1.5 -ml-2.75 underline underline-offset-4"
                        asChild
                      >
                        <a href={`tel:${phoneNumber}`}>
                          <PhoneOutgoing
                            data-icon="inline-start"
                            aria-hidden="true"
                          />
                          {phoneNumber}
                        </a>
                      </Button>
                    ) : (
                      t("not_specified")
                    )}
                  </dd>
                </div>
                {organizations.map((organization, index) => (
                  <div key={index}>
                    <dt>{organization.label}</dt>
                    <dd>{organization.value}</dd>
                  </div>
                ))}
                <div>
                  <dt>{t("features")}</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    {features.length > 0
                      ? features.map((featureId) => (
                          <FeatureBadge key={featureId} featureId={featureId} />
                        ))
                      : t("not_specified")}
                  </dd>
                </div>
                <div>
                  <dt>{t("description")}</dt>
                  <dd>
                    {facility.description ? (
                      <Markdown
                        content={facility.description}
                        className="break-words text-sm leading-6"
                      />
                    ) : (
                      <div className="flex flex-wrap items-center gap-x-2">
                        <span className="text-muted-foreground">
                          {t("no_description")}
                        </span>
                        {canUpdateFacility && (
                          <EditFacilitySheet
                            facilityId={facility.id}
                            trigger={
                              <Button
                                variant="ghost"
                                className="px-2 text-primary underline underline-offset-4"
                              >
                                {t("facility_settings_add_description")}
                              </Button>
                            }
                          />
                        )}
                      </div>
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </section>
        {settingsActions && (
          <aside className={cn("min-w-0", canDelete && "lg:row-span-2")}>
            {settingsActions}
          </aside>
        )}
        {canDelete && (
          <section
            className="min-w-0 lg:col-start-1"
            data-cy="facility-delete-section"
          >
            <Card>
              <Accordion type="single" collapsible>
                <AccordionItem value="delete-facility">
                  <AccordionTrigger className="items-center rounded-xl px-6 py-4 text-sm text-destructive font-medium">
                    {t("facility_settings_delete_section")}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 px-6 pb-6 [&_p:not(:last-child)]:mb-0">
                    <div className="flex p-2 justify-between border border-red-300 rounded-md items-center">
                      <p className="text-muted-foreground">
                        {t("delete_facility_description")}
                      </p>
                      <FacilityDeleteDialog
                        facility={facility}
                        trigger={
                          <Button variant="destructive">
                            <Trash2 aria-hidden="true" />
                            {t("delete_facility")}
                          </Button>
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
