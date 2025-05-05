import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import { ChevronsDownUp, ChevronsUpDown, Clock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

import { PaginatedResponse } from "@/Utils/request/types";

import { DisplayField, RecordItem } from "./RecordItem";

interface BaseRecord {
  created_date?: string;
  [key: string]: any;
}

interface StructuredTypeConfig<T extends BaseRecord> {
  type: string;
  displayFields: DisplayField<T>[];
  queryKey: string[];
  queryFn: (limit: number, offset: number) => Promise<PaginatedResponse<any>>;
  converter?: (item: any) => T;
}

interface HistoricalRecordSelectorProps<T extends BaseRecord> {
  structuredTypes: StructuredTypeConfig<T>[];
  onAddSelected: (selected: T[]) => void;
  buttonLabel?: string;
  title?: string;
}

interface DateGroupedRecords<T extends BaseRecord> {
  date: string;
  records: T[];
}

interface RecordState<T extends BaseRecord> {
  selectedRecords: Record<string, T[]>;
  dateGroupedRecords: DateGroupedRecords<T>[];
  expandedDates: Set<string>;
  currentOffset: Record<string, number>;
}

const LIMIT = 14;

function useRecordState<T extends BaseRecord>() {
  const [state, setState] = useState<RecordState<T>>({
    selectedRecords: {},
    dateGroupedRecords: [],
    expandedDates: new Set(),
    currentOffset: {},
  });

  const resetState = useCallback(() => {
    setState({
      selectedRecords: {},
      dateGroupedRecords: [],
      expandedDates: new Set(),
      currentOffset: {},
    });
  }, []);

  const updateState = useCallback((updates: Partial<RecordState<T>>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  return { state, updateState, resetState };
}

function useRecordSelection<T extends BaseRecord>(
  state: RecordState<T>,
  updateState: (updates: Partial<RecordState<T>>) => void,
  activeType: string,
) {
  const handleToggleSelect = useCallback(
    (record: T) => {
      updateState({
        selectedRecords: {
          ...state.selectedRecords,
          [activeType]: state.selectedRecords[activeType]?.includes(record)
            ? state.selectedRecords[activeType]!.filter((r) => r !== record)
            : [...(state.selectedRecords[activeType] || []), record],
        },
      });
    },
    [state.selectedRecords, activeType, updateState],
  );

  const handleSelectAllInDateGroup = useCallback(
    (date: string, records: T[]) => {
      const allSelected = records.every((record) =>
        (state.selectedRecords[activeType] || []).includes(record),
      );

      updateState({
        selectedRecords: {
          ...state.selectedRecords,
          [activeType]: allSelected
            ? (state.selectedRecords[activeType] || []).filter(
                (record) => !records.includes(record),
              )
            : [
                ...new Set([
                  ...(state.selectedRecords[activeType] || []),
                  ...records,
                ]),
              ],
        },
      });
    },
    [state.selectedRecords, activeType, updateState],
  );

  return { handleToggleSelect, handleSelectAllInDateGroup };
}

export function HistoricalRecordSelector<T extends BaseRecord>({
  structuredTypes,
  onAddSelected,
  buttonLabel = "View History",
  title = "History",
}: HistoricalRecordSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeType, setActiveType] = useState<string>(
    structuredTypes[0]?.type,
  );
  const { state, updateState, resetState } = useRecordState<T>();
  const { handleToggleSelect, handleSelectAllInDateGroup } = useRecordSelection(
    state,
    updateState,
    activeType,
  );

  // Fetch records for the active type
  const { data: recordsData, isLoading: isLoadingRecords } = useQuery({
    queryKey: [
      "historical-records",
      activeType,
      state.currentOffset[activeType],
      ...(structuredTypes.find((st) => st.type === activeType)?.queryKey || []),
    ],
    queryFn: async () => {
      const activeTypeConfig = structuredTypes.find(
        (st) => st.type === activeType,
      );
      if (!activeTypeConfig) return { results: [], count: 0 };
      const response = await activeTypeConfig.queryFn(
        LIMIT,
        state.currentOffset[activeType] || 0,
      );
      const results = activeTypeConfig.converter
        ? response.results.map(activeTypeConfig.converter)
        : (response.results as T[]);
      return {
        results,
        count: response.count,
      };
    },
    enabled: isOpen,
    staleTime: 0,
  });

  // Update state when data changes
  useEffect(() => {
    if (!isOpen || !recordsData?.results) return;

    // Group records by date
    const groupedByDate = recordsData.results.reduce(
      (acc: Record<string, T[]>, record: T) => {
        const date = record.created_date
          ? format(new Date(record.created_date), "dd MMM, yyyy")
          : "No date";
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(record);
        return acc;
      },
      {} as Record<string, T[]>,
    );

    // Convert to array and sort by date
    const sortedGroups: DateGroupedRecords<T>[] = Object.entries(groupedByDate)
      .map(([date, records]) => ({ date, records }))
      .sort((a, b) => {
        if (a.date === "No date") return 1;
        if (b.date === "No date") return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    // Merge with existing records
    updateState({
      dateGroupedRecords: [...state.dateGroupedRecords, ...sortedGroups]
        .reduce((acc: DateGroupedRecords<T>[], group) => {
          const existingGroupIndex = acc.findIndex(
            (g) => g.date === group.date,
          );
          if (existingGroupIndex >= 0) {
            // Merge records for existing date
            const existingRecords = acc[existingGroupIndex].records;
            const newRecords = group.records.filter(
              (newRecord) =>
                !existingRecords.some(
                  (existingRecord) =>
                    JSON.stringify(existingRecord) ===
                    JSON.stringify(newRecord),
                ),
            );
            acc[existingGroupIndex].records = [
              ...existingRecords,
              ...newRecords,
            ];
          } else {
            // Add new date group
            acc.push(group);
          }
          return acc;
        }, [])
        .sort((a, b) => {
          if (a.date === "No date") return 1;
          if (b.date === "No date") return -1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }),
    });

    // Expand the first 5 date groups on initial load
    if (
      !state.currentOffset[activeType] ||
      state.currentOffset[activeType] === 0
    ) {
      const top5Dates = new Set(
        sortedGroups.slice(0, 5).map((group) => group.date),
      );
      updateState({ expandedDates: top5Dates });
    }
  }, [
    isOpen,
    recordsData,
    state.currentOffset[activeType],
    activeType,
    updateState,
  ]);

  const handleLoadMore = useCallback(() => {
    updateState({
      currentOffset: {
        ...state.currentOffset,
        [activeType]: (state.currentOffset[activeType] || 0) + LIMIT,
      },
    });
  }, [state.currentOffset, activeType, updateState]);

  const handleAddSelected = useCallback(() => {
    onAddSelected(state.selectedRecords[activeType] || []);
    updateState({
      selectedRecords: {
        ...state.selectedRecords,
        [activeType]: [],
      },
    });
    setIsOpen(false);
    setActiveType(structuredTypes[0]?.type || "");
    resetState();
  }, [
    state.selectedRecords,
    activeType,
    onAddSelected,
    structuredTypes,
    updateState,
    resetState,
  ]);

  const handleTabChange = useCallback(
    (type: string) => {
      setActiveType(type);
      updateState({
        selectedRecords: {},
        dateGroupedRecords: [],
        expandedDates: new Set(),
        currentOffset: {
          ...state.currentOffset,
          [type]: 0,
        },
      });
    },
    [state.currentOffset, updateState],
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resetState();
    setActiveType(structuredTypes[0]?.type || "");
  }, [structuredTypes, resetState]);

  const handleExpandDate = useCallback(
    (date: string, isOpen: boolean) => {
      const newSet = new Set(state.expandedDates);
      if (isOpen) {
        newSet.add(date);
      } else {
        newSet.delete(date);
      }
      updateState({ expandedDates: newSet });
    },
    [state.expandedDates, updateState],
  );

  const activeTypeConfig = useMemo(
    () => structuredTypes.find((st) => st.type === activeType),
    [structuredTypes, activeType],
  );

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          resetState();
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
          {state.dateGroupedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Clock className="size-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">{t("no_records_found")}</p>
            </div>
          ) : (
            state.dateGroupedRecords.map(({ date, records }) => (
              <Collapsible
                key={date}
                open={state.expandedDates.has(date)}
                onOpenChange={(isOpen) => handleExpandDate(date, isOpen)}
                className=""
              >
                <div className="border rounded-md m-2 bg-gray-50 border-gray-200">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex justify-between items-center p-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={records.every((record) =>
                            (state.selectedRecords[activeType] || []).includes(
                              record,
                            ),
                          )}
                          onCheckedChange={() => {
                            handleSelectAllInDateGroup(date, records);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="ml-1 size-5"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                          <p className="text-sm text-gray-500">{date}</p>
                        </div>
                      </div>
                      {state.expandedDates.has(date) ? (
                        <ChevronsDownUp className="size-4 text-gray-400" />
                      ) : (
                        <ChevronsUpDown className="size-4 text-gray-400" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="overflow-x-auto p-2">
                      {isLoadingRecords ? (
                        <div className="space-y-2 p-2">
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : records.length ? (
                        <Table className="w-full p-2 border rounded-md">
                          <TableHeader>
                            <TableRow className="divide-x">
                              <TableHead className="w-fit"></TableHead>
                              {activeTypeConfig?.displayFields.map((field) => (
                                <TableHead key={String(field.key)}>
                                  {field.label}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody className="[&_tr:last-child]:border-1">
                            {records.map((record: T, index: number) => (
                              <RecordItem
                                key={index}
                                record={record}
                                isSelected={(
                                  state.selectedRecords[activeType] || []
                                ).includes(record)}
                                onToggleSelect={handleToggleSelect}
                                displayFields={
                                  activeTypeConfig?.displayFields || []
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
          {state.dateGroupedRecords.length > 0 &&
            (isLoadingRecords ? (
              <div className="flex justify-center p-4">
                <Skeleton className="h-8 w-full" />
              </div>
            ) : recordsData?.count &&
              recordsData.count >
                (state.currentOffset[activeType] || 0) + LIMIT ? (
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
              {(state.selectedRecords[activeType] || []).length} {activeType}
            </span>{" "}
            {t("selected")}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={(state.selectedRecords[activeType] || []).length === 0}
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
