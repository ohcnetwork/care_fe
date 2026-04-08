import { useQuery } from "@tanstack/react-query";
import { format, formatDate } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { getPermissions } from "@/common/Permissions";
import PrintFooter from "@/components/Common/PrintFooter";
import TagBadge from "@/components/Tags/TagBadge";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermissions } from "@/context/PermissionContext";
import { cn } from "@/lib/utils";
import { formatSlotTimeRange } from "@/pages/Appointments/utils";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { getBasePrice } from "@/types/base/monetaryComponent/monetaryComponent";
import { ChargeItemServiceResource } from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import {
  PAYMENT_RECONCILIATION_METHOD_MAP,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import { formatScheduleResourceName } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { renderTokenNumber } from "@/types/tokens/token/token";
import { add, round } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import { formatName, formatPatientAge } from "@/Utils/utils";

interface Props {
  appointmentId: string;
}

export default function AppointmentPrint(props: Props) {
  const { t } = useTranslation();
  const { facility, facilityId } = useCurrentFacility();
  const { hasPermission } = usePermissions();

  const { canViewAppointments } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );

  const { data: appointment, isLoading } = useQuery({
    queryKey: ["appointment", props.appointmentId],
    queryFn: query(scheduleApis.appointments.retrieve, {
      pathParams: {
        facilityId,
        id: props.appointmentId,
      },
    }),
    enabled: canViewAppointments && !!facility,
  });

  // Get charge items for the appointment to find the linked invoice
  const { data: chargeItems } = useQuery({
    queryKey: ["chargeItems", facilityId, props.appointmentId],
    queryFn: query(chargeItemApi.listChargeItem, {
      pathParams: {
        facilityId: facilityId,
      },
      queryParams: {
        service_resource: ChargeItemServiceResource.appointment,
        service_resource_id: props.appointmentId,
      },
    }),
    enabled: !!facilityId && !!props.appointmentId,
  });

  // Extract the invoice ID from the charge items' paid_invoice
  const invoiceId = chargeItems?.results?.find((item) => item.paid_invoice?.id)
    ?.paid_invoice?.id;

  // Fetch the full invoice which includes both charge_items and payments
  const { data: invoice } = useQuery({
    queryKey: ["appointmentInvoice", facilityId, invoiceId],
    queryFn: query(invoiceApi.retrieveInvoice, {
      pathParams: { facilityId, invoiceId: invoiceId! },
    }),
    enabled: !!facilityId && !!invoiceId,
  });

  if (isLoading || !appointment || !facility) {
    return (
      <PrintPreview
        title={t("appointment_details")}
        disabled
        templateSlug={PrintTemplateType.appointment}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-lg font-semibold">{t("loading")}</div>
            <div className="text-gray-600 mt-2">
              {t("loading_appointment_details")}
            </div>
          </div>
        </div>
      </PrintPreview>
    );
  }

  const patient = appointment.patient;
  const token = appointment.token;

  // Use invoice charge items when available, fall back to the charge items query
  const displayChargeItems = invoice?.charge_items ?? chargeItems?.results;
  const hasChargeItems = displayChargeItems && displayChargeItems.length > 0;

  const payments = (invoice?.payments ?? []).filter(
    (payment) =>
      payment.status === PaymentReconciliationStatus.active &&
      !payment.is_credit_note,
  );
  const hasPayments = payments.length > 0;

  const totalAmount =
    invoice?.total_gross ??
    (displayChargeItems && displayChargeItems.length > 0
      ? add(...displayChargeItems.map((item) => item.total_price)).toString()
      : undefined);
  const totalPaid = invoice?.total_payments;

  const patientTags = patient?.instance_tags ?? [];
  const appointmentTags = appointment?.tags ?? [];

  return (
    <PrintPreview
      title={t("appointment_details")}
      facility={facility}
      templateSlug={PrintTemplateType.appointment}
      className="w-[720px] mx-auto"
    >
      <div className="max-w-4xl mx-auto text-xs">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-300 pb-1 mb-2">
          <span className="font-semibold text-base text-gray-950">
            {t("appointment_details")}
          </span>
          <div className="text-right text-gray-600 leading-snug">
            <div className="text-xs font-semibold text-gray-950 gap-1 flex justify-end">
              <span>
                {formatDate(
                  appointment.token_slot.start_datetime,
                  "dd MMM, yyyy, EEE",
                )}
              </span>
              |<span>{formatSlotTimeRange(appointment.token_slot)}</span>
            </div>
            <div className="flex gap-1 justify-end">
              {t(`schedulable_resource__${appointment.resource_type}`)}:{" "}
              <span className="text-gray-800 font-medium">
                {formatScheduleResourceName(appointment)}
              </span>
              <span className="text-gray-800 font-semibold"> | </span>
              <span>{appointment.token_slot.availability.name}</span>
            </div>
          </div>
        </div>

        {/* Patient Info + QR/Token — compact two-column grid */}
        <div className="flex justify-between gap-3 mb-1.5">
          <div className="flex-1">
            <div className="text-xs leading-snug space-y-px">
              <DetailRow
                label={t("patient")}
                value={`${patient?.name} | ${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`}
              />
              <DetailRow
                label={t("contact_system_phone")}
                value={
                  patient?.phone_number
                    ? formatPhoneNumberIntl(patient.phone_number) ||
                      patient.phone_number
                    : undefined
                }
              />
              {patient?.instance_identifiers
                ?.filter(
                  (identifier) =>
                    identifier.config.config.use ===
                    PatientIdentifierUse.official,
                )
                .map((identifier) => (
                  <DetailRow
                    key={identifier.config.id}
                    label={identifier.config.config.display}
                    value={identifier.value}
                  />
                ))}
              {patient?.address?.trim() && (
                <DetailRow label={t("address")} value={patient.address} />
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            {token && (
              <div className="text-right">
                <p className="text-xs text-gray-600">{t("token_no")}</p>
                <p className="text-xl font-bold tracking-tight text-gray-950 leading-tight">
                  {renderTokenNumber(token)}
                </p>
              </div>
            )}
            <QRCodeSVG size={80} value={patient?.id || ""} />
          </div>
        </div>

        {/* Tags — inline, compact */}
        {(patientTags.length > 0 || appointmentTags.length > 0) && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-gray-600 text-xs w-28">{t("tags")}</span>
            <div className="flex flex-wrap gap-0.5">
              {patientTags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  hierarchyDisplay
                  className="text-xs rounded-sm py-0 px-1"
                />
              ))}
              {appointmentTags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  hierarchyDisplay
                  className="text-xs rounded-sm py-0 px-1"
                />
              ))}
            </div>
          </div>
        )}

        {/* Charges Table — compact */}
        {hasChargeItems && (
          <div className="mb-2">
            <div className="text-xs font-semibold text-gray-950 mb-0.5">
              {t("charges")}
            </div>

            <div className="border rounded overflow-hidden">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-gray-50 divide-x">
                    <TableHead className="text-xs text-gray-700 w-8 text-center h-7">
                      #
                    </TableHead>
                    <TableHead className="text-xs text-gray-700 h-7">
                      {t("particulars")}
                    </TableHead>
                    <TableHead className="text-xs text-gray-700 w-12 h-7">
                      {t("qty")}
                    </TableHead>
                    <TableHead className="text-xs text-gray-700 w-16 h-7">
                      {t("price")}
                    </TableHead>
                    <TableHead className="font-medium text-right text-xs text-gray-700 w-20 h-7">
                      {t("amount")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs font-medium text-gray-950">
                  {displayChargeItems.map((item, index) => {
                    const unitPrice = getBasePrice(
                      item.unit_price_components,
                    ).toString();
                    return (
                      <TableRow
                        key={item.id}
                        className="divide-x hover:bg-transparent"
                      >
                        <TableCell className="text-center py-0.5 px-1">
                          {index + 1}.
                        </TableCell>
                        <TableCell className="py-0.5">{item.title}</TableCell>
                        <TableCell className="py-0.5">
                          {round(item.quantity)}
                        </TableCell>
                        <TableCell className="py-0.5">
                          <MonetaryDisplay amount={unitPrice} hideCurrency />
                        </TableCell>
                        <TableCell className="text-right font-semibold py-0.5">
                          <MonetaryDisplay
                            amount={item.total_price}
                            hideCurrency
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-1 mr-2">
              <span className="text-xs text-gray-950 mr-2">
                {t("total_amount")} :
              </span>
              <MonetaryDisplay
                amount={totalAmount}
                className="text-xs text-gray-950 font-semibold"
              />
            </div>
          </div>
        )}

        {/* Payment Details — compact */}
        {hasPayments && (
          <div className="mb-2">
            <div className="border-t border-dashed border-gray-300 my-1.5" />
            <div className="text-xs font-semibold text-gray-950 mb-0.5">
              {t("payment_details")}
            </div>

            <div className="border rounded overflow-hidden">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-gray-50 divide-x">
                    <TableHead className="text-xs text-gray-700 w-8 text-center h-7 px-1">
                      #
                    </TableHead>
                    <TableHead className="text-xs text-gray-700 h-7">
                      {t("date_and_time")}
                    </TableHead>
                    <TableHead className="text-xs text-gray-700 h-7">
                      {t("payment_method")}
                    </TableHead>
                    <TableHead className="text-xs text-gray-700 h-7">
                      {t("reference")}
                    </TableHead>
                    <TableHead className="font-medium text-right text-xs text-gray-700 w-20 h-7">
                      {t("amount")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs font-medium text-gray-950">
                  {payments.map((payment, index) => (
                    <TableRow
                      key={payment.id}
                      className="divide-x hover:bg-transparent"
                    >
                      <TableCell className="text-center py-0.5 px-1">
                        {index + 1}.
                      </TableCell>
                      <TableCell className="py-0.5">
                        {payment.payment_datetime &&
                          format(
                            new Date(payment.payment_datetime),
                            "dd MMM yyyy, hh:mm a",
                          )}
                      </TableCell>
                      <TableCell className="py-0.5">
                        {PAYMENT_RECONCILIATION_METHOD_MAP[payment.method] ??
                          payment.method}
                      </TableCell>
                      <TableCell className="py-0.5">
                        {payment.reference_number || "--"}
                      </TableCell>
                      <TableCell className="text-right font-semibold py-0.5">
                        <MonetaryDisplay amount={payment.amount} hideCurrency />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-1 mr-2">
              <span className="text-xs text-gray-950 mr-2">
                {t("amount_paid")} :
              </span>
              <MonetaryDisplay
                amount={totalPaid}
                className="text-xs text-gray-950 font-semibold"
              />
            </div>
          </div>
        )}

        {/* Notes — compact */}
        {appointment.note && (
          <div className="mb-2">
            <div className="text-xs font-semibold text-gray-700 border-b border-gray-200 pb-0.5 mb-0.5">
              {t("note")}
            </div>
            <div className="text-xs whitespace-pre-wrap bg-gray-50 p-1.5 rounded">
              {appointment.note}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200">
          <PrintFooter
            rightContent={format(new Date(), "PP 'at' p")}
            leftContent={
              <>
                <span className="font-semibold">{t("last_updated_by")}:</span>{" "}
                {formatName(appointment.updated_by)}
              </>
            }
            className="text-xs"
          />
        </div>
      </div>
    </PrintPreview>
  );
}

interface DetailRowProps {
  label: string;
  value?: string | null;
  isStrong?: boolean;
  width?: string;
}

const DetailRow = ({
  label,
  value,
  isStrong = true,
  width = "w-28",
}: DetailRowProps) => {
  return (
    <div className="flex text-xs leading-snug">
      <span className={cn("text-gray-600 shrink-0", width)}>{label}</span>
      <span className="text-gray-950 font-semibold">: </span>
      <span
        className={cn("ml-0.5 whitespace-pre-wrap text-gray-950", {
          "font-semibold": isStrong,
        })}
      >
        {value}
      </span>
    </div>
  );
};
