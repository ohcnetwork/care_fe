import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightSquare, EditIcon } from "lucide-react";
import { navigate } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  ACCOUNT_BILLING_STATUS_COLORS,
  ACCOUNT_STATUS_COLORS,
  type AccountRead,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";

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
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] =
    React.useState<AccountRead | null>(null);
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["accounts", qParams],
    queryFn: query.debounced(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patientId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        name: qParams.search,
        status: qParams.status,
        billing_status: qParams.billing_status,
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
          <div className="mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4">
              <Tabs
                value={qParams.status ?? "all"}
                onValueChange={(value) =>
                  updateQuery({ status: value === "all" ? undefined : value })
                }
                className="overflow-y-auto max-w-[calc(100%)] max-sm:hidden text-gray-950"
              >
                <TabsList>
                  <TabsTrigger value="all">{t("all_accounts")}</TabsTrigger>
                  {Object.keys(ACCOUNT_STATUS_COLORS).map((key) => (
                    <TabsTrigger key={key} value={key}>
                      <span className="text-gray-950 font-medium text-sm">
                        {t(key)}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <Select
                defaultValue={qParams.status ?? "all"}
                onValueChange={(value) =>
                  updateQuery({ status: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger className="sm:hidden">
                  <SelectValue placeholder={t("filter_by_status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="text-gray-950 font-medium text-sm">
                      {t("all")}
                    </span>
                  </SelectItem>
                  {Object.keys(ACCOUNT_STATUS_COLORS).map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="border-1 border-gray-300 rounded-md relative sm:max-w-xs w-[calc(100%)]">
                <Select
                  value={qParams.billing_status ?? "all"}
                  onValueChange={(value) =>
                    updateQuery({
                      billing_status: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("all_billing_statuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="text-gray-950 font-medium text-sm">
                        {t("all_billing_statuses")}
                      </span>
                    </SelectItem>
                    {Object.keys(ACCOUNT_BILLING_STATUS_COLORS).map((key) => (
                      <SelectItem key={key} value={key}>
                        <span className="text-gray-950 font-medium text-sm">
                          {t(key)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="relative sm:max-w-xs w-[calc(100%)]">
              <CareIcon
                icon="l-search"
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500"
              />
              <Input
                placeholder={t("search_accounts")}
                value={qParams.search || ""}
                onChange={(e) =>
                  updateQuery({ search: e.target.value || undefined })
                }
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              {patientId && (
                <Button onClick={() => setSheetOpen(true)}>
                  {t("create_account")}
                </Button>
              )}
            </div>
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
                <TableHead>{t("account_status")}</TableHead>
                <TableHead>{t("billing_status")}</TableHead>
                <TableHead>{t("period")}</TableHead>
                <TableHead>{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account: AccountRead) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={account.name} className="size-8" />
                      <div>
                        <div className="text-base font-semibold leading-6">
                          {account.name}
                        </div>
                        {!hidePatientName && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <span
                              className="inline-flex text-sm text-gray-600 cursor-pointer underline"
                              onClick={() =>
                                navigate(
                                  `/facility/${facilityId}/patient/${account.patient.id}`,
                                )
                              }
                            >
                              {account.patient.name}
                              <ArrowUpRightSquare className="size-4 ml-1 mt-0.5" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "border-x p-3 text-base font-medium leading-6",
                      Number(account.total_balance) > 0
                        ? "text-gray-950"
                        : "text-green-700 italic",
                    )}
                  >
                    <MonetaryDisplay amount={account.total_balance} />
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
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="font-semibold"
                        onClick={() => {
                          setEditingAccount(account);
                          setSheetOpen(true);
                        }}
                      >
                        <EditIcon strokeWidth={1.5} />
                        <span className="underline">{t("edit")}</span>
                      </Button>
                      <Button
                        variant="outline"
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
