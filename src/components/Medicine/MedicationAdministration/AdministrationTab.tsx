import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Link, usePathParams } from "raviger";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { EmptyState } from "@/components/Medicine/MedicationRequestTable";

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
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

import { DiscontinueConfirmDialog } from "./DiscontinueConfirmDialog";
import { GroupedMedicationRow } from "./GroupedMedicationRow";
import { MedicineAdminDialog } from "./MedicineAdminDialog";
import { MedicineAdminSheet } from "./MedicineAdminSheet";
import {
  GroupedMedication,
  TIME_SLOTS,
  createMedicationAdministrationRequest,
  getLatestActiveRequest,
  groupMedicationsByProduct,
  isTimeInSlot,
} from "./utils";

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
            <div className="text-sm text-gray-500">
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
            <div className="text-sm text-gray-500">
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
        limit: 1000,
        status: ACTIVE_MEDICATION_STATUSES.join(","),
        product_type: "medication",
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
        limit: 1000,
        status: INACTIVE_MEDICATION_STATUSES.join(","),
        facility: facilityId,
        product_type: "medication",
      },
    }),
    enabled: !!patientId && canAccess,
  });

  const { data: administrations } = useQuery({
    queryKey: ["medication_administrations", patientId, encounterId],
    queryFn: query(medicationAdministrationApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 1000, // Increased to fetch more historical administrations
      },
    }),
    enabled: !!patientId && canAccess,
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
          acc.performers[admin.request] = formatName(admin.created_by);
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

  // State for grouped display
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [discontinueDialogOpen, setDiscontinueDialogOpen] = useState(false);
  const [itemToDiscontinue, setItemToDiscontinue] = useState<{
    type: "single" | "group";
    medication?: MedicationRequestRead;
    group?: GroupedMedication;
  } | null>(null);
  const [selectedGroupForAdmin, setSelectedGroupForAdmin] =
    useState<GroupedMedication | null>(null);

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

  const handleMedicationChangeInDialog = useCallback(
    (medication: MedicationRequestRead) => {
      if (!encounterId) {
        return;
      }
      setAdministrationRequest(
        createMedicationAdministrationRequest(medication, encounterId),
      );
      setSelectedMedication(medication);
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

  // Group medications by product - include all medications (active + stopped)
  // so that administrations from stopped requests are shown when the group has active requests
  const groupedMedications = useMemo(() => {
    const allMedications = [
      ...(activeMedications?.results || []),
      ...(stoppedMedications?.results || []),
    ];

    // Apply search filter if present
    const filtered = searchQuery.trim()
      ? allMedications.filter((med: MedicationRequestRead) => {
          const query = searchQuery.toLowerCase().trim();
          const medicationName = med.medication?.display?.toLowerCase() || "";
          const productName = med.requested_product?.name?.toLowerCase() || "";
          return medicationName.includes(query) || productName.includes(query);
        })
      : allMedications;

    return groupMedicationsByProduct(filtered, administrations?.results);
  }, [
    activeMedications?.results,
    stoppedMedications?.results,
    searchQuery,
    administrations?.results,
  ]);

  // Handlers for grouped display
  const handleToggleExpand = useCallback((productId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const handleDiscontinueClick = useCallback(
    (medication: MedicationRequestRead) => {
      setItemToDiscontinue({ type: "single", medication });
      setDiscontinueDialogOpen(true);
    },
    [],
  );

  const handleDiscontinueGroupClick = useCallback(
    (group: GroupedMedication) => {
      setItemToDiscontinue({ type: "group", group });
      setDiscontinueDialogOpen(true);
    },
    [],
  );

  const handleConfirmDiscontinue = useCallback(() => {
    if (!itemToDiscontinue) return;

    if (itemToDiscontinue.type === "group" && itemToDiscontinue.group) {
      // Discontinue all active medications in the group
      const activeRequests = itemToDiscontinue.group.requests.filter((r) =>
        ACTIVE_MEDICATION_STATUSES.includes(
          r.status as (typeof ACTIVE_MEDICATION_STATUSES)[number],
        ),
      );

      discontinueMedication({
        datapoints: activeRequests.map((medication) => ({
          ...medication,
          status: "ended" as const,
          encounter: encounterId,
        })),
      });
    } else if (
      itemToDiscontinue.type === "single" &&
      itemToDiscontinue.medication
    ) {
      discontinueMedication({
        datapoints: [
          {
            ...itemToDiscontinue.medication,
            status: "ended" as const,
            encounter: encounterId,
          },
        ],
      });
    }

    setDiscontinueDialogOpen(false);
    setItemToDiscontinue(null);
  }, [discontinueMedication, encounterId, itemToDiscontinue]);

  const handleAdministerGroup = useCallback(
    (group: GroupedMedication) => {
      const latestRequest = getLatestActiveRequest(group);
      if (latestRequest) {
        setSelectedGroupForAdmin(group);
        handleAdminister(latestRequest);
      }
    },
    [handleAdminister],
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
  } else if (
    searchQuery &&
    !groupedMedications.some((g) => showStopped || g.hasActiveRequests)
  ) {
    content = <EmptyState searching searchQuery={searchQuery} />;
  } else {
    content = (
      <>
        {!groupedMedications.some(
          (g) => showStopped || g.hasActiveRequests,
        ) && (
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
                      <div className="text-xs text-gray-500">
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
              <div className="col-span-full grid grid-cols-subgrid border-l border-r border-gray-200">
                {/* Headers */}
                <div className="p-4 font-medium text-sm border-t border-r border-gray-200 bg-gray-100 text-secondary-700">
                  {t("medicine")}:
                </div>
                {visibleSlots.map((slot, i) => {
                  // Check if this slot is the last of a day (next slot is a different day)
                  const nextSlot = visibleSlots[i + 1];
                  const isLastSlotOfDay =
                    nextSlot &&
                    format(slot.date, "yyyy-MM-dd") !==
                      format(nextSlot.date, "yyyy-MM-dd");

                  return (
                    <div
                      key={`${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
                      className={cn(
                        "p-4 font-semibold text-xs text-center border-t border-r border-gray-200 relative bg-gray-100 text-secondary-700",
                        isLastSlotOfDay && "border-r-4 border-r-gray-200",
                      )}
                    >
                      {i === endSlotIndex &&
                        slot.date.getTime() === currentDate.getTime() && (
                          <div className="absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2">
                            <div className="size-2 rounded-full bg-blue-500" />
                          </div>
                        )}
                      {slot.label}
                    </div>
                  );
                })}
                <div className="border-t border-gray-200 bg-gray-100" />

                {/* Grouped Medication rows */}
                {groupedMedications
                  .filter((group) => showStopped || group.hasActiveRequests)
                  .map((group) => (
                    <GroupedMedicationRow
                      key={group.productId}
                      group={group}
                      visibleSlots={visibleSlots}
                      currentDate={currentDate}
                      administrations={administrations?.results}
                      expandedGroups={expandedGroups}
                      onToggleExpand={handleToggleExpand}
                      onAdminister={handleAdminister}
                      onAdministerGroup={handleAdministerGroup}
                      onEditAdministration={handleEditAdministration}
                      onDiscontinue={handleDiscontinueClick}
                      onDiscontinueGroup={handleDiscontinueGroupClick}
                      canWrite={canWrite}
                    />
                  ))}
              </div>
            </div>

            {stoppedMedications?.results?.length > 0 &&
              activeMedications?.results?.length > 0 &&
              !searchQuery.trim() && (
                <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                  <span className="text-xs text-gray-500">
                    {showStopped
                      ? t("showing_all_medications")
                      : t("n_discontinued_medications_hidden", {
                          count: stoppedMedications.results.length,
                        })}
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
    <div className="flex flex-col gap-4 mx-2">
      {!showTimeLine && (
        <div className="flex flex-col gap-3">
          {/* Search and Actions Row */}
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md bg-white border rounded-lg px-3 py-1.5">
              <CareIcon icon="l-search" className="text-lg text-gray-400" />
              <Input
                placeholder={t("search_medications")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-0 bg-transparent text-sm outline-none focus-visible:ring-0 placeholder:text-gray-400 h-8 px-0"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery("")}
                >
                  <CareIcon icon="l-times" className="text-base" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canWrite && (
                <Button
                  variant="outline"
                  className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                  onClick={() => setIsSheetOpen(true)}
                  disabled={!activeMedications?.results?.length}
                >
                  <CareIcon icon="l-syringe" className="mr-2 size-4" />
                  {t("administer_medicine")}
                </Button>
              )}
              {facilityIdExists && (
                <Link
                  href={`../${encounterId}/medicines/administrations/print`}
                >
                  <Button
                    variant="outline"
                    disabled={
                      !activeMedications?.results?.length &&
                      !stoppedMedications?.results?.length
                    }
                    size="sm"
                    className="h-9"
                  >
                    <CareIcon icon="l-file-medical-alt" className="mr-2" />
                    {t("view_drug_chart")}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-stopped"
                checked={showStopped}
                onCheckedChange={(checked) => setShowStopped(checked === true)}
              />
              <Label
                htmlFor="show-stopped"
                className="text-sm cursor-pointer text-gray-600"
              >
                {t("show_discontinued")}
                {stoppedMedications?.results?.length
                  ? ` (${stoppedMedications.results.length})`
                  : ""}
              </Label>
            </div>
          </div>
        </div>
      )}

      <div>{content}</div>

      {selectedMedication && administrationRequest && (
        <MedicineAdminDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setAdministrationRequest(null);
              setSelectedMedication(null);
              setSelectedGroupForAdmin(null);
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
          otherGroupRequests={
            selectedGroupForAdmin ? selectedGroupForAdmin.requests : undefined
          }
          onMedicationChange={handleMedicationChangeInDialog}
        />
      )}

      {encounterId && (
        <MedicineAdminSheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) {
              setSelectedGroupForAdmin(null);
              queryClient.invalidateQueries({
                queryKey: ["medication_administrations"],
              });
            }
          }}
          medications={activeMedications?.results || []}
          lastAdministeredDates={lastAdministeredDetails?.dates}
          patientId={patientId}
          encounterId={encounterId}
          selectedGroup={selectedGroupForAdmin || undefined}
        />
      )}

      <DiscontinueConfirmDialog
        open={discontinueDialogOpen}
        onOpenChange={setDiscontinueDialogOpen}
        medication={itemToDiscontinue?.medication}
        group={itemToDiscontinue?.group}
        onConfirm={handleConfirmDiscontinue}
      />
    </div>
  );
};
