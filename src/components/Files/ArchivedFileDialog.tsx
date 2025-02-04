import dayjs from "dayjs";
import { t } from "i18next";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { FileUploadModel } from "@/components/Patient/models";

export default function ArchivedFileDialog({
  open,
  onOpenChange,
  file,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileUploadModel | null;
}) {
  const fileName = file?.name ? file.name + file.extension : "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("archived_file")}: {fileName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="flex flex-col gap-1 bg-gray-100 p-4 rounded-md">
            <span className="text-sm text-gray-500">
              {t("archived_reason")}:
            </span>
            <span>{file?.archive_reason}</span>
          </div>
          <div className="flex flex-row gap-2 justify-between text-sm bg-blue-100 text-blue-900 p-2 rounded-md">
            <span>
              {t("archived_by")}: {file?.archived_by?.username}
            </span>
            <span>
              {t("archived_at")}:{" "}
              {dayjs(file?.archived_datetime).format("DD MMM YYYY, hh:mm A")}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
