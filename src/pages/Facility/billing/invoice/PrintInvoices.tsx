import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { DisablingCover } from "@/components/Common/DisablingCover";
import Loading from "@/components/Common/Loading";

import { cn } from "@/lib/utils";
import { useMedicationDispenseData } from "@/pages/Facility/billing/invoice/components/InvoiceChargeItemTitle";
import {
  PrintableInvoice,
  PrintableInvoiceBillTo,
} from "@/pages/Facility/billing/invoice/components/PrintableInvoice";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { InvoiceRead, InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import { getPartialId } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import query from "@/Utils/request/query";

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

  // Fetch all invoices using useQueries
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

  // Collect all charge items from all invoices for medication dispense fetching
  const allChargeItems = invoices.flatMap((invoice) => invoice.charge_items);

  // Pre-fetch medication dispense data for all charge items
  const { dispenseMap, isLoadingDispenses } =
    useMedicationDispenseData(allChargeItems);

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
        },
      }),
      enabled: true,
    })),
  });

  const verifiedPatientsMap = new Map(
    uniquePatients.map((patient, index) => [
      patient.id,
      patientQueries[index]?.data,
    ]),
  );

  const { facility, isFacilityLoading } = useCurrentFacility();

  if (isLoading || isFacilityLoading || invoices.length === 0 || !facility) {
    return <Loading />;
  }

  // Unlike the single-invoice page, the multi-invoice view intentionally omits
  // the `draft` watermark and only applies a watermark when printing one invoice.
  const getWatermark = (invoice: InvoiceRead) => {
    if (invoice.status === InvoiceStatus.cancelled) {
      return { text: t("cancelled"), color: "red" as const };
    }
    if (invoice.status === InvoiceStatus.entered_in_error) {
      return { text: t("entered_in_error"), color: "red" as const };
    }
    return undefined;
  };

  const firstInvoice = invoices[0];

  return (
    <PrintPreview
      title={`${t("invoices")} (${invoices.length})`}
      watermark={invoices.length === 1 ? getWatermark(invoices[0]) : undefined}
      disabled={isLoadingDispenses}
      facility={facility}
      templateSlug={PrintTemplateType.invoices}
    >
      <DisablingCover
        disabled={isLoadingDispenses}
        message={t("loading_medication_details")}
      >
        <div className="max-w-5xl mx-auto">
          {/* Bill To section - shown once */}
          <PrintableInvoiceBillTo
            patient={firstInvoice.account.patient}
            verifiedPatient={verifiedPatientsMap.get(
              firstInvoice.account.patient.id,
            )}
            className="pb-4"
            qrClassName="mr-2"
          />

          {invoices.map((invoice, invoiceIndex) => (
            <div
              key={invoice.id}
              className={cn(invoiceIndex > 0 && "page-break-before mt-4")}
            >
              <PrintableInvoice
                invoice={invoice}
                dispenseMap={dispenseMap}
                isLoadingDispenses={isLoadingDispenses}
              />
            </div>
          ))}
        </div>
      </DisablingCover>
    </PrintPreview>
  );
}

export default PrintInvoices;
