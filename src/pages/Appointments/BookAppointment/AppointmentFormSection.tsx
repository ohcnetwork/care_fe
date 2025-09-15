import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import { ResourceSelector } from "@/components/Schedule/ResourceSelector";
import RadioInput from "@/components/ui/RadioInput";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import { HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import { LocationList } from "@/types/location/location";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { UserReadMinimal } from "@/types/user/user";
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

  const [selectedUser, setSelectedUser] = useState<UserReadMinimal | null>(
    null,
  );
  const [selectedLocation, setSelectedLocation] = useState<LocationList | null>(
    null,
  );
  const [selectedService, setSelectedService] =
    useState<HealthcareServiceReadSpec | null>(null);

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
            setSelectedUser(null);
            setSelectedLocation(null);
            setSelectedService(null);
          }}
        />
      </div>
      <div className="flex flex-col">
        <Label className="mb-2 text-sm font-medium text-gray-950">
          {t(`schedulable_resource__${selectedResourceType}`)}
        </Label>
        <ResourceSelector
          selectedResourceType={selectedResourceType}
          facilityId={facilityId}
          setSelectedUser={setSelectedUser}
          setSelectedLocation={setSelectedLocation}
          setSelectedService={setSelectedService}
          selectedLocation={selectedLocation}
          selectedService={selectedService}
          selectedUser={selectedUser}
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
