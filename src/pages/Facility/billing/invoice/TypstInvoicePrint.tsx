import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { buildInvoicePrintContent } from "@/pages/Facility/billing/invoice/invoicePrintData";
import { serializeSvg } from "@/print/printAssets";
import type { StatusWatermark } from "@/print/types";
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

/** The invoice as a PDF generated with Typst (src/print/templates/invoice.typ). */
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
  const patientId = invoice.account.patient.id;

  // Typst can't draw QR codes, so render one here and pass it as an SVG.
  const qrCodeRef = useRef<SVGSVGElement>(null);
  const [qrCode, setQrCode] = useState<Uint8Array>();
  useEffect(() => {
    if (qrCodeRef.current) setQrCode(serializeSvg(qrCodeRef.current));
  }, [patientId]);

  const isReady = !!qrCode && !isLoadingDispenses && !isVerifiedPatientLoading;

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

  const files = useMemo(
    () => (qrCode ? { [QR_CODE_PATH]: qrCode } : undefined),
    [qrCode],
  );

  return (
    <>
      <div hidden>
        <QRCodeSVG
          ref={qrCodeRef}
          value={patientId}
          size={100}
          level="M"
          marginSize={0}
        />
      </div>
      <TypstPrintPreview
        template="invoice"
        title={`${t("invoice")} ${invoice.number}`}
        content={content}
        facility={facility}
        templateSlug={PrintTemplateType.invoice}
        statusWatermark={statusWatermark}
        files={files}
      />
    </>
  );
}
