import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Badge } from "@/components/ui/badge";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";

import PrintFooter from "@/components/Common/PrintFooter";
import {
  PAYMENT_RECONCILIATION_METHOD_MAP,
  PAYMENT_RECONCILIATION_OUTCOME_COLORS,
  PaymentReconciliationOutcome,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import query from "@/Utils/request/query";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";

const outcomeMap: Record<
  PaymentReconciliationOutcome,
  { label: string; color: string }
> = {
  complete: { label: "Complete", color: "success" },
  error: { label: "Error", color: "destructive" },
  queued: { label: "Queued", color: "secondary" },
  partial: { label: "Partial", color: "warning" },
};

type PrintPaymentReconciliationProps = {
  facilityId: string;
  paymentReconciliationId: string;
};

interface DetailRowProps {
  label: string;
  value?: string | null;
  isStrong?: boolean;
  width?: string;
}

const DetailRow = ({
  label,
  value,
  isStrong = false,
  width = "w-32",
}: DetailRowProps) => {
  return (
    <div className="flex">
      <span className={`text-gray-600 ${width}`}>{label}</span>
      <span className="text-gray-600">: </span>
      <span
        className={`ml-1 whitespace-pre-wrap ${isStrong ? "font-semibold" : ""}`}
      >
        {value || "-"}
      </span>
    </div>
  );
};

export function PrintPaymentReconciliation({
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
    return <Loading />;
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
    <PrintPreview
      title={`${t(payment.is_credit_note ? "refund_receipt" : "payment_receipt")}`}
      watermark={getWatermark()}
    >
      <div className="max-w-5xl mx-auto">
        <div>
          <div className="flex justify-between items-start mb-4 pb-2 border-b border-gray-200">
            <div className="flex items-start gap-4">
              <div className="text-left">
                <h1 className="text-2xl font-medium">{facility?.name}</h1>
                {facility?.address && (
                  <div className="text-gray-500 whitespace-pre-wrap wrap-break-word text-sm">
                    {facility.address}
                    {facility.phone_number && (
                      <p className="text-gray-500 text-sm">
                        {t("phone")}: {facility.phone_number}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <img
              src={careConfig.mainLogo?.dark}
              alt="Logo"
              className="h-10 w-auto object-contain mb-2 sm:mb-0 text-end"
            />
          </div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row print:flex-row print:items-start justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200">
            <div className="text-center sm:text-left sm:order-1 print:text-left">
              <span className="text-xl font-semibold uppercase">
                {t(
                  payment.is_credit_note ? "refund_receipt" : "payment_receipt",
                )}
              </span>

              <Badge
                variant={PAYMENT_RECONCILIATION_OUTCOME_COLORS[payment.outcome]}
                className="ml-2 uppercase"
              >
                {outcomeMap[payment.outcome]?.label}
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-4 mb-4 text-xs">
            <div className="space-y-1">
              <DetailRow
                label={t("name")}
                value={payment.account.patient.name}
                width="w-16"
                isStrong
              />
              <DetailRow
                label={`${t("age")} / ${t("sex")}`}
                value={
                  payment.account.patient
                    ? `${formatPatientAge(payment.account.patient, true)}, ${t(`GENDER__${payment.account.patient.gender}`)}`
                    : undefined
                }
                width="w-16"
              />
              <DetailRow
                label={`${t("address")}`}
                value={payment.account.patient?.address}
                width="w-16"
              />
            </div>
            <div className="space-y-1">
              <DetailRow
                label={`${t("date")}`}
                value={formatDateTime(payment.created_date, "DD-MM-YYYY")}
                width="w-24"
              />
              {payment.account.patient?.instance_identifiers
                ?.filter(
                  ({ config }) =>
                    config.config.use === PatientIdentifierUse.official,
                )
                .map((identifier) => (
                  <DetailRow
                    key={identifier.config.id}
                    label={identifier.config.config.display}
                    value={identifier.value}
                    width="w-24"
                    isStrong
                  />
                ))}
              <DetailRow
                label={t("payment_method")}
                value={PAYMENT_RECONCILIATION_METHOD_MAP[payment.method]}
                width="w-24"
              />
            </div>
          </div>

          <Separator className="mt-4 mb-2" />
          {/* Related Invoice */}
          {payment.target_invoice && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("invoice_no")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">
                        {t("amount")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{payment.target_invoice.number}</TableCell>
                      <TableCell>{payment.target_invoice.status}</TableCell>
                      <TableCell className="text-right">
                        <MonetaryDisplay
                          amount={payment.target_invoice.total_gross}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <Separator className="mb-4" />
            </>
          )}
          {/* Additional Details */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{t("kind")}</TableHead>
                  <TableHead>{t("issuer_type")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    {payment.reconciliation_type.charAt(0).toUpperCase() +
                      payment.reconciliation_type.slice(1)}
                  </TableCell>
                  <TableCell>
                    {payment.kind.charAt(0).toUpperCase() +
                      payment.kind.slice(1)}
                  </TableCell>
                  <TableCell>
                    {payment.issuer_type.charAt(0).toUpperCase() +
                      payment.issuer_type.slice(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    <MonetaryDisplay amount={payment.amount} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          {/* Totals */}
          <div className="flex flex-col items-end space-y-2 mt-6">
            <div className="flex w-48 justify-between">
              <span className="text-gray-500">{t("amount")}</span>
              <MonetaryDisplay amount={payment.amount} />
            </div>
            {payment.method === "cash" && (
              <>
                <div className="flex w-48 justify-between">
                  <span className="text-gray-500">{t("tendered")}</span>
                  <MonetaryDisplay amount={payment.tendered_amount} />
                </div>
                <div className="flex w-48 justify-between">
                  <span className="text-gray-500">{t("returned")}</span>
                  <MonetaryDisplay amount={payment.returned_amount} />
                </div>
              </>
            )}
            <div className="flex w-48 justify-between font-bold border-t pt-2">
              <span>{t("total")}</span>
              <MonetaryDisplay amount={payment.amount} />
            </div>
          </div>
          {/* Notes */}
          {payment.note && (
            <div className="mt-8 text-sm text-gray-600 border-t pt-4">
              <h3 className="font-medium mb-2">{t("notes")}</h3>
              <p>{payment.note}</p>
            </div>
          )}
          {/* Footer */}
          <PrintFooter
            leftContent={
              <>
                <span className="font-semibold">{t("generated_by")} </span>
                {formatName(payment.updated_by)}
              </>
            }
            rightContent={
              payment.location?.name ? (
                <>
                  <span className="font-semibold">{t("location")}: </span>
                  <span>{payment.location.name}</span>
                </>
              ) : undefined
            }
            className="border-t pt-4"
          />
        </div>
      </div>
    </PrintPreview>
  );
}

export default PrintPaymentReconciliation;
