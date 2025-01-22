import { format, formatDistanceToNow } from "date-fns";
import React from "react";

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
  const getAdministrationsForTimeSlot = (
    medicationId: string,
    start: string,
    end: string,
  ) => {
    return administrations?.results?.filter(
      (admin: MedicationAdministration) => {
        const time = new Date(admin.occurrence_period_start).toLocaleTimeString(
          "en-US",
          {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          },
        );
        return admin.request === medicationId && time >= start && time < end;
      },
    );
  };

  const currentDate = new Date();

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
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <CareIcon icon="l-angle-left" />
          </Button>
          <div className="flex flex-col items-center">
            <div className="font-medium">
              {format(currentDate, "dd MMM").toUpperCase()}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(currentDate, "EEE")}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <CareIcon icon="l-angle-right" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[2fr,1fr,1fr,repeat(4,minmax(200px,1fr)),40px] gap-4 px-4">
        <div className="font-medium">Medicine</div>
        <div className="font-medium">Dosage & Frequency</div>
        <div className="font-medium">Action</div>
        {timeSlots.map((slot) => (
          <div key={slot.label} className="font-medium text-center">
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
            <div className="py-2">
              {
                getFrequencyDisplay(medication.dosage_instruction[0]?.timing)
                  ?.meaning
              }
            </div>
            <div className="py-2">
              <Button variant="outline" size="sm">
                Administer
              </Button>
            </div>
            {timeSlots.map((slot) => {
              const administrationRecords = getAdministrationsForTimeSlot(
                medication.id,
                slot.start,
                slot.end,
              );
              return (
                <div
                  key={slot.label}
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
