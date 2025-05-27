import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightSquare, NotepadText } from "lucide-react";
import { navigate } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

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

import Page from "@/components/Common/Page";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  ENCOUNTER_CLASS,
  ENCOUNTER_CLASSES_ICONS,
} from "@/types/emr/encounter";
import {
  MedicationPriority,
  MedicationRequestSummary,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

const PRIORITY_BADGES: Record<
  MedicationPriority | "all",
  { label: string; className: string }
> = {
  all: {
    label: "all_priorities",
    className: "bg-gray-100 text-gray-900",
  },
  [MedicationPriority.STAT]: {
    label: "stat",
    className: "bg-red-100 text-red-900",
  },
  [MedicationPriority.URGENT]: {
    label: "urgent",
    className: "bg-orange-100 text-orange-900",
  },
  [MedicationPriority.ASAP]: {
    label: "asap",
    className: "bg-yellow-100 text-yellow-900",
  },
  [MedicationPriority.ROUTINE]: {
    label: "routine",
    className: "bg-blue-100 text-blue-900",
  },
} as const;

// Add a mapping for encounter class labels
const ENCOUNTER_CLASS_LABELS = {
  imp: "encounter_class__imp", // Inpatient
  amb: "encounter_class__amb", // Ambulatory
  obsenc: "encounter_class__obsenc", // Observation
  emer: "encounter_class__emer", // Emergency
  vr: "encounter_class__vr", // Virtual
  hh: "encounter_class__hh", // Home Health
} as const;

const CATEGORY_BADGE_COLORS = {
  imp: "bg-blue-100 text-blue-900", // Inpatient
  emer: "bg-red-600 text-white", // Emergency
  amb: "bg-green-100 text-green-900", // Outpatient/Ambulatory
  obsenc: "bg-gray-100 text-gray-900", // Observation
  vr: "bg-gray-100 text-gray-900", // Virtual
  hh: "bg-teal-100 text-teal-900", // Home Health
} as const;

export default function MedicationRequestList({
  facilityId,
  locationId,
}: {
  facilityId: string;
  locationId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const { data: prescriptionQueue, isLoading } = useQuery<
    PaginatedResponse<MedicationRequestSummary>
  >({
    queryKey: ["prescriptionQueue", qParams],
    queryFn: query.debounced(medicationRequestApi.summary, {
      pathParams: { facilityId },
      queryParams: {
        name: qParams.search,
        priority: qParams.priority,
        encounter_class: qParams.encounter_class,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        exclude_dispense_status: "complete",
      },
    }),
  });

  // Priority tab keys in order
  const priorityKeys = [
    "all",
    MedicationPriority.STAT,
    MedicationPriority.URGENT,
    MedicationPriority.ASAP,
    MedicationPriority.ROUTINE,
  ] as const;

  return (
    <Page title={t("prescription_queue")}>
      {/* Priority tabs with original styling */}
      <div className="mb-4 pt-6">
        <Tabs
          value={qParams.priority || "all"}
          onValueChange={(value) =>
            updateQuery({ priority: value === "all" ? undefined : value })
          }
          className="w-full"
        >
          <TabsList className="w-full justify-evenly sm:justify-start border-b  rounded-none bg-transparent p-0 h-auto overflow-x-auto">
            {priorityKeys.map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="border-b-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              >
                {t(PRIORITY_BADGES[key].label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Category tabs and search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6 mb-6">
        <div className="flex flex-wrap gap-2">
          {/* Encounter Class Tabs */}
          <Tabs
            value={qParams.encounter_class || "all"}
            onValueChange={(value) =>
              updateQuery({
                encounter_class: value === "all" ? undefined : value,
              })
            }
            className="overflow-y-auto text-gray-950"
          >
            <TabsList>
              <TabsTrigger value="all">
                <span className="text-gray-950 font-medium text-sm flex items-center gap-2">
                  {React.createElement(NotepadText, {
                    className: "size-4",
                  })}
                  {t("all_prescriptions")}
                </span>
              </TabsTrigger>
              {ENCOUNTER_CLASS.map((key) => (
                <TabsTrigger key={key} value={key}>
                  <span className="text-gray-950 font-medium text-sm flex items-center gap-2">
                    {React.createElement(ENCOUNTER_CLASSES_ICONS[key], {
                      className: "size-4",
                    })}
                    {t(ENCOUNTER_CLASS_LABELS[key])}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="w-full lg:max-w-sm">
          <Input
            placeholder={t("search_by_patient_name_or_id_or_pn")}
            value={qParams.search}
            onChange={(e) => updateQuery({ search: e.target.value })}
            className="w-full"
          />
        </div>
      </div>

      {/* Table section */}
      <div className="overflow-hidden rounded-md border-2 border-white shadow-md">
        <Table className="rounded-md">
          <TableHeader className=" bg-gray-100 text-gray-700">
            <TableRow>
              <TableHead className="text-gray-700">
                {t("patient_name")}
              </TableHead>
              <TableHead className="text-gray-700">{t("priority")}</TableHead>
              <TableHead className="text-gray-700">{t("category")}</TableHead>
              <TableHead className="text-gray-700">
                {t("total_medicines")}
              </TableHead>
              <TableHead className="text-gray-700">{t("action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
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
                (item: MedicationRequestSummary) => (
                  <TableRow
                    key={item.encounter.id}
                    className="hover:bg-gray-50 divide-x"
                  >
                    <TableCell className="font-semibold text-gray-950">
                      {item.encounter.patient.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={PRIORITY_BADGES[item.priority].className}
                      >
                        {t(PRIORITY_BADGES[item.priority].label)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          CATEGORY_BADGE_COLORS[
                            item.encounter.encounter_class
                          ] || "bg-gray-100 text-gray-800"
                        }
                      >
                        {t(
                          `encounter_class__${item.encounter.encounter_class}`,
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-950">
                      {item.count}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-auto font-semibold text-gray-950 border-gray-400"
                        onClick={() => {
                          navigate(
                            `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${item.encounter.patient.id}`,
                          );
                        }}
                      >
                        <ArrowUpRightSquare className="mr-2 size-4" />
                        {t("see_prescription")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-8 flex justify-center">
        <Pagination totalCount={prescriptionQueue?.count || 0} />
      </div>
    </Page>
  );
}
