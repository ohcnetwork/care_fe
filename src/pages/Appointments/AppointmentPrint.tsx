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
import { Separator } from "@/components/ui/separator";
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
import { round } from "@/Utils/decimal";
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
      <PrintPreview title={t("appointment_details")} disabled>
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

  const totalAmount = invoice?.total_gross;
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
      <div className="max-w-4xl mx-auto text-sm">
        {/* Header: Appointment Type + Slot Name */}
        <div className="flex justify-between items-start">
          <span className="font-semibold text-base text-gray-700">
            {t(`schedulable_resource__${appointment.resource_type}`)}
          </span>
          <span className="font-semibold text-base text-gray-700">
            {appointment.token_slot.availability.name}
          </span>
        </div>

        {/* Title + Date */}
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-gray-950">{t("appointment_details")}</h5>
          <span className="font-semibold text-gray-950">
            {formatDate(
              appointment.token_slot.start_datetime,
              "dd MMM, yyyy, EEE",
            )}{" "}
            | {formatSlotTimeRange(appointment.token_slot)}
          </span>
        </div>

        {/* Patient Info + QR/Token */}
        <div className="flex justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="text-sm space-y-0.5">
              <DetailRow label={t("patient")} value={patient?.name} />
              <DetailRow
                label={`${t("age")}/${t("gender")}`}
                value={
                  patient
                    ? `${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`
                    : undefined
                }
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
              <DetailRow
                label={t(`schedulable_resource__${appointment.resource_type}`)}
                value={formatScheduleResourceName(appointment)}
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
          <div className="flex flex-col items-end gap-2">
            {token && (
              <div className="text-right">
                <p className="text-gray-950">{t("token_no")}</p>
                <p className="text-2xl font-bold tracking-tigh text-gray-950">
                  {renderTokenNumber(token)}
                </p>
              </div>
            )}
            <QRCodeSVG size={80} value={patient?.id || ""} className="gray" />
          </div>
        </div>

        {/* Tags */}
        {(patientTags.length > 0 || appointmentTags.length > 0) && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-700 w-30">{t("tags")}</span>
            <div className="flex flex-wrap gap-1">
              {patientTags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  hierarchyDisplay
                  className="text-xs rounded-sm"
                />
              ))}
              {appointmentTags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  hierarchyDisplay
                  className="text-xs rounded-sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Charges Table */}
        {hasChargeItems && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-semibold text-gray-950">
                {t("charges")}
              </span>
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 divide-x">
                    <TableHead className="text-sm text-gray-700 w-10 text-center">
                      #
                    </TableHead>
                    <TableHead className="text-sm text-gray-700">
                      {t("item")}
                    </TableHead>
                    <TableHead className="text-sm text-gray-700">
                      {t("qty")}
                    </TableHead>
                    <TableHead className="text-sm text-gray-700">
                      {t("price")}
                    </TableHead>
                    <TableHead className="font-medium text-right text-sm text-gray-700">
                      {t("amount")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-base font-medium text-gray-950">
                  {displayChargeItems.map((item, index) => {
                    const unitPrice = getBasePrice(
                      item.unit_price_components,
                    ).toString();
                    return (
                      <TableRow
                        key={item.id}
                        className="divide-x hover:bg-transparent"
                      >
                        <TableCell className="text-center">
                          {index + 1}.
                        </TableCell>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>{round(item.quantity)}</TableCell>
                        <TableCell>
                          <MonetaryDisplay amount={unitPrice} hideCurrency />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
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
            <div className="flex justify-end mt-1">
              <span className="text-base text-gray-950 mr-3">
                {t("total_amount")} :
              </span>
              <MonetaryDisplay
                amount={totalAmount}
                className="text-base text-gray-950 font-semibold"
              />
            </div>
          </div>
        )}

        {/* Payment Details Table */}
        {hasPayments && (
          <div className="mb-3">
            <div className="p-1 border-b-2 border-dashed border-gray-200 w-full mb-3" />
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-semibold text-gray-950">
                {t("payment_details")}
              </span>
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 divide-x">
                    <TableHead className="text-sm text-gray-700 w-10 text-center">
                      #
                    </TableHead>
                    <TableHead className="text-sm text-gray-700">
                      {t("date_and_time")}
                    </TableHead>
                    <TableHead className="text-sm text-gray-700">
                      {t("payment_method")}
                    </TableHead>
                    <TableHead className="text-sm text-gray-700">
                      {t("reference")}
                    </TableHead>
                    <TableHead className="font-medium text-right text-gray-700">
                      {t("amount")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-base font-medium text-gray-950">
                  {payments.map((payment, index) => (
                    <TableRow
                      key={payment.id}
                      className="divide-x hover:bg-transparent"
                    >
                      <TableCell className="text-center">
                        {index + 1}.
                      </TableCell>
                      <TableCell>
                        {payment.payment_datetime &&
                          format(
                            new Date(payment.payment_datetime),
                            "dd MMM yyyy, hh:mm a",
                          )}
                      </TableCell>
                      <TableCell>
                        {PAYMENT_RECONCILIATION_METHOD_MAP[payment.method] ??
                          payment.method}
                      </TableCell>
                      <TableCell>{payment.reference_number || "--"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        <MonetaryDisplay amount={payment.amount} hideCurrency />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-base text-gray-950 mr-3">
                {t("amount_paid")} :
              </span>
              <MonetaryDisplay
                amount={totalPaid}
                className="text-base text-gray-950 font-semibold"
              />
            </div>
          </div>
        )}

        {/* Notes */}
        {appointment.note && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm border-b border-gray-200 pb-1">
              {t("note")}
            </h3>
            <div className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded">
              {appointment.note}
            </div>
          </div>
        )}

        <Separator className="my-4" />

        {/* Footer */}
        <PrintFooter
          rightContent={format(new Date(), "PP 'at' p")}
          leftContent={
            <>
              <span className="font-semibold">{t("last_updated_by")}: </span>
              {formatName(appointment.updated_by)}
            </>
          }
          className="text-xs"
        />
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
  width = "w-32",
}: DetailRowProps) => {
  return (
    <div className="flex">
      <span className={cn("text-gray-700", width)}>{label}</span>
      <span className="text-gray-950 font-semibold">: </span>
      <span
        className={cn("ml-1 whitespace-pre-wrap text-gray-950", {
          "font-semibold": isStrong,
        })}
      >
        {value}
      </span>
    </div>
  );
};
