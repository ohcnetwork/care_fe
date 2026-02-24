import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { useTranslation } from "react-i18next";
import { EditInvoiceTable } from "./EditInvoiceTable";

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  chargeItems: ChargeItemRead[];
  onSuccess: () => void;
  title?: string;
}

export function EditInvoiceDialog({
  open,
  onOpenChange,
  facilityId,
  chargeItems,
  onSuccess,
  title,
}: EditInvoiceDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full sm:max-w-7xl overflow-auto max-h-[85vh] pb-0 [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title || t("edit_invoice_items")}</DialogTitle>
        </DialogHeader>
        <EditInvoiceTable
          facilityId={facilityId}
          chargeItems={chargeItems}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
          enableShortcut={open}
        />
      </DialogContent>
    </Dialog>
  );
}
