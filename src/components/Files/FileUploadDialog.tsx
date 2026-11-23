import { Spinner } from "@/components/ui/spinner";
import { FileUp, Paperclip, Trash2, X } from "lucide-react";
import { ReactNode, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

import { FileUploadReturn } from "@/hooks/useFileUpload";

interface FileUploadCompletion {
  pending: boolean;
  message: string;
  error?: string;
  onRetry: () => void;
  retryLabel: string;
}

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUpload: FileUploadReturn;
  associatingId: string;
  type:
    | "patient"
    | "consent"
    | "encounter"
    | "diagnostic_report"
    | "service_request"
    | "referral";
  description?: string;
  children?: ReactNode;
  uploadLabel?: string;
  /** A completed upload can require a separate save/link operation. Retrying
   * this action must never upload the selected file again. */
  completion?: FileUploadCompletion;
  instanceId?: string;
}

export default function FileUploadDialog({
  open,
  onOpenChange,
  fileUpload,
  associatingId,
  type,
  description,
  children,
  uploadLabel,
  completion,
  instanceId,
}: FileUploadDialogProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const combineId = useId();
  const descriptionId = useId();
  const [isPdf, setIsPdf] = useState(false);
  const idPrefix = instanceId ? `${instanceId}-` : "";
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);
  const pending = fileUpload.uploading || completion?.pending === true;
  const hasFiles = fileUpload.files.length > 0;

  const handleDialogClose = (nextOpen: boolean) => {
    if (!nextOpen && pending) return;
    if (!nextOpen) setIsPdf(false);
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    const urls = fileUpload.files.map((file) =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    );
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [fileUpload.files]);

  const fileNameField = (index: number) => (
    <Field>
      <FieldLabel htmlFor={`${idPrefix}upload-file-name-${index}`}>
        {t("file_name")}
      </FieldLabel>
      <Input
        name={`file_name_${index}`}
        id={`${idPrefix}upload-file-name-${index}`}
        required
        value={fileUpload.fileNames[index] || ""}
        disabled={pending}
        onChange={(event) => {
          fileUpload.setFileName(event.target.value, index);
          fileUpload.setError(null);
        }}
        placeholder={t("enter_file_name")}
      />
    </Field>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent
        className="flex max-h-[90dvh] flex-col gap-5 overflow-hidden bg-background text-foreground sm:max-w-lg"
        aria-describedby={description ? descriptionId : undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {fileUpload.files.length > 1 ? t("upload_files") : t("upload_file")}
          </DialogTitle>
          {description && (
            <DialogDescription id={descriptionId}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="min-h-0 space-y-5 overflow-y-auto px-1">
          {children}
          {completion ? (
            <div className="space-y-3 rounded-md border border-border p-4">
              <p role="status" className="flex items-start gap-2 text-sm">
                {completion.pending && (
                  <Spinner className="mt-0.5 size-4 shrink-0 animate-spin" />
                )}
                {completion.message}
              </p>
              {completion.error && (
                <FieldError role="alert">{completion.error}</FieldError>
              )}
            </div>
          ) : !hasFiles ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border px-6 py-8">
              <FileUp className="size-6 text-muted-foreground" />
              <fileUpload.Input
                ref={inputRef}
                disabled={pending}
                aria-label={t("choose_file")}
              />
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={pending}
              >
                {t("choose_file")}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {fileUpload.files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="space-y-3 rounded-md border border-border p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {!isPdf && previewUrls[index] ? (
                        <img
                          src={previewUrls[index]}
                          alt={t("file_upload_preview_named", {
                            name: file.name,
                          })}
                          className="size-16 shrink-0 rounded-md border border-border object-contain"
                        />
                      ) : (
                        <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="min-w-0 flex-1 break-words text-sm">
                        {file.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("file_upload_remove_named", {
                          name: file.name,
                        })}
                        onClick={() => {
                          fileUpload.removeFile(index);
                          if (fileUpload.files.length <= 2) setIsPdf(false);
                        }}
                        disabled={pending}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    {!isPdf && fileNameField(index)}
                  </div>
                ))}
              </div>
              {isPdf && fileNameField(0)}
              {fileUpload.files.length > 1 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${combineId}-${type}`}
                    checked={isPdf}
                    onCheckedChange={(checked) => setIsPdf(checked === true)}
                    disabled={pending}
                  />
                  <Label
                    htmlFor={`${combineId}-${type}`}
                    className="cursor-pointer"
                  >
                    {t("combine_files_pdf")}
                  </Label>
                </div>
              )}
            </>
          )}
          {fileUpload.error && (
            <FieldError role="alert">{fileUpload.error}</FieldError>
          )}
          {fileUpload.uploading && !completion && (
            <div className="space-y-2">
              <p role="status" className="flex items-center gap-2 text-sm">
                <Spinner className="size-4 animate-spin" />
                {t("file_upload_progress", {
                  progress: fileUpload.progress ?? 0,
                })}
              </p>
              <Progress
                value={fileUpload.progress ?? 0}
                aria-label={t("uploading")}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (!completion) fileUpload.clearFiles();
              handleDialogClose(false);
            }}
            disabled={pending}
          >
            {!completion && hasFiles && <Trash2 className="size-4" />}
            {!completion && hasFiles ? t("discard") : t("close")}
          </Button>
          <Button
            onClick={() => {
              if (completion) completion.onRetry();
              else void fileUpload.handleFileUpload(associatingId, isPdf);
            }}
            disabled={pending || (!completion && !hasFiles)}
            id={`${idPrefix}upload_file_button`}
          >
            {pending && <Spinner className="size-4 animate-spin" />}
            {completion ? completion.retryLabel : (uploadLabel ?? t("upload"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
