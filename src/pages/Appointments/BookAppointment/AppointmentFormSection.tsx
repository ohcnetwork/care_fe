import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import { UserReadMinimal } from "@/types/user/user";

interface AppointmentFormSectionProps {
  facilityId: string;
  resource: UserReadMinimal | undefined;
  selectedTags: TagConfig[];
  setSelectedTags: (tags: TagConfig[]) => void;
  reason: string;
  setReason: (reason: string) => void;
  setResourceId: (resourceId: string) => void;
}
export const AppointmentFormSection = ({
  facilityId,
  setResourceId,
  resource,
  selectedTags,
  setSelectedTags,
  reason,
  setReason,
}: AppointmentFormSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-8 p-4 w-114 bg-white shadow rounded-lg">
      <div className="w-full">
        <Label className="mb-2 text-sm font-medium text-gray-950">
          {t("select_practitioner")}
        </Label>
        <PractitionerSelector
          facilityId={facilityId}
          selected={resource ?? null}
          onSelect={(user) => user && setResourceId(user.id)}
        />
      </div>
      <div className="max-w-md">
        <Label className="mb-2">{t("tags")}</Label>
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
