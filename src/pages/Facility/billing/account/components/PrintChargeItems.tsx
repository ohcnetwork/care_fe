import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";

import PrintPreview from "@/CAREUI/misc/PrintPreview";
import query from "@/Utils/request/query";
import { formatDateTime, formatPatientAge } from "@/Utils/utils";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paymentmethodMap } from "@/pages/Facility/billing/paymentReconciliation/PaymentsData";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import accountApi from "@/types/billing/account/accountApi";
import {
  ChargeItemRead,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import {
  PaymentReconciliationRead,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import patientApi from "@/types/emr/patient/patientApi";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import { formatPhoneNumberIntl } from "react-phone-number-input";

interface DetailRowProps {
  label: string;
  value?: string | null;
  isStrong?: boolean;
}

const DetailRow = ({ label, value, isStrong = false }: DetailRowProps) => {
  return (
    <div className="flex">
      <span className="text-gray-600 w-32">{label}</span>
      <span className="text-gray-600">: </span>
      <span
        className={`ml-1 whitespace-pre-wrap ${isStrong ? "font-semibold" : ""}`}
      >
        {value || "-"}
      </span>
    </div>
  );
};

export const PrintChargeItems = (props: {
  facilityId: string;
  accountId: string;
}) => {
  const { facilityId, accountId } = props;
  const { facility } = useCurrentFacility();
  const { t } = useTranslation();
  const [hideCategories, setHideCategories] = useState(false);
  const [hidePaymentTypeGrouping, setHidePaymentTypeGrouping] = useState(false);
  const [summaryMode, setSummaryMode] = useState(false);

  const hideCategoryLabel = `${t("hide_category_grouping")}`;
  const hidePaymentTypeLabel = `${t("hide_payment_type_grouping")}`;
  const summaryLabel = `${t("summary")}`;

  const { data: account } = useQuery({
    queryKey: ["account", accountId],
    queryFn: query(accountApi.retrieveAccount, {
      pathParams: { facilityId, accountId },
    }),
  });

  const { data: patient } = useQuery({
    queryKey: ["patient", account?.patient?.id],
    queryFn: query(patientApi.get, {
      pathParams: { id: account?.patient?.id || "" },
    }),
    enabled: !!account?.patient?.id,
  });

  const { data: chargeItems, isLoading } = useQuery({
    queryKey: ["chargeItems", accountId],
    queryFn: query.paginated(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
      },
      pageSize: 100,
    }),
  });

  const { data: paymentsResponse, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["payments", accountId],
    queryFn: query.paginated(
      paymentReconciliationApi.listPaymentReconciliation,
      {
        pathParams: { facilityId },
        queryParams: {
          account: accountId,
          ordering: "-payment_datetime",
        },
        pageSize: 100,
      },
    ),
  });

  const payments =
    (paymentsResponse?.results as PaymentReconciliationRead[]) || [];

  if (isLoading || isLoadingPayments) return <Loading />;

  if (!chargeItems?.results) {
    return (
      <div className="flex h-[200px] items-center justify-center  border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_charge_items_found_for_this_account")}
      </div>
    );
  }

  return (
    <PrintPreview
      title={t("charge_items")}
      disabled={!chargeItems?.results?.length}
    >
      <div className="no-print mb-4 flex justify-between items-center gap-2 p-4 bg-gray-50  border rounded-md border-gray-200">
        <div className="gap-2 flex items-center">
          <Switch
            id="summary-mode"
            checked={summaryMode}
            onCheckedChange={setSummaryMode}
          />
          <label htmlFor="summary-mode" className="cursor-pointer text-sm">
            {summaryLabel}
          </label>
        </div>

        {!summaryMode && (
          <>
            <div className="gap-2 flex items-center">
              <Switch
                id="hide-categories"
                checked={hideCategories}
                onCheckedChange={setHideCategories}
              />
              <label
                htmlFor="hide-categories"
                className="cursor-pointer text-sm"
              >
                {hideCategoryLabel}
              </label>
            </div>

            {payments.length > 0 && (
              <div className="gap-2 flex items-center">
                <Switch
                  id="hide-payment-type-grouping"
                  checked={hidePaymentTypeGrouping}
                  onCheckedChange={setHidePaymentTypeGrouping}
                />
                <label
                  htmlFor="hide-payment-type-grouping"
                  className="cursor-pointer text-sm"
                >
                  {hidePaymentTypeLabel}
                </label>
              </div>
            )}
          </>
        )}
      </div>
      <div className="md:p-2 max-w-4xl mx-auto">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200">
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain mb-2 sm:mb-0 sm:order-2"
            />
            <div className="text-center sm:text-left sm:order-1">
              <h1 className="text-3xl font-semibold">{facility?.name}</h1>
              {facility?.address && (
                <div className="text-gray-500 whitespace-pre-wrap break-words text-sm">
                  {facility.address}
                  {facility.phone_number && (
                    <p className="text-gray-500 text-sm">
                      {facility.phone_number}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 print:grid-cols-2 gap-x-12 gap-y-6 mb-8">
            <div className="space-y-3">
              <DetailRow label={t("patient")} value={patient?.name} isStrong />
              <DetailRow
                label={`${t("age")} / ${t("sex")}`}
                value={
                  patient
                    ? `${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`
                    : undefined
                }
                isStrong
              />
              <DetailRow
                label={`${t("address")}`}
                value={patient?.address}
                isStrong
              />
            </div>
            <div className="space-y-3">
              <DetailRow
                label={`${t("date")}`}
                value={formatDateTime(new Date(), "DD-MM-YYYY, hh:mm A")}
                isStrong
              />
              {patient?.instance_identifiers
                ?.filter(
                  ({ config }) =>
                    config.config.use === PatientIdentifierUse.official,
                )
                .map((identifier) => (
                  <DetailRow
                    key={identifier.config.id}
                    label={identifier.config.config.display}
                    value={identifier.value}
                    isStrong
                  />
                ))}
              <DetailRow
                label={t("mobile_number")}
                value={patient && formatPhoneNumberIntl(patient.phone_number)}
                isStrong
              />
            </div>
          </div>

          {chargeItems?.results && chargeItems?.results?.length > 0 && (
            <div className="mt-2">
              <div className="overflow-hidden  border rounded-md border-gray-200">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-transparent hover:bg-transparent border-b-gray-200">
                      {summaryMode ? (
                        <>
                          <TableHead className="font-bold" colSpan={5}>
                            {t("category")}
                          </TableHead>
                          <TableHead className="font-bold text-right w-32">
                            {t("amount")}
                          </TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="font-bold">
                            {t("date")}
                          </TableHead>
                          <TableHead className="font-bold w-24">
                            {t("invoice_no")}
                          </TableHead>
                          <TableHead className="font-bold w-24">
                            {t("title")}
                          </TableHead>
                          <TableHead className="font-bold text-center w-28">
                            {t("rate")}
                          </TableHead>
                          <TableHead className="font-bold text-right w-24">
                            {t("quantity")}
                          </TableHead>
                          <TableHead className="font-bold text-right w-32">
                            {t("amount")}
                          </TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Group charge items by category, excluding entered_in_error items
                      const validItems = chargeItems.results.filter(
                        (item) =>
                          item.status !== ChargeItemStatus.entered_in_error,
                      );

                      const groups = validItems.reduce(
                        (
                          acc: Record<string, ChargeItemRead[]>,
                          item: ChargeItemRead,
                        ) => {
                          const categoryTitle =
                            item.charge_item_definition?.category?.title ||
                            t("uncategorized");
                          const list = acc[categoryTitle] ?? [];
                          list.push(item);
                          acc[categoryTitle] = list;
                          return acc;
                        },
                        {} as Record<string, ChargeItemRead[]>,
                      );

                      // Sort categories alphabetically
                      const sortedCategories = Object.keys(groups).sort();

                      const rows: React.ReactNode[] = [];

                      sortedCategories.forEach((categoryTitle) => {
                        const items: ChargeItemRead[] =
                          groups[categoryTitle] ?? [];
                        const categoryTotal = items
                          .reduce(
                            (sum: number, item: ChargeItemRead) =>
                              sum + Number(item.total_price ?? 0),
                            0,
                          )
                          .toFixed(2);

                        if (summaryMode) {
                          // In summary mode, show only category with total
                          rows.push(
                            <TableRow
                              key={`category-${categoryTitle}`}
                              className="bg-transparent hover:bg-transparent"
                            >
                              <TableCell
                                colSpan={5}
                                className="font-semibold capitalize"
                              >
                                {categoryTitle}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                <MonetaryDisplay amount={categoryTotal} />
                              </TableCell>
                            </TableRow>,
                          );
                        } else {
                          // Normal mode - show header, items, and subtotal
                          // Add category header (only if not hiding categories)
                          if (!hideCategories) {
                            rows.push(
                              <TableRow
                                key={`category-${categoryTitle}`}
                                className="bg-transparent"
                              >
                                <TableCell
                                  colSpan={7}
                                  className="font-semibold capitalize bg-gray-50"
                                >
                                  {categoryTitle}
                                </TableCell>
                              </TableRow>,
                            );
                          }

                          items.forEach((chargeItem: ChargeItemRead) => {
                            const unitPrice =
                              chargeItem.unit_price_components.find(
                                (c) =>
                                  c.monetary_component_type ===
                                  MonetaryComponentType.base,
                              )?.amount;
                            rows.push(
                              <TableRow
                                key={chargeItem.id}
                                className="bg-transparent hover:bg-transparent"
                              >
                                <TableCell>
                                  {formatDateTime(
                                    chargeItem.created_date,
                                    "DD/MM/YY",
                                  )}
                                </TableCell>
                                <TableCell>
                                  {chargeItem.paid_invoice?.number || "-"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {chargeItem.title}
                                    </span>
                                    {chargeItem.description && (
                                      <span className="text-xs text-gray-600 whitespace-pre-wrap">
                                        {chargeItem.description}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <MonetaryDisplay amount={unitPrice} />
                                </TableCell>
                                <TableCell className="text-right">
                                  {Math.floor(Number(chargeItem.quantity))}
                                </TableCell>
                                <TableCell className="text-right">
                                  <MonetaryDisplay
                                    amount={chargeItem.total_price}
                                  />
                                </TableCell>
                              </TableRow>,
                            );
                          });

                          // Add category subtotal (only if not hiding categories)
                          if (!hideCategories) {
                            rows.push(
                              <TableRow
                                key={`subtotal-${categoryTitle}`}
                                className="font-semibold bg-gray-50"
                              >
                                <TableCell
                                  colSpan={5}
                                  className="text-right pr-2"
                                >
                                  {t("total")}
                                </TableCell>
                                <TableCell className="text-right">
                                  <MonetaryDisplay amount={categoryTotal} />
                                </TableCell>
                              </TableRow>,
                            );
                          }
                        }
                      });

                      // Add grand total
                      rows.push(
                        <TableRow
                          key="grand-total"
                          className="bg-muted/30 font-semibold"
                        >
                          <TableCell colSpan={5} className="text-right pr-2">
                            {t("net_total")}
                          </TableCell>
                          <TableCell className="text-right">
                            <MonetaryDisplay
                              amount={validItems
                                .reduce(
                                  (sum, item) =>
                                    sum + Number(item.total_price ?? 0),
                                  0,
                                )
                                .toFixed(2)}
                            />
                          </TableCell>
                        </TableRow>,
                      );
                      return rows;
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {payments.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-200">
                {t("payment_details")}
              </h2>
              <div className="overflow-hidden  border rounded-md border-gray-200">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      {summaryMode ? (
                        <>
                          <TableHead className="font-bold" colSpan={2}>
                            {t("type")}
                          </TableHead>
                          <TableHead className="font-bold text-right w-32">
                            {t("amount")}
                          </TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="font-bold w-32">
                            {t("date")}
                          </TableHead>
                          {hidePaymentTypeGrouping && (
                            <TableHead className="font-bold w-32">
                              {t("type")}
                            </TableHead>
                          )}
                          <TableHead className="font-bold w-32">
                            {t("method")}
                          </TableHead>
                          <TableHead className="font-bold text-right w-32">
                            {t("amount")}
                          </TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const validPayments = payments.filter(
                        (payment) =>
                          payment.status === PaymentReconciliationStatus.active,
                      );

                      const paymentGroups = validPayments.reduce(
                        (
                          acc: Record<string, PaymentReconciliationRead[]>,
                          payment: PaymentReconciliationRead,
                        ) => {
                          const type = payment.reconciliation_type;
                          const list = acc[type] ?? [];
                          list.push(payment);
                          acc[type] = list;
                          return acc;
                        },
                        {} as Record<string, PaymentReconciliationRead[]>,
                      );

                      const sortedTypes = Object.keys(paymentGroups).sort();

                      const rows: React.ReactNode[] = [];

                      sortedTypes.forEach((paymentType) => {
                        const paymentsOfType: PaymentReconciliationRead[] =
                          paymentGroups[paymentType] ?? [];
                        const typeTotal = paymentsOfType
                          .reduce(
                            (sum: number, payment: PaymentReconciliationRead) =>
                              sum + Number(payment.amount ?? 0),
                            0,
                          )
                          .toFixed(2);

                        if (summaryMode) {
                          // In summary mode, show only payment type with total
                          rows.push(
                            <TableRow
                              key={`payment-type-${paymentType}`}
                              className="bg-transparent hover:bg-transparent"
                            >
                              <TableCell
                                colSpan={2}
                                className="font-semibold capitalize"
                              >
                                {t(paymentType)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                <MonetaryDisplay amount={typeTotal} />
                              </TableCell>
                            </TableRow>,
                          );
                        } else {
                          // Normal mode - show header, items, and subtotal
                          // Add payment type header (only if not hiding grouping)
                          if (!hidePaymentTypeGrouping) {
                            rows.push(
                              <TableRow
                                key={`payment-type-${paymentType}`}
                                className="bg-transparent"
                              >
                                <TableCell
                                  colSpan={3}
                                  className="text-left font-semibold capitalize bg-gray-50"
                                >
                                  {t(paymentType)}
                                </TableCell>
                              </TableRow>,
                            );
                          }

                          paymentsOfType.forEach(
                            (payment: PaymentReconciliationRead) => {
                              rows.push(
                                <TableRow
                                  key={payment.id}
                                  className="bg-transparent hover:bg-transparent"
                                >
                                  <TableCell>
                                    {payment.payment_datetime
                                      ? formatDateTime(
                                          payment.payment_datetime,
                                          "DD-MM-YY",
                                        )
                                      : "-"}
                                  </TableCell>
                                  {hidePaymentTypeGrouping && (
                                    <TableCell className="text-left capitalize">
                                      {t(payment.reconciliation_type)}
                                    </TableCell>
                                  )}
                                  <TableCell>
                                    {paymentmethodMap[payment.method]}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <MonetaryDisplay amount={payment.amount} />
                                  </TableCell>
                                </TableRow>,
                              );
                            },
                          );

                          // Add payment type subtotal (only if not hiding grouping)
                          if (!hidePaymentTypeGrouping) {
                            rows.push(
                              <TableRow
                                key={`subtotal-${paymentType}`}
                                className="font-semibold bg-gray-50"
                              >
                                <TableCell
                                  colSpan={2}
                                  className="text-right pr-2"
                                >
                                  {t("total")}
                                </TableCell>
                                <TableCell className="text-right">
                                  <MonetaryDisplay amount={typeTotal} />
                                </TableCell>
                              </TableRow>,
                            );
                          }
                        }
                      });

                      // Add grand total
                      rows.push(
                        <TableRow
                          key="grand-total"
                          className="bg-muted/30 font-semibold"
                        >
                          <TableCell
                            colSpan={hidePaymentTypeGrouping ? 3 : 2}
                            className="text-right pr-2"
                          >
                            {t("total_paid")}
                          </TableCell>
                          <TableCell className="text-right">
                            <MonetaryDisplay
                              amount={validPayments
                                .reduce(
                                  (sum, payment) =>
                                    sum + Number(payment.amount ?? 0),
                                  0,
                                )
                                .toFixed(2)}
                            />
                          </TableCell>
                        </TableRow>,
                      );

                      return rows;
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Account Summary Section */}
          {account && (
            <div className="overflow-hidden border rounded-md border-gray-200 mt-8">
              <Table className="w-full border-0">
                <TableHeader>
                  <TableRow className="bg-gray-50 divide-x">
                    <TableHead className="text-center font-bold">
                      {t("billed_gross")}
                    </TableHead>
                    <TableHead className="text-center font-bold">
                      {t("total_paid")}
                    </TableHead>
                    <TableHead className="text-center font-bold">
                      {t("amount_due")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-transparent hover:bg-transparent divide-x">
                    <TableCell className="text-center">
                      <MonetaryDisplay amount={account.total_gross} />
                    </TableCell>
                    <TableCell className="text-center">
                      <MonetaryDisplay amount={account.total_paid} />
                    </TableCell>
                    <TableCell className="text-center">
                      <MonetaryDisplay amount={account.total_balance} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </PrintPreview>
  );
};
