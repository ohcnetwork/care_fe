import { t } from "i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUpload: FileUploadReturn;
  associatingId: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      aria-labelledby="file-upload-dialog"
    >
      <DialogContent
        className="mb-8 rounded-lg p-5 max-w-fit"
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
              <div className="flex items-center justify-between gap-2 rounded-md bg-secondary-300 px-4 py-2">
                <span className="flex items-center truncate">
                  <CareIcon icon="l-paperclip" className="mr-2 shrink-0" />
                  <span className="truncate max-w-xs" title={file.name}>
                    {file.name}
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
              <div className="space-y-2">
                <Label
                  htmlFor={`upload-file-name-${index}`}
                  className="text-sm font-medium text-gray-700"
                >
                  {t("enter_file_name")}
                </Label>
                <Input
                  name={`file_name_${index}`}
                  type="text"
                  id={`upload-file-name-${index}`}
                  required
                  className={
                    index === 0 && fileUpload.error
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-primary"
                  }
                  value={fileUpload.fileNames[index] || ""}
                  disabled={fileUpload.uploading}
                  onChange={(e) =>
                    fileUpload.setFileName(e.target.value, index)
                  }
                />
                {index === 0 && fileUpload.error && (
                  <p className="mt-1 text-sm text-red-500">
                    {fileUpload.error}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline_primary"
            onClick={() => fileUpload.handleFileUpload(associatingId)}
            disabled={fileUpload.uploading}
            className="w-full"
            id="upload_file_button"
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
