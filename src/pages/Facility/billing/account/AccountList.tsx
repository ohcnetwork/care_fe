import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRightSquare, PlusIcon } from "lucide-react";
import { navigate } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  accountBillingStatusFilter,
  accountStatusFilter,
  dateFilter,
  tagFilter,
} from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import {
  FilterDateRange,
  longDateRangeOptions,
} from "@/components/ui/multi-filter/utils/Utils";

import { Avatar } from "@/components/Common/Avatar";
import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";
import PatientIdentifierFilter from "@/components/Patient/PatientIdentifierFilter";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";

import { getPermissions } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";
import useFilters from "@/hooks/useFilters";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

import {
  ACCOUNT_BILLING_STATUS_COLORS,
  ACCOUNT_STATUS_COLORS,
  type AccountRead,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import query from "@/Utils/request/query";
import { dateTimeQueryString } from "@/Utils/utils";

import { isPositive } from "@/Utils/decimal";
import AccountSheet from "./AccountSheet";

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AccountList({
  facilityId,
  patientId,
  hideTitleOnPage = false,
  hidePatientName = false,
  className,
}: {
  facilityId: string;
  patientId?: string;
  hideTitleOnPage?: boolean;
  hidePatientName?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] =
    React.useState<AccountRead | null>(null);
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
    defaultQueryParams: { status: "active" },
  });

  const { facility } = useCurrentFacility();
  const { hasPermission } = usePermissions();

  const { canCreateAccount } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );

  const tagIds = qParams.tags?.split(",") || [];
  const tagQueries = useTagConfigs({ ids: tagIds, facilityId });
  const selectedTags = tagQueries
    .map((query) => query.data)
    .filter(Boolean) as TagConfig[];

  const { created_date_after, created_date_before } = qParams;

  const filters = [
    accountStatusFilter("status"),
    dateFilter("created_date", t("period"), longDateRangeOptions, false),
    accountBillingStatusFilter("billing_status"),
    tagFilter("tags", TagResource.ACCOUNT, "multi", "tags"),
  ];

  const onFilterUpdate = (query: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(query)) {
      switch (key) {
        case "tags":
          query.tags = (value as TagConfig[])?.map((tag) => tag.id).join(",");
          break;
        case "created_date":
          {
            const dateRange = value as FilterDateRange;
            query = {
              ...query,
              created_date: undefined,
              created_date_after: dateRange?.from
                ? dateTimeQueryString(dateRange?.from as Date)
                : undefined,
              created_date_before: dateRange?.to
                ? dateTimeQueryString(dateRange?.to as Date, true)
                : undefined,
            };
          }
          break;
      }
    }
    updateQuery(query);
  };

  const {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  } = useMultiFilterState(filters, onFilterUpdate, {
    ...qParams,
    status: qParams.status ? [qParams.status] : undefined,
    created_date:
      created_date_after || created_date_before
        ? {
            from: created_date_after ? new Date(created_date_after) : undefined,
            to: created_date_before ? new Date(created_date_before) : undefined,
          }
        : undefined,
    billing_status: qParams.billing_status
      ? [qParams.billing_status]
      : undefined,
    tags: selectedTags,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["accounts", qParams],
    queryFn: query.debounced(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patientId || qParams.patient_filter,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status,
        billing_status: qParams.billing_status,
        created_date_after: qParams.created_date_after,
        created_date_before: qParams.created_date_before,
        tags: qParams.tags,
        tags_behavior: qParams.tags_behavior,
      },
    }),
  });

  const accounts = (response?.results as AccountRead[]) || [];

  return (
    <Page
      title={t("accounts")}
      hideTitleOnPage={hideTitleOnPage}
      className={cn(hideTitleOnPage && "md:px-0", className)}
    >
      <div className={cn("mx-auto", !hideTitleOnPage && "mt-2")}>
        <div className="mb-4">
          {patientId && (
            <AccountSheet
              open={sheetOpen}
              onOpenChange={(open) => {
                setSheetOpen(open);
                if (!open) setEditingAccount(null);
              }}
              facilityId={facilityId}
              patientId={patientId}
              initialValues={editingAccount ? editingAccount : undefined}
              isEdit={!!editingAccount}
            />
          )}
          <div className="flex flex-wrap items-start gap-2">
            <div className="w-full sm:w-auto sm:shrink-0">
              <PatientIdentifierFilter
                onSelect={(patientId, patientName) =>
                  updateQuery({
                    patient_filter: patientId,
                    patient_name: patientName,
                  })
                }
                placeholder={t("filter_by_identifier")}
                className="w-full sm:w-auto sm:max-w-xs rounded-md h-9 text-gray-500 shadow-sm"
                patientId={qParams.patient_filter}
                patientName={qParams.patient_name}
              />
            </div>
            <div className="w-full sm:w-auto">
              <MultiFilter
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
                onOperationChange={handleOperationChange}
                onClearAll={handleClearAll}
                onClearFilter={handleClearFilter}
                className="w-full items-start sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
                triggerButtonClassName="self-start sm:self-center"
                clearAllButtonClassName="self-center"
                facilityId={facilityId}
              />
            </div>
          </div>
          <div className="flex justify-end w-full">
            {patientId && canCreateAccount && (
              <Button
                className="w-full sm:w-auto mt-2"
                onClick={() => setSheetOpen(true)}
              >
                {t("create_account")}
                <PlusIcon />
              </Button>
            )}
          </div>
        </div>
        {isLoading ? (
          <TableSkeleton count={5} />
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={<CareIcon icon="l-user" className="text-primary size-6" />}
            title={t("no_accounts_found")}
            description={t("adjust_account_filters")}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("account")}</TableHead>
                <TableHead>{t("balance")}</TableHead>
                <TableHead>{t("billable")}</TableHead>
                <TableHead>{t("account_status")}</TableHead>
                <TableHead>{t("billing_status")}</TableHead>
                <TableHead>{t("period")}</TableHead>
                <TableHead>{t("tags_proper")}</TableHead>
                <TableHead>{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account: AccountRead) => (
                <TableRow key={account.id}>
                  <TableCell className="whitespace-normal">
                    <div className="flex items-center gap-3">
                      <Avatar name={account.name} className="size-8 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold leading-6 wrap-break-word">
                          {account.name}
                        </div>
                        {!hidePatientName && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 wrap-break-word">
                            {account.patient.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "border-x p-3 text-base font-medium leading-6",
                      isPositive(account.total_balance)
                        ? "text-gray-950"
                        : "text-green-700 italic",
                    )}
                  >
                    <MonetaryDisplay amount={account.total_balance} />
                  </TableCell>
                  <TableCell className="text-base font-medium leading-6 text-gray-950">
                    <MonetaryDisplay
                      amount={account.total_billable_charge_items}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACCOUNT_STATUS_COLORS[account.status]}>
                      {t(account.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ACCOUNT_BILLING_STATUS_COLORS[account.billing_status]
                      }
                    >
                      {t(account.billing_status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-950 font-medium">
                      {account.service_period?.start
                        ? formatDate(account.service_period?.start)
                        : formatDate(account.created_date)}
                      {account.service_period?.end &&
                        ` - ${formatDate(account.service_period?.end)}`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <TagAssignmentSheet
                      entityType="account"
                      entityId={account.id}
                      facilityId={facilityId}
                      currentTags={account.tags ?? []}
                      onUpdate={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["accounts", qParams],
                        });
                      }}
                      patientId={account.patient.id}
                    />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-semibold"
                        onClick={() =>
                          navigate(
                            `/facility/${facilityId}/billing/account/${account.id}`,
                          )
                        }
                      >
                        <ArrowUpRightSquare strokeWidth={1.5} />
                        {t("go_to_account")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {response && response.count > resultsPerPage && (
          <div className="mt-4 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}

export default AccountList;
