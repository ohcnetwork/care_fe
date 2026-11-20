import { format } from "date-fns";
import type Decimal from "decimal.js";
import type { TFunction } from "i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { formatAmount } from "@/print/formatAmount";
import type { PrintDetailRow } from "@/print/patientDetails";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import type { AccountRead } from "@/types/billing/account/Account";
import type { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import {
  PAYMENT_RECONCILIATION_METHOD_MAP,
  type PaymentReconciliationRead,
  PaymentReconciliationStatus,
  type PaymentReconciliationType,
  getPaymentTypeLabelKey,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import { getPatientIdentifiers } from "@/types/emr/patient/patient";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import { add, multiply, round } from "@/Utils/decimal";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";

export interface ChargeItemsPrintOptions {
  summaryMode: boolean;
  hideCategories: boolean;
  hidePaymentTypeGrouping: boolean;
  showCreatedBy: boolean;
  showStatus: boolean;
  groupByParentCategory: boolean;
  selectedCategory: string | null;
}

export interface PrintTableSection {
  title: string | null;
  header: string[];
  /** The column that takes the remaining width. */
  grow: number;
  align: ("left" | "center" | "right")[];
  rows: {
    type: "group" | "item" | "total";
    cells: string[];
    /** Drawn in red: a charge not on an issued or balanced invoice. */
    flagged?: boolean;
  }[];
}

export interface ChargeItemsPrintContent {
  /** When set, this is all that's printed. */
  warning: string | null;
  header_space: boolean;
  details: { left: PrintDetailRow[]; right: PrintDetailRow[] };
  sections: PrintTableSection[];
  account_summary: { header: string[]; row: string[] } | null;
  footer: { left: string; right: string };
}

export function getCategoryTitle(
  item: ChargeItemRead,
  useParentCategory: boolean,
  t: TFunction,
) {
  const category = item.charge_item_definition?.category;
  return useParentCategory
    ? category?.parent?.title || category?.title || t("uncategorized")
    : category?.title || t("uncategorized");
}

const sum = (values: (string | number | Decimal | null | undefined)[]) =>
  add(...values.map((value) => value || 0));

function groupBy<T>(items: T[], key: (item: T) => string) {
  const groups: Record<string, T[]> = {};
  for (const item of items) (groups[key(item)] ??= []).push(item);
  return groups;
}

function buildChargeSection(
  items: ChargeItemRead[],
  title: string | null,
  options: ChargeItemsPrintOptions,
  useParentCategory: boolean,
  t: TFunction,
): PrintTableSection {
  const { summaryMode, hideCategories, showCreatedBy, showStatus } = options;
  const groups = groupBy(items, (item) =>
    getCategoryTitle(item, useParentCategory, t),
  );

  const rows: PrintTableSection["rows"] = [];
  for (const category of Object.keys(groups).sort()) {
    const categoryItems = groups[category];
    if (summaryMode || !hideCategories) {
      rows.push({
        type: "group",
        cells: [
          category,
          formatAmount(sum(categoryItems.map((i) => i.total_price))),
        ],
      });
    }
    if (summaryMode) continue;

    for (const item of categoryItems) {
      const unitPrice = item.unit_price_components.find(
        (c) => c.monetary_component_type === MonetaryComponentType.base,
      )?.amount;
      const invoiceStatus = item.paid_invoice?.status;
      rows.push({
        type: "item",
        flagged: !(
          invoiceStatus === InvoiceStatus.issued ||
          invoiceStatus === InvoiceStatus.balanced
        ),
        cells: [
          formatDateTime(item.created_date, "DD/MM/YY"),
          item.paid_invoice?.number ?? "",
          item.title,
          ...(showStatus ? [t(item.status)] : []),
          ...(showCreatedBy ? [item.created_by?.first_name ?? ""] : []),
          formatAmount(unitPrice),
          String(round(item.quantity)),
          formatAmount(item.total_price),
        ],
      });
    }
  }
  rows.push({
    type: "total",
    cells: [t("net_total"), formatAmount(sum(items.map((i) => i.total_price)))],
  });

  if (summaryMode) {
    return {
      title,
      header: [t("category"), t("amount")],
      grow: 0,
      align: ["left", "right"],
      rows,
    };
  }
  return {
    title,
    header: [
      t("date"),
      t("invoice"),
      t("title"),
      ...(showStatus ? [t("status")] : []),
      ...(showCreatedBy ? [t("created_by")] : []),
      t("rate"),
      t("qty"),
      t("amount"),
    ],
    grow: 2,
    align: [
      "left",
      "left",
      "left",
      ...(showStatus ? (["center"] as const) : []),
      ...(showCreatedBy ? (["left"] as const) : []),
      "right",
      "right",
      "right",
    ],
    rows,
  };
}

const signedAmount = (payment: PaymentReconciliationRead) =>
  multiply(payment.amount || 0, payment.is_credit_note ? -1 : 1);

function buildPaymentSection(
  payments: PaymentReconciliationRead[],
  title: string,
  totalLabel: string,
  isReturned: boolean,
  options: ChargeItemsPrintOptions,
  t: TFunction,
): PrintTableSection {
  const { summaryMode, hidePaymentTypeGrouping } = options;
  const groups = groupBy(payments, (payment) => payment.reconciliation_type);

  const rows: PrintTableSection["rows"] = [];
  for (const type of Object.keys(groups).sort()) {
    const typePayments = groups[type];
    if (summaryMode || !hidePaymentTypeGrouping) {
      rows.push({
        type: "group",
        cells: [
          t(
            getPaymentTypeLabelKey(
              type as PaymentReconciliationType,
              isReturned,
            ),
          ),
          formatAmount(sum(typePayments.map(signedAmount))),
        ],
      });
    }
    if (summaryMode) continue;

    for (const payment of typePayments) {
      rows.push({
        type: "item",
        cells: [
          [
            payment.payment_datetime
              ? formatDateTime(payment.payment_datetime, "DD-MM-YY")
              : "",
            payment.id,
          ].join("\n"),
          payment.target_invoice?.number ?? "",
          ...(hidePaymentTypeGrouping
            ? [
                t(
                  getPaymentTypeLabelKey(
                    payment.reconciliation_type,
                    payment.is_credit_note,
                  ),
                ),
              ]
            : []),
          PAYMENT_RECONCILIATION_METHOD_MAP[payment.method] ?? "",
          formatAmount(signedAmount(payment)),
        ],
      });
    }
  }
  rows.push({
    type: "total",
    cells: [totalLabel, formatAmount(sum(payments.map(signedAmount)))],
  });

  if (summaryMode) {
    return {
      title,
      header: [t("type"), t("amount")],
      grow: 0,
      align: ["left", "right"],
      rows,
    };
  }
  return {
    title,
    header: [
      t("date"),
      t("invoice"),
      ...(hidePaymentTypeGrouping ? [t("type")] : []),
      t("method"),
      t("amount"),
    ],
    grow: hidePaymentTypeGrouping ? 3 : 2,
    align: [
      "left",
      "left",
      ...(hidePaymentTypeGrouping ? (["left"] as const) : []),
      "left",
      "right",
    ],
    rows,
  };
}

export function buildChargeItemsPrintContent({
  account,
  chargeItems,
  payments,
  options,
  hideHeader,
  preserveHeaderSpace,
  hasUnissuedChargeItems,
  preparedBy,
  t,
}: {
  account: AccountRead | undefined;
  chargeItems: ChargeItemRead[];
  payments: PaymentReconciliationRead[];
  options: ChargeItemsPrintOptions;
  hideHeader: boolean;
  preserveHeaderSpace: boolean;
  hasUnissuedChargeItems: boolean;
  preparedBy: string;
  t: TFunction;
}): ChargeItemsPrintContent {
  const { summaryMode, selectedCategory } = options;
  const footer = {
    left: `${t("prepared_by")}: ${preparedBy}`,
    right: `${t("generated_on")} ${format(new Date(), "PPP 'at' p")}`,
  };

  if (summaryMode && hasUnissuedChargeItems) {
    return {
      warning: t("unissued_charge_items_summary_warning"),
      header_space: false,
      details: { left: [], right: [] },
      sections: [],
      account_summary: null,
      footer,
    };
  }

  const useParentCategory = options.groupByParentCategory || summaryMode;
  const visibleItems = selectedCategory
    ? chargeItems.filter(
        (item) =>
          getCategoryTitle(item, useParentCategory, t) === selectedCategory,
      )
    : chargeItems;
  const charges = visibleItems.filter((item) => !item.paid_invoice?.is_refund);
  const returned = visibleItems.filter((item) => item.paid_invoice?.is_refund);

  const activePayments = payments.filter(
    (payment) => payment.status === PaymentReconciliationStatus.active,
  );
  const paid = activePayments.filter((payment) => !payment.is_credit_note);
  const refunded = activePayments.filter((payment) => payment.is_credit_note);

  const sections: PrintTableSection[] = [];
  if (chargeItems.length > 0) {
    sections.push(
      buildChargeSection(charges, null, options, useParentCategory, t),
    );
    if (returned.length > 0) {
      sections.push(
        buildChargeSection(
          returned,
          t("returned"),
          options,
          useParentCategory,
          t,
        ),
      );
    }
  }
  if (!selectedCategory) {
    if (paid.length > 0) {
      sections.push(
        buildPaymentSection(
          paid,
          t("payment_details"),
          t("total_paid"),
          false,
          options,
          t,
        ),
      );
    }
    if (refunded.length > 0) {
      sections.push(
        buildPaymentSection(
          refunded,
          t("returned_payments"),
          t("net_total"),
          true,
          options,
          t,
        ),
      );
    }
  }

  const patient = account?.patient;
  const encounter = account?.primary_encounter;
  const localDate = (date?: string | null) =>
    date ? new Date(date).toLocaleDateString("en-IN") : null;

  return {
    warning: null,
    header_space: hideHeader && preserveHeaderSpace,
    details: {
      left: [
        { label: t("name"), value: patient?.name ?? null },
        {
          label: `${t("age")} / ${t("sex")}`,
          value: patient
            ? `${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`
            : null,
        },
        { label: t("address"), value: patient?.address ?? null },
        {
          label: t("mobile_number"),
          value: patient?.phone_number
            ? formatPhoneNumberIntl(patient.phone_number)
            : null,
        },
        ...(encounter?.current_location
          ? [
              {
                label: t("location"),
                value: encounter.current_location.name,
              },
            ]
          : []),
      ],
      right: [
        { label: t("bill_id"), value: account?.id ?? null },
        { label: t("date"), value: formatDateTime(new Date(), "DD-MM-YYYY") },
        ...getPatientIdentifiers(patient, {
          use: PatientIdentifierUse.official,
        }).map((identifier) => ({
          label: identifier.config.config.display,
          value: identifier.value,
        })),
        ...(encounter
          ? [
              {
                label: t("start_date"),
                value: localDate(encounter.period.start),
              },
              { label: t("end_date"), value: localDate(encounter.period.end) },
              ...(encounter.care_team?.[0]
                ? [
                    {
                      label: t("doctor"),
                      value: formatName(encounter.care_team[0].member),
                    },
                  ]
                : []),
            ]
          : []),
      ],
    },
    sections,
    account_summary: account
      ? {
          header: [
            t("billed_gross"),
            t("total_paid"),
            t("amount_due"),
            t("total_billable"),
          ],
          row: [
            formatAmount(account.total_gross),
            formatAmount(account.total_paid),
            formatAmount(account.total_balance),
            formatAmount(account.total_billable_charge_items),
          ],
        }
      : null,
    footer,
  };
}
