import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import {
  ResourceSelector,
  ScheduleResourceFormState,
} from "@/components/Schedule/ResourceSelector";
import RadioInput from "@/components/ui/RadioInput";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { useState } from "react";

interface AppointmentFormSectionProps {
  facilityId: string;
  selectedTags: TagConfig[];
  setSelectedTags: (tags: TagConfig[]) => void;
  reason: string;
  setReason: (reason: string) => void;
  setResourceId: (resourceId: string) => void;
  setSelectedResourceType: (resourceType: SchedulableResourceType) => void;
  selectedResourceType: SchedulableResourceType;
}
export const AppointmentFormSection = ({
  facilityId,
  setResourceId,
  selectedTags,
  setSelectedTags,
  reason,
  setReason,
  setSelectedResourceType,
  selectedResourceType,
}: AppointmentFormSectionProps) => {
  const { t } = useTranslation();

  const [selectedResource, setSelectedResource] =
    useState<ScheduleResourceFormState>({
      resource: null,
      resource_type: selectedResourceType,
    });

  return (
    <div className="flex flex-col gap-8 p-4 w-114 bg-white shadow rounded-lg">
      <div className="flex flex-col">
        <Label className="mb-2 text-sm font-medium text-gray-950">
          {t("select_resource_type")}
        </Label>
        <RadioInput
          options={Object.values(SchedulableResourceType).map((type) => ({
            label: t(`resource_type__${type}`),
            value: type,
          }))}
          value={selectedResourceType}
          onValueChange={(value: SchedulableResourceType) => {
            setSelectedResourceType(value);
            setResourceId("");
            setSelectedResource({
              resource: null,
              resource_type: value,
            });
          }}
        />
      </div>
      <div className="flex flex-col">
        <Label className="mb-2 text-sm font-medium text-gray-950">
          {t(`schedulable_resource__${selectedResourceType}`)}
        </Label>
        <ResourceSelector
          facilityId={facilityId}
          setSelectedResource={setSelectedResource}
          selectedResource={selectedResource}
          onChange={setResourceId}
        />
      </div>

      <div className="max-w-md">
        <Label className="mb-2">{t("tags", { count: 1 })}</Label>
        <TagSelectorPopover
          selected={selectedTags}
          onChange={setSelectedTags}
          resource={TagResource.APPOINTMENT}
        />
      </div>
      <div className="w-full">
        <Label className="mb-2 text-sm font-medium text-gray-950">
          {t("reason_for_visit_label")}
          <span className="font-normal italic">({t("optional")})</span>
        </Label>
        <Textarea
          placeholder={t("reason_for_visit")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-10 px-3 py-2"
        />
      </div>
    </div>
  );
};
