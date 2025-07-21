import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Link, usePathParams } from "raviger";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { EmptyState } from "@/components/Medicine/MedicationRequestTable";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage } from "@/components/Medicine/utils";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import {
  MedicationAdministrationRead,
  MedicationAdministrationRequest,
} from "@/types/emr/medicationAdministration/medicationAdministration";
import medicationAdministrationApi from "@/types/emr/medicationAdministration/medicationAdministrationApi";
import {
  ACTIVE_MEDICATION_STATUSES,
  INACTIVE_MEDICATION_STATUSES,
  MedicationRequestRead,
  displayMedicationName,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

import { MedicineAdminDialog } from "./MedicineAdminDialog";
import { MedicineAdminSheet } from "./MedicineAdminSheet";
import {
  STATUS_COLORS,
  TIME_SLOTS,
  createMedicationAdministrationRequest,
} from "./utils";

// Utility Functions
function isTimeInSlot(
  date: Date,
  slot: { date: Date; start: string; end: string },
): boolean {
  const slotStartDate = new Date(slot.date);
  const [startHour] = slot.start.split(":").map(Number);
  const [endHour] = slot.end.split(":").map(Number);

  slotStartDate.setHours(startHour, 0, 0, 0);
  const slotEndDate = new Date(slotStartDate);
  slotEndDate.setHours(endHour, 0, 0, 0);

  return date >= slotStartDate && date < slotEndDate;
}

function getAdministrationsForTimeSlot(
  administrations: MedicationAdministrationRead[],
  medicationId: string,
  slotDate: Date,
  start: string,
  end: string,
): MedicationAdministrationRead[] {
  return administrations.filter((admin) => {
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
  });
}

// Types and Interfaces
interface AdministrationTabProps {
  patientId: string;
  encounterId?: string;
  canAccess: boolean;
  canWrite: boolean;
  showTimeLine?: boolean;
}

interface TimeSlotHeaderProps {
  slot: (typeof TIME_SLOTS)[number] & { date: Date };
  isCurrentSlot: boolean;
  isEndSlot: boolean;
}

interface MedicationStatusBadgeProps {
  status: string;
}

interface MedicationBadgesProps {
  medication: MedicationRequestRead;
}

interface MedicationRowProps {
  medication: MedicationRequestRead;
  visibleSlots: ((typeof TIME_SLOTS)[number] & { date: Date })[];
  currentDate: Date;
  administrations?: MedicationAdministrationRead[];
  onAdminister: (medication: MedicationRequestRead) => void;
  onEditAdministration: (
    medication: MedicationRequestRead,
    admin: MedicationAdministrationRead,
  ) => void;
  onDiscontinue: (medication: MedicationRequestRead) => void;
  canWrite: boolean;
}

// Utility Components
const MedicationStatusBadge: React.FC<MedicationStatusBadgeProps> = ({
  status,
}) => {
  const { t } = useTranslation();

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-md font-medium ${
        status === "active"
          ? "text-emerald-900 bg-emerald-100"
          : "text-gray-900 bg-gray-100"
      }`}
    >
      {t(status)}
    </span>
  );
};

const MedicationBadges: React.FC<MedicationBadgesProps> = ({ medication }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      <span className="text-xs text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md font-medium">
        {medication.dosage_instruction[0]?.route?.display || "Oral"}
      </span>
      {medication.dosage_instruction[0]?.as_needed_boolean && (
        <span className="text-xs text-pink-900 bg-pink-100 px-2 py-0.5 rounded-md font-medium">
          {t("as_needed_prn")}
        </span>
      )}
      <MedicationStatusBadge status={medication.status} />
    </div>
  );
};

const TimeSlotHeader: React.FC<TimeSlotHeaderProps> = ({
  slot,
  isCurrentSlot,
  isEndSlot,
}) => {
  const isFirstSlotOfDay = slot.start === "00:00";
  const isLastSlotOfDay = slot.start === "18:00";

  return (
    <div className="h-14">
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
      {isCurrentSlot && isEndSlot && (
        <div className="absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2">
          <div className="size-2 rounded-full bg-blue-500" />
        </div>
      )}
    </div>
  );
};

const MedicationRow: React.FC<MedicationRowProps> = ({
  medication,
  visibleSlots,
  currentDate,
  administrations,
  onAdminister,
  onEditAdministration,
  onDiscontinue,
  canWrite,
}) => {
  const { t } = useTranslation();
  const isInactive = INACTIVE_MEDICATION_STATUSES.includes(
    medication.status as (typeof INACTIVE_MEDICATION_STATUSES)[number],
  );

  return (
    <React.Fragment>
      <div
        className={cn(
          "p-4 border-t border-gray-200",
          isInactive && "bg-gray-200 opacity-40",
        )}
      >
        <div
          className={cn(
            "font-semibold truncate",
            isInactive && medication.status === "ended" && "line-through",
          )}
        >
          {displayMedicationName(medication)}
        </div>
        <MedicationBadges medication={medication} />
        <div className="text-xs mt-1 font-medium truncate">
          {formatDosage(medication.dosage_instruction[0])},{" "}
          {
            getFrequencyDisplay(medication.dosage_instruction[0]?.timing)
              ?.meaning
          }
        </div>
        <div className="text-xs text-[#6b7280] mt-1 truncate">
          {t("added_on")}:{" "}
          {format(
            new Date(medication.authored_on || medication.created_date),
            "MMM dd, yyyy, hh:mm a",
          )}
        </div>
      </div>

      {visibleSlots.map((slot) => {
        const administrationRecords = getAdministrationsForTimeSlot(
          administrations || [],
          medication.id,
          slot.date,
          slot.start,
          slot.end,
        );
        const isCurrentSlot = isTimeInSlot(currentDate, slot);

        return (
          <div
            key={`${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
            className={cn(
              "p-4 border-t relative text-sm",
              isInactive && "bg-gray-200 opacity-40",
            )}
          >
            {administrationRecords?.map((admin) => {
              const colorClass =
                STATUS_COLORS[admin.status as keyof typeof STATUS_COLORS] ||
                STATUS_COLORS.default;

              return (
                <div
                  key={admin.id}
                  className={`flex font-medium flex-col rounded-md p-2 mb-2 cursor-pointer border border-gray-200 ${colorClass}`}
                  onClick={() => onEditAdministration(medication, admin)}
                >
                  <div className="flex justify-between">
                    <div>
                      <CareIcon
                        icon="l-check-circle"
                        className="size-4 self-center"
                      />
                    </div>
                    <div>
                      {admin.note && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`size-4 hover:${colorClass} p-0`}
                        >
                          <CareIcon icon="l-notes" className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span>
                      {new Date(
                        admin.occurrence_period_start,
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    {admin.occurrence_period_end && (
                      <>
                        <span>{"-"}</span>
                        <span>
                          {new Date(
                            admin.occurrence_period_end,
                          ).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {isCurrentSlot && medication.status === "active" && canWrite && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-primary-800 border-primary-600 hover:bg-primary-100 font-semibold"
                onClick={() => onAdminister(medication)}
              >
                {t("administer")}
              </Button>
            )}
          </div>
        );
      })}

      <div
        className={cn(
          "p-4 border-t border-gray-200 flex justify-center",
          isInactive && "bg-gray-200 opacity-40",
        )}
      >
        {ACTIVE_MEDICATION_STATUSES.includes(
          medication.status as (typeof ACTIVE_MEDICATION_STATUSES)[number],
        ) &&
          canWrite && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="size-6">
                  <CareIcon icon="l-ellipsis-h" className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-0">
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3 py-2 text-sm text-red-600 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    onDiscontinue(medication);
                    // Close the popover after clicking
                    const button = document.activeElement as HTMLElement;
                    button?.blur();
                  }}
                >
                  <CareIcon icon="l-ban" className="mr-2 size-4" />
                  {t("discontinue")}
                </Button>
              </PopoverContent>
            </Popover>
          )}
      </div>
    </React.Fragment>
  );
};

export const AdministrationTab: React.FC<AdministrationTabProps> = ({
  patientId,
  encounterId,
  canAccess,
  canWrite,
  showTimeLine = false,
}) => {
  const { t } = useTranslation();
  const subpathMatch = usePathParams("/facility/:facilityId/*");
  const facilityIdExists = !!subpathMatch?.facilityId;
  const { facilityId } = useCurrentFacilitySilently();

  const currentDate = new Date();
  const [endSlotDate, setEndSlotDate] = useState(currentDate);
  const [showStopped, setShowStopped] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [endSlotIndex, setEndSlotIndex] = useState(
    Math.floor(currentDate.getHours() / 6),
  );
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
        ...TIME_SLOTS[currentIndex],
        date: new Date(currentDate),
      });
      currentIndex--;
    }
    return slots;
  }, [endSlotDate, endSlotIndex]);

  const queryClient = useQueryClient();

  // Queries
  const { data: activeMedications } = useQuery({
    queryKey: ["medication_requests_active", patientId, encounterId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 100,
        status: ACTIVE_MEDICATION_STATUSES.join(","),
        facility: facilityId,
      },
    }),
    enabled: !!patientId && canAccess,
  });

  const { data: stoppedMedications } = useQuery({
    queryKey: ["medication_requests_stopped", patientId, encounterId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 100,
        status: INACTIVE_MEDICATION_STATUSES.join(","),
        facility: facilityId,
      },
    }),
    enabled: !!patientId && canAccess,
  });

  const { data: administrations } = useQuery({
    queryKey: [
      "medication_administrations",
      patientId,
      visibleSlots,
      encounterId,
    ],
    queryFn: query(medicationAdministrationApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 100,
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
    enabled: !!patientId && !!visibleSlots?.length && canAccess,
  });

  // Get last administered date and last administered by for each medication
  const lastAdministeredDetails = useMemo(() => {
    return administrations?.results?.reduce<{
      dates: Record<string, string>;
      performers: Record<string, string>;
    }>(
      (acc, admin) => {
        const existingDate = acc.dates[admin.request];
        const adminDate = new Date(admin.occurrence_period_start);

        if (!existingDate || adminDate > new Date(existingDate)) {
          acc.dates[admin.request] = admin.occurrence_period_start;
          acc.performers[admin.request] = admin.created_by
            ? formatName(admin.created_by)
            : "";
        }

        return acc;
      },
      { dates: {}, performers: {} },
    );
  }, [administrations?.results]);

  // Calculate earliest authored date from all medications
  const getEarliestAuthoredDate = (medications: MedicationRequestRead[]) => {
    if (!medications?.length) return null;
    return new Date(
      Math.min(
        ...medications.map((med) =>
          new Date(med.authored_on || med.created_date).getTime(),
        ),
      ),
    );
  };

  // Calculate if we can go back further based on the earliest slot and authored date
  const canGoBack = useMemo(() => {
    const medications = showStopped
      ? [
          ...(activeMedications?.results || []),
          ...(stoppedMedications?.results || []),
        ]
      : activeMedications?.results || [];

    const earliestAuthoredDate = getEarliestAuthoredDate(medications);
    if (!earliestAuthoredDate || !visibleSlots.length) return true;

    const firstSlotDate = new Date(visibleSlots[0].date);
    const [startHour] = visibleSlots[0].start.split(":").map(Number);
    firstSlotDate.setHours(startHour, 0, 0, 0);

    return firstSlotDate > earliestAuthoredDate;
  }, [activeMedications, stoppedMedications, showStopped, visibleSlots]);

  // State for administration
  const [selectedMedication, setSelectedMedication] =
    useState<MedicationRequestRead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [administrationRequest, setAdministrationRequest] =
    useState<MedicationAdministrationRequest | null>(null);

  // Calculate last modified date
  const lastModifiedDate = useMemo(() => {
    if (!administrations?.results?.length) return null;

    const sortedAdmins = [...administrations.results].sort(
      (a, b) =>
        new Date(b.occurrence_period_start).getTime() -
        new Date(a.occurrence_period_start).getTime(),
    );

    return new Date(sortedAdmins[0].occurrence_period_start);
  }, [administrations?.results]);

  // Mutations
  const { mutate: discontinueMedication } = useMutation({
    mutationFn: mutate(medicationRequestApi.upsert, {
      pathParams: { patientId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["medication_requests_active"],
      });
      queryClient.invalidateQueries({
        queryKey: ["medication_requests_stopped"],
      });
    },
  });

  // Handlers
  const handlePreviousSlot = useCallback(() => {
    if (!canGoBack) return;

    const newEndSlotIndex = endSlotIndex - 1;
    if (newEndSlotIndex < 0) {
      setEndSlotIndex(3);
      const newDate = new Date(endSlotDate);
      newDate.setDate(newDate.getDate() - 1);
      setEndSlotDate(newDate);
    } else {
      setEndSlotIndex(newEndSlotIndex);
    }
  }, [endSlotDate, endSlotIndex, canGoBack]);

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

  const handleAdminister = useCallback(
    (medication: MedicationRequestRead) => {
      if (!encounterId) {
        return;
      }
      setAdministrationRequest(
        createMedicationAdministrationRequest(medication, encounterId),
      );
      setSelectedMedication(medication);
      setDialogOpen(true);
    },
    [encounterId],
  );

  const handleEditAdministration = useCallback(
    (
      medication: MedicationRequestRead,
      admin: MedicationAdministrationRead,
    ) => {
      setAdministrationRequest({
        id: admin.id,
        request: admin.request,
        encounter: admin.encounter,
        note: admin.note || "",
        occurrence_period_start: admin.occurrence_period_start,
        occurrence_period_end: admin.occurrence_period_end,
        status: admin.status,
        ...(admin.medication && { medication: admin.medication }),
        ...(admin.administered_product && {
          administered_product: admin.administered_product.id,
        }),
        dosage: admin.dosage,
      });
      setSelectedMedication(medication);
      setDialogOpen(true);
    },
    [],
  );

  const handleDiscontinue = useCallback(
    (medication: MedicationRequestRead) => {
      discontinueMedication({
        datapoints: [
          {
            ...medication,
            status: "ended",
            encounter: encounterId,
          },
        ],
      });
    },
    [discontinueMedication, encounterId],
  );

  const medications = showStopped
    ? [
        ...(activeMedications?.results || []),
        ...(stoppedMedications?.results || []),
      ]
    : activeMedications?.results || [];

  const filteredMedications = !searchQuery.trim()
    ? medications
    : [
        ...(activeMedications?.results || []),
        ...(stoppedMedications?.results || []),
      ].filter((med: MedicationRequestRead) =>
        med.medication?.display
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase().trim()),
      );

  let content;
  if (!activeMedications || !stoppedMedications) {
    content = (
      <div className="min-h-[200px] flex items-center justify-center">
        <TableSkeleton count={5} />
      </div>
    );
  } else if (
    !activeMedications?.results?.length &&
    !stoppedMedications?.results?.length
  ) {
    content = (
      <EmptyState
        message={t("no_medications")}
        description={t("no_medications_to_administer")}
      />
    );
  } else if (searchQuery && !filteredMedications.length) {
    content = <EmptyState searching searchQuery={searchQuery} />;
  } else {
    content = (
      <>
        {!filteredMedications.length && (
          <CardContent className="p-2">
            <p className="text-gray-500 w-full flex justify-center mb-3">
              {t("no_active_medication_recorded")}
            </p>
          </CardContent>
        )}
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <Card className="w-full border-none shadow-none min-w-[640px]">
            <div className="grid grid-cols-[minmax(200px,2fr)_repeat(4,minmax(140px,1fr))_40px]">
              {/* Top row without vertical borders */}
              <div className="col-span-full grid grid-cols-subgrid">
                <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-50">
                  <div className="flex items-center gap-2 whitespace-break-spaces">
                    {lastModifiedDate && (
                      <div className="text-xs text-[#6b7280]">
                        {t("last_modified")}{" "}
                        {formatDistanceToNow(lastModifiedDate)} {t("ago")}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end items-center bg-gray-50 rounded">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 text-gray-400 mr-2"
                      onClick={handlePreviousSlot}
                      disabled={!canGoBack}
                      title={
                        !canGoBack
                          ? t("cannot_go_before_prescription_date")
                          : ""
                      }
                    >
                      <CareIcon icon="l-angle-left" className="size-4" />
                    </Button>
                  </div>
                </div>
                {visibleSlots.map((slot) => (
                  <TimeSlotHeader
                    key={`${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
                    slot={slot}
                    isCurrentSlot={isTimeInSlot(currentDate, slot)}
                    isEndSlot={slot.date.getTime() === currentDate.getTime()}
                  />
                ))}
                <div className="flex justify-start items-center px-1 bg-gray-50">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 text-gray-400"
                    onClick={handleNextSlot}
                    disabled={isTimeInSlot(currentDate, visibleSlots[3])}
                  >
                    <CareIcon icon="l-angle-right" className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Main content with borders */}
              <div className="col-span-full grid grid-cols-subgrid divide-x divide-[#e5e7eb] border-l border-r border-gray-200">
                {/* Headers */}
                <div className="p-4 font-medium text-sm border-t border-gray-200 bg-[#F3F4F6] text-secondary-700">
                  {t("medicine")}:
                </div>
                {visibleSlots.map((slot, i) => (
                  <div
                    key={`${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
                    className="p-4 font-semibold text-xs text-center border-t border-gray-200 relative bg-[#F3F4F6] text-secondary-700"
                  >
                    {i === endSlotIndex &&
                      slot.date.getTime() === currentDate.getTime() && (
                        <div className="absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2">
                          <div className="size-2 rounded-full bg-blue-500" />
                        </div>
                      )}
                    {slot.label}
                  </div>
                ))}
                <div className="border-t border-gray-200 bg-[#F3F4F6]" />

                {/* Medication rows */}
                {filteredMedications?.map((medication) => (
                  <MedicationRow
                    key={medication.id}
                    medication={medication}
                    visibleSlots={visibleSlots}
                    currentDate={currentDate}
                    administrations={administrations?.results}
                    onAdminister={handleAdminister}
                    onEditAdministration={handleEditAdministration}
                    onDiscontinue={handleDiscontinue}
                    canWrite={canWrite}
                  />
                ))}
              </div>
            </div>

            {stoppedMedications?.results?.length > 0 && !searchQuery.trim() && (
              <div
                className="p-4 border-t border-[#e5e7eb] flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                onClick={() => setShowStopped(!showStopped)}
              >
                <CareIcon
                  icon={showStopped ? "l-eye-slash" : "l-eye"}
                  className="size-4"
                />
                <span className="text-sm underline">
                  {showStopped ? t("hide") : t("show")}{" "}
                  {`${stoppedMedications?.results?.length} ${t("stopped")}`}{" "}
                  {t("prescriptions")}
                </span>
              </div>
            )}
          </Card>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2 mx-2">
      {!showTimeLine && (
        <div className="flex justify-start items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 flex-1">
              <CareIcon icon="l-search" className="text-lg text-gray-500" />
              <Input
                placeholder={t("search_medications")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-hidden placeholder:text-gray-500"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-gray-500 hover:text-foreground"
                  onClick={() => setSearchQuery("")}
                >
                  <CareIcon icon="l-times" className="text-lg" />
                </Button>
              )}
            </div>
          </div>
          {canWrite && (
            <Button
              variant="outline"
              className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 w-full sm:w-auto"
              onClick={() => setIsSheetOpen(true)}
              disabled={!activeMedications?.results.length}
            >
              <CareIcon icon="l-plus" className="mr-2 size-4" />
              {t("administer_medicine")}
            </Button>
          )}
          {facilityIdExists && (
            <Button
              variant="outline"
              disabled={!activeMedications?.results?.length}
              size="sm"
              className="text-gray-950 hover:text-gray-700 h-9"
            >
              <Link href={`../${encounterId}/medicines/administrations/print`}>
                <CareIcon icon="l-print" className="mr-2" />
                {t("print")}
              </Link>
            </Button>
          )}
        </div>
      )}

      <div className="mt-4">{content}</div>

      {selectedMedication && administrationRequest && (
        <MedicineAdminDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setAdministrationRequest(null);
              setSelectedMedication(null);
              queryClient.invalidateQueries({
                queryKey: ["medication_administrations"],
              });
            }
          }}
          medication={selectedMedication}
          lastAdministeredDate={
            lastAdministeredDetails?.dates[selectedMedication.id]
          }
          lastAdministeredBy={
            lastAdministeredDetails?.performers[selectedMedication.id]
          }
          administrationRequest={administrationRequest}
          patientId={patientId}
        />
      )}

      {encounterId && (
        <MedicineAdminSheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) {
              queryClient.invalidateQueries({
                queryKey: ["medication_administrations"],
              });
            }
          }}
          medications={activeMedications?.results || []}
          lastAdministeredDates={lastAdministeredDetails?.dates}
          patientId={patientId}
          encounterId={encounterId}
        />
      )}
    </div>
  );
};
