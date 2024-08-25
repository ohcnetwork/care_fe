import CareIcon from "../../CAREUI/icons/CareIcon";
import { FACILITY_FEATURE_TYPES } from "../../Common/constants";

export const getFacilityFeatureIcon = (featureId: number) => {
  const feature = FACILITY_FEATURE_TYPES.find((f) => f.id === featureId);
  if (!feature?.icon) return null;
  return typeof feature.icon === "string" ? (
    <CareIcon icon={feature.icon} className="text-lg" />
  ) : (
    feature.icon
  );
};
