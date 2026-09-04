import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Info } from "lucide-react";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";

import { Avatar } from "@/components/Common/Avatar";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import publicFacilityApi from "@/types/facility/publicFacilityApi";

import BookingStepLayout from "./BookingStepLayout";

const TOTAL_STEPS = 4;

/**
 * Step 2 of booking: pick who the appointment is with. Keeps the patient inside
 * the wizard rather than handing off to the public facility page.
 */
export default function BookPractitioner({
  facilityId,
}: {
  facilityId: string;
}) {
  const { t } = useTranslation();

  const { data: facility } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(publicFacilityApi.getAny, {
      pathParams: { id: facilityId },
      silent: true,
    }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["schedulable-users", facilityId],
    queryFn: query(publicFacilityApi.listSchedulableUsers, {
      pathParams: { facilityId },
    }),
  });

  const practitioners = data?.results ?? [];

  return (
    <BookingStepLayout
      title={t("patient_booking__choose_practitioner")}
      subtitle={facility?.name}
      step={2}
      totalSteps={TOTAL_STEPS}
      onBack={() => navigate("/nearby_facilities")}
      footer={
        practitioners.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-xl bg-gray-100 px-3.5 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-gray-500" />
            <p className="text-xs leading-snug text-gray-600">
              {t("patient_booking__practitioner_hint")}
            </p>
          </div>
        )
      }
    >
      <div className="flex min-w-0 flex-col gap-3 p-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[76px] w-full rounded-2xl" />
            <Skeleton className="h-[76px] w-full rounded-2xl" />
          </>
        ) : practitioners.length ? (
          practitioners.map((practitioner) => (
            <Link
              key={practitioner.id}
              href={`/facility/${facilityId}/appointments/${practitioner.id}/book-appointment`}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 hover:border-primary-200 hover:bg-primary-50/40"
            >
              <Avatar
                imageUrl={practitioner.profile_picture_url}
                name={formatName(practitioner)}
                className="size-[50px] shrink-0 rounded-full"
              />
              {/* No qualification or next-available-slot on this payload, so
                  the name is all we can honestly show. */}
              <span className="min-w-0 flex-1 truncate font-bold text-gray-900">
                {formatName(practitioner)}
              </span>
              <ChevronRight className="size-4 shrink-0 text-gray-400" />
            </Link>
          ))
        ) : (
          <div className="flex items-start gap-2.5 rounded-2xl bg-gray-100 px-3.5 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-gray-500" />
            <p className="text-xs leading-snug text-gray-600">
              {t("patient_booking__no_practitioners")}
            </p>
          </div>
        )}
      </div>
    </BookingStepLayout>
  );
}
