import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";

import { FACILITY_FEATURE_TYPES } from "@/types/facility/facility";

export const FeatureBadge = ({ featureId }: { featureId: number }) => {
  const feature = FACILITY_FEATURE_TYPES.find((f) => f.id === featureId);
  if (!feature) {
    return <></>;
  }

  return (
    <Badge variant={feature.variant} className="rounded-sm font-normal">
      <div className="flex flex-row items-center gap-1">
        <CareIcon icon={feature.icon} />
        {feature.name}
      </div>
    </Badge>
  );
};
