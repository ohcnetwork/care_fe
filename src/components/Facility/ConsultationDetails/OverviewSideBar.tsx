import { Building, EditIcon, NotebookPen } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { CareTeamSheet } from "@/components/CareTeam/CareTeamSheet";
import { LocationSheet } from "@/components/Location/LocationSheet";
import { LocationTree } from "@/components/Location/LocationTree";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";

import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";

import { formatDateTime, formatName } from "@/Utils/utils";
import EncounterProperties from "@/pages/Encounters/EncounterProperties";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { Encounter } from "@/types/emr/encounter/encounter";

interface Props {
  encounter: Encounter;
  canAccess: boolean;
  canEdit: boolean;
}

export default function SideOverview({ encounter, canEdit }: Props) {
  const { selectedEncounterId, currentEncounterId } = useEncounter();
  const readOnly = selectedEncounterId !== currentEncounterId;

  return (
    <div className="w-full md:max-w-[18rem] flex flex-col gap-4">
      <div className="hidden md:block">
        <EncounterProperties encounter={encounter} canEdit={canEdit} />
      </div>
      <div className="flex flex-col gap-8 md:mt-6">
        <Separator className="bg-slate-200" />
        <Actions />
        {!readOnly && canEdit && <Questionnaires encounter={encounter} />}
        <Locations canEdit={canEdit} encounter={encounter} />
        <DepartmentsAndTeams canEdit={canEdit} encounter={encounter} />
        <AuditLogs encounter={encounter} />
      </div>
    </div>
  );
}

const Actions = () => {
  const { t } = useTranslation();
  const { selectedEncounterId, currentEncounterId } = useEncounter();
  const readOnly = selectedEncounterId !== currentEncounterId;

  return (
    <div>
      <h6 className="text-black font-semibold mb-2">{t("actions")}</h6>
      <div className="flex flex-col gap-3">
        {!readOnly && (
          <>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("consents")}
            >
              <NotebookPen />
              {t("manage_consents")}
            </Button>

            <ManageCareTeamButton />
          </>
        )}

        <Button
          variant="outline"
          className="justify-start"
          onClick={() =>
            navigate(`../${selectedEncounterId}/treatment_summary`)
          }
        >
          <NotebookPen />
          {t("treatment_summary")}
        </Button>
        <Button
          variant="outline"
          className="justify-start"
          onClick={() =>
            navigate("files", {
              query: {
                file: "discharge_summary",
                selectedEncounter: selectedEncounterId,
              },
            })
          }
        >
          <NotebookPen />
          {t("discharge_summary")}
        </Button>
      </div>
    </div>
  );
};

const ManageCareTeamButton = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    selectedEncounterPermissions: { canWriteEncounter: canWrite },
  } = useEncounter();

  if (!encounter) {
    return (
      <Button disabled variant="outline" className="justify-start">
        <NotebookPen />
        {t("manage_care_team")}
      </Button>
    );
  }

  return (
    <CareTeamSheet
      encounter={encounter}
      trigger={
        <Button variant="outline" className="justify-start">
          <NotebookPen />
          {canWrite ? t("manage_care_team") : t("view_care_team")}
        </Button>
      }
      canWrite={canWrite}
    />
  );
};

const Questionnaires = ({ encounter }: { encounter: Encounter }) => {
  const { t } = useTranslation();

  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");

  return (
    <div>
      <h6 className="text-black font-semibold mb-2">{t("questionnaire")}</h6>
      <div className="flex flex-col gap-3">
        {questionnaireOptions.map((option) => (
          <Button
            key={option.slug}
            variant="outline"
            className="justify-start text-left"
            title={option.title}
            onClick={() =>
              navigate(
                `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/${option.slug}`,
              )
            }
          >
            <NotebookPen />
            <span className="truncate">{option.title}</span>
          </Button>
        ))}
        <QuestionnaireSearch
          placeholder={t("choose_questionnaire")}
          subjectType="encounter"
        />
      </div>
    </div>
  );
};

const Locations = ({
  canEdit,
  encounter,
}: {
  canEdit: boolean;
  encounter: Encounter;
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex justify-between items-center">
        <h6 className="text-black font-semibold mb-2">{t("location")}</h6>
        <LocationSheet
          facilityId={encounter.facility.id}
          history={encounter.location_history}
          encounter={encounter}
          trigger={
            <Button
              variant="link"
              className="text-gray-950 underline font-semibold underline-offset-2"
            >
              <CareIcon icon="l-history" className="text-gray-700" />
              {t("history")}
            </Button>
          }
        />
      </div>
      <div className="bg-gray-100 border border-gray-200 rounded-lg mt-2 p-2">
        {encounter.current_location ? (
          <LocationTree location={encounter.current_location} />
        ) : (
          <p className="text-gray-500 text-sm">{t("no_location_associated")}</p>
        )}
        {canEdit && (
          <LocationSheet
            facilityId={encounter.facility.id}
            history={encounter.location_history}
            encounter={encounter}
            trigger={
              <Button variant="outline" className="w-full mt-3">
                <EditIcon className="size-4" />
                {encounter.current_location
                  ? t("update_location")
                  : t("add_location")}
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};

const DepartmentsAndTeams = ({
  canEdit,
  encounter,
}: {
  canEdit: boolean;
  encounter: Encounter;
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <h6 className="text-black font-semibold mb-2">
        {t("departments_and_teams")}
      </h6>
      <div className="space-y-2 bg-gray-100 border border-gray-200 rounded-lg mt-2 p-2">
        {encounter.organizations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {encounter.organizations.map((org) => (
              <Badge key={org.id} variant="blue" className="capitalize">
                {org.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {t("no_departments_assigned")}
          </p>
        )}
        {canEdit && (
          <LinkDepartmentsSheet
            entityType="encounter"
            entityId={encounter.id}
            currentOrganizations={encounter.organizations}
            facilityId={encounter.facility.id}
            trigger={
              <Button variant="outline" className="w-full">
                <Building className="size-4 mr-2" />
                {t("update_department")}
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};

const AuditLogs = ({ encounter }: { encounter: Encounter }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-100 border border-gray-200 rounded-lg p-2">
      <div className="space-y-2">
        <div>
          <p className="text-sm text-gray-500">{t("created_by")}</p>
          <p className="text-sm">{formatName(encounter.created_by)}</p>
          <p className="text-xs text-gray-500">
            {formatDateTime(encounter.created_date)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">{t("last_modified_by")}</p>
          <p className="text-sm">{formatName(encounter.updated_by)}</p>
          <p className="text-xs text-gray-500">
            {formatDateTime(encounter.modified_date)}
          </p>
        </div>
      </div>
    </div>
  );
};
