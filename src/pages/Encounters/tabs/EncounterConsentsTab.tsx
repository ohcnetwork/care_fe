import { useQuery } from "@tanstack/react-query";
import { isPast } from "date-fns";
import { format } from "date-fns";
import { List, Search } from "lucide-react";
import { useNavigate, usePathParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import Loading from "@/components/Common/Loading";
import ConsentFormSheet from "@/components/Consent/ConsentFormSheet";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import { ConsentModel } from "@/types/consent/consent";
import consentApi from "@/types/consent/consentApi";
import { Encounter } from "@/types/emr/encounter";

const CONSENTS_PER_PAGE = 12;

export const EmptyState = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[12.5rem] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-secondary/10 ">
        <CareIcon
          icon="l-file-exclamation-alt"
          className="text-3xl text-gray-500"
        />
      </div>
      <div className="max-w-[300px] space-y-1">
        <h3 className="font-medium">{t("no_consent_found")}</h3>
        <p className="text-sm text-gray-500 whitespace-nowrap">
          {t("no_consent_description")}
        </p>
      </div>
    </div>
  );
};

function ConsentCard({
  consent,
  encounter,
}: {
  consent: ConsentModel;
  encounter: Encounter;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { facilityId } = usePathParams("/facility/:facilityId/*") ?? {};
  const encounterId = consent.encounter;
  const consentId = consent.id;

  const primaryAttachment = consent.source_attachments[0];
  const totalAttachments = consent.source_attachments.length;

  return (
    <Card className="overflow-hidden transition-all h-full flex flex-col">
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className="w-fit justify-center border-b border-gray-300 rounded-b-md rounded-t-none px-2.5 py-1 text-center ml-3 bg-indigo-100 text-indigo-900"
        >
          <h3 className="font-semibold text-xs text-gray-900 uppercase">
            {t(`consent_category__${consent.category}`)}
          </h3>
        </Badge>
        {consent.period.end && isPast(consent.period.end) && (
          <Badge
            variant="destructive"
            className="flex gap-1 items-center text-xs uppercase"
          >
            {t("expired")}
          </Badge>
        )}
      </div>

      <CardContent className="flex-1 flex flex-col justify-between p-4 gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5 items-center w-full mt-1">
            <div className="flex items-center gap-1.5 w-full">
              <div className="flex flex-wrap text-sm font-medium space-x-1">
                {totalAttachments > 0 ? (
                  <>
                    <span className="break-words">
                      {primaryAttachment?.name}
                      {totalAttachments > 1 && ", "}
                    </span>
                    {totalAttachments > 1 && (
                      <span className="break-words">
                        +
                        {t("more_files_count", { count: totalAttachments - 1 })}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500 italic">
                    {t("no_files_attached")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-start items-center flex-wrap w-full gap-1.5">
            {consent.decision === "permit" ? (
              <Badge
                className="flex gap-1 items-center text-xs"
                variant={"primary"}
              >
                {t("permitted")}
              </Badge>
            ) : (
              <Badge
                variant="destructive"
                className="flex gap-1 items-center text-xs"
              >
                {t("denied")}
              </Badge>
            )}
            <Badge
              variant={consent.status === "active" ? "primary" : "secondary"}
              className="flex gap-1 items-center text-xs"
            >
              {t(`consent_status__${consent.status}`)}
            </Badge>
          </div>
        </div>

        <div className="flex justify-between items-start w-full gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">
              {t("consent_given_on")}
            </span>
            <p className="font-medium text-xs">
              {formatDateTime(consent.date, "MMM D, YYYY")}
              <br />
              {format(consent.date, "h:mm a")}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">{t("valid_period")}</span>
            <p className="font-medium text-right text-xs">
              {consent.period.start ? (
                <>
                  <span>
                    {format(new Date(consent.period.start), "MMMM d, yyyy")}{" "}
                    {format(new Date(consent.period.start), "h:mm a")} {" - "}
                  </span>
                  <br />
                  <span>
                    {consent.period.end
                      ? `${format(new Date(consent.period.end), "MMMM d, yyyy")} ${format(
                          new Date(consent.period.end),
                          "h:mm a",
                        )}`
                      : t("na")}
                  </span>
                </>
              ) : (
                <span>{t("na")}</span>
              )}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-0 border-t">
        <Button
          variant="ghost"
          className="w-full justify-center items-center gap-2 rounded-t-none"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/patient/${encounter.patient.id}/encounter/${encounterId}/consents/${consentId}`,
            )
          }
        >
          <List className="size-4" />
          {t("see_details")}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Main tab component
export const EncounterConsentsTab = ({ encounter }: EncounterTabProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: CONSENTS_PER_PAGE,
  });

  const { data: existingConsents, isLoading } = useQuery({
    queryKey: ["consents", encounter.patient.id, encounter.id, qParams],
    queryFn: query(consentApi.list, {
      pathParams: { patientId: encounter.patient.id },
      queryParams: {
        encounter: encounter.id,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
      },
    }),
  });

  const filteredConsents = existingConsents?.results?.filter((consent) => {
    if (!searchQuery) return true;

    return consent.source_attachments.some((attachment) =>
      attachment?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    updateQuery({ page: 1 });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4" />
          <Input
            placeholder={t("search_existing_consent")}
            className="pl-10 focus-visible:ring-1"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        <ConsentFormSheet
          patientId={encounter.patient.id}
          encounterId={encounter.id}
        />
      </div>

      {filteredConsents && filteredConsents.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredConsents.map((consent) => (
              <ConsentCard
                key={consent.id}
                consent={consent}
                encounter={encounter}
              />
            ))}
          </div>

          <Pagination totalCount={existingConsents?.count || 0} />
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};
