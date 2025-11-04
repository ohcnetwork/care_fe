import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { FacilityRead } from "@/types/facility/facility";
import careConfig from "@careConfig";

const getIdentifierConfigs = (
  facility: FacilityRead,
  { level }: { level: "facility" | "instance" },
) => {
  const instanceConfigs = facility.patient_instance_identifier_configs;
  const facilityConfigs = facility.patient_facility_identifier_configs;

  // Merge both arrays maintaining order
  const merged = [...instanceConfigs, ...facilityConfigs];

  // Filter: keep all non-name configs, but for name configs only keep the one from the specified level
  return merged.filter((config) => {
    const isNameConfig =
      config.config.system === careConfig.patientNameConfigSystem;
    if (isNameConfig) {
      // For name configs, only keep the one from the specified level
      if (level === "instance") {
        return instanceConfigs.includes(config);
      }
      return facilityConfigs.includes(config);
    }
    // Keep all non-name configs
    return true;
  });
};

export const usePatientIdentifierConfigs = ({
  level,
}: {
  level: "facility" | "instance";
}) => {
  const { facility } = useCurrentFacility();

  if (!facility) {
    return [];
  }

  return getIdentifierConfigs(facility, { level });
};
