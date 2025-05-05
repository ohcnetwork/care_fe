import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TooltipComponent } from "@/components/ui/tooltip";

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
  const { t } = useTranslation();

  if (!file) {
    return <></>;
  }
  const fileName = file?.name ? file.name + file.extension : "";
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      aria-labelledby="file-archive-dialog"
    >
      <DialogContent
        className="mb-8 rounded-lg p-4 w-[calc(100vw-2.5rem)] sm:w-[calc(100%-2rem)]"
        aria-describedby="file-archive"
      >
        <DialogHeader>
          <DialogTitle>
            {t("archived_file")}:{" "}
            <TooltipComponent content={fileName}>
              <span className="max-w-sm truncate inline-block align-bottom">
                {fileName}
              </span>
            </TooltipComponent>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="flex flex-col gap-1 bg-gray-100 p-4 rounded-md">
            <span className="text-sm text-gray-500">
              {t("archived_reason")}:
            </span>
            <span data-cy="archived-reason">{file?.archive_reason}</span>
          </div>
          <div className="flex flex-row gap-2 justify-between text-sm bg-blue-100 text-blue-900 p-2 rounded-md">
            <span>
              {t("archived_by")}: {file.archived_by?.username}
            </span>
            <span>
              {t("archived_at")}:{" "}
              {dayjs(file.archived_datetime).format("DD MMM YYYY, hh:mm A")}
            </span>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              data-cy="archive-dialog-close"
            >
              {t("close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
