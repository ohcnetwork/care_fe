import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import { ChevronsDownUp, ChevronsUpDown, Clock, Files } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
  queryFn: (
    limit: number,
    offset: number,
    signal: AbortSignal,
  ) => Promise<PaginatedResponse<any>>;
  converter?: (item: any) => T;
  expandableFields?: DisplayField<T>[];
}

interface HistoricalRecordSelectorProps<T extends BaseRecord> {
  structuredTypes: StructuredTypeConfig<T>[];
  onAddSelected: (selected: T[]) => void;
  buttonLabel?: string;
  title?: string;
  disableAPI?: boolean;
}

interface DateGroupedRecords<T extends BaseRecord> {
  date: string;
  records: T[];
}

interface RecordState<T extends BaseRecord> {
  selectedRecords: Record<string, T[]>;
  dateGroupedRecords: DateGroupedRecords<T>[];
  currentOffset: Record<string, number>;
  expandedDates: Set<string>;
}

const LIMIT = 14;

function useRecordState<T extends BaseRecord>() {
  const [state, setState] = useState<RecordState<T>>({
    selectedRecords: {},
    dateGroupedRecords: [],
    currentOffset: {},
    expandedDates: new Set(),
  });

  const resetState = useCallback(() => {
    setState({
      selectedRecords: {},
      dateGroupedRecords: [],
      currentOffset: {},
      expandedDates: new Set(),
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
  buttonLabel,
  title,
  disableAPI = false,
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
  const [expandedRecordId, setExpandedRecordId] = useState<string | undefined>(
    undefined,
  );

  // Fetch records for the active type
  const { data: recordsData, isLoading: isLoadingRecords } = useQuery({
    queryKey: [
      "historical-records",
      activeType,
      state.currentOffset[activeType],
      ...(structuredTypes.find((st) => st.type === activeType)?.queryKey || []),
    ],
    queryFn: async ({ signal }) => {
      const activeTypeConfig = structuredTypes.find(
        (st) => st.type === activeType,
      );
      if (!activeTypeConfig) return { results: [], count: 0 };
      const response = await activeTypeConfig.queryFn(
        LIMIT,
        state.currentOffset[activeType] || 0,
        signal,
      );
      const results = activeTypeConfig.converter
        ? response.results.map(activeTypeConfig.converter)
        : (response.results as T[]);
      return {
        results,
        count: response.count,
      };
    },
    enabled: isOpen && !disableAPI,
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
        currentOffset: {
          ...state.currentOffset,
          [type]: 0,
        },
        expandedDates: new Set(),
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-8 rounded-md px-3 text-xs gap-2">
          <Clock className="size-4" />
          <span className="font-semibold">
            {buttonLabel || t("view_history")}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-3xl lg:max-w-4xl p-0 overflow-y-auto">
        <div className="flex flex-col gap-2 p-2">
          <SheetHeader className="px-2 py-0">
            <SheetTitle className="text-lg font-medium">
              {title || t("history")}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {title || t("history")}
            </SheetDescription>
          </SheetHeader>
          {structuredTypes.length > 1 && (
            <Tabs
              value={activeType}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
                {structuredTypes.map(({ type }) => (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="border-b-3 px-1.5 sm:px-2.5 py-2 text-gray-600 font-semibold hover:text-gray-900 data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
                  >
                    {type}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="space-y-0 p-2">
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
              >
                <CollapsibleTrigger className="w-full bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-t-md mb-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="px-2">
                      <p className="text-sm text-indigo-700 font-medium">
                        {date}
                      </p>
                    </div>
                    {state.expandedDates.has(date) ? (
                      <ChevronsDownUp className="size-4 text-gray-400" />
                    ) : (
                      <ChevronsUpDown className="size-4 text-gray-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="lg:overflow-visible overflow-x-auto p-2">
                    {isLoadingRecords ? (
                      <div className="space-y-2 p-2">
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : records.length ? (
                      <Table className="w-full min-w-fit border-separate border-spacing-y-2">
                        <TableHeader>
                          <TableRow className="border-0">
                            <TableHead className="border-0 bg-transparent p-2 w-12">
                              <Checkbox
                                checked={records.every((record) =>
                                  (
                                    state.selectedRecords[activeType] || []
                                  ).includes(record),
                                )}
                                onCheckedChange={() => {
                                  handleSelectAllInDateGroup(date, records);
                                }}
                                className="size-5"
                              />
                            </TableHead>
                            {activeTypeConfig?.displayFields.map((field) => (
                              <TableHead
                                key={String(field.label)}
                                className={
                                  "border border-gray-200 bg-gray-50 nth-2:rounded-l-md nth-last-1:rounded-r-md"
                                }
                              >
                                {field.label}
                              </TableHead>
                            ))}
                            {activeTypeConfig?.expandableFields &&
                              activeTypeConfig.expandableFields.length > 0 && (
                                <TableHead
                                  className={
                                    "border border-gray-200 bg-gray-50 nth-last-1:rounded-r-md"
                                  }
                                ></TableHead>
                              )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
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
                              expandedRecordId={expandedRecordId}
                              onToggleExpand={(id) =>
                                setExpandedRecordId(
                                  expandedRecordId === id ? undefined : id,
                                )
                              }
                              expandableFields={
                                activeTypeConfig?.expandableFields || []
                              }
                            />
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="pb-4 text-center text-sm text-gray-500">
                        {t("no_records_found")}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
        <div className="flex justify-between items-center p-2">
          {isLoadingRecords && <Skeleton className="h-8 w-full" />}
        </div>

        <div className="sticky bottom-0 bg-white p-4 border-t">
          {state.dateGroupedRecords.length > 0 &&
            (isLoadingRecords ? (
              <div className="flex justify-center p-4">
                <Skeleton className="h-8 w-full" />
              </div>
            ) : recordsData?.count &&
              recordsData.count >
                (state.currentOffset[activeType] || 0) + LIMIT ? (
              <Button
                variant="ghost"
                onClick={handleLoadMore}
                className="font-semibold underline p-0 justify-start"
              >
                {t("load_more")}
              </Button>
            ) : null)}
          <div className="flex justify-between items-center gap-2 w-full">
            <div className="text-sm">
              <span className="font-medium">
                {(state.selectedRecords[activeType] || []).length} {activeType}
              </span>{" "}
              {t("selected")}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="font-semibold underline"
                onClick={handleClose}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={
                  (state.selectedRecords[activeType] || []).length === 0
                }
                className="bg-emerald-600 hover:bg-emerald-700"
                data-cy="add-selected-records"
              >
                <Files className="size-4" />
                {t("add_selected")}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
