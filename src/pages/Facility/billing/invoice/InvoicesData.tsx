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
  createdByFilter,
  invoiceStatusFilter,
} from "@/components/ui/multi-filter/filterConfigs";
import MultiFilter from "@/components/ui/multi-filter/MultiFilter";
import useMultiFilterState from "@/components/ui/multi-filter/utils/useMultiFilterState";

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

import useFilters from "@/hooks/useFilters";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import {
  INVOICE_STATUS_COLORS,
  InvoiceRead,
} from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import { UserReadMinimal } from "@/types/user/user";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

export default function InvoicesData({
  facilityId,
  accountId,
  showIdentifierFilter = false,
  hideAccountColumn = false,
}: {
  facilityId: string;
  accountId?: string;
  showIdentifierFilter?: boolean;
  hideAccountColumn?: boolean;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: RESULTS_PER_PAGE_LIMIT,
    disableCache: true,
  });

  const filters = [
    invoiceStatusFilter("status"),
    createdByFilter("created_by"),
  ];

  const onFilterUpdate = (filterQuery: Record<string, unknown>) => {
    let query = { ...filterQuery };
    const createdByValue = filterQuery.created_by as
      | UserReadMinimal
      | UserReadMinimal[]
      | undefined;
    if (createdByValue !== undefined) {
      const user = Array.isArray(createdByValue)
        ? createdByValue[0]
        : createdByValue;
      query = {
        ...query,
        created_by: user?.id || undefined,
      };
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
    created_by: [],
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["invoices", qParams, accountId],
    queryFn: query.debounced(invoiceApi.listInvoice, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        number: qParams.search,
        status: qParams.status,
        patient: qParams.patient,
        created_by: qParams.created_by,
      },
    }),
  });

  const invoices = (response?.results as InvoiceRead[]) || [];

  return (
    <>
      <div className="flex flex-col md:flex-row gap-2 pb-4">
        <div className="w-full md:w-auto md:flex gap-2 space-y-2 md:space-y-0">
          {showIdentifierFilter && (
            <PatientIdentifierFilter
              onSelect={(patientId, patientName) =>
                updateQuery({ patient: patientId, patient_name: patientName })
              }
              patientId={qParams.patient}
              patientName={qParams.patient_name}
              placeholder={t("filter_by_patient")}
              className="h-9 rounded-md"
            />
          )}

          <div>
            <div className="relative flex-1">
              <CareIcon
                icon="l-search"
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none z-10"
              />
              <Input
                placeholder={t("search_invoices")}
                value={qParams.search || ""}
                onChange={(e) =>
                  updateQuery({ search: e.target.value || undefined })
                }
                className="w-full md:w-auto pl-10 h-9"
              />
            </div>
          </div>
        </div>

        <MultiFilter
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onOperationChange={handleOperationChange}
          onClearAll={handleClearAll}
          onClearFilter={handleClearFilter}
          className="flex flex-row-reverse flex-wrap sm:items-center"
          facilityId={facilityId}
          align="end"
        />
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
                <TableHead>{t("invoice_date")}</TableHead>
                {!hideAccountColumn && <TableHead>{t("account")}</TableHead>}
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
                    <div>
                      {formatDateTime(
                        invoice.created_date,
                        "DD/MM/YY, hh:mm A",
                      )}
                    </div>
                  </TableCell>

                  {!hideAccountColumn && (
                    <TableCell>
                      <Button variant="link" asChild>
                        <Link
                          href={`/facility/${facilityId}/billing/account/${invoice.account?.id}`}
                          className="hover:text-primary "
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="text-base flex items-center gap-1 underline underline-offset-2">
                            {invoice.account?.name}
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
                    <Badge variant={INVOICE_STATUS_COLORS[invoice.status]}>
                      {t(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {invoice.locked ? (
                      <Badge variant="secondary" className="gap-1">
                        <CareIcon icon="l-lock" className="size-3" />
                        {t("locked")}
                      </Badge>
                    ) : (
                      <MonetaryDisplay
                        className="font-medium"
                        amount={invoice.total_gross}
                      />
                    )}
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
