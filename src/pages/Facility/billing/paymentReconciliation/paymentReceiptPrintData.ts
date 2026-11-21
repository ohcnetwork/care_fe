import type { TFunction } from "i18next";

import { formatAmount } from "@/print/formatAmount";
import type { PrintDetailRow } from "@/print/patientDetails";
import {
  PAYMENT_RECONCILIATION_METHOD_MAP,
  type PaymentReconciliationRead,
  getPaymentTypeLabelKey,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import { getPatientIdentifiers } from "@/types/emr/patient/patient";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";

export interface PaymentReceiptPrintContent {
  labels: Record<string, string>;
  title: string;
  outcome: string;
  details: { left: PrintDetailRow[]; right: PrintDetailRow[] };
  invoice: { header: string[]; row: string[] } | null;
  breakdown: { header: string[]; row: string[] };
  totals: { label: string; value: string; strong?: boolean; muted?: boolean }[];
  note: string | null;
  footer: { left: string; right: string | null };
}

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export function buildPaymentReceiptPrintContent({
  payment,
  t,
}: {
  payment: PaymentReconciliationRead;
  t: TFunction;
}): PaymentReceiptPrintContent {
  const patient = payment.account.patient;
  const title = t(
    payment.is_credit_note ? "refund_receipt" : "payment_receipt",
  );

  return {
    labels: { notes: t("notes") },
    title,
    outcome: capitalize(payment.outcome),
    details: {
      left: [
        { label: t("name"), value: patient.name },
        {
          label: `${t("age")} / ${t("sex")}`,
          value: `${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`,
        },
        { label: t("address"), value: patient.address ?? null },
      ],
      right: [
        {
          label: t("date"),
          value: formatDateTime(payment.created_date, "DD-MM-YYYY"),
        },
        { label: t("payment_id"), value: payment.id },
        ...getPatientIdentifiers(patient, {
          use: PatientIdentifierUse.official,
        }).map((identifier) => ({
          label: identifier.config.config.display,
          value: identifier.value,
        })),
        {
          label: t("payment_method"),
          value: PAYMENT_RECONCILIATION_METHOD_MAP[payment.method] ?? null,
        },
      ],
    },
    invoice: payment.target_invoice
      ? {
          header: [t("invoice_no"), t("status"), t("amount")],
          row: [
            payment.target_invoice.number,
            payment.target_invoice.status,
            formatAmount(payment.target_invoice.total_gross),
          ],
        }
      : null,
    breakdown: {
      header: [t("type"), t("kind"), t("issuer_type"), t("amount")],
      row: [
        t(
          getPaymentTypeLabelKey(
            payment.reconciliation_type,
            payment.is_credit_note,
          ),
        ),
        capitalize(payment.kind),
        capitalize(payment.issuer_type),
        formatAmount(payment.amount),
      ],
    },
    totals: [
      { label: t("amount"), value: formatAmount(payment.amount), muted: true },
      ...(payment.method === "cash"
        ? [
            {
              label: t("tendered"),
              value: formatAmount(payment.tendered_amount),
              muted: true,
            },
            {
              label: t("returned"),
              value: formatAmount(payment.returned_amount),
              muted: true,
            },
          ]
        : []),
      { label: t("total"), value: formatAmount(payment.amount), strong: true },
    ],
    note: payment.note || null,
    footer: {
      left: `${t("generated_by")} ${formatName(payment.updated_by)}`,
      right: payment.location?.name
        ? `${t("location")}: ${payment.location.name}`
        : null,
    },
  };
}
