import { FacilityHome } from "@/components/Facility/FacilityHome";

interface GeneralSettingsProps {
  facilityId: string;
}

export function GeneralSettings({ facilityId }: GeneralSettingsProps) {
  return <FacilityHome facilityId={facilityId} />;
}
