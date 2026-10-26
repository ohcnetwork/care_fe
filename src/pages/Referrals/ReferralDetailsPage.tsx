import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  LockKeyhole,
} from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/careui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/careui/empty";
import { Frame, FramePanel } from "@/components/careui/frame";
import { Muted, SubsectionTitle } from "@/components/careui/typography";
import { Skeleton } from "@/components/ui/skeleton";

import Page from "@/components/Common/Page";
import { ReferralAppointments } from "@/components/Referral/ReferralAppointments";
import { ReferralAssignmentDialog } from "@/components/Referral/ReferralAssignmentDialog";
import { ReferralConversation } from "@/components/Referral/ReferralConversation";
import { ReferralFormResponseCard } from "@/components/Referral/ReferralFormResponseCard";
import { ReferralPatientHeader } from "@/components/Referral/ReferralPatientHeader";
import { ReferralResponseDialog } from "@/components/Referral/ReferralResponseDialog";
import { ReferralResponsesSection } from "@/components/Referral/ReferralResponsesSection";
import { ReferralSharedRecords } from "@/components/Referral/ReferralSharedRecords";
import { ReferralStatusBadge } from "@/components/Referral/ReferralStatusBadge";
import {
  ReferralProgress,
  ReferralWorkflowActions,
} from "@/components/Referral/ReferralWorkflowActions";
import {
  getReferralDetailUrl,
  getReferralResponseUrl,
} from "@/components/Referral/referralNavigation";
import { useReferralPermissions } from "@/components/Referral/useReferralPermissions";

import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";
import { formatDateTime, formatName } from "@/Utils/utils";
import referralApi from "@/types/emr/referral/referralApi";

const REQUEST_RECORD_CATEGORIES = ["source", "metadata"] as const;

export function ReferralDetailsPage({ referralId }: { referralId: string }) {
  const { t } = useTranslation();
  const requestId = useId();
  const [requestHidden, setRequestHidden] = useState(false);
  const [
    {
      sourceUrl,
      referralAppointmentId,
      referralEncounterId,
      referralFacilityId,
    },
  ] = useQueryParams<{
    sourceUrl?: string;
    referralAppointmentId?: string;
    referralEncounterId?: string;
    referralFacilityId?: string;
  }>();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["referrals", "detail", referralId],
    queryFn: query(referralApi.get, {
      pathParams: { referralId },
      silent: true,
    }),
    retry: false,
  });
  const isDenied = error instanceof HTTPError && error.status === 403;
  const isNotFound = error instanceof HTTPError && error.status === 404;
  const isUnauthorized = error instanceof HTTPError && error.status === 401;
  const canShowCached = !!data && !isDenied && !isNotFound && !isUnauthorized;
  const { canWrite } = useReferralPermissions(canShowCached ? data : undefined);
  // Shared links have no source context. Only accept a same-origin return path.
  let backUrl = "/";
  if (typeof sourceUrl === "string" && sourceUrl.startsWith("/")) {
    try {
      const source = new URL(sourceUrl, window.location.origin);
      if (
        source.origin === window.location.origin &&
        !source.pathname.startsWith("//")
      ) {
        backUrl = source.pathname + source.search + source.hash;
      }
    } catch {
      // Invalid shared-link context must not prevent opening the referral.
    }
  }
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.origin + getReferralDetailUrl(referralId),
      );
      toast.success(t("copied_to_clipboard"));
    } catch {
      toast.error(t("response_link_copy_failed"));
    }
  };
  const requests =
    data?.questionnaire_responses.filter(
      (response) => response.questionnaire_type === "request",
    ) ?? [];

  return (
    <Page
      title={(canShowCached && data?.title) || t("referral_details")}
      hideTitleOnPage
      className="careui"
    >
      <div className="mx-auto max-w-7xl space-y-4 px-3 py-4 md:px-4 md:py-5">
        <nav
          className="flex items-center justify-between gap-3"
          aria-label={t("referral_navigation")}
        >
          <Link
            href={backUrl}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </Link>
        </nav>
        {isLoading && (
          <div className="space-y-5" role="status" aria-label={t("loading")}>
            <Skeleton className="h-10 w-2/3 bg-cui-muted" />
            <Skeleton className="h-24 w-full bg-cui-muted" />
            <Skeleton className="h-80 w-full bg-cui-muted" />
          </div>
        )}
        {error && canShowCached && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-lg border border-cui-border bg-cui-muted p-4 text-sm"
          >
            <p>{t("referral_refresh_failed")}</p>
            <Button
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={() => refetch()}
            >
              {t("retry")}
            </Button>
          </div>
        )}
        {error && !canShowCached && (
          <Frame>
            <FramePanel>
              <Empty className="p-6 sm:p-10" role="alert">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    {isDenied ? <LockKeyhole /> : <AlertCircle />}
                  </EmptyMedia>
                  <EmptyTitle>
                    {t(
                      isDenied
                        ? "referral_detail_access_denied"
                        : isNotFound
                          ? "referral_not_found"
                          : "referral_load_failed",
                    )}
                  </EmptyTitle>
                  <EmptyDescription>
                    {t(
                      isDenied
                        ? "referral_detail_access_denied_description"
                        : isNotFound
                          ? "referral_not_found_description"
                          : "referral_load_failed_description",
                    )}
                  </EmptyDescription>
                </EmptyHeader>
                {!isDenied && !isNotFound && (
                  <EmptyContent>
                    <Button
                      variant="outline"
                      disabled={isFetching}
                      onClick={() => refetch()}
                    >
                      {t("retry")}
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            </FramePanel>
          </Frame>
        )}
        {data && canShowCached && (
          <>
            <ReferralPatientHeader referral={data}>
              <ReferralWorkflowActions
                referral={data}
                canWrite={canWrite}
                onCopyLink={copyLink}
              />
            </ReferralPatientHeader>
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
              <div className="min-w-0 space-y-5">
                <article className="overflow-hidden rounded-lg border border-cui-border bg-cui-background">
                  <header className="space-y-3 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs text-cui-muted-foreground">
                          {t("referral_letter")} ·{" "}
                          {data.id.slice(0, 8).toUpperCase()}
                        </p>
                        <h1 className="break-words text-xl font-semibold leading-7">
                          {data.title}
                        </h1>
                      </div>
                      <ReferralStatusBadge status={data.status} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <ReferralProgress referral={data} />
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-expanded={!requestHidden}
                        aria-controls={requestId}
                        onClick={() => setRequestHidden(!requestHidden)}
                      >
                        {requestHidden ? (
                          <ChevronDown aria-hidden="true" className="size-4" />
                        ) : (
                          <ChevronUp aria-hidden="true" className="size-4" />
                        )}
                        {t(
                          requestHidden
                            ? "referral_show_request"
                            : "referral_hide_request",
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-cui-muted-foreground">
                      {data.availability_name} ·{" "}
                      {formatDateTime(data.created_date)}
                    </p>
                  </header>
                  <section
                    aria-label={t("assigned_to")}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-cui-border px-4 py-3 sm:px-5"
                  >
                    <div className="min-w-0 space-y-1">
                      <h2 className="text-xs font-medium text-cui-muted-foreground">
                        {t("assigned_to")}
                      </h2>
                      {data.assignees.length ? (
                        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                          {data.assignees.map(({ member, role }) => (
                            <li key={member.id} className="min-w-0">
                              <span className="font-medium">
                                {formatName(member)}
                              </span>
                              {role.display && (
                                <span className="ml-1.5 text-cui-muted-foreground">
                                  · {role.display}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-cui-muted-foreground">
                          {t("unassigned")}
                        </p>
                      )}
                    </div>
                    {canWrite && <ReferralAssignmentDialog referral={data} />}
                  </section>
                  <ReferralAppointments referral={data} />
                  <div
                    id={requestId}
                    role="region"
                    aria-label={t("referral_response_request_tab")}
                    hidden={requestHidden}
                  >
                    {data.note && (
                      <section className="space-y-2 border-b border-cui-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold">
                          {t("referral_clinical_context")}
                        </h2>
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {data.note}
                        </p>
                      </section>
                    )}
                    <section
                      className="space-y-4 border-b border-cui-border p-4 sm:p-5"
                      aria-label={t("referral_requests")}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <SubsectionTitle>
                          {t("referral_requests")}
                        </SubsectionTitle>
                        {canWrite && (
                          <ReferralResponseDialog
                            referral={data}
                            trigger={
                              <Button variant="ghost" size="sm">
                                {t("referral_add_request_information")}
                              </Button>
                            }
                          />
                        )}
                      </div>
                      {requests.length ? (
                        requests.map((response) => (
                          <ReferralFormResponseCard
                            key={response.id}
                            response={response}
                            referralId={data.id}
                            canWrite={canWrite}
                            expanded
                          />
                        ))
                      ) : (
                        <Muted>{t("referral_no_form_responses")}</Muted>
                      )}
                    </section>
                    <section className="border-b border-cui-border p-4 sm:p-5">
                      <ReferralSharedRecords
                        referral={data}
                        canWrite={canWrite}
                        categories={REQUEST_RECORD_CATEGORIES}
                      />
                    </section>
                  </div>
                </article>
                <ReferralResponsesSection
                  referral={data}
                  canWrite={canWrite}
                  responseUrl={getReferralResponseUrl(data.id, sourceUrl, {
                    appointmentId: referralAppointmentId,
                    encounterId: referralEncounterId,
                    facilityId: referralFacilityId,
                  })}
                />
                <details className="group rounded-lg border border-cui-border bg-cui-background">
                  <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-medium focus-visible:outline-cui-ring [&::-webkit-details-marker]:hidden">
                    {t("referral_details")}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 text-cui-muted-foreground group-open:rotate-180"
                    />
                  </summary>
                  <div className="px-4 pb-4">
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                      {data.created_by && (
                        <div>
                          <dt className="text-cui-muted-foreground">
                            {t("created_by")}
                          </dt>
                          <dd className="mt-1 font-medium">
                            {formatName(data.created_by)}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-cui-muted-foreground">
                          {t("created_date")}
                        </dt>
                        <dd className="mt-1">
                          {formatDateTime(data.created_date)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-cui-muted-foreground">
                          {t("last_updated")}
                        </dt>
                        <dd className="mt-1">
                          {formatDateTime(data.modified_date)}
                          {data.updated_by && (
                            <p className="mt-1">
                              {formatName(data.updated_by)}
                            </p>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-cui-muted-foreground">
                          {t("referral_reference")}
                        </dt>
                        <dd className="mt-1 break-all font-mono text-xs text-cui-muted-foreground">
                          {data.id}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </details>
              </div>
              <aside
                aria-label={t("notes__discussion")}
                className="min-w-0 lg:sticky lg:top-4 lg:self-start"
              >
                <div id="referral-discussion">
                  <ReferralConversation referral={data} canWrite={canWrite} />
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
