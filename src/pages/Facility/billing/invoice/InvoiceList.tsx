import { QrCode } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import Page from "@/components/Common/Page";
import GenericQRScanDialog from "@/components/Scan/GenericQRScanDialog";
import { Button } from "@/components/ui/button";

import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import InvoicesData from "./InvoicesData";

export function InvoiceList({
  facilityId,
  accountId,
}: {
  facilityId: string;
  accountId?: string;
}) {
  const { t } = useTranslation();
  const [scanDialogOpen, setScanDialogOpen] = useState(false);

  const handleScanSuccess = (scannedData: string) => {
    try {
      const parsed = JSON.parse(scannedData);
      if (parsed.inv) {
        setScanDialogOpen(false);
        navigate(`/facility/${facilityId}/billing/invoices/${parsed.inv}`);
        return;
      } else {
        toast.error(t("invalid_qr_code"));
      }
    } catch {
      return;
    }
  };

  useBarcodeScanner({
    onScan: handleScanSuccess,
    enabled: !scanDialogOpen,
  });

  return (
    <Page title={t("invoices")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-700 mb-2">
                {t("invoice_management")}
              </h1>
              <p className="text-gray-600 text-sm">
                {accountId
                  ? t("view_and_manage_account_invoices")
                  : t("view_and_manage_invoices")}
              </p>
            </div>
            <Button
              variant="outline"
              aria-label={t("scan_invoice_qr")}
              onClick={() => setScanDialogOpen(true)}
              className="hidden sm:flex"
            >
              <QrCode className="size-4" />
              <span> {t("scan_invoice_qr")}</span>
            </Button>
          </div>
          <InvoicesData
            facilityId={facilityId}
            accountId={accountId}
            showIdentifierFilter
          />
        </div>
      </div>

      <GenericQRScanDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        onScanSuccess={handleScanSuccess}
        title={t("scan_qr")}
      />
    </Page>
  );
}

export default InvoiceList;
