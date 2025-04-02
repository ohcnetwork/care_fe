import { Link, navigate, usePathParams } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import EncounterActions from "@/components/Encounter/EncounterActions";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";

import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";

import { stringifyNestedObject } from "@/Utils/utils";
import { Encounter } from "@/types/emr/encounter";

interface QuickAccessProps {
  encounter: Encounter;
  canEdit: boolean;
}

export default function QuickAccess({ encounter, canEdit }: QuickAccessProps) {
  const { t } = useTranslation();
  const questionnaireOptions = useQuestionnaireOptions(
    "encounter_actions",
    canEdit,
  );
  const subpathMatch = usePathParams("/facility/:facilityId/*");
  const facilityId = subpathMatch?.facilityId;

  return (
    <div className="flex flex-col gap-6">
      {/* Questionnaire Section */}
      {canEdit && facilityId && (
        <section className="space-y-2 p-2">
          <h3 className="text-lg font-semibold mb-3">
            {t("questionnaire_one")}
          </h3>
          <div className="space-y-3 p-2 font-semibold">
            {questionnaireOptions.map((option) => (
              <Link
                key={option.slug}
                href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/${option.slug}`}
                className="flex items-center gap-2 text-sm hover:text-gray-500 text-gray-900"
                data-cy="update-encounter-option"
              >
                <CareIcon icon="l-file-alt" className="size-4 text-gray-950" />
                {t(option.title)}
              </Link>
            ))}
          </div>
          <QuestionnaireSearch
            placeholder={t("choose_questionnaire")}
            subjectType="encounter"
            onSelect={(selected) =>
              navigate(
                `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/${selected.slug}`,
              )
            }
          />
          <div className="w-full border-t border-dashed border-gray-300" />
        </section>
      )}

      {/* Encounter Actions */}
      <section>
        <h3 className="text-lg font-medium text-gray-950 mb-1">
          {t("actions")}
        </h3>

        <EncounterActions encounter={encounter} />
      </section>

      {/* Departments and Teams */}
      <section>
        <div className="items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-950 mb-1">
            {t("departments_and_teams")}
          </h3>
          <LinkDepartmentsSheet
            entityType="encounter"
            entityId={encounter.id}
            currentOrganizations={encounter.organizations}
            facilityId={encounter.facility.id}
            trigger={
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  // onClick={onDepartmentUpdate}
                  className="text-sm font-semibold border-gray-400 text-gray-950"
                >
                  {t("update_department")}
                  <CareIcon icon="l-plus" className="ml-1 size-3" />
                </Button>
              </div>
            }
          />
        </div>
        <div className="flex flex-wrap gap-2 bg-gray-50 p-2 rounded-md">
          <LinkDepartmentsSheet
            entityType="encounter"
            entityId={encounter.id}
            currentOrganizations={encounter.organizations}
            facilityId={encounter.facility.id}
            trigger={
              <div className="flex flex-wrap gap-2 ">
                {encounter.organizations.length > 0
                  ? encounter.organizations.map((org) => (
                      <Badge
                        key={org.id}
                        className="bg-indigo-100 text-indigo-800 font-medium cursor-pointer text-sm "
                        variant="outline"
                        title={`Organization: ${org.name}${org.description ? ` - ${org.description}` : ""}`}
                      >
                        {stringifyNestedObject(org)}
                      </Badge>
                    ))
                  : t("no_organization_added_yet", { count: 0 })}
              </div>
            }
          />
        </div>
      </section>

      {encounter.hospitalization?.admit_source && (
        <>
          <div className="w-full border-t border-dashed border-gray-300" />

          {/* Hospitalisation Details */}
          <section>
            <h3 className="text-lg font-medium mb-3">
              {t("hospitalisation_details")}
            </h3>
            <div className="space-y-2 text-sm mt-4 bg-gray-50 p-2 rounded-md">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("admit_source")}</span>
                <span className="font-semibold text-gray-950">
                  {t(
                    `encounter_admit_sources__${encounter.hospitalization?.admit_source}`,
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("diet_preference")}</span>
                <span className="font-semibold text-gray-950">
                  {t(
                    `encounter_diet_preference__${encounter.hospitalization?.diet_preference}`,
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("re_admission")}</span>
                <span className="font-semibold text-gray-950">
                  {t(
                    `encounter_re_admission__${encounter.hospitalization?.re_admission}`,
                  )}
                </span>
              </div>
              <Button
                asChild
                variant="outline"
                className="font-semibold rounded-md border-gray-400 text-gray-950"
              >
                <Link
                  href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/encounter`}
                >
                  {t("update_hospitalisation_details")}
                </Link>
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
