import { Separator } from "@radix-ui/react-separator";
import { format } from "date-fns";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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

import { Encounter } from "@/types/emr/encounter";

export interface EncounterInfoCardProps {
  encounter: Encounter;
  facilityId: string;
  hideBorder?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "planned":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "stat":
      return "bg-red-100 text-red-800";
    case "urgent":
      return "bg-orange-100 text-orange-800";
    case "asap":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function EncounterInfoCard(props: EncounterInfoCardProps) {
  const { t } = useTranslation();

  const { encounter, facilityId, hideBorder = false } = props;
  return (
    <Card
      data-cy={`encounter-card-${encounter.id}`}
      data-status={encounter.status}
      key={props.encounter.id}
      className={cn(
        "hover:shadow-lg transition-shadow group md:flex md:flex-col h-full",
        hideBorder && "border-none shadow-none",
      )}
    >
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {encounter.patient.name}
            {encounter.patient.deceased_datetime && (
              <Badge
                variant="destructive"
                className="ml-2 py-0 border-2 border-red-700 bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900"
              >
                <h3 className="text-xs font-medium">{t("deceased")}</h3>
              </Badge>
            )}
          </CardTitle>
        </div>
        <CardDescription className="flex items-center">
          <CareIcon icon="l-clock" className="mr-2 size-4" />
          {encounter.period.start &&
            format(new Date(encounter.period.start), "PPp")}
        </CardDescription>
      </CardHeader>
      <CardContent className="grow">
        <div className="flex flex-col justify-between h-full space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              data-cy="encounter-status-badge"
              className={getStatusColor(encounter.status)}
              variant="outline"
            >
              {t(`encounter_status__${encounter.status}`)}
            </Badge>
            <Badge className="bg-gray-100 text-gray-800" variant="outline">
              {t(`encounter_class__${encounter.encounter_class}`)}
            </Badge>
            <Badge
              className={getPriorityColor(encounter.priority)}
              variant="outline"
            >
              {t(`encounter_priority__${encounter.priority}`)}
            </Badge>
          </div>
          <div>
            <Separator className="my-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/patient/${encounter.patient.id}`,
                  )
                }
                className="flex flex-col items-center justify-center gap-0.5 sm:flex-row sm:gap-0.5 text-[9px] sm:text-xs px-1 py-1.5 sm:py-1 h-auto sm:h-7 min-w-0"
                data-cy="visit-patient-profile-button"
                title={t("view_patient_profile")}
              >
                <CareIcon icon="l-user" className="size-2.5 flex-shrink-0" />
                <span className="text-center leading-none sm:ml-1 truncate">
                  {t("view_patient_profile")}
                </span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`,
                  )
                }
                className="flex flex-col items-center justify-center gap-0.5 sm:flex-row sm:gap-0.5 text-[9px] sm:text-xs px-1 py-1.5 sm:py-1 h-auto sm:h-7 min-w-0"
                data-cy="visit-encounter-details-button"
                title={t("visit_encounter_details")}
              >
                <CareIcon icon="l-notes" className="size-2.5 flex-shrink-0" />
                <span className="text-center leading-none sm:ml-1 truncate">
                  {t("visit_encounter_details")}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
