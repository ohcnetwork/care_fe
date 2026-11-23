import { format, formatDate } from "date-fns";
import type { TFunction } from "i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { formatSlotTimeRange } from "@/pages/Appointments/utils";
import { formatAmount } from "@/print/formatAmount";
import type { PrintDetailRow } from "@/print/patientDetails";
import {
  ChargeItemStatus,
  EXCLUDED_CHARGE_ITEM_STATUSES,
  type ChargeItemRead,
} from "@/types/billing/chargeItem/chargeItem";
import type { InvoiceRead } from "@/types/billing/invoice/invoice";
import {
  PAYMENT_RECONCILIATION_METHOD_MAP,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import { getPatientIdentifiers } from "@/types/emr/patient/patient";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import type { AppointmentRead } from "@/types/scheduling/schedule";
import { formatScheduleResourceName } from "@/types/scheduling/schedule";
import { renderTokenNumber } from "@/types/tokens/token/token";
import { add } from "@/Utils/decimal";
import { formatName, formatPatientAge } from "@/Utils/utils";

export interface AppointmentPrintContent {
  title: string;
  date: string;
  resource: string;
  patient_rows: PrintDetailRow[];
  token: { label: string; value: string } | null;
  qr_code: string | null;
  tags: { label: string; value: string } | null;
  charges: {
    title: string;
    header: string[];
    rows: {
      index: string;
      title: string;
      subtitle: string | null;
      amount: string;
      status: string;
    }[];
    total: { label: string; value: string };
  } | null;
  payments: {
    title: string;
    header: string[];
    rows: {
      index: string;
      invoice: string;
      invoice_time: string | null;
      method: string;
      reference: string | null;
      amount: string;
    }[];
    total: { label: string; value: string };
  } | null;
  note: { label: string; text: string } | null;
  footer: { left: string; right: string };
}

export function buildAppointmentPrintContent({
  appointment,
  chargeItems,
  invoices,
  extensionFields,
  qrCodePath,
  t,
}: {
  appointment: AppointmentRead;
  chargeItems: ChargeItemRead[];
  invoices: InvoiceRead[];
  extensionFields: { name: string; value: string }[];
  qrCodePath: string | null;
  t: TFunction;
}): AppointmentPrintContent {
  const patient = appointment.patient;
  const token = appointment.token;

  const displayChargeItems = chargeItems.filter(
    (item) => !EXCLUDED_CHARGE_ITEM_STATUSES.includes(item.status),
  );

  const payments = invoices.flatMap((invoice) =>
    (invoice.payments ?? [])
      .filter(
        (payment) =>
          payment.status === PaymentReconciliationStatus.active &&
          !payment.is_credit_note,
      )
      .map((payment) => ({ ...payment, invoiceNumber: invoice.number })),
  );

  const tags = [...(patient.instance_tags ?? []), ...(appointment.tags ?? [])];

  return {
    title: t("appointment_details"),
    date: `${formatDate(appointment.token_slot.start_datetime, "dd MMM, yyyy, EEE")} | ${formatSlotTimeRange(appointment.token_slot)}`,
    resource: `${t(`schedulable_resource__${appointment.resource_type}`)}: ${formatScheduleResourceName(appointment)} | ${appointment.token_slot.availability.name}`,
    patient_rows: [
      {
        label: t("patient"),
        value: `${patient.name} | ${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`,
      },
      ...extensionFields.map((field) => ({
        label: t(field.name),
        value: field.value,
      })),
      {
        label: t("contact_system_phone"),
        value: patient.phone_number
          ? formatPhoneNumberIntl(patient.phone_number) || patient.phone_number
          : null,
      },
      ...getPatientIdentifiers(patient, {
        use: PatientIdentifierUse.official,
      }).map((identifier) => ({
        label: identifier.config.config.display,
        value: identifier.value,
      })),
      ...(patient.address?.trim()
        ? [{ label: t("address"), value: patient.address }]
        : []),
    ],
    token: token
      ? { label: t("token_no"), value: renderTokenNumber(token) }
      : null,
    qr_code: qrCodePath,
    tags: tags.length
      ? {
          label: t("tags"),
          value: tags.map((tag) => getTagHierarchyDisplay(tag)).join(", "),
        }
      : null,
    charges: displayChargeItems.length
      ? {
          title: t("charges"),
          header: ["#", t("particulars"), t("amount"), t("status")],
          rows: displayChargeItems.map((item, index) => ({
            index: `${index + 1}.`,
            title: item.title,
            subtitle: item.paid_invoice?.number ?? null,
            amount: formatAmount(item.total_price).replace(/^₹/, ""),
            status: item.status === ChargeItemStatus.paid ? t("paid") : "-",
          })),
          total: {
            label: `${t("total_amount")} :`,
            value: formatAmount(
              add(...displayChargeItems.map((item) => item.total_price)),
            ),
          },
        }
      : null,
    payments: payments.length
      ? {
          title: t("payment_details"),
          header: ["#", t("invoice"), t("payment_method"), t("amount")],
          rows: payments.map((payment, index) => ({
            index: `${index + 1}.`,
            invoice: payment.invoiceNumber,
            invoice_time: payment.payment_datetime
              ? format(
                  new Date(payment.payment_datetime),
                  "dd MMM yyyy, hh:mm a",
                )
              : null,
            method:
              PAYMENT_RECONCILIATION_METHOD_MAP[payment.method] ??
              payment.method,
            reference: payment.reference_number || null,
            amount: formatAmount(payment.amount).replace(/^₹/, ""),
          })),
          total: {
            label: `${t("amount_paid")} :`,
            value: formatAmount(add(...payments.map((p) => p.amount))),
          },
        }
      : null,
    note: appointment.note
      ? { label: t("note"), text: appointment.note }
      : null,
    footer: {
      left: `${t("created_by")}: ${formatName(appointment.created_by)} | ${t("last_updated_by")}: ${formatName(appointment.updated_by)}`,
      right: format(new Date(), "PP 'at' p"),
    },
  };
}
