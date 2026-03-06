import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { getPermissions } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";

import { DisablingCover } from "@/components/Common/DisablingCover";
import PrintFooter from "@/components/Common/PrintFooter";
import { Button } from "@/components/ui/button";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import useAppHistory from "@/hooks/useAppHistory";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { PAYMENT_RECONCILIATION_METHOD_MAP } from "@/types/billing/paymentReconciliation/paymentReconciliation";

import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import accountApi from "@/types/billing/account/accountApi";
import {
  ChargeItemRead,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import {
  PaymentReconciliationRead,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";

import useFilters from "@/hooks/useFilters";

import { add, multiply, round } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";

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
        {value}
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
  const { goBack } = useAppHistory();
  const { hasPermission } = usePermissions();
  const { canManageLockedInvoice } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );
  const [hideCategories, setHideCategories] = useState(false);
  const [hidePaymentTypeGrouping, setHidePaymentTypeGrouping] = useState(false);
  const [summaryMode, setSummaryMode] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const [preserveHeaderSpace, setPreserveHeaderSpace] = useState(true);
  const [showCreatedBy, setShowCreatedBy] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [groupByParentCategory, setGroupByParentCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  const selectedStatuses = showAllStatuses
    ? [
        ChargeItemStatus.billable,
        ChargeItemStatus.billed,
        ChargeItemStatus.paid,
        ChargeItemStatus.entered_in_error,
        ChargeItemStatus.not_billable,
        ChargeItemStatus.aborted,
      ]
    : [
        ChargeItemStatus.billable,
        ChargeItemStatus.billed,
        ChargeItemStatus.paid,
      ];

  const { qParams, updateQuery } = useFilters({ disableCache: true });

  const hideCategoryLabel = `${t("hide_category_grouping")}`;
  const hidePaymentTypeLabel = `${t("hide_payment_type_grouping")}`;
  const summaryLabel = `${t("summary")}`;
  const hideHeaderLabel = `${t("hide_header")}`;
  const preserveHeaderSpaceLabel = `${t("preserve_header_space")}`;
  const showCreatedByLabel = `${t("show_created_by")}`;
  const showStatusLabel = `${t("show_status")}`;
  const groupByParentCategoryLabel = `${t("group_by_parent_category")}`;

  const { data: account } = useQuery({
    queryKey: ["account", accountId],
    queryFn: query(accountApi.retrieveAccount, {
      pathParams: { facilityId, accountId },
    }),
  });

  const { data: chargeItems, isLoading } = useQuery({
    queryKey: ["chargeItems", accountId, selectedStatuses, qParams.ordering],
    queryFn: query.paginated(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        status: selectedStatuses.join(","),
        ordering: qParams.ordering,
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

  const activePayments = payments.filter(
    (payment) => payment.status === PaymentReconciliationStatus.active,
  );

  const nonReturnedPayments = activePayments.filter(
    (payment) => !payment.is_credit_note,
  );

  const returnedPayments = activePayments.filter(
    (payment) => payment.is_credit_note,
  );

  if (!chargeItems?.results && !isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center  border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_charge_items_found_for_this_account")}
      </div>
    );
  }

  const hasLockedInvoice = chargeItems?.results?.some(
    (item) => item.paid_invoice?.locked,
  );

  const hasUnissuedChargeItems = chargeItems?.results?.some((item) => {
    const invoice = item.paid_invoice;
    if (!invoice) return true;
    return !(
      invoice.status === InvoiceStatus.issued ||
      invoice.status === InvoiceStatus.balanced
    );
  });

  if (hasLockedInvoice && !canManageLockedInvoice) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] gap-4">
        <p className="text-gray-500">
          {t("no_permission_to_print_charge_items")}
        </p>
        <Button variant="outline" onClick={() => goBack()}>
          {t("go_back")}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-5xl mx-auto no-print mb-4 flex flex-wrap justify-start items-center gap-4 p-4 bg-gray-50 border rounded-md border-gray-200">
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

        <div className="gap-2 flex items-center">
          <Switch
            id="hide-header"
            checked={hideHeader}
            onCheckedChange={setHideHeader}
          />
          <label htmlFor="hide-header" className="cursor-pointer text-sm">
            {hideHeaderLabel}
          </label>
        </div>

        {hideHeader && (
          <div className="gap-2 flex items-center">
            <Switch
              id="preserve-header-space"
              checked={preserveHeaderSpace}
              onCheckedChange={setPreserveHeaderSpace}
            />
            <label
              htmlFor="preserve-header-space"
              className="cursor-pointer text-sm"
            >
              {preserveHeaderSpaceLabel}
            </label>
          </div>
        )}

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

            {!hideCategories && (
              <div className="gap-2 flex items-center">
                <Switch
                  id="group-by-parent-category"
                  checked={groupByParentCategory}
                  onCheckedChange={setGroupByParentCategory}
                />
                <label
                  htmlFor="group-by-parent-category"
                  className="cursor-pointer text-sm"
                >
                  {groupByParentCategoryLabel}
                </label>
              </div>
            )}

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

            <div className="gap-2 flex items-center">
              <Switch
                id="sort-by-title"
                checked={qParams.ordering === "title"}
                onCheckedChange={(checked) =>
                  updateQuery({ ordering: checked ? "title" : undefined })
                }
              />
              <label htmlFor="sort-by-title" className="cursor-pointer text-sm">
                {t("sort_by_title")}
              </label>
            </div>

            <div className="gap-2 flex items-center">
              <Switch
                id="show-created-by"
                checked={showCreatedBy}
                onCheckedChange={setShowCreatedBy}
              />
              <label
                htmlFor="show-created-by"
                className="cursor-pointer text-sm"
              >
                {showCreatedByLabel}
              </label>
            </div>

            <div className="gap-2 flex items-center">
              <Switch
                id="show-status"
                checked={showStatus}
                onCheckedChange={setShowStatus}
              />
              <label htmlFor="show-status" className="cursor-pointer text-sm">
                {showStatusLabel}
              </label>
            </div>

            <div className="gap-2 flex items-center">
              <Switch
                id="show-all-statuses"
                checked={showAllStatuses}
                onCheckedChange={setShowAllStatuses}
              />
              <label
                htmlFor="show-all-statuses"
                className="cursor-pointer text-sm"
              >
                {t("include_cancelled")}
              </label>
            </div>
          </>
        )}

        {/* Category Filter */}
        {chargeItems?.results &&
          chargeItems.results.length > 0 &&
          (() => {
            const useParentCategory = groupByParentCategory || summaryMode;
            const categories = [
              ...new Set(
                chargeItems.results.map((item) => {
                  const category = item.charge_item_definition?.category;
                  return useParentCategory
                    ? category?.parent?.title ||
                        category?.title ||
                        t("uncategorized")
                    : category?.title || t("uncategorized");
                }),
              ),
            ].sort();

            return (
              <div className="gap-2 flex items-center">
                <label
                  htmlFor="category-filter"
                  className="text-sm whitespace-nowrap"
                >
                  {t("filter_by_category")}:
                </label>
                <Select
                  value={selectedCategory ?? "__all__"}
                  onValueChange={(value) =>
                    setSelectedCategory(value === "__all__" ? null : value)
                  }
                >
                  <SelectTrigger
                    id="category-filter"
                    className="w-48 h-8 text-sm"
                  >
                    <SelectValue placeholder={t("all_categories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">
                      {t("all_categories")}
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}
      </div>
      <PrintPreview
        title={t("charge_items")}
        disabled={!chargeItems?.results?.length}
        className="print:pt-0"
      >
        <DisablingCover disabled={isLoading || isLoadingPayments}>
          {summaryMode && hasUnissuedChargeItems ? (
            <p className="mt-2 text-xs text-red-600">
              {t("unissued_charge_items_summary_warning")}
            </p>
          ) : (
            <div className="md:p-2 max-w-4xl mx-auto bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-0 font-normal text-left">
                      {hideHeader && preserveHeaderSpace ? (
                        <div className="mb-4 pb-2 border-b border-gray-200 h-20" />
                      ) : !hideHeader ? (
                        <div className="flex flex-col sm:flex-row print:flex-row print:items-start justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200">
                          <img
                            src={careConfig.mainLogo?.dark}
                            alt="Care Logo"
                            className="h-10 w-auto object-contain mb-2 sm:mb-0 sm:order-2 print:mb-0 print:order-2"
                          />
                          <div className="text-center sm:text-left sm:order-1 print:text-left">
                            <h1 className="text-2xl font-semibold">
                              {facility?.name}
                            </h1>
                            {facility?.address && (
                              <div className="text-gray-500 whitespace-pre-wrap wrap-break-word text-xs">
                                {facility.address}
                                {facility.phone_number && (
                                  <p className="text-gray-500 text-xs">
                                    {facility.phone_number}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-0 align-top">
                      <div className="grid md:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-4 mb-4 text-xs">
                        <div className="space-y-1">
                          <DetailRow
                            label={t("name")}
                            value={account?.patient?.name}
                            width="w-16"
                          />
                          <DetailRow
                            label={`${t("age")} / ${t("sex")}`}
                            value={
                              account?.patient
                                ? `${formatPatientAge(account.patient, true)}, ${t(`GENDER__${account.patient.gender}`)}`
                                : undefined
                            }
                            width="w-16"
                          />
                          <DetailRow
                            label={`${t("address")}`}
                            value={account?.patient?.address}
                            width="w-16"
                          />
                          {account?.primary_encounter?.current_location && (
                            <DetailRow
                              label={`${t("location")}`}
                              value={
                                account?.primary_encounter?.current_location
                                  ?.name
                              }
                              width="w-16"
                            />
                          )}
                        </div>
                        <div className="space-y-1">
                          <DetailRow
                            label={`${t("date")}`}
                            value={formatDateTime(new Date(), "DD-MM-YYYY")}
                            width="w-24"
                          />
                          {account?.patient?.instance_identifiers
                            ?.filter(
                              ({ config }) =>
                                config.config.use ===
                                PatientIdentifierUse.official,
                            )
                            .map((identifier) => (
                              <DetailRow
                                key={identifier.config.id}
                                label={identifier.config.config.display}
                                value={identifier.value}
                                width="w-24"
                              />
                            ))}
                          <DetailRow
                            label={t("mobile_number")}
                            value={
                              account?.patient &&
                              formatPhoneNumberIntl(
                                account.patient.phone_number,
                              )
                            }
                            width="w-24"
                          />
                          {account?.primary_encounter && (
                            <>
                              <DetailRow
                                label={t("start_date")}
                                value={
                                  account?.primary_encounter &&
                                  account?.primary_encounter.period.start &&
                                  new Date(
                                    account?.primary_encounter.period.start,
                                  ).toLocaleDateString("en-IN")
                                }
                                width="w-24"
                              />
                              <DetailRow
                                label={t("end_date")}
                                value={
                                  account?.primary_encounter &&
                                  account?.primary_encounter.period.end &&
                                  new Date(
                                    account?.primary_encounter.period.end,
                                  ).toLocaleDateString("en-IN")
                                }
                                width="w-24"
                              />
                              {account?.primary_encounter?.care_team?.[0] && (
                                <DetailRow
                                  label={t("doctor")}
                                  value={formatName(
                                    account.primary_encounter.care_team[0]
                                      .member,
                                  )}
                                  width="w-24"
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {chargeItems?.results &&
                        chargeItems?.results?.length > 0 && (
                          <>
                            <div className="text-sm">
                              <div className="overflow-hidden">
                                <Table className="w-full [&_th]:text-xs [&_td]:text-xs">
                                  <TableHeader className="[&_tr]:border-y [&_th]:p-0.5 [&_th]:h-auto">
                                    <TableRow className="bg-transparent hover:bg-transparent">
                                      {summaryMode ? (
                                        <>
                                          <TableHead
                                            className="font-bold"
                                            colSpan={5}
                                          >
                                            {t("category")}
                                          </TableHead>
                                          <TableHead className="font-bold text-right w-32">
                                            {t("amount")}
                                          </TableHead>
                                        </>
                                      ) : (
                                        <>
                                          <TableHead className="font-bold w-10">
                                            {t("date")}
                                          </TableHead>
                                          <TableHead className="font-bold w-10">
                                            {t("invoice")}
                                          </TableHead>
                                          <TableHead className="font-bold w-24">
                                            {t("title")}
                                          </TableHead>
                                          {showStatus && (
                                            <TableHead className="font-bold text-center w-8">
                                              {t("status")}
                                            </TableHead>
                                          )}
                                          {showCreatedBy && (
                                            <TableHead className="font-bold w-16">
                                              {t("created_by")}
                                            </TableHead>
                                          )}
                                          <TableHead className="font-bold w-10">
                                            {t("rate")}
                                          </TableHead>
                                          <TableHead className="font-bold text-right w-10">
                                            {t("qty")}
                                          </TableHead>
                                          <TableHead className="font-bold text-right w-10">
                                            {t("amount")}
                                          </TableHead>
                                        </>
                                      )}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody className="[&_tr]:border-0 [&_td]:p-0.5">
                                    {(() => {
                                      const validItemsBeforeFilter =
                                        chargeItems.results;

                                      const useParentCategory =
                                        groupByParentCategory || summaryMode;

                                      const validItems = selectedCategory
                                        ? validItemsBeforeFilter.filter(
                                            (item) => {
                                              const category =
                                                item.charge_item_definition
                                                  ?.category;
                                              const categoryTitle =
                                                useParentCategory
                                                  ? category?.parent?.title ||
                                                    category?.title ||
                                                    t("uncategorized")
                                                  : category?.title ||
                                                    t("uncategorized");
                                              return (
                                                categoryTitle ===
                                                selectedCategory
                                              );
                                            },
                                          )
                                        : validItemsBeforeFilter;

                                      const nonReturnedValidItems =
                                        validItems.filter(
                                          (item) =>
                                            !item.paid_invoice?.is_refund,
                                        );

                                      const groups =
                                        nonReturnedValidItems.reduce(
                                          (
                                            acc: Record<
                                              string,
                                              ChargeItemRead[]
                                            >,
                                            item: ChargeItemRead,
                                          ) => {
                                            const category =
                                              item.charge_item_definition
                                                ?.category;
                                            const categoryTitle =
                                              useParentCategory
                                                ? category?.parent?.title ||
                                                  category?.title ||
                                                  t("uncategorized")
                                                : category?.title ||
                                                  t("uncategorized");
                                            const list =
                                              acc[categoryTitle] ?? [];
                                            list.push(item);
                                            acc[categoryTitle] = list;
                                            return acc;
                                          },
                                          {} as Record<
                                            string,
                                            ChargeItemRead[]
                                          >,
                                        );

                                      const sortedCategories =
                                        Object.keys(groups).sort();

                                      const rows: React.ReactNode[] = [];

                                      sortedCategories.forEach(
                                        (categoryTitle) => {
                                          const items: ChargeItemRead[] =
                                            groups[categoryTitle] ?? [];

                                          const sectionTotal = add(
                                            ...items.map(
                                              (i) => i.total_price || 0,
                                            ),
                                          );

                                          if (summaryMode) {
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
                                                  <MonetaryDisplay
                                                    amount={sectionTotal}
                                                  />
                                                </TableCell>
                                              </TableRow>,
                                            );
                                          } else {
                                            if (!hideCategories) {
                                              rows.push(
                                                <TableRow
                                                  key={`category-${categoryTitle}`}
                                                  className="font-bold hover:bg-transparent"
                                                >
                                                  <TableCell
                                                    colSpan={
                                                      5 +
                                                      (showStatus ? 1 : 0) +
                                                      (showCreatedBy ? 1 : 0)
                                                    }
                                                    className="capitalize"
                                                  >
                                                    {categoryTitle}
                                                  </TableCell>
                                                  <TableCell className="text-right">
                                                    <MonetaryDisplay
                                                      amount={sectionTotal}
                                                    />
                                                  </TableCell>
                                                </TableRow>,
                                              );
                                            }

                                            items.forEach(
                                              (chargeItem: ChargeItemRead) => {
                                                const unitPrice =
                                                  chargeItem.unit_price_components.find(
                                                    (c) =>
                                                      c.monetary_component_type ===
                                                      MonetaryComponentType.base,
                                                  )?.amount;
                                                const hasIssuedOrBalancedInvoice =
                                                  chargeItem.paid_invoice &&
                                                  (chargeItem.paid_invoice
                                                    .status ===
                                                    InvoiceStatus.issued ||
                                                    chargeItem.paid_invoice
                                                      .status ===
                                                      InvoiceStatus.balanced);
                                                rows.push(
                                                  <TableRow
                                                    key={chargeItem.id}
                                                    className={
                                                      hasIssuedOrBalancedInvoice
                                                        ? "bg-transparent hover:bg-transparent"
                                                        : "bg-red-50 hover:bg-red-50 text-red-700 print:bg-red-50"
                                                    }
                                                  >
                                                    <TableCell className="w-10 text-left">
                                                      <div className="flex items-center gap-1">
                                                        {!hasIssuedOrBalancedInvoice && (
                                                          <AlertTriangle className="h-3 w-3 text-red-600 shrink-0" />
                                                        )}
                                                        {formatDateTime(
                                                          chargeItem.created_date,
                                                          "DD/MM/YY",
                                                        )}
                                                      </div>
                                                    </TableCell>
                                                    <TableCell className="w-10 text-left">
                                                      {
                                                        chargeItem.paid_invoice
                                                          ?.number
                                                      }
                                                    </TableCell>
                                                    <TableCell>
                                                      <div className="flex flex-col">
                                                        <span className="font-medium">
                                                          {chargeItem.title}
                                                        </span>
                                                      </div>
                                                    </TableCell>
                                                    {showStatus && (
                                                      <TableCell className="text-center w-8">
                                                        <span className="text-xs">
                                                          {t(chargeItem.status)}
                                                        </span>
                                                      </TableCell>
                                                    )}
                                                    {showCreatedBy && (
                                                      <TableCell className="w-16">
                                                        {
                                                          chargeItem.created_by
                                                            ?.first_name
                                                        }
                                                      </TableCell>
                                                    )}
                                                    <TableCell className="text-right w-10">
                                                      <MonetaryDisplay
                                                        amount={unitPrice}
                                                      />
                                                    </TableCell>
                                                    <TableCell className="text-right w-10">
                                                      {round(
                                                        chargeItem.quantity,
                                                      )}
                                                    </TableCell>
                                                    <TableCell className="text-right w-10">
                                                      <MonetaryDisplay
                                                        amount={
                                                          chargeItem.total_price
                                                        }
                                                      />
                                                    </TableCell>
                                                  </TableRow>,
                                                );
                                              },
                                            );
                                          }
                                        },
                                      );

                                      rows.push(
                                        <TableRow
                                          key="grand-total"
                                          className="bg-muted/30 font-semibold"
                                        >
                                          <TableCell
                                            colSpan={
                                              5 +
                                              (showStatus ? 1 : 0) +
                                              (showCreatedBy ? 1 : 0)
                                            }
                                            className="text-right pr-2"
                                          >
                                            {t("net_total")}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <MonetaryDisplay
                                              amount={add(
                                                ...nonReturnedValidItems.map(
                                                  (i) => i.total_price || 0,
                                                ),
                                              )}
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

                            {(() => {
                              const validItemsBeforeFilter =
                                chargeItems.results;
                              const useParentCategory =
                                groupByParentCategory || summaryMode;

                              const validItems = selectedCategory
                                ? validItemsBeforeFilter.filter((item) => {
                                    const category =
                                      item.charge_item_definition?.category;
                                    const categoryTitle = useParentCategory
                                      ? category?.parent?.title ||
                                        category?.title ||
                                        t("uncategorized")
                                      : category?.title || t("uncategorized");
                                    return categoryTitle === selectedCategory;
                                  })
                                : validItemsBeforeFilter;

                              const returnedValidItems = validItems.filter(
                                (item) => item.paid_invoice?.is_refund,
                              );

                              if (returnedValidItems.length === 0) return null;

                              const groups = returnedValidItems.reduce(
                                (
                                  acc: Record<string, ChargeItemRead[]>,
                                  item: ChargeItemRead,
                                ) => {
                                  const category =
                                    item.charge_item_definition?.category;
                                  const categoryTitle = useParentCategory
                                    ? category?.parent?.title ||
                                      category?.title ||
                                      t("uncategorized")
                                    : category?.title || t("uncategorized");
                                  const list = acc[categoryTitle] ?? [];
                                  list.push(item);
                                  acc[categoryTitle] = list;
                                  return acc;
                                },
                                {} as Record<string, ChargeItemRead[]>,
                              );

                              const sortedCategories =
                                Object.keys(groups).sort();

                              return (
                                <div className="text-sm mt-4">
                                  <h2 className="text-sm font-semibold mb-1">
                                    {t("returned")}
                                  </h2>
                                  <div className="overflow-hidden">
                                    <Table className="w-full [&_th]:text-xs [&_td]:text-xs">
                                      <TableHeader className="[&_tr]:border-y [&_th]:p-0.5 [&_th]:h-auto">
                                        <TableRow className="bg-transparent hover:bg-transparent">
                                          {summaryMode ? (
                                            <>
                                              <TableHead
                                                className="font-bold"
                                                colSpan={5}
                                              >
                                                {t("category")}
                                              </TableHead>
                                              <TableHead className="font-bold text-right w-32">
                                                {t("amount")}
                                              </TableHead>
                                            </>
                                          ) : (
                                            <>
                                              <TableHead className="font-bold w-10">
                                                {t("date")}
                                              </TableHead>
                                              <TableHead className="font-bold w-10">
                                                {t("invoice")}
                                              </TableHead>
                                              <TableHead className="font-bold w-24">
                                                {t("title")}
                                              </TableHead>
                                              {showStatus && (
                                                <TableHead className="font-bold text-center w-8">
                                                  {t("status")}
                                                </TableHead>
                                              )}
                                              {showCreatedBy && (
                                                <TableHead className="font-bold w-16">
                                                  {t("created_by")}
                                                </TableHead>
                                              )}
                                              <TableHead className="font-bold w-10">
                                                {t("rate")}
                                              </TableHead>
                                              <TableHead className="font-bold text-right w-10">
                                                {t("qty")}
                                              </TableHead>
                                              <TableHead className="font-bold text-right w-10">
                                                {t("amount")}
                                              </TableHead>
                                            </>
                                          )}
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody className="[&_tr]:border-0 [&_td]:p-0.5">
                                        {(() => {
                                          const rows: React.ReactNode[] = [];

                                          sortedCategories.forEach(
                                            (categoryTitle) => {
                                              const items: ChargeItemRead[] =
                                                groups[categoryTitle] ?? [];

                                              const sectionTotal = add(
                                                ...items.map(
                                                  (i) => i.total_price || 0,
                                                ),
                                              );

                                              if (summaryMode) {
                                                rows.push(
                                                  <TableRow
                                                    key={`returned-category-${categoryTitle}`}
                                                    className="bg-transparent hover:bg-transparent"
                                                  >
                                                    <TableCell
                                                      colSpan={5}
                                                      className="font-semibold capitalize"
                                                    >
                                                      {categoryTitle}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                      <MonetaryDisplay
                                                        amount={sectionTotal}
                                                      />
                                                    </TableCell>
                                                  </TableRow>,
                                                );
                                              } else {
                                                if (!hideCategories) {
                                                  rows.push(
                                                    <TableRow
                                                      key={`returned-category-${categoryTitle}`}
                                                      className="font-bold hover:bg-transparent"
                                                    >
                                                      <TableCell
                                                        colSpan={
                                                          5 +
                                                          (showStatus ? 1 : 0) +
                                                          (showCreatedBy
                                                            ? 1
                                                            : 0)
                                                        }
                                                        className="capitalize"
                                                      >
                                                        {categoryTitle}
                                                      </TableCell>
                                                      <TableCell className="text-right">
                                                        <MonetaryDisplay
                                                          amount={sectionTotal}
                                                        />
                                                      </TableCell>
                                                    </TableRow>,
                                                  );
                                                }

                                                items.forEach(
                                                  (
                                                    chargeItem: ChargeItemRead,
                                                  ) => {
                                                    const unitPrice =
                                                      chargeItem.unit_price_components.find(
                                                        (c) =>
                                                          c.monetary_component_type ===
                                                          MonetaryComponentType.base,
                                                      )?.amount;
                                                    const hasIssuedOrBalancedInvoice =
                                                      chargeItem.paid_invoice &&
                                                      (chargeItem.paid_invoice
                                                        .status ===
                                                        InvoiceStatus.issued ||
                                                        chargeItem.paid_invoice
                                                          .status ===
                                                          InvoiceStatus.balanced);
                                                    rows.push(
                                                      <TableRow
                                                        key={chargeItem.id}
                                                        className={
                                                          hasIssuedOrBalancedInvoice
                                                            ? "bg-transparent hover:bg-transparent"
                                                            : "bg-red-50 hover:bg-red-50 text-red-700 print:bg-red-50"
                                                        }
                                                      >
                                                        <TableCell className="w-10 text-left">
                                                          <div className="flex items-center gap-1">
                                                            {!hasIssuedOrBalancedInvoice && (
                                                              <AlertTriangle className="h-3 w-3 text-red-600 shrink-0" />
                                                            )}
                                                            {formatDateTime(
                                                              chargeItem.created_date,
                                                              "DD/MM/YY",
                                                            )}
                                                          </div>
                                                        </TableCell>
                                                        <TableCell className="w-10 text-left">
                                                          {
                                                            chargeItem
                                                              .paid_invoice
                                                              ?.number
                                                          }
                                                        </TableCell>
                                                        <TableCell>
                                                          <div className="flex flex-col">
                                                            <span className="font-medium">
                                                              {chargeItem.title}
                                                            </span>
                                                          </div>
                                                        </TableCell>
                                                        {showStatus && (
                                                          <TableCell className="text-center w-8">
                                                            <span className="text-xs">
                                                              {t(
                                                                chargeItem.status,
                                                              )}
                                                            </span>
                                                          </TableCell>
                                                        )}
                                                        {showCreatedBy && (
                                                          <TableCell className="w-16">
                                                            {
                                                              chargeItem
                                                                .created_by
                                                                ?.first_name
                                                            }
                                                          </TableCell>
                                                        )}
                                                        <TableCell className="text-right w-10">
                                                          <MonetaryDisplay
                                                            amount={unitPrice}
                                                          />
                                                        </TableCell>
                                                        <TableCell className="text-right w-10">
                                                          {round(
                                                            chargeItem.quantity,
                                                          )}
                                                        </TableCell>
                                                        <TableCell className="text-right w-10">
                                                          <MonetaryDisplay
                                                            amount={
                                                              chargeItem.total_price
                                                            }
                                                          />
                                                        </TableCell>
                                                      </TableRow>,
                                                    );
                                                  },
                                                );
                                              }
                                            },
                                          );

                                          rows.push(
                                            <TableRow
                                              key="returned-grand-total"
                                              className="bg-muted/30 font-semibold"
                                            >
                                              <TableCell
                                                colSpan={
                                                  5 +
                                                  (showStatus ? 1 : 0) +
                                                  (showCreatedBy ? 1 : 0)
                                                }
                                                className="text-right pr-2"
                                              >
                                                {t("net_total")}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <MonetaryDisplay
                                                  amount={add(
                                                    ...returnedValidItems.map(
                                                      (i) => i.total_price || 0,
                                                    ),
                                                  )}
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
                              );
                            })()}
                          </>
                        )}

                      {nonReturnedPayments.length > 0 && !selectedCategory && (
                        <div className="mt-4">
                          <hr className="border-gray-300 py-2" />
                          <h2 className="text-sm font-semibold mb-1">
                            {t("payment_details")}
                          </h2>
                          <div className="overflow-hidden">
                            <Table className="w-full [&_th]:text-xs [&_td]:text-xs [&_tr]:text-xs">
                              <TableHeader className="[&_tr]:border-y [&_th]:p-0.5 [&_th]:h-auto">
                                <TableRow className="bg-transparent hover:bg-transparent">
                                  {summaryMode ? (
                                    <>
                                      <TableHead
                                        className="font-bold"
                                        colSpan={2}
                                      >
                                        {t("type")}
                                      </TableHead>
                                      <TableHead className="font-bold text-right w-32">
                                        {t("amount")}
                                      </TableHead>
                                    </>
                                  ) : (
                                    <>
                                      <TableHead className="font-bold w-10">
                                        {t("date")}
                                      </TableHead>
                                      <TableHead className="font-bold w-20">
                                        {t("invoice")}
                                      </TableHead>
                                      {hidePaymentTypeGrouping && (
                                        <TableHead className="font-bold w-10">
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
                              <TableBody className="[&_tr]:border-0 [&_td]:p-0.5">
                                {(() => {
                                  const paymentGroups =
                                    nonReturnedPayments.reduce(
                                      (
                                        acc: Record<
                                          string,
                                          PaymentReconciliationRead[]
                                        >,
                                        payment: PaymentReconciliationRead,
                                      ) => {
                                        const type =
                                          payment.reconciliation_type;
                                        const list = acc[type] ?? [];
                                        list.push(payment);
                                        acc[type] = list;
                                        return acc;
                                      },
                                      {} as Record<
                                        string,
                                        PaymentReconciliationRead[]
                                      >,
                                    );

                                  const sortedTypes =
                                    Object.keys(paymentGroups).sort();

                                  const rows: React.ReactNode[] = [];

                                  sortedTypes.forEach((paymentType) => {
                                    const paymentsOfType: PaymentReconciliationRead[] =
                                      paymentGroups[paymentType] ?? [];
                                    const typeTotal = add(
                                      ...paymentsOfType.map((p) =>
                                        multiply(
                                          p.amount || 0,
                                          p.is_credit_note ? -1 : 1,
                                        ),
                                      ),
                                    );

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
                                            <MonetaryDisplay
                                              amount={typeTotal}
                                            />
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
                                            className="font-semibold hover:bg-transparent"
                                          >
                                            <TableCell
                                              colSpan={3}
                                              className="capitalize"
                                            >
                                              {t(paymentType)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <MonetaryDisplay
                                                amount={typeTotal}
                                              />
                                            </TableCell>
                                          </TableRow>,
                                        );
                                      }

                                      paymentsOfType.forEach(
                                        (
                                          payment: PaymentReconciliationRead,
                                        ) => {
                                          rows.push(
                                            <TableRow
                                              key={payment.id}
                                              className="bg-transparent hover:bg-transparent"
                                            >
                                              <TableCell>
                                                {payment.payment_datetime &&
                                                  formatDateTime(
                                                    payment.payment_datetime,
                                                    "DD-MM-YY",
                                                  )}
                                              </TableCell>
                                              <TableCell>
                                                {payment.target_invoice?.number}
                                              </TableCell>
                                              {hidePaymentTypeGrouping && (
                                                <TableCell className="text-left capitalize">
                                                  {t(
                                                    payment.reconciliation_type,
                                                  )}
                                                </TableCell>
                                              )}
                                              <TableCell>
                                                {
                                                  PAYMENT_RECONCILIATION_METHOD_MAP[
                                                    payment.method
                                                  ]
                                                }
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <MonetaryDisplay
                                                  amount={multiply(
                                                    payment.amount,
                                                    payment.is_credit_note
                                                      ? -1
                                                      : 1,
                                                  )}
                                                />
                                              </TableCell>
                                            </TableRow>,
                                          );
                                        },
                                      );
                                    }
                                  });

                                  // Add grand total
                                  rows.push(
                                    <TableRow
                                      key="grand-total"
                                      className="bg-muted/30 font-semibold"
                                    >
                                      <TableCell
                                        colSpan={
                                          hidePaymentTypeGrouping ? 4 : 3
                                        }
                                        className="text-right pr-2"
                                      >
                                        {t("total_paid")}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <MonetaryDisplay
                                          amount={add(
                                            ...nonReturnedPayments.map((p) =>
                                              multiply(
                                                p.amount || 0,
                                                p.is_credit_note ? -1 : 1,
                                              ),
                                            ),
                                          )}
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

                      {returnedPayments.length > 0 && !selectedCategory && (
                        <div className="mt-4">
                          <hr className="border-gray-300 py-2" />
                          <h2 className="text-sm font-semibold mb-1">
                            {t("returned_payments")}
                          </h2>
                          <div className="overflow-hidden">
                            <Table className="w-full [&_th]:text-xs [&_td]:text-xs [&_tr]:text-xs">
                              <TableHeader className="[&_tr]:border-y [&_th]:p-0.5 [&_th]:h-auto">
                                <TableRow className="bg-transparent hover:bg-transparent">
                                  {summaryMode ? (
                                    <>
                                      <TableHead
                                        className="font-bold"
                                        colSpan={2}
                                      >
                                        {t("type")}
                                      </TableHead>
                                      <TableHead className="font-bold text-right w-32">
                                        {t("amount")}
                                      </TableHead>
                                    </>
                                  ) : (
                                    <>
                                      <TableHead className="font-bold w-10">
                                        {t("date")}
                                      </TableHead>
                                      <TableHead className="font-bold w-20">
                                        {t("invoice")}
                                      </TableHead>
                                      {hidePaymentTypeGrouping && (
                                        <TableHead className="font-bold w-10">
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
                              <TableBody className="[&_tr]:border-0 [&_td]:p-0.5">
                                {(() => {
                                  const returnedPayments = payments.filter(
                                    (payment) =>
                                      payment.status ===
                                        PaymentReconciliationStatus.active &&
                                      payment.is_credit_note === true,
                                  );

                                  const paymentGroups = returnedPayments.reduce(
                                    (
                                      acc: Record<
                                        string,
                                        PaymentReconciliationRead[]
                                      >,
                                      payment: PaymentReconciliationRead,
                                    ) => {
                                      const type = payment.reconciliation_type;
                                      const list = acc[type] ?? [];
                                      list.push(payment);
                                      acc[type] = list;
                                      return acc;
                                    },
                                    {} as Record<
                                      string,
                                      PaymentReconciliationRead[]
                                    >,
                                  );

                                  const sortedTypes =
                                    Object.keys(paymentGroups).sort();

                                  const rows: React.ReactNode[] = [];

                                  sortedTypes.forEach((paymentType) => {
                                    const paymentsOfType: PaymentReconciliationRead[] =
                                      paymentGroups[paymentType] ?? [];
                                    const typeTotal = add(
                                      ...paymentsOfType.map((p) =>
                                        multiply(
                                          p.amount || 0,
                                          p.is_credit_note ? -1 : 1,
                                        ),
                                      ),
                                    );

                                    if (summaryMode) {
                                      // In summary mode, show only payment type with total
                                      rows.push(
                                        <TableRow
                                          key={`returned-payment-type-${paymentType}`}
                                          className="bg-transparent hover:bg-transparent"
                                        >
                                          <TableCell
                                            colSpan={2}
                                            className="font-semibold capitalize"
                                          >
                                            {t(paymentType)}
                                          </TableCell>
                                          <TableCell className="text-right font-semibold">
                                            <MonetaryDisplay
                                              amount={typeTotal}
                                            />
                                          </TableCell>
                                        </TableRow>,
                                      );
                                    } else {
                                      // Normal mode - show header, items, and subtotal
                                      // Add payment type header (only if not hiding grouping)
                                      if (!hidePaymentTypeGrouping) {
                                        rows.push(
                                          <TableRow
                                            key={`returned-payment-type-${paymentType}`}
                                            className="font-semibold hover:bg-transparent"
                                          >
                                            <TableCell
                                              colSpan={3}
                                              className="capitalize"
                                            >
                                              {t(paymentType)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <MonetaryDisplay
                                                amount={typeTotal}
                                              />
                                            </TableCell>
                                          </TableRow>,
                                        );
                                      }

                                      paymentsOfType.forEach(
                                        (
                                          payment: PaymentReconciliationRead,
                                        ) => {
                                          rows.push(
                                            <TableRow
                                              key={payment.id}
                                              className="bg-transparent hover:bg-transparent"
                                            >
                                              <TableCell>
                                                {payment.payment_datetime &&
                                                  formatDateTime(
                                                    payment.payment_datetime,
                                                    "DD-MM-YY",
                                                  )}
                                              </TableCell>
                                              <TableCell>
                                                {payment.target_invoice?.number}
                                              </TableCell>
                                              {hidePaymentTypeGrouping && (
                                                <TableCell className="text-left capitalize">
                                                  {t(
                                                    payment.reconciliation_type,
                                                  )}
                                                </TableCell>
                                              )}
                                              <TableCell>
                                                {
                                                  PAYMENT_RECONCILIATION_METHOD_MAP[
                                                    payment.method
                                                  ]
                                                }
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <MonetaryDisplay
                                                  amount={multiply(
                                                    payment.amount,
                                                    payment.is_credit_note
                                                      ? -1
                                                      : 1,
                                                  )}
                                                />
                                              </TableCell>
                                            </TableRow>,
                                          );
                                        },
                                      );
                                    }
                                  });

                                  // Add grand total
                                  rows.push(
                                    <TableRow
                                      key="returned-grand-total"
                                      className="bg-muted/30 font-semibold"
                                    >
                                      <TableCell
                                        colSpan={
                                          hidePaymentTypeGrouping ? 4 : 3
                                        }
                                        className="text-right pr-2"
                                      >
                                        {t("net_total")}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <MonetaryDisplay
                                          amount={add(
                                            ...returnedPayments.map((p) =>
                                              multiply(
                                                p.amount || 0,
                                                p.is_credit_note ? -1 : 1,
                                              ),
                                            ),
                                          )}
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
                        <div className="overflow-hidden mt-4">
                          <Table className="w-full border [&_th]:text-xs [&_td]:text-xs">
                            <TableHeader className="[&_tr]:border [&_th]:p-0.5 [&_th]:h-auto">
                              <TableRow className="bg-transparent hover:bg-transparent">
                                <TableHead className="text-center font-bold">
                                  {t("billed_gross")}
                                </TableHead>
                                <TableHead className="text-center font-bold">
                                  {t("total_paid")}
                                </TableHead>
                                <TableHead className="text-center font-bold">
                                  {t("amount_due")}
                                </TableHead>
                                <TableHead className="text-center font-bold">
                                  {t("total_billable")}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="[&_tr]:border [&_td]:p-0.5">
                              <TableRow className="bg-transparent hover:bg-transparent">
                                <TableCell className="text-center">
                                  <MonetaryDisplay
                                    amount={account.total_gross}
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <MonetaryDisplay
                                    amount={account.total_paid}
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <MonetaryDisplay
                                    amount={account.total_balance}
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <MonetaryDisplay
                                    amount={account.total_billable_charge_items}
                                  />
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Footer Section */}
                      <PrintFooter
                        showPreparedBy
                        className="mt-4 border-t border-gray-200"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </DisablingCover>
      </PrintPreview>
    </div>
  );
};
