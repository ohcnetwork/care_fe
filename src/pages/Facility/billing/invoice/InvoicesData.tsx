import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightSquare, PrinterIcon } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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
  INVOICE_STATUS_COLORS,
  InvoiceRead,
  InvoiceStatus,
} from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

const statusMap: Record<InvoiceStatus, { label: string; color: string }> = {
  [InvoiceStatus.draft]: {
    label: "draft",
    color: "bg-gray-100 text-gray-900 border-gray-200",
  },
  [InvoiceStatus.issued]: {
    label: "issued",
    color: "bg-blue-100 text-blue-900 border-blue-200",
  },
  [InvoiceStatus.balanced]: {
    label: "balanced",
    color: "bg-green-100 text-green-900 border-green-200",
  },
  [InvoiceStatus.cancelled]: {
    label: "cancelled",
    color: "bg-red-100 text-red-900 border-red-200",
  },
  [InvoiceStatus.entered_in_error]: {
    label: "entered_in_error",
    color: "bg-red-100 text-red-900 border-red-200",
  },
};

export default function InvoicesData({
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

  const { data: response, isLoading } = useQuery({
    queryKey: ["invoices", qParams, accountId],
    queryFn: query.debounced(
      invoiceApi.retrieveInvoice.method === "GET"
        ? invoiceApi.listInvoice
        : invoiceApi.listInvoice,
      {
        pathParams: { facilityId },
        queryParams: {
          account: accountId,
          limit: resultsPerPage,
          offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
          number: qParams.search,
          status: qParams.status,
          ordering: "-created_date",
        },
      },
    ),
  });

  const invoices = (response?.results as InvoiceRead[]) || [];

  return (
    <>
      <div className="flex flex-row justify-between items-center gap-2 max-sm:flex-col pb-4">
        <Tabs
          defaultValue={qParams.status ?? "all"}
          onValueChange={(value) =>
            updateQuery({ status: value === "all" ? undefined : value })
          }
          className="max-sm:hidden"
        >
          <TabsList>
            <TabsTrigger value="all">{t("all")}</TabsTrigger>
            {Object.values(InvoiceStatus).map((status) => (
              <TabsTrigger key={status} value={status}>
                {t(statusMap[status].label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:max-w-xs border border-gray-400 rounded-md">
          <CareIcon
            icon="l-search"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500"
          />
          <Input
            placeholder={t("search_invoices")}
            value={qParams.search || ""}
            onChange={(e) =>
              updateQuery({ search: e.target.value || undefined })
            }
            className="w-full pl-10"
          />
        </div>

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
            <SelectGroup>
              <SelectItem value="all">{t("all")}</SelectItem>
              {Object.values(InvoiceStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {t(statusMap[status].label)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <TableSkeleton count={3} />
      ) : !invoices?.length ? (
        <EmptyState
          icon={<CareIcon icon="l-file-alt" className="text-primary size-6" />}
          title={t("no_invoices")}
          description={t("try_adjusting_your_filters_or_search")}
        />
      ) : (
        <div>
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
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div>{invoice.number}</div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={INVOICE_STATUS_COLORS[invoice.status]}>
                      {t(statusMap[invoice.status].label)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <MonetaryDisplay
                      className="font-medium"
                      amount={String(invoice.total_gross)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        className="font-semibold"
                        asChild
                      >
                        <Link
                          href={`/facility/${facilityId}/billing/invoice/${invoice.id}/print`}
                        >
                          <PrinterIcon strokeWidth={1.5} />
                          {t("print")}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="font-semibold"
                        asChild
                      >
                        <Link
                          href={`/facility/${facilityId}/billing/invoices/${invoice.id}`}
                        >
                          <ArrowUpRightSquare strokeWidth={1.5} />
                          {t("see_invoice")}
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {response && <Pagination totalCount={response.count} />}
    </>
  );
}
