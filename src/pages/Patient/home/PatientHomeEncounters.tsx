import { useQuery } from "@tanstack/react-query";
import { AlarmClockIcon, Calendar, Eye, User } from "lucide-react";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import { cn } from "@/lib/utils";
import {
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_STATUS_COLORS,
  ENCOUNTER_STATUS_ICONS,
  EncounterRead,
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
  isFirst?: boolean;
}

function TimelineEncounterCard({
  encounter,
  permissions,
  facilityId,
}: TimelineEncounterCardProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { canViewEncounter, canViewPatients } = getPermissions(
    hasPermission,
    permissions,
  );
  const [isHovered, setIsHovered] = useState(false);

  const canAccess = canViewEncounter || canViewPatients;

  const ClassIcon = ENCOUNTER_CLASS_ICONS[encounter.encounter_class];
  const StatusIcon = ENCOUNTER_STATUS_ICONS[encounter.status];

  const getComponentColor = (color: string) => {
    const colorMap = {
      blue: "bg-blue-200 text-blue-700 border-blue-500",
      yellow: "bg-yellow-200 text-yellow-700 border-yellow-500",
      orange: "bg-orange-200 text-orange-700 border-orange-500",
      green: "bg-green-200 text-green-700 border-green-500",
      red: "bg-red-200 text-red-700 border-red-500",
      gray: "bg-gray-200 text-gray-700 border-gray-500",
      primary: "bg-primary-200 text-primary-700 border-primary-500",
      destructive:
        "bg-destructive-200 text-destructive-700 border-destructive-500",
      secondary: "bg-secondary-200 text-secondary-700 border-secondary-500",
    };

    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <div className="flex items-stretch gap-3 py-4 group">
      <div className="w-[36px] flex flex-col items-center self-stretch">
        <div className="hidden" />

        <div
          className={cn(
            "relative p-2 rounded-full border-2 transition-all duration-200 mt-6 group-hover:scale-105 group-hover:shadow-md",
            getComponentColor(ENCOUNTER_STATUS_COLORS[encounter.status]),
          )}
          role="img"
          aria-label={t(`encounter_status__${encounter.status}`)}
        >
          <StatusIcon
            className={cn(
              "size-4",
              getComponentColor(ENCOUNTER_STATUS_COLORS[encounter.status]),
            )}
          />
        </div>

        <div className="hidden" />
      </div>

      <Card
        className={`flex-1 transition-all duration-200 ${
          isHovered ? "shadow-md border-gray-200" : "shadow-sm border-gray-100"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <Badge
              variant={ENCOUNTER_CLASSES_COLORS[encounter.encounter_class]}
              size="sm"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium"
            >
              <ClassIcon className="size-4" />
              {t(`encounter_class__${encounter.encounter_class}`)}
            </Badge>
            <Badge
              variant={ENCOUNTER_STATUS_COLORS[encounter.status]}
              size="sm"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium"
            >
              <StatusIcon className="size-4" />
              {t(`encounter_status__${encounter.status}`)}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-gray-600 flex items-center gap-1.5">
                {t("start_date")}
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {encounter.period.start
                  ? formatDateTime(encounter.period.start)
                  : t("not_started")}
              </div>
            </div>
            <div>
              <div className="text-gray-600 flex items-center gap-1.5">
                {t("priority")}{" "}
                <AlarmClockIcon className="size-5 text-orange-500" />
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {t(`encounter_priority__${encounter.priority.toLowerCase()}`)}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-1">
          <div className="bg-gray-100 p-4 rounded-b-lg w-full">
            {canAccess ? (
              <Button asChild variant="outline" className="px-4">
                <Link
                  href={
                    facilityId
                      ? `/facility/${facilityId}/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`
                      : `/organization/organizationId/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`
                  }
                >
                  <Eye className="mr-2 size-4" /> {t("view_encounter")}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" className="px-4" disabled>
                <Eye className="mr-2 size-4" /> {t("view_encounter")}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
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
    queryKey: ["encounters", patientId],
    queryFn: query(encounterApi.list, {
      queryParams: {
        patient: patientId,
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
              <div className="flex flex-col items-center">
                {i > 0 && <Skeleton className="w-0.5 h-4 mb-1" />}
                <Skeleton className="w-8 h-8 rounded-full" />
                {i < 2 && <Skeleton className="w-0.5 h-4 mt-1" />}
              </div>
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
    <>
      {encounters?.results && encounters.results.length > 0 ? (
        <div className="relative pb-6">
          <div className="absolute left-[17px] top-12 bottom-2 w-0.5 bg-gray-200" />
          <div className="absolute left-[17px] bottom-2 h-0.5 w-7 -translate-x-[13px] bg-gray-200 rounded" />
          {encounters.results.map((encounter, index) => (
            <TimelineEncounterCard
              encounter={encounter}
              key={encounter.id}
              permissions={facilityPermissions}
              facilityId={
                encounter.facility.id === facilityId ? facilityId : undefined
              }
              isLast={index === encounters.results.length - 1}
              isFirst={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="relative">
            <div className="rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-4 mb-4 shadow-md">
              <CareIcon icon="l-folder-open" className="size-8 text-blue-600" />
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
    </>
  );
}
