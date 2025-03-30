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
    blue: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    orange: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    teal: "bg-teal-100 text-teal-800 hover:bg-teal-200",
    yellow: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    pink: "bg-pink-100 text-pink-800 hover:bg-pink-200",
    red: "bg-red-100 text-red-800 hover:bg-red-200",
    indigo: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
    purple: "bg-purple-100 text-purple-800 hover:bg-purple-200",
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
