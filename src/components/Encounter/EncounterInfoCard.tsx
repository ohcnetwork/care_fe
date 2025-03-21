import { Separator } from "@radix-ui/react-separator";
import { format } from "date-fns";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
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
      key={props.encounter.id}
      className={cn(
        "hover:shadow-lg transition-shadow group md:flex md:flex-col",
        hideBorder && "border-none shadow-none",
      )}
    >
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center justify-between">
          <Link
            href={`/facility/${facilityId}/patient/${encounter.patient.id}`}
            className="hover:text-primary"
          >
            <CardTitle className="group-hover:text-primary transition-colors">
              {encounter.patient.name}
              {encounter.patient.death_datetime && (
                <Badge variant="destructive" className="ml-2 py-0">
                  <h3 className="text-xs font-medium">{t("expired")}</h3>
                </Badge>
              )}
            </CardTitle>
          </Link>
        </div>
        <CardDescription className="flex items-center">
          <CareIcon icon="l-clock" className="mr-2 h-4 w-4" />
          {encounter.period.start &&
            format(new Date(encounter.period.start), "PPp")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-col justify-between h-full space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
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
            <Separator className="my-2" />
            <Link
              href={`/facility/${facilityId}/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`}
              className="text-sm text-primary hover:underline text-right flex items-center justify-end group-hover:translate-x-1 transition-transform"
            >
              {t("view_details")}
              <CareIcon icon="l-arrow-right" className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
