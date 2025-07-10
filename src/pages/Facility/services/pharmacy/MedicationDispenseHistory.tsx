import { useQuery } from "@tanstack/react-query";
import { EyeIcon } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
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
import { PaginatedResponse } from "@/Utils/request/types";
import {
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_STATUS_COLORS,
} from "@/types/emr/encounter/encounter";
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

  const { data: prescriptionQueue, isLoading } = useQuery<
    PaginatedResponse<MedicationDispenseSummary>
  >({
    queryKey: ["medicationDispenseSummary", facilityId, locationId, qParams],
    queryFn: query.debounced(medicationDispenseApi.summary, {
      pathParams: { facilityId },
      queryParams: {
        location: locationId,
        search: qParams.search,
        priority: qParams.priority,
        encounter_class: qParams.category,
        limit: qParams.limit,
        offset: ((qParams.page ?? 1) - 1) * (qParams.limit ?? 14),
        status:
          qParams.exclude_status === "history"
            ? "completed,cancelled,entered_in_error,stopped,declined"
            : "preparation,in_progress,on_hold",
      },
    }),
  });

  const DISPENSE_STATUS_OPTIONS = {
    pending: {
      label: "pending",
    },
    history: {
      label: "history",
    },
  } as const;

  return (
    <Page title={t("medication_dispense")}>
      <div className="mb-4 pt-6">
        <Tabs
          value={qParams.exclude_status || "pending"}
          onValueChange={(value) => updateQuery({ exclude_status: value })}
          className="w-full"
        >
          <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
            {Object.entries(DISPENSE_STATUS_OPTIONS).map(([key, { label }]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="border-b-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              >
                {t(label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
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

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("patient_name")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("encounter_status")}</TableHead>
              <TableHead>{t("medications")}</TableHead>
              <TableHead>{t("action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : prescriptionQueue?.results?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t("no_prescriptions_found")}
                </TableCell>
              </TableRow>
            ) : (
              prescriptionQueue?.results?.map(
                (item: MedicationDispenseSummary) => (
                  <TableRow key={item.encounter.id}>
                    <TableCell className="font-semibold">
                      {item.encounter.patient.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ENCOUNTER_CLASSES_COLORS[
                            item.encounter.encounter_class
                          ]
                        }
                      >
                        {t(
                          `encounter_class__${item.encounter.encounter_class}`,
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ENCOUNTER_STATUS_COLORS[item.encounter.status]}
                      >
                        {t(`encounter_status__${item.encounter.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        className="font-semibold"
                        onClick={() => {
                          navigate(
                            `/facility/${facilityId}/locations/${locationId}/medication_dispense/patient/${item.encounter.patient.id}/preparation`,
                          );
                        }}
                      >
                        <EyeIcon />
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
