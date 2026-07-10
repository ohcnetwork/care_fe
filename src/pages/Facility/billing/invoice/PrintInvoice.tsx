import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { DisablingCover } from "@/components/Common/DisablingCover";
import Loading from "@/components/Common/Loading";

import { register } from "@/lib/override/";
import { InvoiceBillTo } from "@/pages/Facility/billing/invoice/components/InvoiceBillTo";
import { useMedicationDispenseData } from "@/pages/Facility/billing/invoice/components/InvoiceChargeItemTitle";
import { PrintableInvoice } from "@/pages/Facility/billing/invoice/components/PrintableInvoice";
import { getInvoiceWatermark } from "@/pages/Facility/billing/invoice/utils";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import { getPartialId } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import query from "@/Utils/request/query";

type PrintInvoiceProps = {
  facilityId: string;
  invoiceId: string;
};

export function PrintInvoiceBase({ facilityId, invoiceId }: PrintInvoiceProps) {
  const { t } = useTranslation();

  const { data: invoice, isLoading: isInvoiceLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: query(invoiceApi.retrieveInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
  });

  const patient = invoice?.account.patient;

  // Fetch patient data for identifiers
  const { data: verifiedPatient } = useQuery({
    queryKey: ["patient-verify", patient?.id, patient?.year_of_birth],
    queryFn: query(patientApi.searchRetrieve, {
      pathParams: { facilityId },
      body: {
        phone_number: patient?.phone_number ?? "",
        year_of_birth: patient?.year_of_birth?.toString() ?? "",
        partial_id: patient ? getPartialId(patient) : "",
      },
    }),
    enabled: !!patient,
  });

  // Pre-fetch medication dispense data for charge items
  const { dispenseMap, isLoadingDispenses } = useMedicationDispenseData(
    invoice?.charge_items,
  );

  const { facility, isFacilityLoading } = useCurrentFacility();

  if (isInvoiceLoading || isFacilityLoading || !invoice || !facility) {
    return <Loading />;
  }

  return (
    <PrintPreview
      title={`${t("invoice")} ${invoice.number}`}
      watermark={getInvoiceWatermark(invoice, t, { includeDraft: true })}
      disabled={isLoadingDispenses}
      facility={facility}
      templateSlug={PrintTemplateType.invoice}
    >
      <DisablingCover
        disabled={isLoadingDispenses}
        message={t("loading_medication_details")}
      >
        <PrintableInvoice
          invoice={invoice}
          dispenseMap={dispenseMap}
          isLoadingDispenses={isLoadingDispenses}
          billTo={
            <InvoiceBillTo
              invoice={invoice}
              verifiedPatient={verifiedPatient}
            />
          }
        />
      </DisablingCover>
    </PrintPreview>
  );
}

export default register("PrintInvoice", PrintInvoiceBase);
