"use client";

import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import React, { useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import Loading from "@/components/Common/Loading";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage } from "@/components/Medicine/utils";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import {
  MedicationAdministration,
  MedicationAdministrationRequest,
} from "@/types/emr/medicationAdministration/medicationAdministration";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";

import { MedicineAdminDialog } from "./MedicineAdminDialog";
import { MedicineAdminSheet } from "./MedicineAdminSheet";

interface AdministrationTabProps {
  loadingAdministrations: boolean;
  activeMedications: MedicationRequestRead[] | undefined;
  patientId: string;
  encounterId: string;
}

const timeSlots = [
  { label: "12:00 AM - 06:00 AM", start: "00:00", end: "06:00" },
  { label: "06:00 AM - 12:00 PM", start: "06:00", end: "12:00" },
  { label: "12:00 PM - 06:00 PM", start: "12:00", end: "18:00" },
  { label: "06:00 PM - 12:00 AM", start: "18:00", end: "24:00" },
];

export const AdministrationTab: React.FC<AdministrationTabProps> = ({
  loadingAdministrations,
  activeMedications,
  patientId,
  encounterId,
}) => {
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
  const visibleSlots = React.useMemo(() => {
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

  const { data: administrations, refetch: refetchAdministrations } = useQuery({
    queryKey: ["medication_administrations", patientId, visibleSlots],
    queryFn: query(routes.medicationAdministration.list, {
      pathParams: { patientId: patientId },
      queryParams: {
        encounter: encounterId,
        ...(visibleSlots.length > 0 && {
          occurrence_period_start_after: (() => {
            const firstSlot = visibleSlots[0];
            const [startHour] = firstSlot.start.split(":").map(Number);
            const date = new Date(firstSlot.date);
            date.setHours(startHour, 0, 0, 0);
            return format(date, "yyyy-MM-dd'T'HH:mm:ss");
          })(),
          occurrence_period_start_before: (() => {
            const lastSlot = visibleSlots[visibleSlots.length - 1];
            const [endHour] = lastSlot.end.split(":").map(Number);
            const date = new Date(lastSlot.date);
            date.setHours(endHour, 0, 0, 0);
            return format(date, "yyyy-MM-dd'T'HH:mm:ss");
          })(),
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

  const handlePreviousSlot = React.useCallback(() => {
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

  const handleNextSlot = React.useCallback(() => {
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

  // Dialog state for single medicine administration
  const [selectedMedication, setSelectedMedication] =
    useState<MedicationRequestRead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Sheet state for multiple medicine administration
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // State for last modified date
  const [lastModifiedDate, setLastModifiedDate] = useState<Date | null>(null);

  // Set last modified date when administrations change
  useEffect(() => {
    if (administrations?.results?.length) {
      const sortedAdmins = [...administrations.results].sort(
        (a, b) =>
          new Date(b.occurrence_period_start).getTime() -
          new Date(a.occurrence_period_start).getTime(),
      );

      if (!lastModifiedDate) {
        setLastModifiedDate(new Date(sortedAdmins[0].occurrence_period_start));
      }
    }
  }, [administrations]);

  const isTimeInSlot = (
    date: Date,
    slot: { date: Date; start: string; end: string },
  ) => {
    const slotStartDate = new Date(slot.date);
    const [startHour] = slot.start.split(":").map(Number);
    const [endHour] = slot.end.split(":").map(Number);

    slotStartDate.setHours(startHour, 0, 0, 0);
    const slotEndDate = new Date(slotStartDate);
    slotEndDate.setHours(endHour, 0, 0, 0);

    return date >= slotStartDate && date < slotEndDate;
  };

  const getAdministrationsForTimeSlot = (
    medicationId: string,
    slotDate: Date,
    start: string,
    end: string,
  ) => {
    return administrations?.results?.filter(
      (admin: MedicationAdministration) => {
        const adminDate = new Date(admin.occurrence_period_start);
        const slotStartDate = new Date(slotDate);
        const slotEndDate = new Date(slotDate);

        const [startHour] = start.split(":").map(Number);
        const [endHour] = end.split(":").map(Number);

        slotStartDate.setHours(startHour, 0, 0, 0);
        slotEndDate.setHours(endHour, 0, 0, 0);

        return (
          admin.request === medicationId &&
          adminDate >= slotStartDate &&
          adminDate < slotEndDate
        );
      },
    );
  };

  const [administrationRequest, setAdministrationRequest] =
    useState<MedicationAdministrationRequest | null>(null);

  const handleAdminister = (medication: MedicationRequestRead) => {
    // Create new administration request
    setAdministrationRequest({
      request: medication.id,
      encounter: encounterId,
      note: "",
      occurrence_period_start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      occurrence_period_end: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      status: "completed",
      medication: medication.medication,
      // TODO: Undo comment after FE dosage type is fixed
      // dosage: {
      //   text: medication.dosage_instruction[0]?.text,
      //   site: medication.dosage_instruction[0]?.site,
      //   route: medication.dosage_instruction[0]?.route,
      //   method: medication.dosage_instruction[0]?.method,
      //   ...(medication.dosage_instruction[0]?.dose_and_rate?.dose_quantity && {
      //     dose: {
      //       value:
      //         medication.dosage_instruction[0].dose_and_rate.dose_quantity
      //           .value,
      //       unit: medication.dosage_instruction[0].dose_and_rate.dose_quantity
      //         .unit,
      //     },
      //   }),
      // },
    });
    setSelectedMedication(medication);
    setDialogOpen(true);
  };

  const handleEditAdministration = (
    medication: MedicationRequestRead,
    admin: MedicationAdministration,
  ) => {
    // Convert existing administration to request
    setAdministrationRequest({
      id: admin.id,
      request: admin.request,
      encounter: admin.encounter,
      note: admin.note || "",
      occurrence_period_start: admin.occurrence_period_start,
      occurrence_period_end: admin.occurrence_period_end,
      status: admin.status,
      medication: admin.medication,
      dosage: admin.dosage,
    });
    setSelectedMedication(medication);
    setDialogOpen(true);
  };

  return loadingAdministrations ? (
    <div className="min-h-[200px] flex items-center justify-center">
      <Loading />
    </div>
  ) : (
    <div className="flex flex-col gap-2 m-2">
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
          onClick={() => setIsSheetOpen(true)}
        >
          <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
          Administer Medicine
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <Card className="w-full border-none shadow-none min-w-[640px]">
          <div className="grid grid-cols-[minmax(200px,2fr),repeat(4,minmax(140px,1fr)),40px]">
            {/* Top row without vertical borders */}
            <div className="col-span-full grid grid-cols-subgrid">
              <div className=" flex items-center justify-between p-4 bg-gray-50 border-t border-gray-50">
                <div className="flex items-center gap-2 whitespace-break-spaces">
                  {lastModifiedDate && (
                    <div className="text-xs text-[#6b7280]">
                      Last modified {formatDistanceToNow(lastModifiedDate)} ago
                    </div>
                  )}
                </div>
                <div className="flex justify-end items-center bg-gray-50 rounded">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-gray-400 mr-2"
                    onClick={handlePreviousSlot}
                  >
                    <CareIcon icon="l-angle-left" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {visibleSlots.map((slot) => {
                const isFirstSlotOfDay = slot.start === "00:00";
                const isLastSlotOfDay = slot.start === "18:00";
                return (
                  <div
                    key={`${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
                    className=" h-14"
                  >
                    {isFirstSlotOfDay && (
                      <div className="flex items-center h-full ml-2">
                        <div className="flex flex-col items-center">
                          <div className="text-sm font-medium">
                            {format(slot.date, "dd MMM").toUpperCase()}
                          </div>
                          <div className="text-sm text-[#6b7280]">
                            {format(slot.date, "EEE")}
                          </div>
                        </div>
                        <div className="flex-1 border-t border-dotted border-gray-300 ml-2" />
                      </div>
                    )}
                    {!isFirstSlotOfDay && !isLastSlotOfDay && (
                      <div className="flex items-center h-full">
                        <div className="w-full border-t border-dotted border-gray-300" />
                      </div>
                    )}
                    {isLastSlotOfDay && (
                      <div className="flex items-center h-full mr-2">
                        <div className="flex-1 border-t border-dotted border-gray-300 mr-2" />
                        <div className="flex flex-col items-center">
                          <div className="text-sm font-medium">
                            {format(slot.date, "dd MMM").toUpperCase()}
                          </div>
                          <div className="text-sm text-[#6b7280]">
                            {format(slot.date, "EEE")}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-start items-center px-1 bg-gray-50 ">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-gray-400"
                  onClick={handleNextSlot}
                  disabled={isTimeInSlot(currentDate, visibleSlots[3])}
                >
                  <CareIcon icon="l-angle-right" className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Main content with borders */}
            <div className="col-span-full grid grid-cols-subgrid divide-x divide-[#e5e7eb] border-l border-r ">
              {/* Headers */}
              <div className="p-4 font-medium text-sm border-t bg-[#F3F4F6] text-secondary-700">
                Medicine:
              </div>
              {visibleSlots.map((slot, i) => (
                <div
                  key={`${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
                  className="p-4 font-semibold text-xs text-center border-t relative bg-[#F3F4F6] text-secondary-700"
                >
                  {i === endSlotIndex &&
                    slot.date.getTime() === currentDate.getTime() && (
                      <div className="absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      </div>
                    )}
                  {slot.label}
                </div>
              ))}
              <div className="border-t bg-[#F3F4F6]" />

              {/* Medication rows */}
              {activeMedications?.map((medication) => (
                <React.Fragment key={medication.id}>
                  <div className="p-4 border-t">
                    <div className="font-semibold truncate">
                      {medication.medication?.display}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md font-medium">
                        {medication.dosage_instruction[0]?.route?.display ||
                          "Oral"}
                      </span>
                      {medication.dosage_instruction[0]?.as_needed_boolean && (
                        <span className="text-xs text-pink-900 bg-pink-100 px-2 py-0.5 rounded-md font-medium">
                          As Needed / PRN
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-1 font-medium truncate">
                      {formatDosage(medication.dosage_instruction[0])},{" "}
                      {
                        getFrequencyDisplay(
                          medication.dosage_instruction[0]?.timing,
                        )?.meaning
                      }
                    </div>
                    <div className="text-xs text-[#6b7280] mt-1 truncate">
                      Added on:{" "}
                      {format(
                        new Date(medication.created_date),
                        "MMM dd, yyyy, hh:mm a",
                      )}
                    </div>
                  </div>
                  {visibleSlots.map((slot) => {
                    const administrationRecords = getAdministrationsForTimeSlot(
                      medication.id,
                      slot.date,
                      slot.start,
                      slot.end,
                    );
                    const isCurrentSlot = isTimeInSlot(currentDate, slot);
                    return (
                      <div
                        key={`${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
                        className="p-4 border-t relative text-sm"
                      >
                        {administrationRecords?.map((admin) => {
                          const statusColors = {
                            completed:
                              "bg-emerald-50 text-emerald-700 border-emerald-200",
                            in_progress:
                              "bg-yellow-50 text-yellow-700 border-yellow-200",
                            default: "bg-red-50 text-red-700 border-red-200",
                          };

                          const colorClass =
                            statusColors[
                              admin.status as keyof typeof statusColors
                            ] || statusColors.default;

                          return (
                            <div
                              key={admin.id}
                              className={`flex font-medium items-center gap-2 rounded-md p-2 mb-2 cursor-pointer justify-between border ${colorClass}`}
                              onClick={() =>
                                handleEditAdministration(medication, admin)
                              }
                            >
                              <div className="flex items-center gap-1">
                                <CareIcon
                                  icon="l-check-circle"
                                  className="h-3 w-3"
                                />
                                {new Date(
                                  admin.occurrence_period_start,
                                ).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                              {admin.note && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-4 w-4 hover:${colorClass} p-0`}
                                >
                                  <CareIcon
                                    icon="l-notes"
                                    className="h-3 w-3"
                                  />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                        {isCurrentSlot && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-primary-800 border-primary-600 hover:bg-primary-100 font-semibold"
                            onClick={() => handleAdminister(medication)}
                          >
                            Administer
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  <div className="p-4 border-t flex justify-center">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <CareIcon icon="l-ellipsis-h" className="h-4 w-4" />
                    </Button>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-[#e5e7eb] flex items-center gap-2">
            <CareIcon icon="l-eye" className="h-4 w-4" />
            <span className="text-sm">Hide </span>
            <span className="text-sm font-medium">1 Stopped</span>
            <span className="text-sm"> prescription(s)</span>
          </div>
        </Card>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {selectedMedication && administrationRequest && (
        <MedicineAdminDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setAdministrationRequest(null);
              setSelectedMedication(null);
              refetchAdministrations();
            }
          }}
          medication={selectedMedication}
          lastAdministeredDate={lastAdministeredDates?.[selectedMedication.id]}
          administrationRequest={administrationRequest}
          patientId={patientId}
        />
      )}

      <MedicineAdminSheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            refetchAdministrations();
          }
        }}
        medications={activeMedications || []}
        lastAdministeredDates={lastAdministeredDates}
        patientId={patientId}
        encounterId={encounterId}
      />
    </div>
  );
};
