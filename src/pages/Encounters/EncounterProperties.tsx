import { ChevronDown, Edit2Icon, MapPinIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { LocationSheet } from "@/components/Location/LocationSheet";
import { LocationTree } from "@/components/Location/LocationTree";

import { formatDateTime } from "@/Utils/utils";
import {
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_STATUS_ICONS,
  Encounter,
} from "@/types/emr/encounter";

interface Props {
  encounter: Encounter;
  canEdit: boolean;
}

export default function EncounterProperties({ encounter, canEdit }: Props) {
  const { t } = useTranslation();

  const EncounterClassIcon = ENCOUNTER_CLASS_ICONS[encounter.encounter_class];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{t("status")}: </span>
        <div>
          <StatusBadge encounter={encounter} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{t("encounter_class")}: </span>
        <div>
          <Badge variant="teal" size="sm">
            <EncounterClassIcon className="size-3" />
            {t(`encounter_class__${encounter.encounter_class}`)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{t("start_date")}: </span>
        <div>
          <Badge variant="secondary" size="sm">
            {formatDateTime(encounter.period.start)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{t("end_date")}: </span>
        <div>
          <Badge variant="secondary" size="sm">
            {encounter.period.end
              ? formatDateTime(encounter.period.end)
              : t("ongoing")}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{t("priority")}: </span>
        <div>
          <Badge variant="orange" size="sm">
            {t(`encounter_priority__${encounter.priority}`)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{t("location")}: </span>
        <div>
          <LocationPropertyBadge encounter={encounter} canEdit={canEdit} />
        </div>
      </div>
    </div>
  );
}

const StatusBadge = ({ encounter }: { encounter: Encounter }) => {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge variant="blue" size="sm" className="cursor-pointer">
          <CareIcon
            icon={
              ENCOUNTER_STATUS_ICONS[
                encounter.status as keyof typeof ENCOUNTER_STATUS_ICONS
              ]
            }
            className="size-3"
          />
          {t(`encounter_status__${encounter.status}`)}
          <ChevronDown className="size-3 opacity-50" />
        </Badge>
      </PopoverTrigger>
      <PopoverContent align={"start"} className="w-auto p-2">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{t("status_history")}</h4>
          {encounter.status_history.history.map((history, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">
                {formatDateTime(history.moved_at)}
              </span>
              <span className="font-medium">
                {t(`encounter_status__${history.status}`)}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const LocationPropertyBadge = ({
  encounter,
  canEdit,
}: {
  encounter: Encounter;
  canEdit: boolean;
}) => {
  const { t } = useTranslation();

  if (!encounter.current_location) {
    if (!canEdit) {
      return (
        <Badge variant="secondary" size="sm">
          <MapPinIcon className="size-3" />
          {t("no_location_associated")}
        </Badge>
      );
    }

    return (
      <LocationSheet
        facilityId={encounter.facility.id}
        encounter={encounter}
        trigger={
          <div className="group flex items-center gap-1">
            <Badge variant="secondary" size="sm" className="cursor-pointer">
              <MapPinIcon className="size-3" />
              {t("no_location_associated")}
            </Badge>
            <div className="group-hover:opacity-100 opacity-0 transition-opacity duration-200 ease-in-out">
              <Edit2Icon className="size-3" />
            </div>
          </div>
        }
        history={encounter.location_history}
      />
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant="secondary"
          size="sm"
          title={`Current Location: ${encounter.current_location.name}`}
        >
          <MapPinIcon className="size-3" />
          {encounter.current_location.name}
          <ChevronDown className="size-3 opacity-50" />
        </Badge>
      </PopoverTrigger>
      <PopoverContent align={"start"} className="w-auto p-2">
        <div className="space-y-2 p-2 items-center">
          <div className="flex items-center gap-8 justify-between">
            <h4 className="font-medium text-sm">{t("location")}</h4>

            <LocationSheet
              facilityId={encounter.facility.id}
              history={encounter.location_history}
              encounter={encounter}
              trigger={
                <div>
                  <CareIcon icon="l-history" className="size-4 text-gray-700" />
                  <Button
                    variant="link"
                    className="text-gray-950 underline pl-1 pr-0  font-semibold"
                  >
                    {t("history")}
                  </Button>
                </div>
              }
            />
          </div>
          <div className="border-b border-gray-200 my-2" />
          <LocationTree location={encounter.current_location} />
          <div className="border-b border-dashed border-gray-200 my-2" />
          {canEdit && (
            <LocationSheet
              facilityId={encounter.facility.id}
              encounter={encounter}
              trigger={
                <Button variant="secondary">{t("update_location")}</Button>
              }
              history={encounter.location_history}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
