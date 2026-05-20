import { useQuery } from "@tanstack/react-query";
import { LucideBadgeCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";

import query from "@/Utils/request/query";

import { DottedDivider } from "@/components/careui/dotted-divider";
import { Button } from "@/components/ui/button";
import { Link, Redirect } from "raviger";

interface Props {
  facilityId: string;
  locationId: string;
  dispenseOrderId: string;
}

export default function DispenseOrderCompleted({
  facilityId,
  locationId,
  dispenseOrderId,
}: Props) {
  const { t } = useTranslation();

  const { data: dispenseOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
    queryFn: query(dispenseOrderApi.get, {
      pathParams: { facilityId, id: dispenseOrderId },
    }),
    enabled: !!dispenseOrderId,
  });

  if (isLoadingOrder) {
    return <TableSkeleton count={5} />;
  }

  if (!dispenseOrder) {
    return <ErrorPage />;
  }

  if (dispenseOrder.status !== "completed") {
    return (
      <Redirect
        to={`/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}`}
      />
    );
  }

  return (
    <Page title={t("dispense_completed_title")} hideTitleOnPage>
      <div className="flex flex-col gap-6 mx-auto max-w-2xl">
        <div className="flex flex-col gap-4 bg-white shadow p-2 pb-4 rounded-xl border border-gray-300">
          {/* Success banner */}
          <div className="flex flex-col gap-3 py-4 bg-primary-50 rounded-xl border border-primary-100">
            <LucideBadgeCheck
              className="m-2 size-12 mx-auto text-primary-700"
              strokeWidth={1.5}
            />
            <div className="flex flex-col gap-1 justify-center items-center text-center">
              <h2 className="text-xl font-semibold text-green-900">
                {t("dispense_completed_title")}
              </h2>
              <p className="text-sm text-green-900 mt-1 max-w-54">
                {t("dispense_completed_description")}
              </p>
            </div>
          </div>

          {/* Next actions */}
          <div className="flex flex-col gap-4 px-3 pt-4">
            <span className="text-sm font-medium text-gray-700">
              {t("next_pharmacy_action_question")}
            </span>
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                type="button"
                asChild
              >
                <Link href="/medication_requests">
                  {t("prescription_queue")}
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                type="button"
                asChild
              >
                <Link href="/medication_dispense">{t("go_to_dispenses")}</Link>
              </Button>
              <Button
                variant="link"
                size="lg"
                className="w-full underline"
                type="button"
                asChild
              >
                <Link href="/medication_return">{t("medicine_returns")}</Link>
              </Button>
            </div>
          </div>
        </div>

        <DottedDivider />

        {/* TODO: print stuffs */}
      </div>
    </Page>
  );
}
