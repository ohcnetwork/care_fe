import { useQuery } from "@tanstack/react-query";
import { EyeIcon } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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

import Page from "@/components/Common/Page";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { getEncounterStatusColor } from "@/types/emr/encounter";
import { MedicationDispenseSummary } from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";

export default function MedicationDispenseHistory({
  facilityId,
  locationId,
}: {
  facilityId: string;
  locationId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const tableHeadClass =
    "border-x p-3 text-gray-700 text-sm font-medium leading-5";
  const tableCellClass = "border-x p-3 text-gray-950";

  const { data: prescriptionQueue, isLoading } = useQuery<
    PaginatedResponse<MedicationDispenseSummary>
  >({
    queryKey: ["medicationDispenseSummary", qParams],
    queryFn: query.debounced(medicationDispenseApi.summary, {
      pathParams: { facilityId },
      queryParams: {
        search: qParams.search,
        priority: qParams.priority,
        encounter_class: qParams.category,
        limit: qParams.limit,
        offset: ((qParams.page ?? 1) - 1) * (qParams.limit ?? 14),
        exclude_dispense_status: "complete",
      },
    }),
  });

  return (
    <Page title={t("medication_dispense")} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder={t("Search by patient name, ID, or prescription...")}
            value={qParams.search}
            onChange={(e) => updateQuery({ search: e.target.value })}
            className="w-full"
          />
        </div>
      </div>

      <div className="rounded-md border shadow-sm w-full bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow className="border-b">
              <TableHead className={tableHeadClass}>{t("patient")}</TableHead>
              <TableHead className={tableHeadClass}>{t("category")}</TableHead>
              <TableHead className={tableHeadClass}>
                {t("encounter_status")}
              </TableHead>
              <TableHead className={cn(tableHeadClass, "text-right")}>
                {t("medications")}
              </TableHead>
              <TableHead className={cn(tableHeadClass, "w-[100px]")}>
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {isLoading ? (
              <TableRow className="border-b hover:bg-gray-50">
                <TableCell
                  colSpan={5}
                  className={cn(tableCellClass, "text-center py-8")}
                >
                  {t("Loading...")}
                </TableCell>
              </TableRow>
            ) : prescriptionQueue?.results?.length === 0 ? (
              <TableRow className="border-b hover:bg-gray-50">
                <TableCell
                  colSpan={5}
                  className={cn(tableCellClass, "text-center py-8")}
                >
                  {t("No prescriptions found")}
                </TableCell>
              </TableRow>
            ) : (
              prescriptionQueue?.results?.map(
                (item: MedicationDispenseSummary) => (
                  <TableRow
                    key={item.encounter.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <TableCell className={tableCellClass}>
                      <div className="font-medium text-base">
                        {item.encounter.patient.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.encounter.patient.id}
                      </div>
                    </TableCell>
                    <TableCell className={tableCellClass}>
                      <Badge
                        variant="outline"
                        className="bg-gray-100 text-gray-700 border-gray-200"
                      >
                        {t(
                          `encounter_class__${item.encounter.encounter_class}`,
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className={tableCellClass}>
                      <Badge
                        variant="outline"
                        className={getEncounterStatusColor(
                          item.encounter.status,
                        )}
                      >
                        {t(`encounter_status__${item.encounter.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(tableCellClass, "text-right font-semibold")}
                    >
                      {item.count}
                    </TableCell>
                    <TableCell className={tableCellClass}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-400 shadow-sm bg-white text-gray-950 font-medium"
                        onClick={() => {
                          navigate(
                            `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${item.encounter.patient.id}/dispense`,
                          );
                        }}
                      >
                        <EyeIcon className="size-4" />
                        {t("view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
      </div>
    </Page>
  );
}
