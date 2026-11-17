import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { CreateInvoicePage } from "@/pages/Facility/billing/account/CreateInvoice";
import { ChargeItemScope } from "@/pages/Facility/billing/account/useInvoiceChargeItems";

interface CreateInvoiceSheetProps {
  facilityId: string;
  accountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope?: ChargeItemScope;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  sourceUrl?: string;
  locationId?: string;
  dispenseOrderId?: string;
  skipNavigation?: boolean;
}

export function CreateInvoiceSheet({
  facilityId,
  accountId,
  open,
  onOpenChange,
  scope,
  trigger,
  onSuccess,
  sourceUrl,
  locationId,
  dispenseOrderId,
  skipNavigation = false,
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
        <div className="h-[calc(100vh-8rem)] overflow-auto mt-6 -mx-4">
          <CreateInvoicePage
            facilityId={facilityId}
            accountId={accountId}
            scope={scope}
            onSuccess={onSuccess}
            onCancel={() => onOpenChange(false)}
            showHeader={false}
            sourceUrl={sourceUrl}
            locationId={locationId}
            dispenseOrderId={dispenseOrderId}
            skipNavigation={skipNavigation}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
