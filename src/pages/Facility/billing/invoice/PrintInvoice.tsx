import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { DisablingCover } from "@/components/Common/DisablingCover";
import Loading from "@/components/Common/Loading";

import { register } from "@/lib/override/";
import { useMedicationDispenseData } from "@/pages/Facility/billing/invoice/components/InvoiceChargeItemTitle";
import {
  PrintableInvoice,
  PrintableInvoiceBillTo,
} from "@/pages/Facility/billing/invoice/components/PrintableInvoice";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
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
        facility: facilityId,
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

  const getWatermark = () => {
    if (invoice.status === InvoiceStatus.cancelled) {
      return { text: t("cancelled"), color: "red" as const };
    } else if (invoice.status === InvoiceStatus.entered_in_error) {
      return { text: t("entered_in_error"), color: "red" as const };
    } else if (invoice.status === InvoiceStatus.draft) {
      return { text: t("draft"), color: "gray" as const };
    }
    return undefined;
  };

  return (
    <PrintPreview
      title={`${t("invoice")} ${invoice.number}`}
      watermark={getWatermark()}
      disabled={isLoadingDispenses}
      facility={facility}
      templateSlug={PrintTemplateType.invoice}
    >
      <DisablingCover
        disabled={isLoadingDispenses}
        message={t("loading_medication_details")}
      >
        <div>
          <PrintableInvoice
            invoice={invoice}
            dispenseMap={dispenseMap}
            isLoadingDispenses={isLoadingDispenses}
            billTo={
              <PrintableInvoiceBillTo
                patient={invoice.account.patient}
                verifiedPatient={verifiedPatient}
              />
            }
          />
        </div>
      </DisablingCover>
    </PrintPreview>
  );
}

export default register("PrintInvoice", PrintInvoiceBase);
