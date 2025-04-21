import { useQuery } from "@tanstack/react-query";
import { Calendar, CalendarRange, Plus, Search } from "lucide-react";
import { Link, usePathParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import Loading from "@/components/Common/Loading";
import PDFViewer from "@/components/Common/PDFViewer";
import AddConsentSheet from "@/components/Consent/AddConsentSheet";
import { FileUploadModel } from "@/components/Patient/models";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import { ConsentModel } from "@/types/consent/consent";
import consentApi from "@/types/consent/consentApi";
import { Encounter } from "@/types/emr/encounter";

// Empty state component for when no consents are found
export const EmptyState = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-secondary/10 ">
        <CareIcon
          icon="l-file-exclamation-alt"
          className="text-3xl text-gray-500"
        />
      </div>
      <div className="max-w-[300px] space-y-1">
        <h3 className="font-medium">{t("no_consent_found")}</h3>
        <p className="text-sm text-gray-500 whitespace-nowrap break-words">
          {t("no_consent_description")}
        </p>
      </div>
    </div>
  );
};

// Component to preview the file based on its type
function PreviewFile({ file }: { file: FileUploadModel }) {
  if (!file.read_signed_url) {
    return null;
  }

  if (file.mime_type === "application/pdf") {
    return (
      <PDFViewer
        url={file.read_signed_url}
        pageNumber={1}
        onDocumentLoadSuccess={() => {}}
        scale={1}
        className="object-cover w-full h-full overflow-hidden!"
      />
    );
  }

  if (file.mime_type?.startsWith("image")) {
    return (
      <img
        src={file.read_signed_url}
        alt={file.name}
        className="object-cover w-full h-full"
      />
    );
  }

  return (
    <iframe
      src={file.read_signed_url}
      title={file.name}
      className="object-cover w-full h-full"
      sandbox="allow-same-origin"
    />
  );
}

function ConsentCard({
  consent,
  encounter,
}: {
  consent: ConsentModel;
  encounter: Encounter;
}) {
  const { t } = useTranslation();
  const { facilityId } = usePathParams("/facility/:facilityId/*") ?? {};
  const encounterId = consent.encounter;
  const consentId = consent.id;

  const primaryAttachment = consent.source_attachments[0];
  const totalAttachments = consent.source_attachments.length;

  const { data: consentFile } = useQuery({
    queryKey: ["file_upload", primaryAttachment?.id],
    queryFn: query(routes.retrieveUpload, {
      pathParams: { id: primaryAttachment?.id ?? "" },
    }),
    enabled: !!primaryAttachment?.id,
  });

  return (
    <Link
      href={`/facility/${facilityId}/patient/${encounter.patient.id}/encounter/${encounterId}/consents/${consentId}`}
      className="block h-full"
    >
      <Card className="overflow-hidden transition-all h-full flex flex-col hover:shadow-md cursor-pointer group">
        <CardContent className="p-0 group">
          <div className="relative aspect-video">
            {consentFile ? (
              <div className="h-full w-full object-cover">
                <div className="h-full w-full transition-opacity">
                  <PreviewFile file={consentFile} />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center p-2">
                    <span className="text-white font-medium flex items-center gap-1">
                      <CareIcon icon="l-eye" />
                      {t("view")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-100">
                <img
                  src="/images/placeholder.svg"
                  alt={consent.category}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-1 flex flex-col justify-evenly p-4 pt-5 gap-3">
          <div className="flex flex-col justify-between items-start w-full gap-2">
            <div className="flex justify-start items-center flex-wrap w-full gap-1.5">
              <div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <Badge
                    variant="secondary"
                    className="border border-gray-300 rounded-full"
                  >
                    <h3 className="font-semibold text-xs text-gray-900">
                      {t(`consent_category__${consent.category}`)}
                    </h3>
                  </Badge>
                </div>
              </div>
              <div className="flex items-center">
                {consent.decision === "permit" ? (
                  <Badge
                    className="flex gap-1 items-center py-1 rounded-full"
                    variant={"primary"}
                  >
                    {t("permitted")}
                  </Badge>
                ) : (
                  <Badge
                    variant="primary"
                    className="flex gap-1 items-center py-1 rounded-full bg-red-100 border-red-300 text-red-900"
                  >
                    {t("denied")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center">
                <Badge
                  variant={
                    consent.status === "active" ? "primary" : "secondary"
                  }
                  className="flex gap-1 items-center py-1 rounded-full"
                >
                  {t(`consent_status__${consent.status}`)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-start w-full flex-col gap-2">
            <div className="flex flex-wrap gap-1.5 items-center w-full">
              <div className="flex items-center gap-1.5 w-full">
                <CareIcon
                  icon="l-file-alt"
                  className="size-3.5 text-muted-foreground"
                />
                <div className="flex flex-wrap text-sm font-medium space-x-1">
                  <span className="break-words">
                    {primaryAttachment?.name || t("no_files_attached")}
                    {totalAttachments > 1 && ", "}
                  </span>
                  {totalAttachments > 1 && (
                    <span className="text-muted-foreground break-words">
                      +{t("more_files_count", { count: totalAttachments - 1 })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center gap-1.5 text-xs text-secondary-700">
              <Calendar className="size-3.5 text-muted-foreground" />
              <p className="font-medium">
                {formatDateTime(consent.date, "MMMM D, YYYY")}
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-secondary-700">
              <p>
                <CalendarRange className="size-3.5 text-muted-foreground" />
              </p>
              <p className="text-xs font-medium">
                <span>
                  {consent.period.start
                    ? formatDateTime(consent.period.start, "MMMM D, YYYY")
                    : t("NA")}
                </span>
                {" - "}
                <span>
                  {consent.period.end
                    ? formatDateTime(consent.period.end, "MMMM D, YYYY")
                    : t("NA")}
                </span>
              </p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

// Main tab component
export const EncounterConsentsTab = ({ encounter }: EncounterTabProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: existingConsents, isLoading } = useQuery({
    queryKey: ["consents", encounter.patient.id, encounter.id],
    queryFn: query(consentApi.list, {
      pathParams: { patientId: encounter.patient.id },
      queryParams: { encounter: encounter.id },
    }),
  });

  const consents = existingConsents?.results?.filter((consent) => {
    if (!searchQuery) return true;

    // Check if any attachment name matches the search query
    return consent.source_attachments.some((attachment) =>
      attachment?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            placeholder={t("search_existing_consent")}
            className="pl-10 focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {
          <AddConsentSheet
            patientId={encounter.patient.id}
            encounterId={encounter.id}
            trigger={
              <Button className="flex items-center gap-1">
                <Plus className="size-4" />
                {t("add_consent")}
              </Button>
            }
          />
        }
      </div>

      {consents && consents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {consents.map((consent) => (
            <ConsentCard
              key={consent.id}
              consent={consent}
              encounter={encounter}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};
