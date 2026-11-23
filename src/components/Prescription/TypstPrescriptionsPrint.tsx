import { useTranslation } from "react-i18next";

import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { buildPrescriptionsPrintContent } from "@/components/Prescription/prescriptionsPrintData";
import { useQrCode } from "@/print/useQrCode";
import type { PatientRead } from "@/types/emr/patient/patient";
import type { PrescriptionRead } from "@/types/emr/prescription/prescription";
import type { FacilityRead } from "@/types/facility/facility";
import { PrintTemplateType } from "@/types/facility/printTemplate";

const QR_CODE_PATH = "/assets/qr-code.svg";

interface Props {
  prescriptions: PrescriptionRead[];
  patient: PatientRead;
  facility: FacilityRead | undefined;
}

export function TypstPrescriptionsPrint({
  prescriptions,
  patient,
  facility,
}: Props) {
  const { t } = useTranslation();
  const qrCode = useQrCode(patient.id, QR_CODE_PATH, 85);

  return (
    <>
      {qrCode.element}
      <TypstPrintPreview
        template="prescriptions"
        title={`${t("prescriptions")} - ${patient.name}`}
        content={
          qrCode.ready
            ? buildPrescriptionsPrintContent({
                prescriptions,
                patient,
                qrCodePath: QR_CODE_PATH,
                t,
              })
            : undefined
        }
        facility={facility}
        templateSlug={PrintTemplateType.prescription}
        files={qrCode.files}
      />
    </>
  );
}
