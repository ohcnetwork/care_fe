import { format } from "date-fns";
import type Decimal from "decimal.js";
import type { TFunction } from "i18next";

import {
  getCurrencySymbol,
  numberFormatter,
  numberFormatterWithoutCurrency,
} from "@/components/ui/monetary-display";

import { formatPatientAddress } from "@/components/Patient/utils";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  type ChargeItemRead,
  ChargeItemServiceResource,
} from "@/types/billing/chargeItem/chargeItem";
import type { InvoiceRead } from "@/types/billing/invoice/invoice";
import {
  PAYMENT_RECONCILIATION_METHOD_MAP,
  type PaymentReconciliationRead,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import type { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import {
  type PatientRead,
  getPatientIdentifiers,
} from "@/types/emr/patient/patient";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import { add, multiply, round, toNumber } from "@/Utils/decimal";
import { formatName, formatPatientAge } from "@/Utils/utils";

/** A dispensed medicine's title is the product name, with lot and expiry as a subtitle. */
export function getChargeItemTitle(
  item: ChargeItemRead,
  dispenseMap: Record<string, MedicationDispenseRead | undefined>,
  t: TFunction,
): { title: string; subtitle: string | null } {
  const dispense =
    item.service_resource === ChargeItemServiceResource.medication_dispense &&
    item.service_resource_id
      ? dispenseMap[item.service_resource_id]
      : undefined;

  if (!dispense) return { title: item.title, subtitle: null };

  const medicineName = dispense.item?.product?.product_knowledge?.name;
  const lotNumber = dispense.item?.product?.batch?.lot_number;
  const expiryDate = dispense.item?.product?.expiration_date;

  const details = [
    lotNumber && `${t("lot")}: ${lotNumber}`,
    expiryDate &&
      `${t("expiry")}: ${format(new Date(expiryDate), "dd/MM/yyyy")}`,
  ].filter(Boolean);

  return {
    title: medicineName || item.title,
    subtitle: details.length ? details.join(" | ") : null,
  };
}

export interface InvoicePrintContent {
  labels: Record<string, string>;
  number: string;
  issue_date: string;
  patient: {
    name: string;
    gender_age: string;
    identifiers: { label: string; value: string }[];
    address: string | null;
  };
  qr_code: string | null;
  tax_columns: string[];
  items: {
    index: number;
    title: string;
    subtitle: string | null;
    unit_price: string;
    quantity: string;
    discount: { total: string; parts: string[] };
    taxes: { total: string; unit: string | null }[];
    total: string;
  }[];
  totals: {
    components: { label: string; value: string; muted?: boolean }[];
    net: string;
    gross: string;
  };
  payments: TransactionsContent | null;
  credit_notes: TransactionsContent | null;
  payment_terms: string | null;
  created_by: string;
  location: string | null;
}

interface TransactionsContent {
  rows: {
    index: number;
    datetime: string;
    id: string;
    method: string;
    reference: string;
    amount: string;
  }[];
  total: string;
}

type Amount = string | number | Decimal | null | undefined;

/** Formats like `<MonetaryDisplay>`: an amount, a percentage, or "-". */
function formatMonetary(
  { amount, factor }: { amount?: Amount; factor?: Amount },
  { hideCurrency = false } = {},
) {
  if ((amount ?? factor) == null) return "-";
  const formatter = hideCurrency
    ? numberFormatterWithoutCurrency
    : numberFormatter;
  return [
    amount != null && formatter.format(toNumber(round(amount))),
    factor != null && `${round(factor)}%`,
  ]
    .filter(Boolean)
    .join("");
}

const byType =
  (type: MonetaryComponentType) =>
  (c: { monetary_component_type: MonetaryComponentType }) =>
    c.monetary_component_type === type;

function getTaxCodes(items: ChargeItemRead[]) {
  const codes = new Map<string, string | undefined>();
  for (const item of items) {
    for (const component of item.unit_price_components ?? []) {
      if (
        component.monetary_component_type === MonetaryComponentType.tax &&
        component.code?.code &&
        !codes.has(component.code.code)
      ) {
        codes.set(component.code.code, component.code.display);
      }
    }
  }
  return Array.from(codes, ([code, display]) => ({ code, display }));
}

function buildTransactions(
  transactions: PaymentReconciliationRead[] | undefined,
  total: Amount,
  { negateCreditNotes }: { negateCreditNotes: boolean },
): TransactionsContent | null {
  const active = (transactions ?? []).filter(
    (p) => p.status === PaymentReconciliationStatus.active,
  );
  if (active.length === 0) return null;

  return {
    rows: active.map((payment, index) => ({
      index: index + 1,
      datetime: payment.payment_datetime
        ? format(new Date(payment.payment_datetime), "d MMM yyyy, hh:mm a")
        : "-",
      id: payment.id,
      method: PAYMENT_RECONCILIATION_METHOD_MAP[payment.method] ?? "",
      reference: payment.reference_number ?? "",
      amount: formatMonetary(
        {
          amount:
            negateCreditNotes && payment.is_credit_note
              ? multiply(payment.amount, -1)
              : payment.amount,
        },
        { hideCurrency: true },
      ),
    })),
    total: formatMonetary({ amount: total }),
  };
}

export function buildInvoicePrintContent({
  invoice,
  verifiedPatient,
  dispenseMap,
  qrCodePath,
  t,
}: {
  invoice: InvoiceRead;
  verifiedPatient: PatientRead | undefined;
  dispenseMap: Record<string, MedicationDispenseRead | undefined>;
  qrCodePath: string | null;
  t: TFunction;
}): InvoicePrintContent {
  const currency = getCurrencySymbol();
  const patient = invoice.account.patient;
  const taxCodes = getTaxCodes(invoice.charge_items);
  const totalComponents = invoice.total_price_components ?? [];

  const signed =
    (sign: string, typeLabel: string) =>
    (component: (typeof totalComponents)[number]) => ({
      label: `${component.code ? `${component.code.display} ` : ""}(${typeLabel})`,
      value: `${sign} ${formatMonetary(component)}`,
      muted: true,
    });

  return {
    labels: {
      invoice: t("invoice"),
      issue_date: t("issue_date"),
      bill_to: t("bill_to"),
      patient: t("patient"),
      address: t("address"),
      no_address_provided: t("no_address_provided"),
      item: t("item"),
      unit_price: `${t("unit_price")} (${currency})`,
      qty: t("qty"),
      discount: t("discount"),
      total: `${t("total")} (${currency})`,
      no_charge_items: t("no_charge_items"),
      net_amount: t("net_amount"),
      grand_total: t("total"),
      date_and_time: t("date_and_time"),
      payment_method: t("payment_method"),
      reference: t("reference"),
      amount: `${t("amount")} (${currency})`,
      total_received: t("total_received"),
      credit_notes_title: t("credit_notes_issued_against_this_invoice"),
      total_credit_notes: t("total_credit_notes"),
      payment_terms: t("payment_terms"),
      created_by: t("created_by"),
      location: t("location"),
    },
    number: invoice.number,
    issue_date: invoice.issue_date
      ? format(new Date(invoice.issue_date), "dd MMM, yyyy h:mm a")
      : "-",
    patient: {
      name: patient.name,
      gender_age: `${t(`GENDER__${patient.gender}`)}, ${formatPatientAge(patient, true)}`,
      identifiers: getPatientIdentifiers(verifiedPatient, {
        use: PatientIdentifierUse.official,
      }).map((identifier) => ({
        label: identifier.config.config.display,
        value: identifier.value,
      })),
      address: formatPatientAddress(patient.address) || null,
    },
    qr_code: qrCodePath,
    tax_columns: taxCodes.map(({ code, display }) =>
      t(code, { defaultValue: display || code }),
    ),
    items: invoice.charge_items.map((item, index) => {
      const { title, subtitle } = getChargeItemTitle(item, dispenseMap, t);
      const discount = byType(MonetaryComponentType.discount);
      return {
        index: index + 1,
        title,
        subtitle,
        unit_price: formatMonetary(
          {
            amount:
              item.unit_price_components?.find(
                byType(MonetaryComponentType.base),
              )?.amount || "0",
          },
          { hideCurrency: true },
        ),
        quantity: round(item.quantity),
        discount: {
          total: formatMonetary(
            {
              amount: add(
                ...item.total_price_components
                  .filter(discount)
                  .map((c) => c.amount || "0"),
              ),
            },
            { hideCurrency: true },
          ),
          parts: item.unit_price_components
            .filter(discount)
            .map((c) => formatMonetary(c, { hideCurrency: true })),
        },
        taxes: taxCodes.map(({ code }) => {
          const total = item.total_price_components.find(
            (c) => c.code?.code === code,
          )?.amount;
          const unit = item.unit_price_components.find(
            (c) => c.code?.code === code,
          );
          return {
            total: formatMonetary({ amount: total }, { hideCurrency: true }),
            unit: total
              ? formatMonetary(unit ?? {}, { hideCurrency: true })
              : null,
          };
        }),
        total: formatMonetary(
          { amount: item.total_price },
          { hideCurrency: true },
        ),
      };
    }),
    totals: {
      components: [
        ...totalComponents
          .filter(byType(MonetaryComponentType.base))
          .map((component) => ({
            label: `${component.code?.display || t("base_amount")}:`,
            value: formatMonetary({ amount: component.amount }),
          })),
        ...totalComponents
          .filter(byType(MonetaryComponentType.surcharge))
          .map(signed("+", t("surcharge"))),
        ...totalComponents
          .filter(byType(MonetaryComponentType.discount))
          .map(signed("-", t("discount"))),
        ...totalComponents
          .filter(byType(MonetaryComponentType.tax))
          .map(signed("+", t("tax"))),
      ],
      net: formatMonetary({ amount: invoice.total_net }),
      gross: formatMonetary({ amount: invoice.total_gross }),
    },
    payments: buildTransactions(invoice.payments, invoice.total_payments, {
      negateCreditNotes: true,
    }),
    credit_notes: buildTransactions(
      invoice.credit_notes,
      invoice.total_credit_notes,
      { negateCreditNotes: false },
    ),
    payment_terms: invoice.payment_terms || null,
    created_by: formatName(invoice.created_by),
    location: invoice.payments?.[0]?.location?.name ?? null,
  };
}

/** Data for src/print/templates/invoices.typ. */
export interface InvoicesPrintContent {
  invoices: InvoicePrintContent[];
}

/** The patient's QR code is printed once, with the first invoice. */
export function buildInvoicesPrintContent({
  invoices,
  verifiedPatients,
  dispenseMap,
  qrCodePath,
  t,
}: {
  invoices: InvoiceRead[];
  verifiedPatients: Map<string, PatientRead | undefined>;
  dispenseMap: Record<string, MedicationDispenseRead | undefined>;
  qrCodePath: string;
  t: TFunction;
}): InvoicesPrintContent {
  return {
    invoices: invoices.map((invoice, index) =>
      buildInvoicePrintContent({
        invoice,
        verifiedPatient: verifiedPatients.get(invoice.account.patient.id),
        dispenseMap,
        qrCodePath: index === 0 ? qrCodePath : null,
        t,
      }),
    ),
  };
}
