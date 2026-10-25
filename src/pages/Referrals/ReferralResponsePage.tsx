import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, LockKeyhole } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/careui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/careui/empty";
import Page from "@/components/Common/Page";
import { FillShell } from "@/components/QuestionnaireV2/fill/FillShell";
import { getReferralDetailUrl } from "@/components/Referral/referralNavigation";
import { ReferralResponseEditor } from "@/components/Referral/ReferralResponseEditor";
import { useReferralPermissions } from "@/components/Referral/useReferralPermissions";
import { Skeleton } from "@/components/ui/skeleton";
import referralApi from "@/types/emr/referral/referralApi";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

export function ReferralResponsePage({ referralId }: { referralId: string }) {
  const { t } = useTranslation();
  const [{ sourceUrl }] = useQueryParams<{ sourceUrl?: string }>();
  const detailUrl = getReferralDetailUrl(
    referralId,
    typeof sourceUrl === "string" ? sourceUrl : undefined,
  );
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["referrals", "detail", referralId],
    queryFn: query(referralApi.get, {
      pathParams: { referralId },
      silent: true,
    }),
    retry: false,
  });
  const isDenied =
    error instanceof HTTPError && [401, 403].includes(error.status);
  const isNotFound = error instanceof HTTPError && error.status === 404;
  const canShowCached = !!data && !isDenied && !isNotFound;
  const { canWrite, isLoading: permissionsLoading } = useReferralPermissions(
    canShowCached ? data : undefined,
  );
  const readOnly = canShowCached && !permissionsLoading && !canWrite;
  const close = () => navigate(detailUrl);

  return (
    <Page title={t("referral_respond")} hideTitleOnPage className="careui">
      {data && canWrite ? (
        <ReferralResponseEditor
          key={data.id}
          page
          responseOnly
          referral={data}
          onClose={close}
        />
      ) : (
        <FillShell
          onClose={close}
          tabs={
            <div className="py-1.5 text-sm font-medium text-gray-900">
              {t("referral_respond")}
            </div>
          }
        >
          {isLoading || permissionsLoading ? (
            <div
              role="status"
              aria-label={t("loading")}
              className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 md:px-8"
            >
              <Skeleton className="h-12 w-2/3 bg-cui-muted" />
              <Skeleton className="h-24 w-full bg-cui-muted" />
              <Skeleton className="h-80 w-full bg-cui-muted" />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6">
              <Empty role="alert" className="m-auto max-w-xl p-4 sm:p-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    {readOnly || isDenied ? <LockKeyhole /> : <AlertCircle />}
                  </EmptyMedia>
                  <EmptyTitle>
                    {t(
                      readOnly
                        ? "read_only"
                        : isDenied
                          ? "referral_detail_access_denied"
                          : isNotFound
                            ? "referral_not_found"
                            : "referral_load_failed",
                    )}
                  </EmptyTitle>
                  <EmptyDescription>
                    {t(
                      readOnly
                        ? "referral_response_readonly"
                        : isDenied
                          ? "referral_detail_access_denied_description"
                          : isNotFound
                            ? "referral_not_found_description"
                            : "referral_load_failed_description",
                    )}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="flex-row flex-wrap justify-center">
                  <Button variant="outline" onClick={close}>
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    {t("referral_return_to_referral")}
                  </Button>
                  {!isDenied && !isNotFound && (
                    <Button
                      variant="outline"
                      disabled={isFetching}
                      onClick={() => void refetch()}
                    >
                      {t("retry")}
                    </Button>
                  )}
                </EmptyContent>
              </Empty>
            </div>
          )}
        </FillShell>
      )}
    </Page>
  );
}
