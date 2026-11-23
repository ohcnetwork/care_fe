import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { buildInvoicePrintContent } from "@/pages/Facility/billing/invoice/invoicePrintData";
import type { StatusWatermark } from "@/print/types";
import { useQrCode } from "@/print/useQrCode";
import type { InvoiceRead } from "@/types/billing/invoice/invoice";
import type { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import type { PatientRead } from "@/types/emr/patient/patient";
import type { FacilityRead } from "@/types/facility/facility";
import { PrintTemplateType } from "@/types/facility/printTemplate";

const QR_CODE_PATH = "/assets/qr-code.svg";

interface Props {
  invoice: InvoiceRead;
  facility: FacilityRead;
  verifiedPatient: PatientRead | undefined;
  isVerifiedPatientLoading: boolean;
  dispenseMap: Record<string, MedicationDispenseRead | undefined>;
  isLoadingDispenses: boolean;
  statusWatermark?: StatusWatermark;
}

export function TypstInvoicePrint({
  invoice,
  facility,
  verifiedPatient,
  isVerifiedPatientLoading,
  dispenseMap,
  isLoadingDispenses,
  statusWatermark,
}: Props) {
  const { t } = useTranslation();
  const qrCode = useQrCode(invoice.account.patient.id, QR_CODE_PATH, 100);

  const isReady =
    qrCode.ready && !isLoadingDispenses && !isVerifiedPatientLoading;

  const content = useMemo(
    () =>
      isReady
        ? buildInvoicePrintContent({
            invoice,
            verifiedPatient,
            dispenseMap,
            qrCodePath: QR_CODE_PATH,
            t,
          })
        : undefined,
    // dispenseMap is rebuilt on every render; its contents change only when
    // loading finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isReady, invoice, verifiedPatient, t],
  );

  return (
    <>
      {qrCode.element}
      <TypstPrintPreview
        template="invoice"
        title={`${t("invoice")} ${invoice.number}`}
        content={content}
        facility={facility}
        templateSlug={PrintTemplateType.invoice}
        statusWatermark={statusWatermark}
        files={qrCode.files}
      />
    </>
  );
}
