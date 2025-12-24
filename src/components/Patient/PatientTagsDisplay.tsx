import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PatientListRead,
  PatientRead,
  PublicPatientRead,
} from "@/types/emr/patient/patient";
import {
  getTagHierarchyDisplay,
  TagConfig,
} from "@/types/emr/tagConfig/tagConfig";
import { useTranslation } from "react-i18next";

interface PatientTagsDisplayProps {
  patient: PublicPatientRead | PatientListRead | PatientRead;
  showLabel?: boolean;
  className?: string;
}

export const PatientTagsDisplay = ({
  patient,
  showLabel = true,
  className,
}: PatientTagsDisplayProps) => {
  const { t } = useTranslation();

  const allTags: TagConfig[] = [];

  if ("instance_tags" in patient) {
    allTags.push(...patient.instance_tags);
  }

  if ("facility_tags" in patient && patient.facility_tags) {
    allTags.push(...patient.facility_tags);
  }

  if (allTags.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1 text-sm font-medium w-full",
        className,
      )}
    >
      {showLabel && <span className="text-gray-700">{t("patient_tags")}:</span>}
      <div className="flex flex-wrap gap-2 text-sm whitespace-nowrap">
        {allTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="capitalize"
            title={tag.description}
          >
            {getTagHierarchyDisplay(tag)}
          </Badge>
        ))}
      </div>
    </div>
  );
};
