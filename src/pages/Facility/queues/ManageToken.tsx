import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clipboard,
  MoreVertical,
  Printer,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Page from "@/components/Common/Page";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import { TokenCard } from "@/pages/Facility/queues/TokenCard";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { renderTokenNumber, TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";
import { formatPatientAge } from "@/Utils/utils";

interface ManageTokenProps {
  facilityId: string;
  queueId: string;
  tokenId: string;
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Patient Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusText(status: TokenStatus, t: (key: string) => string) {
  switch (status) {
    case TokenStatus.CREATED:
      return t("created");
    case TokenStatus.IN_PROGRESS:
      return t("in_service");
    case TokenStatus.FULFILLED:
      return t("fulfilled");
    default:
      return status;
  }
}

export default function ManageToken({
  facilityId,
  queueId,
  tokenId,
}: ManageTokenProps) {
  const { t } = useTranslation();
  const { facility, isFacilityLoading } = useCurrentFacility();

  useShortcutSubContext();

  const {
    data: token,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["token", facilityId, queueId, tokenId],
    queryFn: query(tokenApi.get, {
      pathParams: {
        facility_id: facilityId,
        queue_id: queueId,
        id: tokenId,
      },
    }),
  });

  if (isLoading || isFacilityLoading) {
    return (
      <Page title={t("loading")} hideTitleOnPage={true}>
        <LoadingSkeleton />
      </Page>
    );
  }

  if (isError || !token) {
    return (
      <Page title={t("error")}>
        <div className="container mx-auto max-w-3xl py-8">
          <Alert variant="destructive">
            <CareIcon icon="l-exclamation-triangle" className="size-4" />
            <AlertTitle>{t("error_loading_token")}</AlertTitle>
            <AlertDescription>{t("token_not_found")}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.history.back()}
          >
            <CareIcon icon="l-arrow-left" className="mr-2 size-4" />
            {t("go_back")}
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page title={`Token: ${renderTokenNumber(token)}`} hideTitleOnPage={true}>
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("back_to_queues")}
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="primary" disabled>
              {t("mark_as_complete")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>{t("cancel_token")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => print()}>
                  {t("print_token")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Patient Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold underline">
                  {token.patient
                    ? token.patient.name
                    : renderTokenNumber(token)}
                </h1>
              </div>
              {token.patient && (
                <p className="text-muted-foreground">
                  {`${formatPatientAge(token.patient, true)}, ${t(`GENDER__${token.patient.gender}`)}`}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-3xl font-bold">
                {renderTokenNumber(token)}
              </div>
              <Badge
                variant={
                  token.status === TokenStatus.IN_PROGRESS
                    ? "green"
                    : "secondary"
                }
              >
                {getStatusText(token.status, t)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 grid-cols gap-4 ">
          <div id="section-to-print" className="print:w-[400px] print:pt-4">
            <TokenCard token={token} facility={facility!} />
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-1 grid-cols-2 grid-row-1 gap-4 items-center justify-center">
            {token.patient && (
              <Button
                data-shortcut-id="patient-home"
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 relative"
                asChild
              >
                <Link
                  href={`/facility/${facilityId}/patients/verify?${new URLSearchParams(
                    {
                      phone_number: token.patient.phone_number,
                      year_of_birth: token.patient.year_of_birth.toString(),
                      partial_id: token.patient.id.slice(0, 5),
                    },
                  ).toString()}`}
                >
                  <ShortcutBadge actionId="patient-home" />
                  <Clipboard className="size-6" />
                  <span className="text-sm">{t("patient_home")}</span>
                </Link>
              </Button>
            )}
            <Button
              data-shortcut-id="print-token"
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 relative"
              onClick={() => print()}
            >
              <ShortcutBadge actionId="print-token" />
              <Printer className="size-6" />
              <span className="text-sm">{t("print_token")}</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Schedule Information */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {t("session")} - {token.category.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {token.note && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm">{token.note}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
