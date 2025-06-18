import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OfflinePatientWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleOk: () => void;
  checked: boolean;
  setChecked: (val: boolean) => void;
}

const OfflinePatientWarningDialog = ({
  open,
  onOpenChange,
  handleOk,
  checked,
  setChecked,
}: OfflinePatientWarningDialogProps) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="[&>button:last-child]:hidden w-3/4 md:w-1/2 max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("You_are_Offline")}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="text-sm leading-relaxed">
              {t("offline_patient_create _records_warning")}
            </p>
          </div>

          <div className="flex ">
            <div className="mb-2 flex items-center">
              <label className="mb-2 ml-0 flex w-full rounded-md bg-red-500 py-2 pr-2 text-white">
                <input
                  type="radio"
                  className="m-3 text-red-600 focus:ring-2 focus:ring-red-500"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                <p>{t("offline_patient_create_confirmation")}</p>
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <div className="mt-4 flex flex-col justify-between sm:flex-row gap-2">
            <Button variant="primary" disabled={!checked} onClick={handleOk}>
              <CareIcon icon="l-check" className="text-lg mr-1" />
              {t("continue")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OfflinePatientWarningDialog;
