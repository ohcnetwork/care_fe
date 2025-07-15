import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Edit2Icon, MapPinIcon, PenIcon } from "lucide-react";
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
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";

import { formatDateTime } from "@/Utils/utils";
import {
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_STATUS_ICONS,
  Encounter,
} from "@/types/emr/encounter/encounter";

interface Props {
  encounter: Encounter;
  canEdit: boolean;
}

export default function EncounterProperties({ encounter, canEdit }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const EncounterClassIcon = ENCOUNTER_CLASS_ICONS[encounter.encounter_class];

  return (
    <div className="flex flex-wrap md:flex-col gap-2">
      <div className="hidden md:flex flex-col gap-1">
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
            <span className="whitespace-nowrap">
              {t(`encounter_class__${encounter.encounter_class}`)}
            </span>
          </Badge>
        </div>
      </div>

      <div className="hidden md:flex flex-col gap-1">
        <span className="text-xs font-medium">{t("start_date")}: </span>
        <div>
          <Badge variant="secondary" size="sm">
            <span className="whitespace-nowrap">
              {formatDateTime(encounter.period.start)}
            </span>
          </Badge>
        </div>
      </div>

      <div className="hidden md:flex flex-col gap-1">
        <span className="text-xs font-medium">{t("end_date")}: </span>
        <div>
          <Badge variant="secondary" size="sm">
            <span className="whitespace-nowrap">
              {encounter.period.end
                ? formatDateTime(encounter.period.end)
                : t("ongoing")}
            </span>
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{t("priority")}: </span>
        <div>
          <Badge variant="orange" size="sm">
            <span className="whitespace-nowrap">
              {t(`encounter_priority__${encounter.priority}`)}
            </span>
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{t("location")}: </span>
        <div>
          <LocationPropertyBadge encounter={encounter} canEdit={canEdit} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">
          {t("departments_and_teams")}:{" "}
        </span>
        <div className="flex flex-wrap gap-2">
          {encounter.organizations.length > 0 ? (
            <>
              {encounter.organizations.map((org) => (
                <Badge key={org.id} variant="blue" className="capitalize">
                  {org.name}
                </Badge>
              ))}
            </>
          ) : (
            <p className="text-sm text-gray-500">
              {t("no_departments_assigned")}
            </p>
          )}
          {canEdit && (
            <LinkDepartmentsSheet
              entityType="encounter"
              entityId={encounter.id}
              currentOrganizations={encounter.organizations}
              facilityId={encounter.facility.id}
              trigger={
                <Button variant="ghost" size="xs">
                  <PenIcon />
                </Button>
              }
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{t("tags")}: </span>
        <div className="flex flex-wrap gap-2">
          {encounter.tags.length > 0 ? (
            <>
              {encounter.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="capitalize"
                  title={tag.description}
                >
                  {tag.display}
                </Badge>
              ))}
            </>
          ) : (
            <p className="text-sm text-gray-500">{t("no_tags")}</p>
          )}
          {canEdit && (
            <TagAssignmentSheet
              entityType="encounter"
              entityId={encounter.id}
              currentTags={encounter.tags}
              onUpdate={() => {
                queryClient.invalidateQueries({
                  queryKey: ["encounter", encounter.id],
                });
              }}
              trigger={
                <Button variant="ghost" size="xs">
                  <PenIcon />
                </Button>
              }
              canWrite={canEdit}
            />
          )}
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
              ] ?? "l-spinner"
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
          {t("none")}
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
