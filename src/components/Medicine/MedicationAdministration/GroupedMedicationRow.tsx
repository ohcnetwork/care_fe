import { format, formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight, CircleStop } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { formatDosage, formatFrequency } from "@/components/Medicine/utils";

import { MedicationAdministrationRead } from "@/types/emr/medicationAdministration/medicationAdministration";
import {
  ACTIVE_MEDICATION_STATUSES,
  INACTIVE_MEDICATION_STATUSES,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";

import {
  GroupedMedication,
  STATUS_COLORS,
  TIME_SLOTS,
  getGroupAdministrationsForTimeSlot,
  isTimeInSlot,
} from "./utils";

type TimeSlot = (typeof TIME_SLOTS)[number] & { date: Date };

interface GroupedMedicationRowProps {
  group: GroupedMedication;
  visibleSlots: TimeSlot[];
  currentDate: Date;
  administrations?: MedicationAdministrationRead[];
  expandedGroups: Set<string>;
  onToggleExpand: (productId: string) => void;
  onAdminister: (medication: MedicationRequestRead) => void;
  onAdministerGroup: (group: GroupedMedication) => void;
  onDiscontinue: (medication: MedicationRequestRead) => void;
  onDiscontinueGroup: (group: GroupedMedication) => void;
  onEditAdministration: (
    medication: MedicationRequestRead,
    admin: MedicationAdministrationRead,
  ) => void;
  canWrite: boolean;
}

// Individual medication row within expanded group
const IndividualMedicationRow: React.FC<{
  medication: MedicationRequestRead;
  visibleSlots: TimeSlot[];
  currentDate: Date;
  administrations?: MedicationAdministrationRead[];
  onEditAdministration: (
    medication: MedicationRequestRead,
    admin: MedicationAdministrationRead,
  ) => void;
  onAdminister: (medication: MedicationRequestRead) => void;
  onDiscontinue: (medication: MedicationRequestRead) => void;
  canWrite: boolean;
  groupHasActiveRequests: boolean;
}> = ({
  medication,
  visibleSlots,
  currentDate,
  administrations,
  onEditAdministration,
  onAdminister,
  onDiscontinue,
  canWrite,
  groupHasActiveRequests,
}) => {
  const { t } = useTranslation();
  const isInactive = INACTIVE_MEDICATION_STATUSES.includes(
    medication.status as (typeof INACTIVE_MEDICATION_STATUSES)[number],
  );
  const isActive = ACTIVE_MEDICATION_STATUSES.includes(
    medication.status as (typeof ACTIVE_MEDICATION_STATUSES)[number],
  );

  return (
    <React.Fragment>
      {/* Medication details - indented */}
      <div
        className={cn(
          "p-3 pl-12 border-t border-r border-gray-100 bg-gray-50 min-w-0",
          isInactive && "opacity-50",
        )}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-sm font-medium text-gray-700",
              isInactive && medication.status === "ended" && "line-through",
            )}
          >
            {[
              formatDosage(medication.dosage_instruction[0]),
              formatFrequency(medication.dosage_instruction[0]),
              medication.dosage_instruction[0]?.method?.display,
            ]
              .filter(Boolean)
              .join(", ")}
          </span>
          <Badge
            variant={medication.status === "active" ? "green" : "secondary"}
            className="text-xs"
          >
            {t(medication.status)}
          </Badge>
        </div>
        {medication.note && (
          <div className="text-xs text-gray-500 mt-0.5 italic wrap-break-word">
            {medication.note}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-0.5">
          {t("added_on")}:{" "}
          {format(
            new Date(medication.authored_on || medication.created_date),
            "MMM dd, yyyy",
          )}
        </div>
      </div>

      {/* Time slots - show administrations and administer button */}
      {visibleSlots.map((slot, slotIndex) => {
        const slotAdmins = administrations?.filter((admin) => {
          const adminDate = new Date(admin.occurrence_period_start);
          const slotStartDate = new Date(slot.date);
          const slotEndDate = new Date(slot.date);
          const [startHour] = slot.start.split(":").map(Number);
          const [endHour] = slot.end.split(":").map(Number);
          slotStartDate.setHours(startHour, 0, 0, 0);
          slotEndDate.setHours(endHour, 0, 0, 0);
          return (
            admin.request === medication.id &&
            adminDate >= slotStartDate &&
            adminDate < slotEndDate
          );
        });

        const hasAdmins = slotAdmins && slotAdmins.length > 0;
        const isCurrentSlot = isTimeInSlot(currentDate, slot);

        // Check if this is the last slot of a day
        const nextSlot = visibleSlots[slotIndex + 1];
        const isLastSlotOfDay =
          nextSlot &&
          format(slot.date, "yyyy-MM-dd") !==
            format(nextSlot.date, "yyyy-MM-dd");

        return (
          <div
            key={`${medication.id}-${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
            className={cn(
              "p-2 border-t border-r border-gray-100 bg-gray-50",
              isInactive && "opacity-50",
              hasAdmins && "bg-green-50/50",
              isLastSlotOfDay && "border-r-4 border-r-gray-200",
            )}
          >
            <div className="flex flex-wrap gap-1">
              {slotAdmins?.map((admin) => {
                const colorClass =
                  STATUS_COLORS[admin.status as keyof typeof STATUS_COLORS] ||
                  STATUS_COLORS.default;
                return (
                  <button
                    key={admin.id}
                    type="button"
                    className={cn(
                      "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium border cursor-pointer hover:opacity-80",
                      colorClass,
                    )}
                    onClick={() => onEditAdministration(medication, admin)}
                  >
                    <CareIcon icon="l-check-circle" className="size-3" />
                    {new Date(admin.occurrence_period_start).toLocaleTimeString(
                      "en-US",
                      { hour: "numeric", minute: "2-digit", hour12: true },
                    )}
                  </button>
                );
              })}
            </div>
            {/* Show Administer button if group has active requests */}
            {isCurrentSlot && groupHasActiveRequests && canWrite && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 mt-1 text-primary-700 border-primary-500 hover:bg-primary-50 font-medium text-xs"
                onClick={() => onAdminister(medication)}
              >
                <CareIcon icon="l-syringe" className="size-3 mr-1" />
                {t("administer")}
              </Button>
            )}
          </div>
        );
      })}

      {/* Actions column */}
      <div
        className={cn(
          "p-2 flex items-center justify-center border-t border-gray-100 bg-gray-50",
          isInactive && "opacity-50",
        )}
      >
        {isActive && canWrite && (
          <div
            className="flex flex-col p-1 rounded-md cursor-pointer items-center text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700"
            onClick={() => onDiscontinue(medication)}
          >
            <CircleStop className="size-4" />
            <span className="text-xs">{t("stop")}</span>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

// Main component - desktop grid row only
export const GroupedMedicationRow: React.FC<GroupedMedicationRowProps> = ({
  group,
  visibleSlots,
  currentDate,
  administrations,
  expandedGroups,
  onToggleExpand,
  onAdminister,
  onAdministerGroup,
  onEditAdministration,
  onDiscontinue,
  onDiscontinueGroup,
  canWrite,
}) => {
  const { t } = useTranslation();
  const isExpanded = expandedGroups.has(group.productId);
  const hasMultipleRequests = group.requests.length > 1;

  // Get active requests and find the latest one
  const activeRequests = group.requests.filter((r) =>
    ACTIVE_MEDICATION_STATUSES.includes(
      r.status as (typeof ACTIVE_MEDICATION_STATUSES)[number],
    ),
  );

  // Get the latest active prescription (most recently authored)
  const latestActiveRequest =
    activeRequests.length > 0
      ? activeRequests.reduce((latest, current) => {
          const latestDate = new Date(
            latest.authored_on || latest.created_date,
          );
          const currentDate = new Date(
            current.authored_on || current.created_date,
          );
          return currentDate > latestDate ? current : latest;
        })
      : group.requests[0]; // Fallback to first request if no active ones

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={() => onToggleExpand(group.productId)}
      className="contents"
    >
      {/* Group Header Row */}
      <div
        className={cn(
          "grid grid-cols-subgrid col-span-full border-t border-gray-200",
          !group.hasActiveRequests && "bg-gray-50 opacity-60",
        )}
      >
        {/* Product name column */}
        <div className="p-4 border-r border-gray-200">
          <div className="flex items-start gap-2">
            {hasMultipleRequests ? (
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="mt-0.5 p-0.5 rounded hover:bg-gray-200 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="size-4 text-gray-500" />
                  )}
                </button>
              </CollapsibleTrigger>
            ) : (
              <div className="w-5" /> // Spacer for alignment
            )}

            <div className="flex-1 min-w-0">
              {/* Product name */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "font-semibold text-gray-900",
                    !group.hasActiveRequests && "line-through text-gray-500",
                  )}
                >
                  {group.productName}
                </span>
                {hasMultipleRequests && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {group.requests.length}
                  </Badge>
                )}
              </div>

              {/* Latest prescription dosage and frequency */}
              {latestActiveRequest &&
                (() => {
                  const freq = formatFrequency(
                    latestActiveRequest.dosage_instruction[0],
                  );
                  const method =
                    latestActiveRequest.dosage_instruction[0]?.method;
                  return (
                    <>
                      <div className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">
                        {formatDosage(
                          latestActiveRequest.dosage_instruction[0],
                        )}
                        {freq && <span className="text-gray-400"> · </span>}
                        {freq}
                        {method && (
                          <>
                            <span className="text-gray-400"> · </span>
                            {method.display}
                          </>
                        )}
                      </div>
                      {latestActiveRequest.note && (
                        <div className="text-xs text-gray-500 mt-0.5 italic whitespace-pre-wrap">
                          {latestActiveRequest.note}
                        </div>
                      )}
                    </>
                  );
                })()}

              {/* Status and route badges */}
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge
                  variant={group.hasActiveRequests ? "green" : "secondary"}
                  className="text-xs"
                >
                  {group.hasActiveRequests ? t("active") : t("stopped")}
                </Badge>
                {group.routes.slice(0, 2).map((route) => (
                  <Badge key={route} variant="blue" className="text-xs">
                    {route}
                  </Badge>
                ))}
                {group.routes.length > 2 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="text-xs cursor-help"
                      >
                        +{group.routes.length - 2}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {group.routes.slice(2).join(", ")}
                    </TooltipContent>
                  </Tooltip>
                )}
                {group.hasPRN && (
                  <Badge variant="pink" className="text-xs">
                    PRN
                  </Badge>
                )}
              </div>

              {/* Last administered */}
              {group.lastAdministeredTime && (
                <div className="text-xs text-gray-500 mt-1">
                  {t("last_administered")}:{" "}
                  {formatDistanceToNow(new Date(group.lastAdministeredTime))}{" "}
                  {t("ago")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time slot columns */}
        {visibleSlots.map((slot, slotIndex) => {
          const slotAdmins = getGroupAdministrationsForTimeSlot(
            administrations || [],
            group,
            slot.date,
            slot.start,
            slot.end,
          );
          const isCurrentSlot = isTimeInSlot(currentDate, slot);
          const hasAdmins = slotAdmins.length > 0;

          // Check if this is the last slot of a day (next slot is different day)
          const nextSlot = visibleSlots[slotIndex + 1];
          const isLastSlotOfDay =
            nextSlot &&
            format(slot.date, "yyyy-MM-dd") !==
              format(nextSlot.date, "yyyy-MM-dd");

          return (
            <div
              key={`${group.productId}-${format(slot.date, "yyyy-MM-dd")}-${slot.start}`}
              className={cn(
                "p-3 border-t border-r border-gray-200",
                hasAdmins && "bg-green-50",
                isLastSlotOfDay && "border-r-4 border-r-gray-200",
              )}
            >
              {/* Administration badges */}
              {hasAdmins && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {slotAdmins.slice(0, 3).map((admin) => {
                    const colorClass =
                      STATUS_COLORS[
                        admin.status as keyof typeof STATUS_COLORS
                      ] || STATUS_COLORS.default;
                    return (
                      <button
                        key={admin.id}
                        type="button"
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs font-medium border cursor-pointer hover:opacity-80",
                          colorClass,
                        )}
                        onClick={() => {
                          const med = group.requests.find(
                            (r) => r.id === admin.request,
                          );
                          if (med) onEditAdministration(med, admin);
                        }}
                      >
                        {new Date(
                          admin.occurrence_period_start,
                        ).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </button>
                    );
                  })}
                  {slotAdmins.length > 3 && (
                    <span className="text-xs text-gray-600 px-1.5 py-0.5 bg-gray-100 rounded font-medium">
                      +{slotAdmins.length - 3} {t("more")}
                    </span>
                  )}
                </div>
              )}

              {/* Administer button */}
              {isCurrentSlot && group.hasActiveRequests && canWrite && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-primary-700 border-primary-500 hover:bg-primary-50 font-medium"
                  onClick={() => onAdministerGroup(group)}
                >
                  <CareIcon icon="l-syringe" className="size-4 mr-1" />
                  {t("administer")}
                </Button>
              )}
            </div>
          );
        })}

        {/* Actions column */}
        <div className="p-3 flex items-center justify-center border-t border-gray-200">
          {group.hasActiveRequests && canWrite && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="p-2 rounded-md cursor-pointer text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700"
                  onClick={() => onDiscontinueGroup(group)}
                >
                  <CircleStop className="size-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("discontinue")}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Expanded individual medications */}
      <CollapsibleContent className="contents">
        {group.requests.map((medication) => (
          <IndividualMedicationRow
            key={medication.id}
            medication={medication}
            visibleSlots={visibleSlots}
            currentDate={currentDate}
            administrations={administrations}
            onEditAdministration={onEditAdministration}
            onAdminister={onAdminister}
            onDiscontinue={onDiscontinue}
            canWrite={canWrite}
            groupHasActiveRequests={group.hasActiveRequests}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};
