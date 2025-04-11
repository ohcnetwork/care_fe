import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";
import { Clock } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

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
import { Table, TableBody } from "@/components/ui/table";

import query from "@/Utils/request/query";
import { Encounter } from "@/types/emr/encounter";

import { DisplayField, RecordItem } from "./RecordItem";

interface HistoricalRecordSelectorProps<T> {
  patientId: string;
  structuredType: string;
  displayFields: DisplayField<T>[];
  onAddSelected: (selected: T[]) => void;
  fetchRecords: (encounterId: string) => Promise<T[]>;
  buttonLabel?: string;
  title?: string;
  currentEncounterId: string;
}

interface EncounterWithRecords<T> extends Encounter {
  records?: T[];
  isLoading?: boolean;
}

export function HistoricalRecordSelector<T>({
  patientId,
  structuredType,
  displayFields,
  onAddSelected,
  fetchRecords,
  buttonLabel = "View History",
  title = "History",
  currentEncounterId,
}: HistoricalRecordSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<T[]>([]);
  const [encounters, setEncounters] = useState<EncounterWithRecords<T>[]>([]);
  const [_selectedEncounter, setSelectedEncounter] = useState<string>("");

  // Fetch encounters
  const { data: encounterData } = useQuery({
    queryKey: ["encounters", patientId],
    queryFn: query(
      {
        path: "/api/v1/encounter/",
        method: "GET",
        TRes: {} as { results: Encounter[] },
      },
      {
        queryParams: {
          patient: patientId,
          limit: 100,
        },
      },
    ),
  });

  useEffect(() => {
    if (encounterData?.results) {
      setEncounters(encounterData.results);
    }
  }, [encounterData]);

  const handleExpandEncounter = async (encounterId: string) => {
    setSelectedEncounter(encounterId);
    setEncounters((prev) =>
      prev.map((e) => (e.id === encounterId ? { ...e, isLoading: true } : e)),
    );

    try {
      const records = await fetchRecords(encounterId);
      setEncounters((prev) =>
        prev.map((e) =>
          e.id === encounterId ? { ...e, records, isLoading: false } : e,
        ),
      );
    } catch (error) {
      console.error("Error fetching records:", error);
      setEncounters((prev) =>
        prev.map((e) =>
          e.id === encounterId ? { ...e, isLoading: false } : e,
        ),
      );
    }
  };

  const handleToggleSelect = (record: T) => {
    setSelectedRecords((prev) =>
      prev.includes(record)
        ? prev.filter((r) => r !== record)
        : [...prev, record],
    );
  };

  const handleAddSelected = () => {
    onAddSelected(selectedRecords);
    setSelectedRecords([]);
    setIsOpen(false);
  };

  const handleClose = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
      <SheetContent className="w-full sm:max-w-3xl p-0">
        <div className="flex justify-between items-center p-2">
          <SheetHeader className="p-0">
            <SheetTitle className="text-lg font-medium">{title}</SheetTitle>
          </SheetHeader>
        </div>

        <div className="space-y-0">
          {encounters
            .slice()
            .filter((encounter) => encounter.id !== currentEncounterId)
            .map((encounter) => (
              <Collapsible
                key={encounter.id}
                onOpenChange={() => {
                  if (!encounter.records && !encounter.isLoading) {
                    handleExpandEncounter(encounter.id);
                  }
                }}
                className=""
              >
                <div className="border rounded-md m-2 bg-gray-50 border-gray-200">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex justify-between items-center p-1 cursor-pointer">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                          <h2 className="font-semibold text-sm">
                            {t("encounter")}
                          </h2>
                        </div>
                        <p className="text-sm text-gray-500 ml-3">
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
                      </div>
                      <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="overflow-x-auto p-2">
                      {encounter.isLoading ? (
                        <div className="space-y-2 p-2">
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : encounter.records?.length ? (
                        <Table className="w-full p-2">
                          <TableBody className="[&_tr:last-child]:border-1">
                            {encounter.records.map(
                              (record: T, index: number) => (
                                <RecordItem
                                  key={index}
                                  record={record}
                                  isSelected={selectedRecords.includes(record)}
                                  onToggleSelect={handleToggleSelect}
                                  displayFields={displayFields}
                                />
                              ),
                            )}
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
            ))}
        </div>

        <div className="flex justify-between items-center p-4 border-t">
          <div className="text-sm">
            <span className="font-medium">
              {selectedRecords.length} {structuredType}(s)
            </span>{" "}
            selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={selectedRecords.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-cy="add-selected-records"
            >
              Add to Prescription
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
