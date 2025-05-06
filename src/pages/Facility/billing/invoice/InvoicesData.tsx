import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonetaryValue } from "@/components/ui/monetary-value";
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
import { InvoiceRead, InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

const statusMap: Record<
  InvoiceStatus,
  {
    label: string;
    variant: "default" | "secondary" | "primary" | "destructive" | "outline";
  }
> = {
  [InvoiceStatus.draft]: { label: "draft", variant: "secondary" },
  [InvoiceStatus.issued]: { label: "issued", variant: "default" },
  [InvoiceStatus.balanced]: { label: "balanced", variant: "primary" },
  [InvoiceStatus.cancelled]: { label: "cancelled", variant: "destructive" },
  [InvoiceStatus.entered_in_error]: {
    label: "entered_in_error",
    variant: "destructive",
  },
};

export default function InvoicesData({
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
    queryKey: ["invoices", qParams, accountId],
    queryFn: query(
      invoiceApi.retrieveInvoice.method === "GET"
        ? invoiceApi.listInvoice
        : invoiceApi.listInvoice,
      {
        pathParams: { facilityId },
        queryParams: {
          account: accountId,
          limit: resultsPerPage,
          offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
          search: qParams.search,
          status: qParams.status ?? InvoiceStatus.draft,
        },
      },
    ),
  });

  const invoices = (response?.results as InvoiceRead[]) || [];

  return (
    <>
      <div className="flex flex-row justify-between items-center gap-2">
        <Input
          placeholder={t("search_invoices")}
          value={qParams.search || ""}
          onChange={(e) => updateQuery({ search: e.target.value || undefined })}
          className="max-w-xs"
        />
        <Tabs
          defaultValue={qParams.status ?? InvoiceStatus.draft}
          onValueChange={(value) => updateQuery({ status: value })}
          className="mx-4 mb-4"
        >
          <TabsList>
            {Object.values(InvoiceStatus).map((status) => (
              <TabsTrigger key={status} value={status}>
                {t(statusMap[status].label)}
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
                <TableHead>{t("invoice_number")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("total")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!invoices?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    {t("no_invoices")}
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <div> {invoice.title}</div>
                      <div className="text-xs text-muted-foreground mt-px">
                        {invoice.id}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={statusMap[invoice.status].variant}>
                        {t(statusMap[invoice.status].label)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <MonetaryValue
                        className="font-medium"
                        value={invoice.total_gross}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/facility/${facilityId}/billing/invoices/${invoice.id}`}
                          >
                            <CareIcon icon="l-eye" className="size-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/facility/${facilityId}/billing/invoice/${invoice.id}/print`}
                          >
                            <CareIcon icon="l-print" className="size-4" />
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
      {<Pagination totalCount={invoices.length} />}
    </>
  );
}
