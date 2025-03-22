import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CalendarRange,
  CheckCircle,
  Download,
  Loader2,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import PDFViewer from "@/components/Common/PDFViewer";
import { FileUploadModel } from "@/components/Patient/models";

import useFileManager from "@/hooks/useFileManager";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import { ConsentModel } from "@/types/consent/consent";
import consentApi from "@/types/consent/consentApi";

import LinkConsentDialog from "./LinkConsentDialog";

type ConsentSheetProps = {
  trigger: React.ReactNode;
  patientId: string;
  encounterId: string;
};

export function ConsentSheet({
  trigger,
  patientId,
  encounterId,
}: ConsentSheetProps) {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");

  const { data: existingConsents } = useQuery({
    queryKey: ["consents", patientId, encounterId],
    queryFn: query(consentApi.list, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId },
    }),
  });

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg pr-2 pl-3">
        <SheetHeader className="space-y-1 px-1">
          <SheetTitle className="text-xl font-semibold">
            {t("consents")}
          </SheetTitle>
          <p className="text-sm text-gray-500">
            {t("manage_consents_description")}
          </p>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div className="container">
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t("search_existing_consent")}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <LinkConsentDialog
                patientId={patientId}
                encounterId={encounterId}
                trigger={
                  <Button className="flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    {t("link_consent")}
                  </Button>
                }
              />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
              {existingConsents?.results
                ?.filter((consent) =>
                  consent.source_attachments[0]?.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
                ) // TODO: move this to the backend in the next iteration
                .map((consent) => (
                  <ConsentCard key={consent.id} consent={consent} />
                ))}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

type ConsentCardProps = {
  consent: ConsentModel;
};

function ConsentCard({ consent }: ConsentCardProps) {
  const { t } = useTranslation();

  const [loadPreview, setLoadPreview] = useState(false);

  const attachment = consent.source_attachments[0];
  const attachmentId = attachment?.id;
  const { data: consentFile, isPending } = useQuery({
    queryKey: ["file_upload", attachmentId],
    queryFn: query(routes.retrieveUpload, {
      pathParams: { id: attachmentId! },
    }),
    enabled: loadPreview && !!attachmentId,
  });

  const fileManager = useFileManager({
    type: "consent",
    uploadedFiles: consentFile ? [consentFile] : [attachment],
  });

  return (
    <div className="relative">
      <Card className="overflow-hidden transition-all h-full flex flex-col">
        <CardContent className="p-0 group max-sm:hidden">
          <div className="relative aspect-video">
            <div className="absolute top-1/2 left-1/2 -translate-x-3 -translate-y-3">
              {!consentFile && attachmentId && loadPreview === false && (
                <Download
                  onClick={() => setLoadPreview(true)}
                  className="text-secondary-800 hidden group-hover:block cursor-pointer animate-bounce"
                />
              )}
              {!consentFile && loadPreview === true && isPending && (
                <Loader2 className="text-secondary-800 cursor-pointer animate-spin" />
              )}
            </div>
            {consentFile ? (
              <div className="h-full w-full object-cover">
                <div className="h-full w-full opacity-30 hover:opacity-100 transition-opacity">
                  <PreviewFile file={consentFile} />
                </div>
                {fileManager.isPreviewable(consentFile) && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 z-20"
                    onClick={() =>
                      fileManager.viewFile(
                        consentFile,
                        consentFile.associating_id!,
                      )
                    }
                  >
                    <CareIcon icon="l-eye" />
                  </Button>
                )}
              </div>
            ) : (
              <img
                src="/images/placeholder.svg"
                alt={consent.category}
                className="object-cover w-full h-full"
              />
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-1 flex flex-col justify-evenly p-4 pt-5 gap-3">
          <div className="flex flex-col justify-between items-start w-full gap-2">
            <div className="flex justify-between items-start w-full">
              <div>
                <h3 className="text-base font-medium">{attachment?.name}</h3>
              </div>
              <div className="flex items-center">
                {consent.decision === "permit" ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex gap-1 items-center">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {t("approved")}
                  </Badge>
                ) : (
                  <Badge
                    variant="destructive"
                    className="flex gap-1 items-center"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {t("denied")}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="size-3.5 text-muted-foreground" />
              <p className="font-medium">
                {formatDateTime(consent.date, "MMMM D, YYYY")}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-start w-full flex-col gap-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              <Badge variant="outline">
                {t(`consent_category__${consent.category}`)}
              </Badge>
              <Badge
                variant={consent.status === "active" ? "primary" : "secondary"}
                className="font-normal"
              >
                {t(`consent_status__${consent.status}`)}
              </Badge>
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

            <Button
              className="w-full sm:hidden"
              variant="outline"
              size="sm"
              onClick={() => {
                fileManager.viewFile(attachment, attachment.associating_id!);
              }}
            >
              {loadPreview && <Loader2 className="mr-2 animate-spin" />}
              {t("view")}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {fileManager.Dialogues}
    </div>
  );
}

type PreviewFileProps = {
  file: FileUploadModel;
};

function PreviewFile({ file }: PreviewFileProps) {
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
        className="object-cover w-full h-full !overflow-hidden"
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
