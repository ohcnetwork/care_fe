import { useTranslation } from "react-i18next";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { CreateInvoicePage } from "@/pages/Facility/billing/account/CreateInvoice";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";

interface CreateInvoiceSheetProps {
  facilityId: string;
  accountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedChargeItems?: ChargeItemRead[];
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  sourceUrl?: string;
  locationId?: string;
  patientId?: string;
  disableCreateChargeItems?: boolean;
  showDispenseNowButton?: boolean;
}

export function CreateInvoiceSheet({
  facilityId,
  accountId,
  open,
  onOpenChange,
  preSelectedChargeItems,
  trigger,
  onSuccess,
  sourceUrl,
  locationId,
  patientId,
  disableCreateChargeItems = false,
  showDispenseNowButton = false,
}: CreateInvoiceSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle>{t("create_invoice")}</SheetTitle>
          <SheetDescription>{t("create_invoice_description")}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6 -mx-4">
          <CreateInvoicePage
            facilityId={facilityId}
            accountId={accountId}
            preSelectedChargeItems={preSelectedChargeItems}
            onSuccess={onSuccess}
            showHeader={false}
            sourceUrl={sourceUrl}
            locationId={locationId}
            patientId={patientId}
            disableCreateChargeItems={disableCreateChargeItems}
            showDispenseNowButton={showDispenseNowButton}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default CreateInvoiceSheet;
