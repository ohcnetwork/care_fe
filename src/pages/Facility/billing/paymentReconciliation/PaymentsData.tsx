import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { EyeIcon } from "lucide-react";
import { Link } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

import query from "@/Utils/request/query";
import {
  PAYMENT_RECONCILIATION_STATUS_COLORS,
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationRead,
  PaymentReconciliationStatus,
  PaymentReconciliationType,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";

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

const methodMap: Record<PaymentReconciliationPaymentMethod, string> = {
  cash: "Cash",
  ccca: "Credit Card",
  cchk: "Credit Check",
  cdac: "Credit Account",
  chck: "Check",
  ddpo: "Direct Deposit",
  debc: "Debit Card",
};

export default function PaymentsData({
  facilityId,
  accountId,
}: {
  facilityId: string;
  accountId?: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: RESULTS_PER_PAGE_LIMIT,
    disableCache: true,
  });

  useEffect(() => {
    updateQuery({ ordering: "-payment_datetime" });
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ["payments", accountId, qParams],
    queryFn: query(paymentReconciliationApi.listPaymentReconciliation, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status,
        reconciliation_type: qParams.reconciliation_type,
        ordering: qParams.ordering,
      },
    }),
  });

  const payments = (response?.results as PaymentReconciliationRead[]) || [];

  return (
    <>
      <div className="flex w-full flex-col items-center my-4 gap-2 md:flex-row md:flex-wrap md:gap-y-4 md:justify-start lg:flex-nowrap lg:justify-between">
        <div className="flex w-full flex-col items-center gap-3 md:flex-row md:flex-wrap md:gap-y-4">
          <Tabs
            defaultValue={qParams.status ?? "all"}
            onValueChange={(value) =>
              updateQuery({ status: value === "all" ? undefined : value })
            }
            className="hidden sm:flex"
          >
            <TabsList>
              <TabsTrigger value="all">{t("all_status")}</TabsTrigger>
              {Object.values(PaymentReconciliationStatus).map((status) => (
                <TabsTrigger key={status} value={status}>
                  {t(status)}
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
            <SelectTrigger className="sm:hidden border-gray-400 text-gray-950 rounded-sm">
              <SelectValue placeholder={t("filter_by_status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t("all")}</SelectItem>
                {Object.values(PaymentReconciliationStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(status)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Tabs
            defaultValue={qParams.reconciliation_type ?? "all"}
            onValueChange={(value) =>
              updateQuery({
                reconciliation_type: value === "all" ? undefined : value,
              })
            }
            className="hidden sm:flex"
          >
            <TabsList>
              <TabsTrigger value="all">{t("all_type")}</TabsTrigger>
              {Object.values(PaymentReconciliationType).map((type) => (
                <TabsTrigger key={type} value={type}>
                  {t(typeMap[type])}
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
            <SelectTrigger className="sm:hidden border-gray-400 text-gray-950 rounded-sm">
              <SelectValue placeholder={t("filter_by_type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t("all")}</SelectItem>
                {Object.values(PaymentReconciliationType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(typeMap[type])}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="w-full sm:w-fit">
            <Select
              value={qParams.ordering}
              onValueChange={(value) => {
                updateQuery({ ordering: value });
              }}
            >
              <SelectTrigger className="border-gray-400 text-gray-950 rounded-sm">
                <SelectValue placeholder={t("sort_by")} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORT_OPTIONS).map(([value, text]) => (
                  <SelectItem key={text} value={value}>
                    {t(text)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {isLoading ? (
        <TableSkeleton count={3} />
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("account")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("invoice")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("method")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!payments?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    {t("no_payments")}
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
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
                            {t("view_invoice")}
                            <CareIcon
                              icon="l-external-link-alt"
                              className="size-3"
                            />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {typeMap[payment.reconciliation_type]}
                    </TableCell>
                    <TableCell>{methodMap[payment.method]}</TableCell>
                    <TableCell>
                      <MonetaryDisplay amount={payment.amount} />
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
                      <Button
                        variant="outline"
                        className="font-semibold"
                        asChild
                      >
                        <Link
                          href={`/facility/${facilityId}/billing/payments/${payment.id}`}
                        >
                          <EyeIcon />
                          {t("view")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {response && <Pagination totalCount={response.count} />}
    </>
  );
}
