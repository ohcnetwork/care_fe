import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

import { FileUploadReturn } from "@/hooks/useFileUpload";

export default function FileUploadDialog({
  open,
  onOpenChange,
  fileUpload,
  associatingId,
  type,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUpload: FileUploadReturn;
  associatingId: string;
  type: "patient" | "consent" | "encounter";
}) {
  const { t } = useTranslation();
  const [isPdf, setIsPdf] = useState(false);

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsPdf(false);
    }
    onOpenChange(open);
  };

  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);

  useEffect(() => {
    const urls = fileUpload.files.map((file) =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    );
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [fileUpload.files]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogClose}
      aria-labelledby="file-upload-dialog"
    >
      <DialogContent
        className="mb-8 rounded-lg p-5 max-w-fit md:max-w-[30rem] shadow-lg hover:shadow-xl transition-shadow duration-200"
        aria-describedby="file-upload"
      >
        <DialogHeader>
          <DialogTitle>
            {fileUpload.files.length > 1 ? t("upload_files") : t("upload_file")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pr-5 max-h-[70vh] overflow-y-auto">
          {isPdf ? (
            <>
              {fileUpload.files.map((file, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between gap-2 rounded-md bg-secondary-300 px-4 py-2">
                    <span
                      className="flex items-center text-sm truncate"
                      title={file.name}
                    >
                      <CareIcon icon="l-paperclip" className="mr-2 shrink-0" />
                      <span className="truncate hidden md:block">
                        {file.name.length > 25
                          ? `${file.name.substring(0, 25)}...`
                          : file.name}
                      </span>

                      <span className="truncate block md:hidden">
                        {file.name.length > 6
                          ? `${file.name.substring(0, 6)}...`
                          : file.name}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileUpload.removeFile(index)}
                      disabled={fileUpload.uploading}
                    >
                      <CareIcon icon="l-times" />
                    </Button>
                  </div>
                </div>
              ))}
              <div>
                <Label
                  htmlFor="upload-file-name-0"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("enter_file_name")}
                </Label>
                <Input
                  name="file_name_0"
                  data-cy="upload-file-name"
                  type="text"
                  id="upload-file-name-0"
                  required
                  value={fileUpload.fileNames[0] || ""}
                  disabled={fileUpload.uploading}
                  onChange={(e) => {
                    fileUpload.setFileName(e.target.value);
                    fileUpload.setError(null);
                  }}
                  className="ml-0.5 mb-1"
                />
                {fileUpload.error && (
                  <p className="mt-2 text-sm text-red-600">
                    {fileUpload.error}
                  </p>
                )}
              </div>
            </>
          ) : (
            fileUpload.files.map((file, index) => (
              <div
                key={index}
                className="rounded-lg p-4 shadow-md border-2 border-primary-500 relative"
              >
                <div className="flex gap-4 items-start w-full">
                  {file.type.startsWith("image/") && previewUrls[index] && (
                    <div className="flex items-center justify-center mt-2 md:mt-0 rounded-lg border border-gray-300 shadow-md overflow-hidden">
                      <img
                        src={previewUrls[index]}
                        alt="Preview"
                        className="w-20 h-15 md:w-22 md:h-24 object-fit"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center justify-between gap-2 rounded-md bg-secondary-200 md:p-2 border border-gray-200">
                      <span
                        className="flex items-center text-sm truncate"
                        title={file.name}
                      >
                        <CareIcon
                          icon="l-paperclip"
                          className="pl-2 pr-2 shrink-0"
                        />
                        <span className="truncate hidden md:block">
                          {file.name.length > 25
                            ? `${file.name.substring(0, 25)}...`
                            : file.name}
                        </span>

                        <span className="truncate block md:hidden">
                          {file.name.length > 6
                            ? `${file.name.substring(0, 6)}...`
                            : file.name}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileUpload.removeFile(index)}
                        disabled={fileUpload.uploading}
                      >
                        <CareIcon icon="l-times" />
                      </Button>
                    </div>

                    <div className="rounded-lg">
                      <Input
                        name={`file_name_${index}`}
                        type="text"
                        id={`upload-file-name-${index}`}
                        data-cy={`upload-file-name-${index}`}
                        required
                        value={fileUpload.fileNames[index] || ""}
                        disabled={fileUpload.uploading}
                        onChange={(e) => {
                          fileUpload.setFileName(e.target.value, index);
                          fileUpload.setError(null);
                        }}
                        placeholder={t("enter_file_name")}
                        className="border border-gray-300 focus:border-gray-400 rounded-md px-3 py-2 w-full text-sm"
                      />
                      {fileUpload.error && (
                        <p className="mt-2 text-sm text-red-600">
                          {fileUpload.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {fileUpload.files.length > 1 && (
          <div className="flex items-center gap-2 mt-4">
            <Checkbox
              id={`file_upload_${type}`}
              checked={isPdf}
              onCheckedChange={(checked: boolean) => setIsPdf(checked)}
              disabled={fileUpload.uploading}
              className="cursor-pointer"
            />
            <Label htmlFor={`file_upload_${type}`} className="cursor-pointer">
              {t("combine_files_pdf")}
            </Label>
          </div>
        )}

        <div className="flex justify-end gap-2 mr-4">
          <Button
            variant="destructive"
            onClick={fileUpload.clearFiles}
            disabled={fileUpload.uploading}
          >
            <CareIcon icon="l-trash-alt" className="mr-1" />
            {t("discard")}
          </Button>
          <Button
            variant="outline_primary"
            onClick={() => fileUpload.handleFileUpload(associatingId, isPdf)}
            disabled={fileUpload.uploading}
            id="upload_file_button"
            data-cy="upload-files-button"
          >
            <CareIcon icon="l-check" className="mr-1" />
            {t("upload")}
          </Button>
        </div>
        {!!fileUpload.progress && (
          <Progress value={fileUpload.progress} className="mt-4" />
        )}
      </DialogContent>
    </Dialog>
  );
}
