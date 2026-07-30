import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Info, Search } from "lucide-react";
import { Link, navigate, useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { usePatientContext } from "@/hooks/usePatientUser";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import OrganizationFilter from "@/pages/Organization/components/OrganizationFilter";
import { PublicPatientRead } from "@/types/emr/patient/patient";
import publicFacilityApi from "@/types/facility/publicFacilityApi";
import { OrganizationParent } from "@/types/organization/organization";

import BookingStepLayout from "./BookingStepLayout";

const TOTAL_STEPS = 4;

/**
 * Walk up from the patient's own geo organization to the district-level one, so
 * the list is scoped to where they live rather than the whole deployment.
 */
function districtOrganization(
  patient: PublicPatientRead | null,
): OrganizationParent | undefined {
  let organization = patient?.geo_organization?.parent;
  while (organization?.parent) {
    if (organization.level_cache === 1) {
      break;
    }
    organization = organization.parent;
  }
  return organization;
}

export default function BookFacility() {
  const { t } = useTranslation();
  const { selectedPatient } = usePatientContext();
  const [search, setSearch] = useState("");
  const [qParams, setQParams] = useQueryParams<{
    organization?: string;
    facility_type?: string;
  }>();

  // Default to the patient's own district; a state-level deployment has far too
  // many facilities to list, and the filter lets them widen or move area.
  const district = districtOrganization(selectedPatient);
  const organization = qParams.organization ?? district?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["facilities", organization, qParams.facility_type, search],
    queryFn: query.debounced(publicFacilityApi.getAll, {
      queryParams: {
        ...(search && { name: search }),
        ...(organization && { organization }),
        ...(qParams.facility_type && { facility_type: qParams.facility_type }),
        page: 1,
        limit: RESULTS_PER_PAGE_LIMIT,
        offset: 0,
      },
    }),
  });

  const facilities = data?.results ?? [];

  return (
    <BookingStepLayout
      title={t("book_appointment")}
      step={1}
      totalSteps={TOTAL_STEPS}
      onBack={() => navigate("/patient/home")}
      headerExtra={
        // OrganizationFilter stacks its controls below `sm`, which leaves its
        // "Clear" ghost button as a full-width orphan under the select. Pull it
        // in to a link-sized control, and drop it entirely while it is disabled
        // — with nothing selected there is nothing to clear.
        <div className="flex flex-col gap-3 bg-white px-4 pb-3.5 [&>div>button]:h-9 [&>div>button]:self-start [&>div>button]:px-0 [&>div>button:disabled]:hidden">
          <OrganizationFilter
            skipLevels={[]}
            selected={organization}
            onChange={(filter) =>
              setQParams(
                {
                  organization: filter.organization as string | undefined,
                  facility_type: filter.facility_type as string | undefined,
                },
                { replace: true },
              )
            }
          />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("search_by_facility_name")}
              className="h-11 bg-gray-50 pl-9 placeholder:text-gray-400"
              aria-label={t("search_by_facility_name")}
            />
          </div>
        </div>
      }
      footer={
        selectedPatient && (
          <div className="flex items-start gap-2.5 rounded-xl bg-gray-100 px-3.5 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-gray-500" />
            <p className="text-xs leading-snug text-gray-600">
              {t("patient_booking__booking_for")}{" "}
              <span className="font-semibold text-gray-900">
                {selectedPatient.name}
              </span>
              . {t("patient_booking__switch_patient_hint")}
            </p>
          </div>
        )
      }
    >
      <div className="flex min-w-0 flex-col gap-3 p-4">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          {!qParams.organization && district?.name
            ? t("patient_booking__facilities_in", { area: district.name })
            : t("patient_booking__all_facilities")}
        </span>

        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </>
        ) : facilities.length ? (
          facilities.map((facility) => (
            <Link
              key={facility.id}
              href={`/patient/book/${facility.id}`}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 hover:border-primary-200 hover:bg-primary-50/40"
            >
              {/* Facility names and addresses are long and matter for
                  choosing — wrap them rather than cutting them off mid-word. */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="line-clamp-2 font-bold text-gray-900">
                  {facility.name}
                </span>
                <span className="line-clamp-2 text-xs text-gray-600">
                  {[facility.facility_type, facility.address]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <ChevronRight className="size-4 shrink-0 text-gray-400" />
            </Link>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-gray-600">
            {t("no_facilities_found")}
          </p>
        )}
      </div>
    </BookingStepLayout>
  );
}
