import { t } from "i18next";
import { useEffect, useState } from "react";

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
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsPdf(false);
    }
    onOpenChange(open);
  };
  const [isPdf, setIsPdf] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = fileUpload.files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [fileUpload.files]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogClose}
      aria-labelledby="file-upload-dialog"
    >
      <DialogContent
        className="mb-8 rounded-lg p-5 max-w-fit md:max-w-[30rem]"
        aria-describedby="file-upload"
      >
        <DialogHeader>
          <DialogTitle>
            {fileUpload.files.length > 1 ? t("upload_files") : t("upload_file")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pr-5 max-h-[70vh] overflow-y-auto">
          {fileUpload.files.map((file, index) => (
            <div key={index} className="space-y-2">
              {file.type.startsWith("image/") && previewUrls[index] ? (
                <div className="flex flex-col items-center space-y-2 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div className="w-full max-w-md overflow-hidden rounded-lg">
                    <img
                      src={previewUrls[index]}
                      alt="Preview"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between w-full gap-2 rounded-md bg-secondary-300 px-4 py-2">
                    <span
                      className="flex items-center truncate"
                      title={file.name}
                    >
                      <CareIcon icon="l-paperclip" className="mr-2 shrink-0" />
                      <span className="truncate">
                        {file.name.length > 40
                          ? `${file.name.substring(0, 30)}...`
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
              ) : (
                <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-2 rounded-md bg-secondary-300 px-4 py-2">
                    <span
                      className="flex items-center truncate"
                      title={file.name}
                    >
                      <CareIcon icon="l-paperclip" className="mr-2 shrink-0" />
                      <span className="truncate">
                        {file.name.length > 40
                          ? `${file.name.substring(0, 30)}...`
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
              )}
              <div>
                <Label
                  htmlFor={`upload-file-name-${index}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("enter_file_name")}
                </Label>

                <Input
                  name={`file_name_${index}`}
                  type="text"
                  id={`upload-file-name-${index}`}
                  required
                  value={fileUpload.fileNames[index] || ""}
                  disabled={fileUpload.uploading}
                  onChange={(e) => {
                    fileUpload.setFileName(e.target.value, index);
                    fileUpload.setError(null);
                  }}
                  className="ml-0.5 mb-0.5"
                />
                {!fileUpload.fileNames[index] && fileUpload.error && (
                  <p className="mt-2 text-sm text-red-600">
                    {fileUpload.error}
                  </p>
                )}
              </div>
            </div>
          ))}
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

        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline_primary"
            onClick={() => fileUpload.handleFileUpload(associatingId, isPdf)}
            disabled={fileUpload.uploading}
            className="w-full"
            id="upload_file_button"
            data-cy="upload-files-button"
          >
            <CareIcon icon="l-check" className="mr-1" />
            {t("upload")}
          </Button>
          <Button
            variant="destructive"
            onClick={fileUpload.clearFiles}
            disabled={fileUpload.uploading}
          >
            <CareIcon icon="l-trash-alt" className="mr-1" />
            {t("discard")}
          </Button>
        </div>
        {!!fileUpload.progress && (
          <Progress value={fileUpload.progress} className="mt-4" />
        )}
      </DialogContent>
    </Dialog>
  );
}
