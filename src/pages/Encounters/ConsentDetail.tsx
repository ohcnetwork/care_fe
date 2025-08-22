import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  Download,
  FileText,
} from "lucide-react";
import { Link } from "raviger";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import ConsentFormSheet from "@/components/Consent/ConsentFormSheet";
import FileUploadDialog from "@/components/Files/FileUploadDialog";

import useFileManager from "@/hooks/useFileManager";
import useFileUpload from "@/hooks/useFileUpload";

import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import consentApi from "@/types/consent/consentApi";

import { useEncounter } from "./utils/EncounterProvider";

interface ConsentDetailPageProps {
  consentId: string;
}

export function ConsentDetailPage({ consentId }: ConsentDetailPageProps) {
  const { t } = useTranslation();

  const {
    selectedEncounterId: encounterId,
    canWriteSelectedEncounter: canWrite,
    patientId,
    facilityId,
  } = useEncounter();

  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: consent, isLoading: isLoadingConsent } = useQuery({
    queryKey: ["consent", consentId],
    queryFn: query(consentApi.retrieve, {
      pathParams: { patientId, id: consentId },
    }),
    enabled: !!consentId && !!patientId,
  });

  const fileUpload = useFileUpload({
    type: "consent",
    category: "consent_attachment",
    multiple: false,
    allowedExtensions: ["jpg", "jpeg", "png", "pdf"],
    allowNameFallback: false,
    compress: false,
    onUpload: () => {
      queryClient.invalidateQueries({
        queryKey: ["consent", consentId],
      });
      setOpenUploadDialog(false);
    },
  });

  const fileManager = useFileManager({
    type: "consent",
    uploadedFiles: consent?.source_attachments || [],
    onArchive: () => {},
    onEdit: () => {},
  });

  const isLoading = isLoadingConsent;

  useEffect(() => {
    if (fileUpload.files.length > 0 && !fileUpload.previewing) {
      setOpenUploadDialog(true);
    } else {
      setOpenUploadDialog(false);
    }
  }, [fileUpload.files, fileUpload.previewing]);

  useEffect(() => {
    if (!openUploadDialog) {
      fileUpload.clearFiles();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [openUploadDialog]);

  if (isLoading) {
    return <Loading />;
  }

  if (!consent) {
    return (
      <Page title="">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <FileText className="size-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {t("consent_not_found")}
          </h2>
          <p className="text-gray-500 mb-4">
            {t("consent_not_found_description")}
          </p>
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/consents`}
            className="hover:underline flex items-center gap-2"
          >
            <ChevronLeft className="size-4" />
            {t("back")}
          </Link>
        </div>
      </Page>
    );
  }

  const associatingId = consent.id;

  const handleUploadDialogClose = (open: boolean) => {
    setOpenUploadDialog(open);
    if (!open) {
      fileUpload.clearFiles();
    }
  };

  return (
    <div>
      <Link
        href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/consents`}
        className="flex items-center hover:underline md:px-6"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
      <Page title="">
        <div className="container mx-auto py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 order-last lg:order-first">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {t("supporting_documents")}
                  </h3>
                  {canWrite && (
                    <Button
                      variant="outline"
                      className="flex flex-row items-center"
                      data-cy="add-files-button"
                      asChild
                    >
                      <Label className="flex flex-row items-center cursor-pointer w-fit">
                        <CareIcon icon="l-file-upload" className="mr-1" />
                        <span>{t("add_files")}</span>
                        {fileUpload.Input({
                          className: "hidden",
                          ref: fileInputRef,
                        })}
                      </Label>
                    </Button>
                  )}
                </div>

                <Card className="p-5 shadow-none">
                  {consent.source_attachments.length > 0 ? (
                    <div>
                      <div className="divide-y">
                        {consent.source_attachments.map((attachment, index) => (
                          <div
                            key={attachment.id}
                            className="py-2 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium break-all">
                                  {attachment.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDateTime(attachment.created_date)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex justify-end">
                                {fileManager.isPreviewable(attachment) && (
                                  <Button
                                    variant="ghost"
                                    className="cursor-pointer"
                                    onClick={() =>
                                      fileManager.viewFile(
                                        attachment,
                                        associatingId,
                                      )
                                    }
                                  >
                                    <span className="flex flex-row items-center gap-1 text-sm text-gray-600">
                                      <CareIcon icon="l-eye" />
                                      <span className="hidden sm:inline">
                                        {t("view")}
                                      </span>
                                    </span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  className="cursor-pointer ml-2"
                                  onClick={() =>
                                    fileManager.downloadFile(
                                      attachment,
                                      associatingId,
                                    )
                                  }
                                >
                                  <span className="flex flex-row items-center gap-1 text-sm text-gray-600">
                                    <Download className="size-4 mr-1" />
                                    <span className="hidden sm:inline">
                                      {t("download")}
                                    </span>
                                  </span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="rounded-full bg-gray-100 p-3 mb-4">
                        <FileText className="size-6 text-gray-400" />
                      </div>
                      <h4 className="text-base font-medium mb-2">
                        {t("no_files_attached")}
                      </h4>
                      <p className="text-sm text-gray-500 mb-4 max-w-md">
                        {t("attach_files_to_consent_description")}
                      </p>
                    </div>
                  )}
                </Card>
              </div>
              {consent?.note && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">{t("note")}</h3>
                  <Alert className="bg-blue-50 border-blue-200 text-blue-500">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="whitespace-pre-wrap font-medium text-base">
                      {consent.note}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>

            <div className="order-first lg:order-last">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {t("consent_details")}
                </h2>
                <ConsentFormSheet existingConsent={consent} />
              </div>
              <Card className="p-5 shadow-none">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      {t("category")}
                    </h3>
                    <p className="text-base font-semibold text-gray-700">
                      {t(`consent_category__${consent.category}`)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      {t("consent_given_on")}
                    </h3>
                    <p className="text-base font-semibold text-gray-700">
                      {formatDateTime(consent.date, "MMMM D, YYYY")}
                      {" , "}
                      {format(consent.date, "h:mm a")}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      {t("valid_period")}
                    </h3>
                    <p className="text-base font-semibold text-gray-700">
                      {consent.period.start
                        ? `${format(new Date(consent.period.start), "MMMM d, yyyy")}${" , "} ${format(new Date(consent.period.start), "h:mm a")}`
                        : t("na")}
                      {" - "}
                      {consent.period.end
                        ? `${format(new Date(consent.period.end), "MMMM d, yyyy")}${" , "} ${format(new Date(consent.period.end), "h:mm a")}`
                        : t("na")}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      {t("decision")}
                    </h3>
                    <p className="text-base font-semibold text-gray-700">
                      {consent.decision === "permit"
                        ? t("permitted")
                        : t("denied")}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      {t("status")}
                    </h3>
                    <p className="text-base font-semibold text-gray-700">
                      {t(`consent_status__${consent.status}`)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Page>
      {fileManager.Dialogues}
      {fileUpload.Dialogues}
      <FileUploadDialog
        open={openUploadDialog}
        onOpenChange={handleUploadDialogClose}
        fileUpload={fileUpload}
        associatingId={associatingId}
        type="consent"
      />
    </div>
  );
}
