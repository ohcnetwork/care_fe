import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { PencilIcon } from "lucide-react";
import { Link } from "raviger";
import { useCallback, useMemo, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Loading from "@/components/Common/Loading";
import { MedicationsTable } from "@/components/Medicine/MedicationsTable";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { MedicationAdministration } from "@/types/emr/medicationAdministration/medicationAdministration";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

import { AdministrationTab } from "./AdministrationTab";

interface Props {
  readonly?: boolean;
  facilityId: string;
  patientId: string;
  encounterId: string;
}

const timeSlots = [
  { label: "12:00 AM - 06:00 AM", start: "00:00", end: "06:00" },
  { label: "06:00 AM - 12:00 PM", start: "06:00", end: "12:00" },
  { label: "12:00 PM - 06:00 PM", start: "12:00", end: "18:00" },
  { label: "06:00 PM - 12:00 AM", start: "18:00", end: "24:00" },
];

export default function MedicationRequestTable({
  patientId,
  encounterId,
  facilityId,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const currentDate = new Date();

  const [endSlotDate, setEndSlotDate] = useState(currentDate);
  const [endSlotIndex, setEndSlotIndex] = useState(() => {
    const hour = currentDate.getHours();
    if (hour < 6) return 0;
    if (hour < 12) return 1;
    if (hour < 18) return 2;
    return 3;
  });

  // Calculate visible slots based on end slot
  const visibleSlots = useMemo(() => {
    const slots = [];
    let currentIndex = endSlotIndex;
    let currentDate = new Date(endSlotDate);

    // Add slots from right to left
    for (let i = 0; i < 4; i++) {
      if (currentIndex < 0) {
        currentIndex = 3;
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() - 1);
      }
      slots.unshift({
        ...timeSlots[currentIndex],
        date: new Date(currentDate),
      });
      currentIndex--;
    }
    return slots;
  }, [endSlotDate, endSlotIndex]);

  const handlePreviousSlot = useCallback(() => {
    const newEndSlotIndex = endSlotIndex - 1;
    if (newEndSlotIndex < 0) {
      setEndSlotIndex(3);
      const newDate = new Date(endSlotDate);
      newDate.setDate(newDate.getDate() - 1);
      setEndSlotDate(newDate);
    } else {
      setEndSlotIndex(newEndSlotIndex);
    }
  }, [endSlotDate, endSlotIndex]);

  const handleNextSlot = useCallback(() => {
    const newEndSlotIndex = endSlotIndex + 1;
    if (newEndSlotIndex > 3) {
      setEndSlotIndex(0);
      const newDate = new Date(endSlotDate);
      newDate.setDate(newDate.getDate() + 1);
      setEndSlotDate(newDate);
    } else {
      setEndSlotIndex(newEndSlotIndex);
    }
  }, [endSlotDate, endSlotIndex]);

  const { data: medications, isLoading: loading } = useQuery({
    queryKey: ["medication_requests", patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId: patientId },
      queryParams: { encounter: encounterId, limit: 100 },
    }),
    enabled: !!patientId,
  });

  const { data: administrations, refetch: refetchAdministrations } = useQuery({
    queryKey: ["medication_administrations", patientId, visibleSlots],
    queryFn: query(routes.medicationAdministration.list, {
      pathParams: { patientId: patientId },
      queryParams: {
        encounter: encounterId,
        ...(visibleSlots.length > 0 && {
          occurrence_period_start_after: format(
            visibleSlots[0].date,
            "yyyy-MM-dd'T'HH:mm:ss",
          ),
          occurrence_period_start_before: format(
            new Date(
              visibleSlots[visibleSlots.length - 1].date.getTime() +
                24 * 60 * 60 * 1000,
            ),
            "yyyy-MM-dd'T'HH:mm:ss",
          ),
        }),
      },
    }),
    enabled: !!patientId && !!visibleSlots?.length,
  });

  // Get last administered date for each medication
  const lastAdministeredDates = administrations?.results?.reduce(
    (acc: Record<string, string>, admin: MedicationAdministration) => {
      const existingDate = acc[admin.request];
      const adminDate = new Date(admin.occurrence_period_start);

      if (!existingDate || adminDate > new Date(existingDate)) {
        acc[admin.request] = admin.occurrence_period_start;
      }

      return acc;
    },
    {},
  );

  const handleAdministrationComplete = useCallback(() => {
    refetchAdministrations();
  }, [refetchAdministrations]);

  const filteredMedications = medications?.results?.filter(
    (med: MedicationRequestRead) => {
      if (!searchQuery.trim()) return true;
      const searchTerm = searchQuery.toLowerCase().trim();
      const medicationName = med.medication?.display?.toLowerCase() || "";
      return medicationName.includes(searchTerm);
    },
  );

  const activeMedications = filteredMedications?.filter(
    (med: MedicationRequestRead) =>
      ["active", "on_hold"].includes(med.status || ""),
  );
  const discontinuedMedications = filteredMedications?.filter(
    (med: MedicationRequestRead) =>
      !["active", "on_hold"].includes(med.status || ""),
  );

  const EmptyState = ({ searching }: { searching?: boolean }) => (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-secondary/10 p-3">
        <CareIcon icon="l-tablets" className="text-3xl text-muted-foreground" />
      </div>
      <div className="max-w-[200px] space-y-1">
        <h3 className="font-medium">
          {searching ? "No matches found" : "No Prescriptions"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {searching
            ? `No medications match "${searchQuery}"`
            : "No medications have been prescribed yet"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="rounded-lg">
        <Tabs defaultValue="prescriptions">
          <TabsList className="bg-gray-200 py-0 w-fit ">
            <TabsTrigger
              value="prescriptions"
              className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
            >
              Prescriptions
            </TabsTrigger>
            <TabsTrigger
              value="administration"
              className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
            >
              Medicine Administration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions">
            <div className="flex flex-col gap-2 ">
              <div className="flex items-center gap-2 p-2">
                <CareIcon
                  icon="l-search"
                  className="text-lg text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Search medications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery("")}
                  >
                    <CareIcon icon="l-times" className="text-lg" />
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="min-h-[200px] flex items-center justify-center">
                  <Loading />
                </div>
              ) : !medications?.results?.length ? (
                <EmptyState />
              ) : !filteredMedications?.length ? (
                <EmptyState searching />
              ) : (
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <Tabs defaultValue="active" className="w-full">
                    <div className=" px-2 flex justify-between">
                      <TabsList className="h-9">
                        <TabsTrigger value="active" className="text-xs">
                          Active{" "}
                          <Badge variant="secondary" className="ml-2">
                            {activeMedications?.length || 0}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="discontinued" className="text-xs">
                          Discontinued{" "}
                          <Badge variant="secondary" className="ml-2">
                            {discontinuedMedications?.length || 0}
                          </Badge>
                        </TabsTrigger>
                      </TabsList>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/medication_request`}
                          >
                            <PencilIcon className="mr-2" />
                            Edit
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/facility/${facilityId}/encounter/${encounterId}/prescriptions/print`}
                          >
                            <CareIcon icon="l-print" className="mr-2" />
                            Print
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <div className="min-w-[800px]">
                      <TabsContent value="active" className="p-2">
                        <MedicationsTable
                          medications={activeMedications || []}
                        />
                      </TabsContent>
                      <TabsContent value="discontinued" className="p-2">
                        <MedicationsTable
                          medications={discontinuedMedications || []}
                        />
                      </TabsContent>
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </Tabs>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          <TabsContent value="administration">
            <AdministrationTab
              loadingAdministrations={loading}
              activeMedications={medications?.results}
              administrations={administrations}
              lastAdministeredDates={lastAdministeredDates}
              patientId={patientId}
              encounterId={encounterId}
              visibleSlots={visibleSlots}
              onPreviousSlot={handlePreviousSlot}
              onNextSlot={handleNextSlot}
              currentDate={currentDate}
              endSlotIndex={endSlotIndex}
              onAdministrationComplete={handleAdministrationComplete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
