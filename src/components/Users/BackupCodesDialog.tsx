import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BackupCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupCodes: string[];
  showRegenerateBackupCodes?: boolean;
}

export function BackupCodesDialog({
  open,
  onOpenChange,
  backupCodes,
  showRegenerateBackupCodes = false,
}: BackupCodesDialogProps) {
  const { t } = useTranslation();

  const handleCopyBackupCodes = () => {
    if (backupCodes.length > 0) {
      navigator.clipboard.writeText(backupCodes.join("\n"));
      toast.success(t("backup_codes_copied"));
    }
  };

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length > 0) {
      const element = document.createElement("a");
      const file = new Blob([backupCodes.join("\n")], {
        type: "text/plain",
      });
      element.href = URL.createObjectURL(file);
      element.download = "backup-codes.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handlePrintBackupCodes = () => {
    if (backupCodes.length > 0) {
      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${t("2FA_backup_code")}</title>
              <style>
                body { font-family: system-ui; padding: 2rem; }
                .code { font-family: monospace; margin: 0.5rem 0; }
              </style>
            </head>
            <body>
              <h1>${t("two_factor_authentication_backup_codes")}</h1>
              <p>${t("keep_code_safe")}</p>
              ${backupCodes.map((code) => `<div class="code">${code}</div>`).join("")}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95%] rounded-md">
        <DialogHeader>
          {!showRegenerateBackupCodes ? (
            <div className="flex items-center space-x-2">
              <div>
                <DialogTitle className="text-2xl font-bold text-primary-800">
                  {t("two_factor_authentication_enabled")}
                </DialogTitle>
                <DialogDescription>
                  {t("backup_codes_description")}
                </DialogDescription>
              </div>
            </div>
          ) : (
            <>
              <DialogTitle className="text-2xl font-bold text-primary-800">
                {t("new_backup_codes")}
              </DialogTitle>
              <DialogDescription>
                {t("backup_codes_description")}
              </DialogDescription>
            </>
          )}
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <code key={index} className="font-mono text-sm">
                  {code}
                </code>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleCopyBackupCodes}
              className="flex-1"
            >
              <CareIcon icon="l-copy" className="mr-2 size-4" />
              {t("copy")}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadBackupCodes}
              className="flex-1"
            >
              <CareIcon
                icon="l-file-download"
                className="size-4 text-gray-500"
              />
              {t("download")}
            </Button>
            <Button
              variant="outline"
              onClick={handlePrintBackupCodes}
              className="flex-1"
            >
              <CareIcon icon="l-print" className="size-4 text-gray-500" />
              {t("print")}
            </Button>
          </div>
          <p className="text-sm text-red-500">
            {showRegenerateBackupCodes ? t("backup_codes_warning") : t("")}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            {t("done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
