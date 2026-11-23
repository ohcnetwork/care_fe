import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { buildPaymentReceiptPrintContent } from "@/pages/Facility/billing/paymentReconciliation/paymentReceiptPrintData";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { PaymentReconciliationStatus } from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import query from "@/Utils/request/query";

type PrintPaymentReconciliationProps = {
  facilityId: string;
  paymentReconciliationId: string;
};

function PrintPaymentReconciliation({
  facilityId,
  paymentReconciliationId,
}: PrintPaymentReconciliationProps) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

  const { data: payment, isLoading } = useQuery({
    queryKey: ["paymentReconciliation", paymentReconciliationId],
    queryFn: query(paymentReconciliationApi.retrievePaymentReconciliation, {
      pathParams: { facilityId, paymentReconciliationId },
    }),
  });

  if (isLoading || !payment) {
    return <PrintLoading />;
  }

  const getWatermark = () => {
    if (payment.status === PaymentReconciliationStatus.cancelled) {
      return { text: t("cancelled"), color: "red" as const };
    }
    if (payment.status === PaymentReconciliationStatus.entered_in_error) {
      return { text: t("entered_in_error"), color: "red" as const };
    }
    return undefined;
  };

  return (
    <TypstPrintPreview
      template="payment-receipt"
      title={t(payment.is_credit_note ? "refund_receipt" : "payment_receipt")}
      content={buildPaymentReceiptPrintContent({ payment, t })}
      facility={facility}
      templateSlug={PrintTemplateType.payment_receipt}
      statusWatermark={getWatermark()}
    />
  );
}

export default PrintPaymentReconciliation;
