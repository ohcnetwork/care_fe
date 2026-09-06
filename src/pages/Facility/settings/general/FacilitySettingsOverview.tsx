import { Trash2 } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";

import { Avatar } from "@/components/Common/Avatar";
import ContactLink from "@/components/Common/ContactLink";
import FacilityDeleteDialog from "@/components/Facility/FacilityDeleteDialog";
import { FacilityMapsLink } from "@/components/Facility/FacilityMapLink";

import { FeatureBadge } from "@/pages/Facility/Utils";
import {
  FACILITY_FEATURE_TYPES,
  FacilityRead,
} from "@/types/facility/facility";
import { renderGeoOrganizations } from "@/types/organization/organization";

interface FacilitySettingsOverviewProps {
  facility: FacilityRead;
  actions: ReactNode;
  settingsActions?: ReactNode;
  canDelete: boolean;
}

export function FacilitySettingsOverview({
  facility,
  actions,
  settingsActions,
  canDelete,
}: FacilitySettingsOverviewProps) {
  const { t } = useTranslation();
  const organizations = facility.geo_organization
    ? renderGeoOrganizations(facility.geo_organization)
    : [];
  const features =
    facility.features?.filter((feature) =>
      FACILITY_FEATURE_TYPES.some(({ id }) => id === feature),
    ) ?? [];

  return (
    <div className="space-y-6 text-neutral-950">
      <section
        aria-label={facility.name}
        className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6"
      >
        <div className="flex min-w-0 flex-1 basis-72 items-center gap-4">
          {facility.read_cover_image_url ? (
            <img
              src={facility.read_cover_image_url}
              alt=""
              className="h-16 w-24 shrink-0 rounded-[10px] border border-neutral-200 object-cover"
            />
          ) : (
            <Avatar
              name={facility.name}
              colors={["#f5f5f5", "#171717"]}
              className="size-16 shrink-0 rounded-[10px] border border-neutral-200"
            />
          )}
          <div className="min-w-0 space-y-1">
            <h2 className="break-words text-2xl leading-8 font-semibold">
              {facility.name}
            </h2>
            <p className="text-sm text-neutral-600">{facility.facility_type}</p>
          </div>
        </div>
        {actions && (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {actions}
          </div>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {settingsActions && (
          <aside className="min-w-0 lg:order-2">{settingsActions}</aside>
        )}
        <section
          aria-labelledby="facility-details-heading"
          className="min-w-0 overflow-hidden rounded-[10px] border border-neutral-200 bg-white shadow-xs lg:order-1"
        >
          <h2
            id="facility-details-heading"
            className="border-b border-neutral-200 px-4 py-3 text-lg leading-6 font-semibold"
          >
            {t("facility_details")}
          </h2>
          <div className="divide-y divide-neutral-200 px-4">
            <dl className="grid gap-4 py-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <dt className="text-sm font-medium text-neutral-700">
                  {t("address")}
                </dt>
                <dd className="break-words whitespace-pre-wrap text-sm leading-6">
                  {facility.address || "—"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-neutral-700">
                  {t("mobile_number")}
                </dt>
                <dd className="break-words text-sm leading-6 [&_a]:rounded-sm [&_a]:text-neutral-950 [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:focus-visible:outline-indigo-500">
                  {facility.phone_number ? (
                    <ContactLink
                      tel={formatPhoneNumberIntl(String(facility.phone_number))}
                    />
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              {facility.latitude && facility.longitude && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-neutral-700">
                    {t("location_details")}
                  </dt>
                  <dd className="text-sm leading-6 [&_a]:rounded-sm [&_a]:text-neutral-950 [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:focus-visible:outline-indigo-500">
                    <FacilityMapsLink
                      latitude={facility.latitude}
                      longitude={facility.longitude}
                    />
                  </dd>
                </div>
              )}
            </dl>

            {organizations.length > 0 && (
              <dl className="grid gap-4 py-4 sm:grid-cols-2">
                {organizations.map((organization, index) => (
                  <div key={index} className="min-w-0 space-y-1">
                    <dt className="break-words text-sm font-medium text-neutral-700">
                      {organization.label}
                    </dt>
                    <dd className="break-words text-sm leading-6">
                      {organization.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {features.length > 0 && (
              <section
                className="space-y-3 py-4"
                aria-labelledby="facility-features-heading"
              >
                <h3
                  id="facility-features-heading"
                  className="text-sm font-medium text-neutral-700"
                >
                  {t("features")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {features.map((featureId) => (
                    <FeatureBadge key={featureId} featureId={featureId} />
                  ))}
                </div>
              </section>
            )}

            {facility.description && (
              <section
                className="space-y-2 py-4"
                aria-labelledby="facility-description-heading"
              >
                <h3
                  id="facility-description-heading"
                  className="text-sm font-medium text-neutral-700"
                >
                  {t("description")}
                </h3>
                <Markdown
                  content={facility.description}
                  className="break-words text-sm leading-6"
                />
              </section>
            )}
          </div>
        </section>
      </div>

      {canDelete && (
        <section
          aria-labelledby="facility-danger-heading"
          className="flex flex-col items-start justify-between gap-4 border-t border-neutral-200 pt-4 sm:flex-row sm:items-center"
        >
          <div className="max-w-2xl space-y-1">
            <h2
              id="facility-danger-heading"
              className="text-sm font-medium text-neutral-700"
            >
              {t("danger_zone")}
            </h2>
            <p className="text-sm leading-6 text-neutral-600">
              {t("delete_facility_description")}
            </p>
          </div>
          <FacilityDeleteDialog
            facility={facility}
            trigger={
              <Button
                variant="outline"
                className="h-12 shrink-0 border-red-300 text-red-700 shadow-xs hover:bg-red-50 hover:text-red-800 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10 [&_svg]:size-5"
              >
                <Trash2 className="size-5" />
                {t("delete_facility")}
              </Button>
            }
          />
        </section>
      )}
    </div>
  );
}
