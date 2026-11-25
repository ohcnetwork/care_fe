import { Link } from "@tanstack/react-router";
import { ChevronRight, ClipboardList, FilePlus2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ResourceFormPicker } from "@/components/Questionnaire/ResourceFormPicker";

interface FacilityOverviewActionsProps {
  facilityId: string;
  disabled: boolean;
}

export function FacilityOverviewActions({
  facilityId,
  disabled,
}: FacilityOverviewActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="facility-forms-heading"
        data-cy="facility-forms"
      >
        <Card>
          <CardHeader className="border-b border-border p-4">
            <CardTitle>
              <h2 id="facility-forms-heading" className="text-sm font-semibold">
                {t("forms")}
              </h2>
            </CardTitle>
            <CardDescription>{t("facility_forms_description")}</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-2">
            <ResourceFormPicker
              facilityId={facilityId}
              subjectType="facility"
              subjectId={facilityId}
              disabled={disabled}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  disabled={disabled}
                  className="w-full justify-start whitespace-normal text-left font-normal tracking-normal"
                >
                  <FilePlus2 aria-hidden="true" />
                  {t("submit_forms")}
                  <ChevronRight className="ml-auto size-4" aria-hidden="true" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              className="w-full justify-start whitespace-normal text-left font-normal tracking-normal"
              asChild
            >
              <Link
                to="/facility/$facilityId/settings/responses"
                params={{ facilityId }}
              >
                <ClipboardList aria-hidden="true" />
                {t("responses")}
                <ChevronRight className="ml-auto size-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
