import { FilePlus2 } from "lucide-react";
import { navigate } from "raviger";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";
import { ResourceResponseSubjectType } from "@/components/Questionnaire/ResourceResponses/types";

interface ResourceFormPickerProps {
  facilityId: string;
  subjectType: ResourceResponseSubjectType;
  subjectId: string;
  trigger?: ReactNode;
  disabled?: boolean;
}

export function ResourceFormPicker({
  facilityId,
  subjectType,
  subjectId,
  trigger,
  disabled = false,
}: ResourceFormPickerProps) {
  const { t } = useTranslation();
  const baseUrl =
    subjectType === "facility"
      ? `/facility/${facilityId}/settings`
      : subjectType === "location"
        ? `/facility/${facilityId}/locations/${subjectId}`
        : `/facility/${facilityId}/settings/devices/${subjectId}`;

  return (
    <QuestionnaireSearch
      appearance="careui"
      facilityId={facilityId}
      subjectType={subjectType}
      disabled={disabled}
      onSelect={(questionnaire) =>
        navigate(`${baseUrl}/questionnaire/${questionnaire.id}`)
      }
      trigger={
        trigger ?? (
          <Button
            type="button"
            disabled={disabled}
            className="h-12 border border-emerald-950 bg-emerald-800 text-white shadow-md hover:bg-emerald-900 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10 [&_svg]:size-5"
          >
            <FilePlus2 className="size-4" />
            {t("submit_forms")}
          </Button>
        )
      }
    />
  );
}
