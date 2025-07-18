import { Separator } from "@radix-ui/react-separator";
import { format } from "date-fns";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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

import {
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_PRIORITY_COLORS,
  ENCOUNTER_STATUS_COLORS,
  Encounter,
} from "@/types/emr/encounter/encounter";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";

export interface EncounterInfoCardProps {
  encounter: Encounter;
  facilityId: string;
  hideBorder?: boolean;
}

export default function EncounterInfoCard(props: EncounterInfoCardProps) {
  const { t } = useTranslation();

  const { encounter, facilityId, hideBorder = false } = props;
  return (
    <Card
      data-cy={`encounter-card-${encounter.id}`}
      data-status={encounter.status}
      key={props.encounter.id}
      className={cn(
        "hover:shadow-lg transition-shadow group md:flex md:flex-col h-full overflow-hidden",
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
      <CardContent className="grow pb-3">
        <div className="flex flex-col justify-between h-full space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              data-cy="encounter-status-badge"
              variant={ENCOUNTER_STATUS_COLORS[encounter.status]}
            >
              {t(`encounter_status__${encounter.status}`)}
            </Badge>
            <Badge
              variant={ENCOUNTER_CLASSES_COLORS[encounter.encounter_class]}
            >
              {t(`encounter_class__${encounter.encounter_class}`)}
            </Badge>
            <Badge variant={ENCOUNTER_PRIORITY_COLORS[encounter.priority]}>
              {t(`encounter_priority__${encounter.priority}`)}
            </Badge>
            {encounter.tags?.map((tag) => (
              <Badge variant="outline" key={tag.id}>
                {getTagHierarchyDisplay(tag)}
              </Badge>
            ))}
          </div>
          <div>
            <Separator />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-1 items-center py-2 px-2 bg-gray-50">
        <Link
          href={
            encounter.status === "completed"
              ? `/facility/${facilityId}/patients/verify?${new URLSearchParams({
                  phone_number: encounter.patient.phone_number,
                  year_of_birth: encounter.patient.year_of_birth.toString(),
                  partial_id: encounter.patient.id.slice(0, 5),
                }).toString()}`
              : `/facility/${facilityId}/patient/${encounter.patient.id}`
          }
          className="w-full"
        >
          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-1 px-1 py-2 w-full h-9"
            title={t("view_patient")}
          >
            <CareIcon icon="l-user" className="size-2 flex-shrink-0" />
            <span className="leading-none truncate">{t("view_patient")}</span>
          </Button>
        </Link>
        <Link
          href={`/facility/${facilityId}/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`}
          className="w-full"
        >
          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-1 px-1 py-2 w-full h-9"
            title={t("view_encounter")}
          >
            <CareIcon icon="l-notes" className="size-2 flex-shrink-0" />
            <span className="leading-none truncate">{t("view_encounter")}</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
