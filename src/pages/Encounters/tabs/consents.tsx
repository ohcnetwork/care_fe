import { useQuery } from "@tanstack/react-query";
import { isPast } from "date-fns";
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
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { buildEncounterUrl } from "@/pages/Encounters/utils/utils";
import { ConsentModel } from "@/types/consent/consent";
import consentApi from "@/types/consent/consentApi";

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
  patientId,
}: {
  consent: ConsentModel;
  patientId: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { facilityId } = usePathParams("/facility/:facilityId/*") ?? {};
  const encounterId = consent.encounter;
  const consentId = consent.id;

  const primaryAttachment = consent.source_attachments[0];
  const totalAttachments = consent.source_attachments.length;

  const renderDateTime = (date: Date | undefined | null) => {
    if (!date) return <span>{t("na")}</span>;
    return <>{formatDateTime(date, "DD MMM YYYY h:mm A")}</>;
  };

  return (
    <Card className="overflow-hidden transition-all h-full flex flex-col">
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="indigo"
          className="w-fit border-b rounded-b-md border-t-0 rounded-t-none py-1 ml-3 font-semibold text-xs"
        >
          {t(`consent_category__${consent.category}`).toUpperCase()}
        </Badge>
        {consent.period.end && isPast(consent.period.end) && (
          <Badge
            variant="danger"
            className="flex bg-red-500 my-1 border-none items-center font-semibold text-xs uppercase"
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
              <Badge variant="green">{t("permitted")}</Badge>
            ) : (
              <Badge variant="destructive">{t("denied")}</Badge>
            )}
            <Badge
              variant={consent.status === "active" ? "primary" : "secondary"}
            >
              {t(`consent_status__${consent.status}`)}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col justify-between w-full gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">
              {t("consent_given_on")}
            </span>
            <p className="font-medium text-xs w-full">
              {renderDateTime(consent.date)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">{t("valid_period")}</span>
            <p className="font-medium text-xs w-full">
              {renderDateTime(consent.period.start)}
              {" - "}
              {renderDateTime(consent.period.end)}
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
              buildEncounterUrl(
                patientId,
                `/encounter/${encounterId}/consents/${consentId}`,
                facilityId,
              ),
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
export const EncounterConsentsTab = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const {
    selectedEncounterId: encounterId,
    patientId,
    canWriteSelectedEncounter,
  } = useEncounter();

  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: CONSENTS_PER_PAGE,
  });

  const { data: existingConsents, isLoading } = useQuery({
    queryKey: ["consents", patientId, encounterId, qParams],
    queryFn: query(consentApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
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

        {canWriteSelectedEncounter && <ConsentFormSheet />}
      </div>

      {filteredConsents && filteredConsents.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredConsents.map((consent) => (
              <ConsentCard
                key={consent.id}
                consent={consent}
                patientId={patientId}
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
