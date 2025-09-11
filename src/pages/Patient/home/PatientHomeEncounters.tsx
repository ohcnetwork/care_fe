import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bed,
  Building2,
  Calendar,
  Clock,
  Eye,
  MapPin,
  Sparkles,
  User,
} from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import {
  EncounterRead,
  completedEncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

interface PatientHomeEncountersProps {
  patientId: string;
  facilityId: string;
  facilityPermissions: string[];
  canListEncounters: boolean;
}

interface TimelineEncounterCardProps {
  encounter: EncounterRead;
  permissions: string[];
  facilityId?: string;
  isLast?: boolean;
}

function TimelineEncounterCard({
  encounter,
  permissions,
  facilityId,
  isLast,
}: TimelineEncounterCardProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { canViewEncounter, canViewPatients } = getPermissions(
    hasPermission,
    permissions,
  );
  const [isHovered, setIsHovered] = useState(false);

  const canAccess = canViewEncounter || canViewPatients;
  const isCompleted = completedEncounterStatus.includes(encounter.status);

  // Determine encounter class display
  const getEncounterClassDisplay = () => {
    switch (encounter.encounter_class) {
      case "imp":
        return {
          label: "Inpatient",
          icon: Bed,
          color: "bg-green-50 text-green-800 border-green-300",
        };
      case "amb":
        return {
          label: "Ambulatory (OP)",
          icon: Building2,
          color: "bg-orange-50 text-orange-800 border-orange-300",
        };
      default:
        return {
          label: t(`encounter_class__${encounter.encounter_class}`),
          icon: Building2,
          color: "bg-gray-50 text-gray-800 border-gray-300",
        };
    }
  };

  const encounterClassInfo = getEncounterClassDisplay();
  const ClassIcon = encounterClassInfo.icon;

  return (
    <div className="flex gap-3 mb-3 group">
      {/* Enhanced Timeline indicator with proper connection */}
      <div className="flex flex-col items-center">
        {/* Timeline connector from previous item */}
        {!isLast && (
          <div className="w-0.5 h-4 bg-gradient-to-b from-gray-300 to-gray-200 mb-1" />
        )}

        <div
          className={`relative p-2 rounded-full border-2 transition-all duration-200 ${
            isCompleted
              ? "border-green-400 bg-green-100 shadow-green-100"
              : "border-blue-400 bg-blue-100 shadow-blue-100"
          } group-hover:scale-105 group-hover:shadow-md`}
          role="img"
          aria-label={
            isCompleted ? "Completed encounter" : "In-progress encounter"
          }
        >
          {isCompleted ? (
            <BadgeCheck className="size-3 text-white drop-shadow-sm" />
          ) : (
            <Sparkles className="size-3 text-white drop-shadow-sm" />
          )}
          {/* Subtle pulse for in-progress */}
          {!isCompleted && (
            <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-20" />
          )}
        </div>

        {/* Timeline connector to next item */}
        {!isLast && (
          <div className="w-0.5 h-4 bg-gradient-to-b from-gray-200 to-gray-300 mt-1" />
        )}
      </div>

      {/* Clickable Encounter card */}
      {canAccess ? (
        <Link
          href={
            facilityId
              ? `/facility/${facilityId}/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`
              : `/organization/organizationId/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`
          }
          className="flex-1"
        >
          <Card
            className={`transition-all duration-200 cursor-pointer ${
              isHovered
                ? "shadow-md border-gray-200"
                : "shadow-sm border-gray-100"
            } hover:shadow-md hover:border-gray-200 hover:scale-[1.01]`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <CardContent className="p-4">
              {/* Compact header with status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium transition-all duration-200 ${encounterClassInfo.color} group-hover:scale-105`}
                  >
                    <ClassIcon className="size-3" />
                    {encounterClassInfo.label}
                  </Badge>
                  <Badge
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium transition-all duration-200 ${
                      isCompleted
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                    } group-hover:scale-105`}
                  >
                    {isCompleted ? (
                      <BadgeCheck className="size-3" />
                    ) : (
                      <Sparkles className="size-3" />
                    )}
                    {isCompleted ? t("completed") : t("in_progress")}
                  </Badge>
                </div>

                {/* View indicator */}
                <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-blue-600 transition-colors duration-200">
                  <Eye className="size-3" />
                  <span>{t("view_encounter")}</span>
                </div>
              </div>

              {/* Compact details in single row */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-gray-500" />
                    <span className="text-gray-600">{t("start_date")}:</span>
                    <span className="font-medium text-gray-900">
                      {encounter.period.start
                        ? formatDateTime(encounter.period.start)
                        : t("not_started")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-gray-500" />
                    <span className="text-gray-600">{t("priority")}:</span>
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          encounter.priority.toLowerCase() === "urgent"
                            ? "bg-red-500"
                            : encounter.priority.toLowerCase() === "high"
                              ? "bg-orange-500"
                              : encounter.priority.toLowerCase() === "medium"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                        }`}
                      />
                      <span className="font-medium text-gray-900">
                        {t(
                          `encounter_priority__${encounter.priority.toLowerCase()}`,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <MapPin className="size-3.5" />
                  <span className="text-xs">{encounter.facility.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Card className="flex-1 shadow-sm border-gray-100 opacity-75">
          <CardContent className="p-4">
            {/* Same content but without click functionality */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${encounterClassInfo.color}`}
                >
                  <ClassIcon className="size-3" />
                  {encounterClassInfo.label}
                </Badge>
                <Badge
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                    isCompleted
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-purple-50 text-purple-700 border-purple-200"
                  }`}
                >
                  {isCompleted ? (
                    <BadgeCheck className="size-3" />
                  ) : (
                    <Sparkles className="size-3" />
                  )}
                  {isCompleted ? t("completed") : t("in_progress")}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-gray-500" />
                  <span className="text-gray-600">{t("start_date")}:</span>
                  <span className="font-medium text-gray-900">
                    {encounter.period.start
                      ? formatDateTime(encounter.period.start)
                      : t("not_started")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-gray-500" />
                  <span className="text-gray-600">{t("priority")}:</span>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        encounter.priority.toLowerCase() === "urgent"
                          ? "bg-red-500"
                          : encounter.priority.toLowerCase() === "high"
                            ? "bg-orange-500"
                            : encounter.priority.toLowerCase() === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                      }`}
                    />
                    <span className="font-medium text-gray-900">
                      {t(
                        `encounter_priority__${encounter.priority.toLowerCase()}`,
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <MapPin className="size-3.5" />
                <span className="text-xs">{encounter.facility.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PatientHomeEncounters({
  patientId,
  facilityId,
  facilityPermissions,
  canListEncounters,
}: PatientHomeEncountersProps) {
  const { t } = useTranslation();

  const { data: encounters, isLoading: encounterLoading } = useQuery({
    queryKey: ["encounters", "live", patientId],
    queryFn: query(encounterApi.list, {
      queryParams: {
        patient: patientId,
        live: false,
      },
      silent: true,
    }),
    enabled: !!patientId && canListEncounters,
  });

  if (!canListEncounters) {
    return null;
  }

  if (encounterLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Calendar className="size-4 text-blue-600" />
            </div>
            {t("active_encounters")}
          </CardTitle>
          <CardDescription className="text-sm">
            {t("view_and_manage_patient_encounters")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              {/* Enhanced Timeline skeleton */}
              <div className="flex flex-col items-center">
                {i > 0 && <Skeleton className="w-0.5 h-4 mb-1" />}
                <Skeleton className="w-8 h-8 rounded-full" />
                {i < 2 && <Skeleton className="w-0.5 h-4 mt-1" />}
              </div>
              {/* Card skeleton */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Calendar className="size-4 text-blue-600" />
          </div>
          {t("active_encounters")}
          {encounters?.results && encounters.results.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {encounters.results.length}{" "}
              {encounters.results.length === 1
                ? t("encounter")
                : t("encounters")}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {t("view_and_manage_patient_encounters")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {encounters?.results && encounters.results.length > 0 ? (
          <div className="space-y-0">
            {encounters.results.map((encounter, index) => (
              <TimelineEncounterCard
                encounter={encounter}
                key={encounter.id}
                permissions={facilityPermissions}
                facilityId={
                  encounter.facility.id === facilityId ? facilityId : undefined
                }
                isLast={index === encounters.results.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="relative">
              <div className="rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-4 mb-4 shadow-md">
                <CareIcon
                  icon="l-folder-open"
                  className="size-8 text-blue-600"
                />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {t("no_active_encounters_found")}
            </h3>
            <p className="text-gray-600 mb-4 text-sm max-w-md">
              {t("create_a_new_encounter_to_get_started")}
            </p>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <User className="size-3 mr-1.5" />
              {t("create_encounter")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
