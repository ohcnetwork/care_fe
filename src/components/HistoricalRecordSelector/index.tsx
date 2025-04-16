import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import { ChevronsDownUp, ChevronsUpDown, Clock } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { PaginatedResponse } from "@/Utils/request/types";
import { Encounter } from "@/types/emr/encounter";
import { BatchRequestBody } from "@/types/questionnaire/batch";

import { DisplayField, RecordItem } from "./RecordItem";

interface StructuredTypeConfig<T> {
  type: string;
  displayFields: DisplayField<T>[];
  queryKey: string[];
  queryFn: (limit: number, offset: number) => Promise<PaginatedResponse<any>>;
  converter?: (item: any) => T;
}

interface HistoricalRecordSelectorProps<T> {
  patientId: string;
  structuredTypes: StructuredTypeConfig<T>[];
  onAddSelected: (selected: T[]) => void;
  buttonLabel?: string;
  title?: string;
  currentEncounterId: string;
}

interface EncounterWithRecords<T> extends Encounter {
  records?: {
    type: string;
    data: T[];
  }[];
  isLoading?: boolean;
  isFetched?: boolean;
}

interface BatchSubmissionResult {
  reference_id: string;
  status_code: number;
  data?: any;
}

interface BatchResponse {
  results: BatchSubmissionResult[];
}

export function HistoricalRecordSelector<T>({
  patientId,
  structuredTypes,
  onAddSelected,
  buttonLabel = "View History",
  title = "History",
  currentEncounterId,
}: HistoricalRecordSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Record<string, T[]>>(
    {},
  );
  const [encounters, setEncounters] = useState<EncounterWithRecords<T>[]>([]);
  const [activeType, setActiveType] = useState<string>(
    structuredTypes[0]?.type,
  );
  const [expandedEncounterId, setExpandedEncounterId] = useState<Set<string>>(
    new Set(),
  );
  const [currentOffset, setCurrentOffset] = useState<Record<string, number>>(
    {},
  );
  const LIMIT = 14;

  const { mutateAsync: submitBatch } = useMutation<
    BatchResponse,
    unknown,
    BatchRequestBody
  >({
    mutationFn: (variables) =>
      mutate(routes.batchRequest, { silent: true })(variables),
  });

  // Fetch records for the active type
  const { data: recordsData, isLoading: isLoadingRecords } = useQuery({
    queryKey: [
      "historical-records",
      activeType,
      currentOffset[activeType],
      ...(structuredTypes.find((st) => st.type === activeType)?.queryKey || []),
    ],
    queryFn: async () => {
      const activeTypeConfig = structuredTypes.find(
        (st) => st.type === activeType,
      );
      if (!activeTypeConfig) return { results: [], count: 0 };
      const response = await activeTypeConfig.queryFn(
        LIMIT,
        currentOffset[activeType] || 0,
      );
      return {
        results: activeTypeConfig.converter
          ? response.results.map(activeTypeConfig.converter)
          : response.results,
        count: response.count,
      };
    },
    enabled: isOpen,
  });

  console.log("recordsData", recordsData);

  // Fetch encounters for the records
  const { data: encounterData } = useQuery({
    queryKey: ["encounters", patientId, recordsData],
    queryFn: async () => {
      if (!recordsData?.results?.length) return { results: [] };

      // Get unique encounter IDs from records that we haven't fetched yet
      const newEncounterIds = new Set(
        recordsData.results
          .map((record: any) => record.encounter)
          .filter(
            (id: string): id is string =>
              !!id && !encounters.find((e) => e.id === id)?.isFetched,
          ),
      );

      if (newEncounterIds.size === 0) return { results: [] };

      // Create batch request for new encounters
      const batchRequest: BatchRequestBody = {
        requests: Array.from(newEncounterIds).map((id) => ({
          url: `/api/v1/encounter/${id}/?patient=${patientId}`,
          method: "GET",
          reference_id: `Encounter ${id}`,
          body: {},
        })),
      };

      try {
        const response = await submitBatch(batchRequest);
        if (!response) return { results: [] };

        // Process batch response
        const results = response.results
          .map((result: BatchSubmissionResult) => {
            if (result.status_code === 200 && result.data) {
              return { ...result.data, isFetched: true };
            }
            console.error(`Failed to fetch encounter: ${result.reference_id}`);
            return null;
          })
          .filter(Boolean);

        return { results };
      } catch (error) {
        console.error("Failed to fetch encounters:", error);
        return { results: [] };
      }
    },
    enabled: isOpen && !!recordsData?.results?.length && !isLoadingRecords,
  });

  // Update state when data changes
  useEffect(() => {
    if (!isOpen) return;

    // Update encounters with their records
    if (recordsData?.results && encounterData?.results) {
      // Group records by encounter
      const groupedRecords = recordsData.results.reduce(
        (acc: Record<string, T[]>, record: any) => {
          const encounterId = record.encounter;

          if (!acc[encounterId]) {
            acc[encounterId] = [];
          }
          acc[encounterId].push(record);
          return acc;
        },
        {} as Record<string, T[]>,
      );

      // Update encounters with their records
      setEncounters((prev) => {
        const updatedEncounters = [...prev];

        // Add new encounters from batch response
        encounterData.results.forEach((encounter: EncounterWithRecords<T>) => {
          const existingEncounterIndex = updatedEncounters.findIndex(
            (e) => e.id === encounter.id,
          );

          if (existingEncounterIndex === -1) {
            // New encounter
            updatedEncounters.push({
              ...encounter,
              isFetched: true,
              records: [
                {
                  type: activeType,
                  data: groupedRecords[encounter.id] || [],
                },
              ],
            });
            setExpandedEncounterId((prevIds) =>
              new Set(prevIds).add(encounter.id),
            );
          } else {
            // Existing encounter - append new records
            const existingRecords =
              updatedEncounters[existingEncounterIndex].records || [];
            const existingTypeRecords = existingRecords.find(
              (r) => r.type === activeType,
            );

            if (existingTypeRecords) {
              // Append new records to existing type
              existingTypeRecords.data = [
                ...existingTypeRecords.data,
                ...(groupedRecords[encounter.id] || []),
              ];
            } else {
              // Add new type records
              existingRecords.push({
                type: activeType,
                data: groupedRecords[encounter.id] || [],
              });
            }
            updatedEncounters[existingEncounterIndex].isFetched = true;
          }
        });

        return updatedEncounters;
      });
    }
  }, [isOpen, recordsData, encounterData, activeType]);

  const handleLoadMore = () => {
    setCurrentOffset((prev) => ({
      ...prev,
      [activeType]: (prev[activeType] || 0) + LIMIT,
    }));
  };

  const handleToggleSelect = (record: T) => {
    setSelectedRecords((prev) => ({
      ...prev,
      [activeType]: prev[activeType]?.includes(record)
        ? prev[activeType]!.filter((r) => r !== record)
        : [...(prev[activeType] || []), record],
    }));
  };

  const handleAddSelected = () => {
    onAddSelected(selectedRecords[activeType] || []);
    setSelectedRecords((prev) => ({
      ...prev,
      [activeType]: [],
    }));
    setIsOpen(false);
    setActiveType(structuredTypes[0]?.type || "");
    handleSoftReset();
  };

  const handleTabChange = (type: string) => {
    handleReset();
    setActiveType(type);
    setCurrentOffset((prev) => ({
      ...prev,
      [type]: prev[type] || 0,
    }));
  };

  const handleSoftReset = () => {
    setEncounters([]);
    setExpandedEncounterId(new Set());
    setCurrentOffset({});
  };

  const handleReset = () => {
    setSelectedRecords({});
    handleSoftReset();
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
    setActiveType(structuredTypes[0]?.type || "");
  };

  const handleExpandEncounter = (encounterId: string, isOpen: boolean) => {
    setExpandedEncounterId((prev) => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.add(encounterId);
      } else {
        newSet.delete(encounterId);
      }
      return newSet;
    });
  };

  const filteredEncounters = encounters
    .filter((encounter) => encounter.id !== currentEncounterId)
    .filter((encounter) => {
      const records = encounter.records?.find(
        (r) => r.type === activeType,
      )?.data;
      return records && records.length > 0;
    })
    .sort((a, b) => {
      const dateA = a.period?.start ? new Date(a.period.start).getTime() : 0;
      const dateB = b.period?.start ? new Date(b.period.start).getTime() : 0;
      return dateB - dateA; // Sort in descending order (newest first)
    });

  useEffect(() => {
    console.log("encounters", encounters);
    console.log("filteredEncounters", filteredEncounters);
  }, [encounters, filteredEncounters]);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          handleReset();
          setActiveType(structuredTypes[0]?.type || "");
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      }}
    >
      <SheetTrigger asChild>
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            data-cy="view-history"
            className="border-gray-400"
          >
            <Clock className="size-4" />
            <span className="font-semibold">{buttonLabel}</span>
          </Button>
        </div>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-3xl p-0 overflow-y-auto">
        <div className="flex flex-col gap-2 p-2">
          <SheetHeader className="p-0">
            <SheetTitle className="text-lg font-medium">{title}</SheetTitle>
          </SheetHeader>
          <Tabs
            value={activeType}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="w-full">
              {structuredTypes.map(({ type }) => (
                <TabsTrigger key={type} value={type} className="flex-1">
                  {type}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-0">
          {filteredEncounters.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Clock className="size-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">{t("no_records_found")}</p>
            </div>
          ) : (
            filteredEncounters.map((encounter) => (
              <Collapsible
                key={encounter.id}
                open={expandedEncounterId.has(encounter.id)}
                onOpenChange={(isOpen) =>
                  handleExpandEncounter(encounter.id, isOpen)
                }
                className=""
              >
                <div className="border rounded-md m-2 bg-gray-50 border-gray-200">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex justify-between items-center p-1 cursor-pointer">
                      <div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                          <p className="text-sm text-gray-500">
                            {encounter.period.start
                              ? format(
                                  new Date(encounter.period.start),
                                  "dd MMM, yyyy hh:mm a",
                                )
                              : "No date"}
                            {encounter.period.end
                              ? format(
                                  new Date(encounter.period.end),
                                  "dd MMM, yyyy hh:mm a",
                                )
                              : ""}
                          </p>
                          {encounter.organizations &&
                            encounter.organizations.map((org) => (
                              <Badge
                                variant="outline"
                                key={org.id}
                                className="ml-2"
                              >
                                {org.name}
                              </Badge>
                            ))}
                        </div>
                      </div>
                      {expandedEncounterId.has(encounter.id) ? (
                        <ChevronsDownUp className="size-4 text-gray-400" />
                      ) : (
                        <ChevronsUpDown className="size-4 text-gray-400" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="overflow-x-auto p-2">
                      {encounter.isLoading ? (
                        <div className="space-y-2 p-2">
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : encounter.records?.find((r) => r.type === activeType)
                          ?.data.length ? (
                        <Table className="w-full p-2 border rounded-md">
                          <TableHeader>
                            <TableRow className="divide-x">
                              <TableHead className="w-fit"></TableHead>
                              {structuredTypes
                                .find((st) => st.type === activeType)
                                ?.displayFields.map((field) => (
                                  <TableHead key={String(field.key)}>
                                    {field.label}
                                  </TableHead>
                                ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody className="[&_tr:last-child]:border-1">
                            {encounter.records
                              .find((r) => r.type === activeType)
                              ?.data.map((record: T, index: number) => (
                                <RecordItem
                                  key={index}
                                  record={record}
                                  isSelected={(
                                    selectedRecords[activeType] || []
                                  ).includes(record)}
                                  onToggleSelect={handleToggleSelect}
                                  displayFields={
                                    structuredTypes.find(
                                      (st) => st.type === activeType,
                                    )?.displayFields || []
                                  }
                                />
                              ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="pb-4 text-center text-sm text-gray-500">
                          No records found
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          )}
        </div>
        <div className="flex justify-between items-center p-2">
          {isLoadingRecords && <Skeleton className="h-8 w-full" />}
        </div>

        <div className="flex flex-col gap-2 p-4 border-t">
          {filteredEncounters.length > 0 &&
            (isLoadingRecords ? (
              <div className="flex justify-center p-4">
                <Skeleton className="h-8 w-full" />
              </div>
            ) : recordsData?.count &&
              recordsData.count > (currentOffset[activeType] || 0) + LIMIT ? (
              <Button
                variant="outline"
                onClick={handleLoadMore}
                className="w-full"
              >
                {t("load_more")}
              </Button>
            ) : null)}
          <div className="text-sm">
            <span className="font-medium">
              {(selectedRecords[activeType] || []).length} {activeType}
            </span>{" "}
            {t("selected")}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={(selectedRecords[activeType] || []).length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-cy="add-selected-records"
            >
              {t("add_selected")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
