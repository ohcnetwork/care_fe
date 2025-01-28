"use client";

import { format, formatDistanceToNow } from "date-fns";
import React, { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import Loading from "@/components/Common/Loading";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage } from "@/components/Medicine/utils";

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
  administrations: { results: MedicationAdministration[] } | undefined;
  lastAdministeredDates?: Record<string, string>;
  patientId: string;
  encounterId: string;
  visibleSlots: { date: Date; start: string; end: string; label: string }[];
  onPreviousSlot: () => void;
  onNextSlot: () => void;
  currentDate: Date;
  endSlotIndex: number;
  onAdministrationComplete: () => void;
}

export const AdministrationTab: React.FC<AdministrationTabProps> = ({
  loadingAdministrations,
  activeMedications,
  administrations,
  lastAdministeredDates,
  patientId,
  encounterId,
  visibleSlots,
  onPreviousSlot,
  onNextSlot,
  currentDate,
  endSlotIndex,
  onAdministrationComplete,
}) => {
  // Dialog state for single medicine administration
  const [selectedMedication, setSelectedMedication] =
    useState<MedicationRequestRead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Sheet state for multiple medicine administration
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
    <div className="flex flex-col gap-2 m-2 ">
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

      <Card className="w-full border-none shadow-none">
        <div className="grid grid-cols-[2fr,1fr,auto,repeat(4,1fr),40px]">
          {/* Top row without vertical borders */}
          <div className="col-span-full grid grid-cols-subgrid">
            <div className="p-4  bg-gray-50 border-t border-gray-50">
              <div className="text-xs text-[#6b7280]">
                Last modified {formatDistanceToNow(currentDate)} ago
              </div>
            </div>
            <div className="bg-gray-50" />
            <div className="flex justify-end items-center bg-gray-50 rounded">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-gray-400 mr-2"
                onClick={onPreviousSlot}
              >
                <CareIcon icon="l-angle-left" className="h-4 w-4" />
              </Button>
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
                onClick={onNextSlot}
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
            <div className="p-4 font-medium text-sm border-t bg-[#F3F4F6] text-secondary-700">
              Dosage & Frequency:
            </div>
            <div className="p-4 font-medium text-sm border-t bg-[#F3F4F6] text-secondary-700">
              Action
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
                  <div className="font-medium">
                    {medication.medication?.display}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-sm text-[#059669]">
                      {medication.dosage_instruction[0]?.route?.display ||
                        "Oral"}
                    </span>
                    {medication.dosage_instruction[0]?.as_needed_boolean && (
                      <span className="text-sm text-[#b91c1c]">
                        As Needed / PRN
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#6b7280] mt-1">
                    Added on:{" "}
                    {format(
                      new Date(medication.created_date),
                      "MMM dd, yyyy, hh:mm a",
                    )}
                  </div>
                </div>
                <div className="p-4 border-t">
                  <div>{formatDosage(medication.dosage_instruction[0])}</div>
                  <div className="text-sm text-[#6b7280]">
                    {
                      getFrequencyDisplay(
                        medication.dosage_instruction[0]?.timing,
                      )?.meaning
                    }
                  </div>
                </div>
                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-primary-800 border-primary-600 hover:bg-primary-100 font-semibold"
                    onClick={() => handleAdminister(medication)}
                  >
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
                      className="p-4 border-t relative text-sm"
                    >
                      {administrationRecords?.map((admin) => (
                        <div
                          key={admin.id}
                          className="flex font-medium items-center gap-2 bg-[#ecfdf5] text-[#059669] rounded-md p-2 mb-2 cursor-pointer justify-between border border-primary-400"
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
                              className="h-4 w-4 hover:bg-emerald-100 p-0"
                            >
                              <CareIcon icon="l-notes" className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
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

      {selectedMedication && administrationRequest && (
        <MedicineAdminDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setAdministrationRequest(null);
              setSelectedMedication(null);
              onAdministrationComplete();
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
            onAdministrationComplete();
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
