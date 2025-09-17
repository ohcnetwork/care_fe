import { ChevronDown } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { formatDateTime } from "@/Utils/utils";
import {
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_STATUS_COLORS,
  ENCOUNTER_STATUS_ICONS,
  EncounterRead,
} from "@/types/emr/encounter/encounter";

export const StatusBadge = ({ encounter }: { encounter: EncounterRead }) => {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant={ENCOUNTER_STATUS_COLORS[encounter.status]}
          size="sm"
          className="cursor-pointer"
        >
          {React.createElement(ENCOUNTER_STATUS_ICONS[encounter.status], {
            className: "size-3",
          })}
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

export const EncounterClassBadge = ({
  encounter,
}: {
  encounter: EncounterRead;
}) => {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant={ENCOUNTER_CLASSES_COLORS[encounter.encounter_class]}
          size="sm"
          className="cursor-pointer"
        >
          {React.createElement(
            ENCOUNTER_CLASS_ICONS[encounter.encounter_class],
            {
              className: "size-3",
            },
          )}
          {t(`encounter_class__${encounter.encounter_class}`)}
          <ChevronDown className="size-3 opacity-50" />
        </Badge>
      </PopoverTrigger>
      <PopoverContent align={"start"} className="w-auto p-2">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{t("class_history")}</h4>
          {encounter.encounter_class_history.history.map((history, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">
                {formatDateTime(history.moved_at)}
              </span>
              <span className="font-medium">
                {t(`encounter_class__${history.status}`)}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
