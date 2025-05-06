import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  PaymentReconciliationOutcome,
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationRead,
  PaymentReconciliationStatus,
  PaymentReconciliationType,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";

function formatCurrency(amount: number | null, currency: string = "INR") {
  if (amount === null) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

const statusMap: Record<
  PaymentReconciliationStatus,
  {
    label: string;
    variant: "default" | "secondary" | "primary" | "destructive" | "outline";
  }
> = {
  active: { label: "active", variant: "primary" },
  cancelled: { label: "cancelled", variant: "destructive" },
  draft: { label: "draft", variant: "secondary" },
  entered_in_error: { label: "entered_in_error", variant: "destructive" },
};

const typeMap: Record<PaymentReconciliationType, string> = {
  payment: "Payment",
  adjustment: "Adjustment",
  advance: "Advance",
};

const outcomeMap: Record<
  PaymentReconciliationOutcome,
  {
    label: string;
    variant: "default" | "secondary" | "primary" | "destructive" | "outline";
  }
> = {
  complete: { label: "complete", variant: "primary" },
  error: { label: "error", variant: "destructive" },
  queued: { label: "queued", variant: "secondary" },
  partial: { label: "partial", variant: "outline" },
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
  className,
}: {
  facilityId: string;
  accountId?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["payments", qParams, accountId],
    queryFn: query(paymentReconciliationApi.listPaymentReconciliation, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        status: qParams.status ?? PaymentReconciliationStatus.active,
        reconciliation_type:
          qParams.reconciliation_type ?? PaymentReconciliationType.payment,
      },
    }),
  });

  const payments = (response?.results as PaymentReconciliationRead[]) || [];

  return (
    <>
      <Input
        placeholder={t("search_payments")}
        value={qParams.search || ""}
        onChange={(e) => updateQuery({ search: e.target.value || undefined })}
        className="max-w-xs"
      />
      <div className="flex flex-row justify-between items-center gap-2 my-4">
        <Tabs
          defaultValue={qParams.status ?? PaymentReconciliationStatus.active}
          onValueChange={(value) => updateQuery({ status: value })}
        >
          <TabsList>
            {Object.values(PaymentReconciliationStatus).map((status) => (
              <TabsTrigger key={status} value={status}>
                {t(statusMap[status].label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs
          defaultValue={
            qParams.reconciliation_type ?? PaymentReconciliationType.payment
          }
          onValueChange={(value) => updateQuery({ reconciliation_type: value })}
        >
          <TabsList>
            {Object.values(PaymentReconciliationType).map((type) => (
              <TabsTrigger key={type} value={type}>
                {t(typeMap[type])}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      {isLoading ? (
        <TableSkeleton count={3} />
      ) : (
        <div className={className}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("payment_id")}</TableHead>
                <TableHead>{t("invoice")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("method")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("outcome")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!payments?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    {t("no_payments")}
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      <div>#{payment.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        #{payment.target_invoice?.id}
                      </div>
                      <div className="text-xs text-muted-foreground mt-px">
                        {payment.target_invoice?.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      {typeMap[payment.reconciliation_type]}
                    </TableCell>
                    <TableCell>{methodMap[payment.method]}</TableCell>
                    <TableCell>
                      {payment.payment_datetime
                        ? format(
                            new Date(payment.payment_datetime),
                            "MMM d, yyyy",
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(payment.amount ?? null)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[payment.status].variant}>
                        {t(statusMap[payment.status].label)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={outcomeMap[payment.outcome].variant}>
                        {t(outcomeMap[payment.outcome].label)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/facility/${facilityId}/billing/payments/${payment.id}`}
                          >
                            <CareIcon icon="l-eye" className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {<Pagination totalCount={payments.length} />}
    </>
  );
}
