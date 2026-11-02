import { useTranslation } from "react-i18next";

import { RichTextEditor } from "@/components/Common/RichTextEditor";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";
import { Label } from "@/components/ui/label";

import {
  ScheduleResourceFormState,
  ScheduleResourceSelector,
} from "@/components/Schedule/ResourceSelector";
import RadioInput from "@/components/ui/RadioInput";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

interface AppointmentFormSectionProps {
  disabled?: boolean;
  facilityId: string;
  selectedTags: TagConfig[];
  setSelectedTags: (tags: TagConfig[]) => void;
  reason: string;
  setReason: (reason: string) => void;
  selectedResource: ScheduleResourceFormState;
  setSelectedResource: (resource: ScheduleResourceFormState) => void;
}
export const AppointmentFormSection = ({
  disabled,
  facilityId,
  selectedTags,
  setSelectedTags,
  reason,
  setReason,
  selectedResource,
  setSelectedResource,
}: AppointmentFormSectionProps) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col">
        <Label className="mb-2 text-sm font-medium text-gray-950">
          {t("select_resource_type")}
        </Label>
        <RadioInput
          options={Object.values(SchedulableResourceType).map((type) => ({
            label: t(`resource_type__${type}`),
            value: type,
          }))}
          value={selectedResource.resource_type}
          onValueChange={(value: SchedulableResourceType) => {
            if (selectedResource.resource_type === value) {
              return;
            }
            setSelectedResource({
              resource: null,
              resource_type: value,
            });
          }}
          required={true}
        />
      </div>
      <div className="flex flex-col">
        <Label className="mb-2 text-sm font-medium text-gray-950">
          {t(`schedulable_resource__${selectedResource.resource_type}`)}
        </Label>
        <ScheduleResourceSelector
          facilityId={facilityId}
          setSelectedResource={setSelectedResource}
          selectedResource={selectedResource}
        />
      </div>

      <div className="max-w-md">
        <Label className="mb-2">{t("tags", { count: 1 })}</Label>
        <TagSelectorPopover
          selected={selectedTags}
          onChange={setSelectedTags}
          resource={TagResource.APPOINTMENT}
          facilityId={facilityId}
        />
      </div>
      <div className="w-full space-y-2">
        <Label>
          {t("reason_for_visit_label")}{" "}
          <span className="font-normal italic">({t("optional")})</span>
        </Label>
        <RichTextEditor
          disabled={disabled}
          label={`${t("reason_for_visit_label")} (${t("optional")})`}
          placeholder={t("reason_for_visit")}
          value={reason}
          onChange={setReason}
        />
      </div>
    </>
  );
};
