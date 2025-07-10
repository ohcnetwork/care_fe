import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightSquare, ChevronDown, NotepadText } from "lucide-react";
import { navigate } from "raviger";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  ENCOUNTER_CLASSES_ICONS,
  EncounterClass,
} from "@/types/emr/encounter/encounter";
import {
  MEDICATION_PRIORITY_COLORS,
  MedicationPriority,
  MedicationRequestSummary,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

const BILLING_STATUS_OPTIONS = {
  pending: {
    label: "billing_pending",
  },
  partial: {
    label: "partially_billed",
  },
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

  // State for visible tabs and dropdown items
  const [visibleTabs, setVisibleTabs] = useState<("all" | EncounterClass)[]>([
    "all",
    "imp",
    "amb",
    "emer",
  ]);
  const [dropdownItems, setDropdownItems] = useState<EncounterClass[]>([
    "obsenc",
    "vr",
    "hh",
  ]);

  // Handle tab selection
  const handleTabSelect = (value: string) => {
    updateQuery({
      encounter_class: value === "all" ? undefined : value,
    });
  };

  // Handle dropdown item selection
  const handleDropdownSelect = (value: EncounterClass) => {
    // Swap the selected dropdown item with the last visible tab
    const lastVisibleTab = visibleTabs[visibleTabs.length - 1];
    const newVisibleTabs = [...visibleTabs.slice(0, -1), value];
    const newDropdownItems = [
      ...dropdownItems.filter((item) => item !== value),
      lastVisibleTab as EncounterClass,
    ];

    setVisibleTabs(newVisibleTabs);
    setDropdownItems(newDropdownItems);
    handleTabSelect(value);
  };

  const { data: prescriptionQueue, isLoading } = useQuery<
    PaginatedResponse<MedicationRequestSummary>
  >({
    queryKey: ["prescriptionQueue", facilityId, qParams],
    queryFn: query.debounced(medicationRequestApi.summary, {
      pathParams: { facilityId },
      queryParams: {
        patient: qParams.search,
        priority: qParams.priority,
        encounter_class: qParams.encounter_class,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        dispense_status:
          qParams.billing_status === "partial" ? "partial" : undefined,
        dispense_status_isnull: qParams.billing_status !== "partial",
      },
    }),
  });

  return (
    <Page title={t("prescription_queue")}>
      {/* Priority tabs with original styling */}
      <div className="mb-4 pt-6">
        <Tabs
          value={qParams.billing_status || "pending"}
          onValueChange={(value) => updateQuery({ billing_status: value })}
          className="w-full"
        >
          <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
            {Object.entries(BILLING_STATUS_OPTIONS).map(([key, { label }]) => (
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

      {/* Category tabs and search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between lg:gap-6 mb-6">
        <div className="flex flex-wrap gap-2">
          {/* Encounter Class Tabs */}
          <Tabs
            value={qParams.encounter_class || "all"}
            onValueChange={handleTabSelect}
            className="overflow-y-auto text-gray-950"
          >
            <TabsList className="flex items-center">
              <TabsTrigger value="all">
                <span className="text-gray-950 font-medium text-sm flex items-center gap-1">
                  {React.createElement(NotepadText, {
                    className: "size-4 text-gray-500",
                  })}
                  {t("all_prescriptions")}
                </span>
              </TabsTrigger>
              {visibleTabs.slice(1).map((key) => (
                <TabsTrigger key={key} value={key}>
                  <span className="text-gray-950 font-medium text-sm flex items-center gap-1">
                    {React.createElement(
                      ENCOUNTER_CLASSES_ICONS[key as EncounterClass],
                      {
                        className: "size-4 text-gray-500",
                      },
                    )}
                    {t(`encounter_class__${key as EncounterClass}`)}
                  </span>
                </TabsTrigger>
              ))}
              {dropdownItems.length > 0 && (
                <>
                  <Separator
                    orientation="vertical"
                    className="bg-gray-300 ml-2"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-gray-950 font-medium text-sm px-3 flex items-center"
                      >
                        {t("more")}
                        <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {dropdownItems.map((key) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => handleDropdownSelect(key)}
                          className="text-gray-950 font-medium text-sm flex items-center gap-1"
                        >
                          {React.createElement(ENCOUNTER_CLASSES_ICONS[key], {
                            className: "size-4",
                          })}
                          {t(`encounter_class__${key}`)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </TabsList>
          </Tabs>
          <FilterSelect
            value={qParams.priority || ""}
            onValueChange={(value) => updateQuery({ priority: value })}
            options={Object.values(MedicationPriority)}
            label="priority"
            onClear={() => updateQuery({ priority: undefined })}
          />
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
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("patient_name")}</TableHead>
              <TableHead>{t("priority")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("total_medicines")}</TableHead>
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
                (item: MedicationRequestSummary) => (
                  <TableRow key={item.encounter.id}>
                    <TableCell className="font-semibold">
                      {item.encounter.patient.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={MEDICATION_PRIORITY_COLORS[item.priority]}
                      >
                        {t(item.priority)}
                      </Badge>
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
                    <TableCell>{item.count}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        className="font-semibold"
                        onClick={() => {
                          navigate(
                            `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${item.encounter.patient.id}${qParams.billing_status === "partial" ? "/partial" : ""}`,
                          );
                        }}
                      >
                        <ArrowUpRightSquare strokeWidth={1.5} />
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
