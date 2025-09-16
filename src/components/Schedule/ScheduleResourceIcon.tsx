import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";
import { Avatar } from "@/components/Common/Avatar";
import { cn } from "@/lib/utils";
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
  switch (resource.resource_type) {
    case SchedulableResourceType.Practitioner:
      return (
        <Avatar
          name={formatName(resource.resource)}
          imageUrl={resource.resource.profile_picture_url}
          className={cn("size-8", className)}
        />
      );

    case SchedulableResourceType.Location: {
      const IconComponent = LocationTypeIcons[resource.resource.form];
      return (
        <div className="p-2 bg-gray-100 flex justify-center rounded-lg items-center">
          <IconComponent className={cn("size-5", className)} />
        </div>
      );
    }

    case SchedulableResourceType.HealthcareService: {
      type DuoToneIconName = keyof typeof duoToneIcons;
      const getIconName = (name: string): DuoToneIconName =>
        `d-${name}` as DuoToneIconName;
      return (
        <div className="p-2 bg-gray-100 rounded-lg flex items-center justify-center">
          <CareIcon
            icon={
              resource.resource.styling_metadata?.careIcon
                ? getIconName(resource.resource.styling_metadata.careIcon)
                : "d-health-worker"
            }
            className={cn("size-4", className)}
          />
        </div>
      );
    }

    default:
      return null;
  }
};
