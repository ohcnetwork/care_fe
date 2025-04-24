import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  Download,
  Edit,
  FileText,
  PlusCircle,
  Upload,
} from "lucide-react";
import { Link, usePathParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import AddConsentSheet from "@/components/Consent/AddConsentSheet";
import FileUploadDialog from "@/components/Files/FileUploadDialog";
import { FileUploadModel } from "@/components/Patient/models";

import useFileManager from "@/hooks/useFileManager";
import useFileUpload from "@/hooks/useFileUpload";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import consentApi from "@/types/consent/consentApi";

export function ConsentDetailPage() {
  const { t } = useTranslation();
  const { facilityId, patientId, encounterId, consentId } =
    usePathParams(
      "/facility/:facilityId/patient/:patientId/encounter/:encounterId/consents/:consentId",
    ) ?? {};

  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const queryClient = useQueryClient();

  // Load consent data
  const { data: consent, isLoading: isLoadingConsent } = useQuery({
    queryKey: ["consent", consentId],
    queryFn: query(consentApi.retrieve, {
      pathParams: { patientId: patientId!, id: consentId! },
    }),
    enabled: !!consentId && !!patientId,
  });

  // Load encounter data for permissions
  const { isLoading: isLoadingEncounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(routes.encounter.get, {
      pathParams: { id: encounterId! },
      queryParams: { patient: patientId! },
    }),
    enabled: !!encounterId && !!patientId,
  });

  // Load file data for the primary attachment
  const attachmentId = consent?.source_attachments[0]?.id;
  const { data: fileData, isLoading: isLoadingFile } = useQuery({
    queryKey: ["file_upload", attachmentId],
    queryFn: query(routes.retrieveUpload, {
      pathParams: { id: attachmentId! },
    }),
    enabled: !!attachmentId,
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
    uploadedFiles:
      consent?.source_attachments.map((attachment) => {
        if (fileData && fileData.id === attachment.id) {
          return fileData;
        }
        return attachment;
      }) || [],
    onArchive: () => {},
    onEdit: () => {},
  });

  const isLoading = isLoadingConsent || isLoadingFile || isLoadingEncounter;

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

  const DetailButtons = ({ file }: { file: FileUploadModel }) => {
    return (
      <div className="flex flex-row gap-2 justify-end">
        {fileManager.isPreviewable(file) && (
          <Button
            variant="secondary"
            className="cursor-pointer"
            onClick={() => fileManager.viewFile(file, associatingId)}
          >
            <span className="flex flex-row items-center gap-1">
              <CareIcon icon="l-eye" />
              <span className="hidden sm:inline">{t("view")}</span>
            </span>
          </Button>
        )}
        <Button
          variant="secondary"
          className="cursor-pointer"
          onClick={() => fileManager.downloadFile(file, associatingId)}
        >
          <span className="flex flex-row items-center gap-1">
            <Download className="size-4 mr-1" />
            <span className="hidden sm:inline">{t("download")}</span>
          </span>
        </Button>
      </div>
    );
  };

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
        <div className="mb-4 flex justify-end">
          <AddConsentSheet
            patientId={patientId!}
            encounterId={encounterId!}
            existingConsent={consent}
            trigger={
              <Button variant="outline" className="gap-2">
                <Edit className="size-4" />
                {t("edit")}
              </Button>
            }
          />
        </div>
        <div className="container mx-auto py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {t("consent_details")}
              </h2>
              <Card className="p-5">
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
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      {t("valid_period")}
                    </h3>
                    <p className="text-base font-semibold text-gray-700">
                      {consent.period.start
                        ? formatDateTime(consent.period.start, "MMMM D, YYYY")
                        : t("NA")}
                      {" - "}
                      {consent.period.end
                        ? formatDateTime(consent.period.end, "MMMM D, YYYY")
                        : t("NA")}
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

            <div className="lg:col-span-2">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {t("supporting_documents")}
                  </h3>
                  <div className="flex rounded-md border border-gray-200">
                    <Label
                      htmlFor="file_upload_consent"
                      className="cursor-pointer flex items-center px-4 py-2 rounded-l-md hover:bg-gray-50 transition-colors"
                    >
                      <PlusCircle className="size-4 mr-2" />
                      {t("select")} {t("files")}
                      {fileUpload.Input({ className: "hidden" })}
                    </Label>
                    <div className="border-l border-gray-200" />
                    <Button
                      variant="ghost"
                      className="gap-2 rounded-r-md rounded-l-none px-4 py-2 text-primary hover:bg-gray-50 transition-colors"
                      onClick={() => setOpenUploadDialog(true)}
                      disabled={fileUpload.files.length === 0}
                    >
                      <Upload className="size-4" />
                      {t("upload")}
                      {fileUpload.files.length > 0 &&
                        ` (${fileUpload.files.length})`}
                    </Button>
                  </div>
                </div>

                {fileUpload.files.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-base font-medium mb-2">
                      {t("selected_files")}
                    </h4>
                    <Card className="p-4">
                      <div className="space-y-2">
                        {fileUpload.files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-2"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <CareIcon
                                icon="l-paperclip"
                                className="shrink-0"
                              />
                              <span
                                className="truncate max-w-[200px]"
                                title={file.name}
                              >
                                {file.name}
                              </span>
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => fileUpload.removeFile(index)}
                            >
                              <CareIcon icon="l-times" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                <Card className="p-5">
                  {consent.source_attachments.length > 0 ? (
                    <div>
                      <div className="divide-y">
                        {consent.source_attachments.map((attachment, index) => {
                          const isActive =
                            fileData && fileData.id === attachment.id;
                          return (
                            <div
                              key={attachment.id}
                              className={cn(
                                "py-2 flex items-center justify-between",
                                isActive && "bg-primary-50",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium",
                                  )}
                                >
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
                                {fileData && (
                                  <div className="mt-4 flex justify-end">
                                    {fileData && (
                                      <DetailButtons file={fileData} />
                                    )}
                                    {fileManager.Dialogues}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
                <div className="mt-4">
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
