import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";
import { Avatar } from "@/components/Common/Avatar";
import { LocationTypeIcons } from "@/types/location/location";
import {
  SchedulableResourceType,
  ScheduleResource,
} from "@/types/scheduling/schedule";
import { formatName } from "@/Utils/utils";

export const ScheduleResourceIcon = ({
  resource,
  className,
}: {
  resource: ScheduleResource;
  className?: string;
}) => {
  if (resource.resource_type === SchedulableResourceType.Practitioner) {
    return (
      <Avatar
        name={formatName(resource.resource)}
        imageUrl={resource.resource.profile_picture_url}
        className={className}
      />
    );
  }
  if (resource.resource_type === SchedulableResourceType.Location) {
    const IconComponent = LocationTypeIcons[resource.resource.form];
    return <IconComponent className="size-14" />;
  }
  type DuoToneIconName = keyof typeof duoToneIcons;
  const getIconName = (name: string): DuoToneIconName =>
    `d-${name}` as DuoToneIconName;
  return (
    <CareIcon
      icon={
        resource.resource.styling_metadata?.careIcon
          ? getIconName(resource.resource.styling_metadata.careIcon)
          : "d-health-worker"
      }
    />
  );
};
