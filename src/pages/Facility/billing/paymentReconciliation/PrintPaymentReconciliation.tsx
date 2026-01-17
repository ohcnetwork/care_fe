import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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
  PAYMENT_RECONCILIATION_STATUS_COLORS,
  PaymentReconciliationOutcome,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import query from "@/Utils/request/query";
import { formatName, formatPatientAge } from "@/Utils/utils";

const statusMap: Record<
  PaymentReconciliationStatus,
  { label: string; color: string }
> = {
  active: { label: "Active", color: "success" },
  cancelled: { label: "Cancelled", color: "destructive" },
  draft: { label: "Draft", color: "secondary" },
  entered_in_error: { label: "Error", color: "destructive" },
};

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

export function PrintPaymentReconciliation({
  facilityId,
  paymentReconciliationId,
}: PrintPaymentReconciliationProps) {
  const { t } = useTranslation();

  const { data: payment, isLoading } = useQuery({
    queryKey: ["paymentReconciliation", paymentReconciliationId],
    queryFn: query(paymentReconciliationApi.retrievePaymentReconciliation, {
      pathParams: { facilityId, paymentReconciliationId },
    }),
  });

  if (isLoading || !payment) {
    return <Loading />;
  }

  return (
    <PrintPreview
      title={`${t(payment.is_credit_note ? "refund_receipt" : "payment_receipt")}`}
    >
      <div className="md:p-2 max-w-4xl mx-auto md:min-w-2xl">
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200">
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain mb-2 sm:mb-0 sm:order-2"
            />
            <div className="text-center sm:text-left sm:order-1">
              <h1 className="text-3xl font-semibold">
                {t(
                  payment.is_credit_note ? "refund_receipt" : "payment_receipt",
                )}
              </h1>
              <h2 className="text-gray-500 uppercase text-sm tracking-wide mt-1 font-semibold">
                <span className="ml-2">
                  <Badge
                    variant={
                      PAYMENT_RECONCILIATION_STATUS_COLORS[payment.status]
                    }
                  >
                    {statusMap[payment.status]?.label}
                  </Badge>
                  <Badge
                    variant={
                      PAYMENT_RECONCILIATION_OUTCOME_COLORS[payment.outcome]
                    }
                    className="ml-2"
                  >
                    {outcomeMap[payment.outcome]?.label}
                  </Badge>
                </span>
              </h2>
            </div>
          </div>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <div>
                <span className="text-gray-600">{t("payment_date")}: </span>
                <span className="font-medium">
                  {payment.payment_datetime
                    ? format(new Date(payment.payment_datetime), "MMM dd, yyyy")
                    : format(new Date(), "MMM dd, yyyy")}
                </span>
              </div>
              <div>
                <span className="text-gray-600">{t("payment_method")}: </span>
                <span className="font-medium">
                  {PAYMENT_RECONCILIATION_METHOD_MAP[payment.method]}
                </span>
              </div>
            </div>
          </div>
          {/* Patient Information - Similar to PrintInvoice */}
          {payment.account?.patient && (
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <div>
                  <span className="text-gray-600">{t("name")}: </span>
                  <span className="font-medium">
                    {payment.account.patient.name.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("age")} / {t("sex")}:{" "}
                  </span>
                  <span className="font-medium">
                    {formatPatientAge(payment.account.patient, true)},{" "}
                    {t(`GENDER__${payment.account.patient.gender}`)}
                  </span>
                </div>
                {payment.account.patient.address && (
                  <div>
                    <span className="text-gray-600">{t("address")}: </span>
                    <span className="font-medium">
                      {payment.account.patient.address}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator className="mt-4 mb-2" />

          {/* Related Invoice */}
          {payment.target_invoice && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("invoice_number")}</TableHead>
                      <TableHead>{t("title")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("amount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>#{payment.target_invoice.id}</TableCell>
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
