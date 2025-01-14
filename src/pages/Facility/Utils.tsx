import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";

import { FACILITY_FEATURE_TYPES } from "@/common/constants";

export const FeatureBadge = ({ featureId }: { featureId: number }) => {
  const feature = FACILITY_FEATURE_TYPES.find((f) => f.id === featureId);
  if (!feature) {
    return <></>;
  }
  const variantStyles = {
    green: "bg-green-100 text-green-800 hover:bg-green-100",
    blue: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    amber: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    orange: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    teal: "bg-teal-100 text-teal-800 hover:bg-teal-100",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm font-normal",
        variantStyles[feature.variant as keyof typeof variantStyles],
      )}
    >
      <div className="flex flex-row items-center gap-1">
        <CareIcon icon={feature.icon} />
        {feature.name}
      </div>
    </Badge>
  );
};
