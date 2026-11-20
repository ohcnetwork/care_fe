import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { getPermissions } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import BackButton from "@/components/Common/BackButton";
import useAuthUser from "@/hooks/useAuthUser";
import useFilters from "@/hooks/useFilters";
import { chargeItemPrintSearch } from "@/lib/router/search/billing";
import {
  buildChargeItemsPrintContent,
  getCategoryTitle,
} from "@/pages/Facility/billing/account/components/chargeItemsPrintData";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import accountApi from "@/types/billing/account/accountApi";
import { ChargeItemStatus } from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import { PaymentReconciliationRead } from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";

function Option({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <label htmlFor={id} className="cursor-pointer text-sm">
        {label}
      </label>
    </div>
  );
}

const ACTIVE_STATUSES = [
  ChargeItemStatus.billable,
  ChargeItemStatus.billed,
  ChargeItemStatus.paid,
];

const ALL_STATUSES = [
  ...ACTIVE_STATUSES,
  ChargeItemStatus.entered_in_error,
  ChargeItemStatus.not_billable,
  ChargeItemStatus.aborted,
];

export const PrintChargeItems = (props: {
  facilityId: string;
  accountId: string;
}) => {
  const { facilityId, accountId } = props;
  const { facility } = useCurrentFacility();
  const { t } = useTranslation();
  const user = useAuthUser();
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
  const selectedStatuses = showAllStatuses ? ALL_STATUSES : ACTIVE_STATUSES;

  const { qParams, updateQuery } = useFilters({
    schema: chargeItemPrintSearch,
  });

  const { data: account, isLoading: isLoadingAccount } = useQuery({
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
      },
    ),
  });

  const payments =
    (paymentsResponse?.results as PaymentReconciliationRead[]) || [];

  if (!chargeItems?.results && !isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center  border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_charge_items_found_for_this_account")}
      </div>
    );
  }

  const items = chargeItems?.results ?? [];

  const hasLockedInvoice = items.some((item) => item.paid_invoice?.locked);

  const hasUnissuedChargeItems = items.some((item) => {
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
        <BackButton variant="outline">{t("go_back")}</BackButton>
      </div>
    );
  }

  const useParentCategory = groupByParentCategory || summaryMode;
  const categories = [
    ...new Set(
      items.map((item) => getCategoryTitle(item, useParentCategory, t)),
    ),
  ].sort();

  const toolbar = (
    <div className="flex flex-wrap items-center justify-start gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
      <Option
        id="summary-mode"
        label={t("summary")}
        checked={summaryMode}
        onChange={setSummaryMode}
      />
      <Option
        id="hide-header"
        label={t("hide_header")}
        checked={hideHeader}
        onChange={setHideHeader}
      />
      {hideHeader && (
        <Option
          id="preserve-header-space"
          label={t("preserve_header_space")}
          checked={preserveHeaderSpace}
          onChange={setPreserveHeaderSpace}
        />
      )}
      {!summaryMode && (
        <>
          <Option
            id="hide-categories"
            label={t("hide_category_grouping")}
            checked={hideCategories}
            onChange={setHideCategories}
          />
          {!hideCategories && (
            <Option
              id="group-by-parent-category"
              label={t("group_by_parent_category")}
              checked={groupByParentCategory}
              onChange={setGroupByParentCategory}
            />
          )}
          {payments.length > 0 && (
            <Option
              id="hide-payment-type-grouping"
              label={t("hide_payment_type_grouping")}
              checked={hidePaymentTypeGrouping}
              onChange={setHidePaymentTypeGrouping}
            />
          )}
          <Option
            id="sort-by-title"
            label={t("sort_by_title")}
            checked={qParams.ordering === "title"}
            onChange={(checked) =>
              updateQuery({ ordering: checked ? "title" : undefined })
            }
          />
          <Option
            id="show-created-by"
            label={t("show_created_by")}
            checked={showCreatedBy}
            onChange={setShowCreatedBy}
          />
          <Option
            id="show-status"
            label={t("show_status")}
            checked={showStatus}
            onChange={setShowStatus}
          />
          <Option
            id="show-all-statuses"
            label={t("include_cancelled")}
            checked={showAllStatuses}
            onChange={setShowAllStatuses}
          />
        </>
      )}
      {categories.length > 0 && (
        <div className="flex items-center gap-2">
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
            <SelectTrigger id="category-filter" className="w-48 h-8 text-sm">
              <SelectValue placeholder={t("all_categories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("all_categories")}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  return (
    <TypstPrintPreview
      template="charge-items"
      title={t("charge_items")}
      content={
        isLoading || isLoadingPayments || isLoadingAccount
          ? undefined
          : buildChargeItemsPrintContent({
              account,
              chargeItems: items,
              payments,
              options: {
                summaryMode,
                hideCategories,
                hidePaymentTypeGrouping,
                showCreatedBy,
                showStatus,
                groupByParentCategory,
                selectedCategory,
              },
              hideHeader,
              preserveHeaderSpace,
              hasUnissuedChargeItems,
              preparedBy: formatName(user),
              t,
            })
      }
      facility={facility}
      templateSlug={PrintTemplateType.charge_items}
      hideFacilityHeader={hideHeader}
      toolbar={toolbar}
    />
  );
};
