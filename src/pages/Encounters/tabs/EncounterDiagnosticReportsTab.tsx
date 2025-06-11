import { useQuery } from "@tanstack/react-query";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import Pagination from "@/components/Common/Pagination";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import { DIAGNOSTIC_REPORT_STATUS_COLORS } from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";

export const EncounterDiagnosticReportsTab = ({
  encounter,
}: EncounterTabProps) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const limit = RESULTS_PER_PAGE_LIMIT;
  const facilityId = encounter.facility.id;

  const { data, isLoading } = useQuery({
    queryKey: ["diagnosticReports", facilityId, encounter.id, page, limit],
    queryFn: query(diagnosticReportApi.listDiagnosticReports, {
      pathParams: { facility_external_id: facilityId },
      queryParams: {
        encounter: encounter.id,
        offset: (page - 1) * limit,
        limit,
        status: "final",
      },
    }),
  });

  return (
    <div className="space-y-6">
      {isLoading ? (
        <TableSkeleton count={6} />
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {data?.results?.length ? (
                <Table className="w-full overflow-x-auto whitespace-nowrap">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>{t("diagnostic_report")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("category")}</TableHead>
                      <TableHead className="text-right">
                        {t("action")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.results.map((report) => {
                      return (
                        <TableRow
                          key={report.id}
                          className="hover:bg-gray-50/50"
                        >
                          <TableCell className="font-medium">
                            <Link
                              href={`/facility/${facilityId}/diagnostic_reports/${report.id}`}
                              className="group flex items-start gap-1"
                            >
                              <div>
                                <div className="flex items-center gap-1">
                                  <div className="text-sm">
                                    {report.code ? (
                                      <p className="flex flex-col gap-1">
                                        {report.code.display}
                                        <span className="text-xs text-gray-500">
                                          {report.code.code}
                                        </span>
                                      </p>
                                    ) : (
                                      report.id
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]
                              }`}
                            >
                              {t(report.status)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {report.category?.display || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        navigate(
                                          `/facility/${facilityId}/diagnostic_reports/${report.id}`,
                                        )
                                      }
                                    >
                                      <CareIcon
                                        icon="l-eye"
                                        className="size-8"
                                      />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {t("view_details")}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  {t("no_diagnostic_reports_found")}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            {!!(data && data.count > limit) && (
              <Pagination
                data={{ totalCount: data.count }}
                onChange={(page, _) => setPage(page)}
                defaultPerPage={limit}
                cPage={page}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
