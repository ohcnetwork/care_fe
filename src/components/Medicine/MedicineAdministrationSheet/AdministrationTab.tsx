import { format, formatDistanceToNow, isBefore } from "date-fns";
import React, { useMemo, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Loading from "@/components/Common/Loading";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage } from "@/components/Medicine/utils";

import { MedicationAdministration } from "@/types/emr/medicationAdministration";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";

interface AdministrationTabProps {
  loadingAdministrations: boolean;
  activeMedications: MedicationRequestRead[] | undefined;
  administrations: { results: MedicationAdministration[] } | undefined;
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
  administrations,
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

  const handlePreviousSlot = () => {
    const newEndSlotIndex = endSlotIndex - 1;
    const newEndSlotDate = new Date(endSlotDate);

    if (newEndSlotIndex < 0) {
      // Moving to previous day's last slot
      newEndSlotDate.setDate(newEndSlotDate.getDate() - 1);
      setEndSlotIndex(3);
    } else {
      setEndSlotIndex(newEndSlotIndex);
    }
    setEndSlotDate(newEndSlotDate);
  };

  const handleNextSlot = () => {
    const newEndSlotIndex = endSlotIndex + 1;
    const newEndSlotDate = new Date(endSlotDate);

    if (newEndSlotIndex > 3) {
      // Moving to next day's first slot
      newEndSlotDate.setDate(newEndSlotDate.getDate() + 1);
      setEndSlotIndex(0);
    } else {
      setEndSlotIndex(newEndSlotIndex);
    }

    // Check if we're trying to move beyond current time
    const slotStartDate = new Date(newEndSlotDate);
    const startHour = parseInt(
      timeSlots[newEndSlotIndex].start.split(":")[0],
      10,
    );
    slotStartDate.setHours(startHour, 0, 0, 0);

    if (isBefore(slotStartDate, currentDate)) {
      setEndSlotDate(newEndSlotDate);
      setEndSlotIndex(newEndSlotIndex > 3 ? 0 : newEndSlotIndex);
    }
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

  return loadingAdministrations ? (
    <div className="min-h-[200px] flex items-center justify-center">
      <Loading />
    </div>
  ) : (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-sm text-muted-foreground">
          Last modified {formatDistanceToNow(currentDate)} ago
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePreviousSlot}
          >
            <CareIcon icon="l-angle-left" />
          </Button>
          <div className="flex flex-col items-center">
            <div className="font-medium">
              {format(visibleSlots[0].date, "dd MMM").toUpperCase()} -{" "}
              {format(visibleSlots[3].date, "dd MMM").toUpperCase()}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(visibleSlots[0].date, "EEE")} -{" "}
              {format(visibleSlots[3].date, "EEE")}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleNextSlot}
            disabled={isBefore(currentDate, endSlotDate)}
          >
            <CareIcon icon="l-angle-right" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[2fr,1fr,1fr,repeat(4,minmax(200px,1fr)),40px] gap-4 px-4">
        <div className="font-medium">Medicine</div>
        <div className="font-medium">Dosage & Frequency</div>
        <div className="font-medium">Action</div>
        {visibleSlots.map((slot) => (
          <div
            key={`${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
            className="font-medium text-center"
          >
            {slot.label}
          </div>
        ))}
        <div /> {/* For overflow menu */}
        {activeMedications?.map((medication) => (
          <React.Fragment key={medication.id}>
            <div className="space-y-1 py-2">
              <div>{medication.medication?.display}</div>
              <Badge variant="secondary" className="text-blue-600 bg-blue-50">
                {medication.dosage_instruction[0]?.route?.display || "Oral"}
              </Badge>
              <div className="text-xs text-muted-foreground">
                Added on:{" "}
                {format(
                  new Date(medication.created_date),
                  "MMM dd, yyyy, hh:mm a",
                )}
              </div>
            </div>
            <div className="py-2 text-sm flex flex-col gap-1">
              <div>{formatDosage(medication.dosage_instruction[0])}</div>
              <div>
                {
                  getFrequencyDisplay(medication.dosage_instruction[0]?.timing)
                    ?.meaning
                }
              </div>
            </div>
            <div className="py-2">
              <Button variant="outline" size="sm">
                Administer
              </Button>
            </div>
            {visibleSlots.map((slot) => {
              const administrationRecords = getAdministrationsForTimeSlot(
                medication.id,
                slot.date,
                slot.start,
                slot.end,
              );
              return (
                <div
                  key={`${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
                  className="flex flex-col gap-2 items-center justify-center py-2"
                >
                  {administrationRecords?.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-sm rounded px-2 py-1"
                    >
                      {new Date(
                        admin.occurrence_period_start,
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 hover:bg-emerald-100"
                      >
                        <CareIcon icon="l-copy" className="text-xs" />
                      </Button>
                    </div>
                  ))}
                </div>
              );
            })}
            <div className="py-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <CareIcon icon="l-ellipsis-v" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2">
                    <CareIcon icon="l-ban" />
                    Discontinue
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
