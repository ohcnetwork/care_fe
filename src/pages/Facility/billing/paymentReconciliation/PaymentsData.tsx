import { CheckedState } from "@radix-ui/react-checkbox";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRightLeft, EyeIcon } from "lucide-react";
import { Link } from "raviger";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";

import useFilters from "@/hooks/useFilters";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import { multiply } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import { dateQueryString, dateTimeQueryString } from "@/Utils/utils";
import UserSelector from "@/components/Common/UserSelector";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import {
  dateFilter,
  locationFilter,
  paymentMethodFilter,
  paymentStatusFilter,
  paymentTypeFilter,
} from "@/components/ui/multi-filter/filterConfigs";
import {
  FilterDateRange,
  longDateRangeOptions,
} from "@/components/ui/multi-filter/utils/Utils";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";
import {
  PAYMENT_RECONCILIATION_METHOD_MAP,
  PAYMENT_RECONCILIATION_STATUS_COLORS,
  PaymentReconciliationRead,
  PaymentReconciliationType,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import { LocationRead } from "@/types/location/location";
import { UserReadMinimal } from "@/types/user/user";
import userApi from "@/types/user/userApi";
import ChangePaymentAccountSheet from "./ChangePaymentAccountSheet";

const typeMap: Record<PaymentReconciliationType, string> = {
  payment: "Payment",
  adjustment: "Adjustment",
  advance: "Advance",
};

const SORT_OPTIONS = {
  "-payment_datetime": "sort_by_latest_payment",
  payment_datetime: "sort_by_oldest_payment",
  "-created_date": "sort_by_latest_created",
  created_date: "sort_by_oldest_created",
};

export default function PaymentsData({
  facilityId,
  accountId,
  patientId,
  hideAccountColumn = false,
}: {
  facilityId: string;
  accountId?: string;
  patientId?: string;
  hideAccountColumn?: boolean;
}) {
  const { t } = useTranslation();
  const [createdBy, setCreatedBy] = useState<UserReadMinimal | undefined>(
    undefined,
  );
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isChangeAccountOpen, setIsChangeAccountOpen] = useState(false);
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: RESULTS_PER_PAGE_LIMIT,
    disableCache: true,
  });

  useEffect(() => {
    updateQuery({ ordering: "-payment_datetime" });
  }, []);

  // Resolve created_by_username from URL to user object
  const { data: selectedUser } = useQuery({
    queryKey: ["user", qParams.created_by_username],
    queryFn: query(userApi.get, {
      pathParams: { username: qParams.created_by_username },
    }),
    enabled: !!qParams.created_by_username && !createdBy,
  });

  useEffect(() => {
    if (selectedUser && qParams.created_by_username) {
      setCreatedBy(selectedUser);
      updateQuery({ created_by: selectedUser.id });
    }
  }, [selectedUser]);

  useEffect(() => {
    if (createdBy && !qParams.created_by) {
      setCreatedBy(undefined);
    }
  }, [qParams.created_by]);

  const { data: response, isLoading } = useQuery({
    queryKey: ["payments", accountId, qParams],
    queryFn: query(paymentReconciliationApi.listPaymentReconciliation, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status,
        created_date_after: qParams.created_date_after
          ? dateTimeQueryString(new Date(qParams.created_date_after))
          : undefined,
        created_date_before: qParams.created_date_before
          ? dateTimeQueryString(new Date(qParams.created_date_before), true)
          : undefined,
        reconciliation_type: qParams.reconciliation_type,
        method: qParams.method,
        location: qParams.location,
        ordering: qParams.ordering,
        created_by: qParams.created_by,
      },
    }),
  });

  const payments = useMemo(
    () => (response?.results as PaymentReconciliationRead[]) || [],
    [response?.results],
  );

  const selectedPayments = payments.filter((p) => selectedItems.has(p.id));

  useEffect(() => {
    if (!payments.length) {
      if (selectedItems.size > 0) {
        setSelectedItems(new Set());
      }
      return;
    }

    const validIds = new Set(payments.map((payment) => payment.id));
    setSelectedItems((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [payments, selectedItems.size]);

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(payments.map((p) => p.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const filters = [
    paymentStatusFilter("status"),
    paymentTypeFilter("reconciliation_type"),
    paymentMethodFilter("method"),
    locationFilter("location"),
    dateFilter("created_date", t("date"), longDateRangeOptions),
  ];

  const onFilterUpdate = (filterQuery: Record<string, unknown>) => {
    let query = { ...filterQuery };
    for (const [key, value] of Object.entries(filterQuery)) {
      switch (key) {
        case "created_date":
          {
            const dateRange = value as FilterDateRange;
            query = {
              ...query,
              created_date: undefined,
              created_date_after: dateRange?.from
                ? dateQueryString(dateRange?.from as Date)
                : undefined,
              created_date_before: dateRange?.to
                ? dateQueryString(dateRange?.to as Date)
                : undefined,
            };
          }
          break;
        case "location":
          {
            // value can be LocationRead (single mode) or LocationRead[] (multi mode)
            const locationValue = value as LocationRead | LocationRead[];
            const locationId = Array.isArray(locationValue)
              ? locationValue[0]?.id
              : (locationValue as LocationRead)?.id;
            query = {
              ...query,
              location: locationId || undefined,
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
    created_date:
      qParams.created_date_after || qParams.created_date_before
        ? {
            from: qParams.created_date_after
              ? new Date(qParams.created_date_after)
              : undefined,
            to: qParams.created_date_before
              ? new Date(qParams.created_date_before)
              : undefined,
          }
        : undefined,
    status: qParams.status ? [qParams.status] : undefined,
    reconciliation_type: qParams.reconciliation_type
      ? [qParams.reconciliation_type]
      : undefined,
    method: qParams.method ? [qParams.method] : undefined,
    location: [],
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between w-full my-4 gap-2">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
          <div className="w-full sm:w-fit">
            <UserSelector
              selected={createdBy}
              onChange={(user) => {
                setCreatedBy(user);
                updateQuery({
                  created_by: user.id,
                  created_by_username: user.username,
                });
              }}
              onClear={() => {
                setCreatedBy(undefined);
                updateQuery({
                  created_by: undefined,
                  created_by_username: undefined,
                });
              }}
              placeholder={t("filter_by_user")}
              facilityId={facilityId}
            />
          </div>
          <div className="w-full sm:w-fit">
            <MultiFilter
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onOperationChange={handleOperationChange}
              onClearAll={handleClearAll}
              onClearFilter={handleClearFilter}
              className="flex sm:flex-row flex-wrap sm:items-center"
              triggerButtonClassName="self-start sm:self-center"
              clearAllButtonClassName="self-start"
              facilityId={facilityId}
            />
          </div>
        </div>
        <div className="w-full sm:w-fit">
          <Select
            value={qParams.ordering || ""}
            onValueChange={(value) => {
              updateQuery({ ordering: value });
            }}
          >
            <SelectTrigger className="border-gray-400 text-gray-950 rounded-sm">
              <SelectValue placeholder={t("sort_by")} />
            </SelectTrigger>
            <SelectContent align="end">
              {Object.entries(SORT_OPTIONS).map(([value, text]) => (
                <SelectItem key={text} value={value}>
                  {t(text)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {selectedItems.size > 0 && payments?.length && patientId && accountId && (
        <div className="mb-4 flex items-center gap-3 rounded-md border bg-primary/5 border-primary/20 p-3">
          <span className="text-sm font-medium">
            {selectedItems.size} {t("items_selected")}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChangeAccountOpen(true)}
          >
            <ArrowRightLeft className="size-4 mr-2" />
            {t("change_account")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedItems(new Set())}
          >
            {t("clear_selection")}
          </Button>
        </div>
      )}
      {isLoading ? (
        <TableSkeleton count={3} />
      ) : !payments?.length ? (
        <EmptyState
          icon={
            <CareIcon icon="l-credit-card" className="text-primary size-6" />
          }
          title={t("no_payments")}
          description={t("no_payments_description")}
        />
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                {patientId && accountId && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        !!payments?.length &&
                        payments.every((p) => selectedItems.has(p.id))
                      }
                      onCheckedChange={(checked: CheckedState) =>
                        handleSelectAll(checked === true)
                      }
                      aria-label={t("select_all")}
                    />
                  </TableHead>
                )}
                {!hideAccountColumn && <TableHead>{t("account")}</TableHead>}
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("invoice")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("issuer_type")}</TableHead>
                <TableHead>{t("method")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow
                  key={payment.id}
                  className={
                    selectedItems.has(payment.id) ? "bg-primary/5" : ""
                  }
                >
                  {patientId && accountId && (
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(payment.id)}
                        onCheckedChange={(checked: CheckedState) =>
                          handleSelectItem(payment.id, checked === true)
                        }
                        aria-label={t("select_item")}
                      />
                    </TableCell>
                  )}
                  {!hideAccountColumn && (
                    <TableCell>
                      <Button variant="link" asChild>
                        <Link
                          href={`/facility/${facilityId}/billing/account/${payment.account?.id}`}
                          className="hover:text-primary "
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="text-base flex items-center gap-1 underline underline-offset-2">
                            {payment.account?.name}
                            <CareIcon
                              icon="l-external-link-alt"
                              className="size-3"
                            />
                          </div>
                        </Link>
                      </Button>
                    </TableCell>
                  )}
                  <TableCell>
                    {payment.payment_datetime
                      ? format(
                          new Date(payment.payment_datetime),
                          "MMM d, yyyy hh:mm a",
                        )
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {payment.target_invoice && (
                      <Button variant="link" asChild>
                        <Link
                          href={`/facility/${facilityId}/billing/invoices/${payment.target_invoice?.id}`}
                          className="hover:text-primary underline underline-offset-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {payment.target_invoice.number || t("view_invoice")}
                          <CareIcon
                            icon="l-external-link-alt"
                            className="size-3"
                          />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>{typeMap[payment.reconciliation_type]}</TableCell>
                  <TableCell>{t(payment.issuer_type)}</TableCell>
                  <TableCell>
                    {PAYMENT_RECONCILIATION_METHOD_MAP[payment.method]}
                  </TableCell>
                  <TableCell>
                    <MonetaryDisplay
                      amount={multiply(
                        payment.amount,
                        payment.is_credit_note ? -1 : 1,
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        PAYMENT_RECONCILIATION_STATUS_COLORS[payment.status]
                      }
                    >
                      {t(payment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" className="font-semibold" asChild>
                      <Link
                        href={`/facility/${facilityId}/billing/payments/${payment.id}`}
                      >
                        <EyeIcon />
                        {t("view")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {response && <Pagination totalCount={response.count} />}

      {patientId && accountId && (
        <ChangePaymentAccountSheet
          open={isChangeAccountOpen}
          onOpenChange={setIsChangeAccountOpen}
          facilityId={facilityId}
          patientId={patientId}
          currentAccountId={accountId}
          payments={selectedPayments}
          onSuccess={() => setSelectedItems(new Set())}
        />
      )}
    </>
  );
}
