import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { useMedicationDispenseData } from "@/pages/Facility/billing/invoice/components/InvoiceChargeItemTitle";
import { buildInvoicesPrintContent } from "@/pages/Facility/billing/invoice/invoicePrintData";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { useQrCode } from "@/print/useQrCode";
import { InvoiceRead, InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import { getPartialId } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import query from "@/Utils/request/query";

const QR_CODE_PATH = "/assets/qr-code.svg";

interface PrintInvoicesProps {
  facilityId: string;
  invoiceIds: string;
}

function PrintInvoices({ facilityId, invoiceIds }: PrintInvoicesProps) {
  const { t } = useTranslation();

  // Parse comma-separated invoice IDs
  const invoiceIdArray = Array.from(
    new Set(invoiceIds.split(",").map((id) => id.trim())),
  );

  const invoiceQueries = useQueries({
    queries: invoiceIdArray.map((invoiceId) => ({
      queryKey: ["invoice", invoiceId],
      queryFn: query(invoiceApi.retrieveInvoice, {
        pathParams: { facilityId, invoiceId },
      }),
    })),
  });

  const isLoading = invoiceQueries.some((q) => q.isLoading);
  const invoices = invoiceQueries
    .map((q) => q.data)
    .filter((invoice): invoice is InvoiceRead => invoice !== undefined);

  // Pre-fetch medication dispense data for all charge items
  const { dispenseMap, isLoadingDispenses } = useMedicationDispenseData(
    invoices.flatMap((invoice) => invoice.charge_items),
  );

  // Fetch patient data for each unique patient
  const uniquePatients = Array.from(
    new Map(
      invoices.map((invoice) => [
        invoice.account.patient.id,
        invoice.account.patient,
      ]),
    ).values(),
  );

  const patientQueries = useQueries({
    queries: uniquePatients.map((patient) => ({
      queryKey: ["patient-verify", patient.id, patient.year_of_birth],
      queryFn: query(patientApi.searchRetrieve, {
        pathParams: { facilityId },
        body: {
          phone_number: patient.phone_number ?? "",
          year_of_birth: patient.year_of_birth?.toString() ?? "",
          partial_id: getPartialId(patient),
          facility: facilityId,
        },
      }),
    })),
  });

  const { facility, isFacilityLoading } = useCurrentFacility();

  const qrCode = useQrCode(
    invoices[0]?.account.patient.id ?? "",
    QR_CODE_PATH,
    100,
  );

  if (
    isLoading ||
    isFacilityLoading ||
    invoices.length === 0 ||
    !facility ||
    isLoadingDispenses ||
    patientQueries.some((q) => q.isLoading) ||
    !qrCode.ready
  ) {
    return (
      <>
        {qrCode.element}
        <PrintLoading />
      </>
    );
  }

  const getWatermark = (invoice: InvoiceRead) => {
    if (invoice.status === InvoiceStatus.cancelled) {
      return { text: t("cancelled"), color: "red" as const };
    }
    if (invoice.status === InvoiceStatus.entered_in_error) {
      return { text: t("entered_in_error"), color: "red" as const };
    }
    return undefined;
  };

  return (
    <>
      {qrCode.element}
      <TypstPrintPreview
        template="invoices"
        title={`${t("invoices")} (${invoices.length})`}
        content={buildInvoicesPrintContent({
          invoices,
          verifiedPatients: new Map(
            uniquePatients.map((patient, index) => [
              patient.id,
              patientQueries[index]?.data,
            ]),
          ),
          dispenseMap,
          qrCodePath: QR_CODE_PATH,
          t,
        })}
        facility={facility}
        templateSlug={PrintTemplateType.invoices}
        statusWatermark={
          invoices.length === 1 ? getWatermark(invoices[0]) : undefined
        }
        files={qrCode.files}
      />
    </>
  );
}

export default PrintInvoices;
