import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";

import { register } from "@/lib/override/";
import { useMedicationDispenseData } from "@/pages/Facility/billing/invoice/components/InvoiceChargeItemTitle";
import { TypstInvoicePrint } from "@/pages/Facility/billing/invoice/TypstInvoicePrint";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import { getPartialId } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
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
  const { data: verifiedPatient, isLoading: isVerifiedPatientLoading } =
    useQuery({
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
    return <PrintLoading />;
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
    <TypstInvoicePrint
      invoice={invoice}
      facility={facility}
      verifiedPatient={verifiedPatient}
      isVerifiedPatientLoading={isVerifiedPatientLoading}
      dispenseMap={dispenseMap}
      isLoadingDispenses={isLoadingDispenses}
      statusWatermark={getWatermark()}
    />
  );
}

export default register("PrintInvoice", PrintInvoiceBase);
