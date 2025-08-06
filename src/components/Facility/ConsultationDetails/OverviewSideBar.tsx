import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { NotebookPen, Plus, SquarePen } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CareTeamSheet } from "@/components/CareTeam/CareTeamSheet";
import { Avatar } from "@/components/Common/Avatar";
import { LocationSheet } from "@/components/Location/LocationSheet";
import { LocationTree } from "@/components/Location/LocationTree";
import { AccountSheetButton } from "@/components/Patient/AccountSheet";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";

import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";

import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import { StatusBadge } from "@/pages/Encounters/EncounterProperties";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import {
  ENCOUNTER_CLASS_ICONS,
  EncounterRead,
} from "@/types/emr/encounter/encounter";

interface Props {
  encounter: EncounterRead;
  canAccess: boolean;
  canEdit: boolean;
}

export default function SideOverview({ encounter, canEdit }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("details");

  return (
    <div className="w-72 flex flex-col gap-4">
      <div className="hidden md:block">
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-gray-100 justify-between border border-gray-200 -p-1">
              <TabsTrigger value="details" className="w-full">
                {t("details")}
              </TabsTrigger>
              <TabsTrigger value="actions" className="w-full">
                {t("actions")}
              </TabsTrigger>
              <TabsTrigger value="reports" className="w-full">
                {t("reports")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <RenderDetailsTab encounter={encounter} canEdit={canEdit} />
            </TabsContent>

            <TabsContent value="actions">
              <Actions encounter={encounter} canWrite={canEdit} />
            </TabsContent>

            <TabsContent value="reports">
              <Reports />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* <div className="flex flex-col gap-8 md:mt-6">
        <Separator className="bg-slate-200" />
        <Actions />
        {!readOnly && canEdit && <Questionnaires encounter={encounter} />}
        <Locations canEdit={canEdit} encounter={encounter} />
        <DepartmentsAndTeams canEdit={canEdit} encounter={encounter} />
        <div className="flex md:flex-col gap-0.5 items-center md:items-start">
          <span className="text-xs text-gray-600 w-32 md:w-auto">
            {t("hospital_identifier")}:{" "}
          </span>
          <span className="text-sm font-semibold">
            {encounter.external_identifier || "--"}
          </span>
        </div>
        <AuditLogs encounter={encounter} />
      </div> */}
    </div>
  );
}

export const RenderDetailsTab = ({
  encounter,
  canEdit,
}: {
  encounter: EncounterRead;
  canEdit: boolean;
}) => {
  const { t } = useTranslation();
  const { selectedEncounterId, currentEncounterId } = useEncounter();
  const readOnly = selectedEncounterId !== currentEncounterId;
  const queryClient = useQueryClient();
  const EncounterClassIcon = ENCOUNTER_CLASS_ICONS[encounter.encounter_class];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 border bg-gray-100 border-gray-200 rounded-md">
        <div className="flex items-center justify-between w-full p-2">
          <span className="font-semibold">{t("encounter_details")}</span>
          <SquarePen className="size-4" />
        </div>
        <div className="flex flex-wrap gap-2 justify-between bg-white w-full p-2 rounded-md mx-1">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t("status")}: </span>
            <div>
              <StatusBadge encounter={encounter} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {t("encounter_class")}:{" "}
            </span>
            <div>
              <Badge variant="teal" size="sm">
                <EncounterClassIcon className="size-3" />
                <span className="whitespace-nowrap">
                  {t(`encounter_class__${encounter.encounter_class}`)}
                </span>
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t("priority")}: </span>
            <div>
              <Badge variant="orange" size="sm">
                <span className="whitespace-nowrap">
                  {t(`encounter_priority__${encounter.priority}`)}
                </span>
              </Badge>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="hidden md:flex flex-col gap-1">
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t("start_date")}:
              </span>
              <div className="text-sm text-gray-950 font-semibold">
                {encounter.period.start ? (
                  <>
                    {format(encounter.period.start, "dd MMM yyyy")},
                    <div className="text-gray-600">
                      {format(encounter.period.start, "hh:mma")}
                    </div>
                  </>
                ) : (
                  <span>--({t("ongoing")})</span>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-1">
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t("end_date")}:
              </span>
              <div className="text-sm text-gray-950 font-semibold">
                {encounter.period.end ? (
                  <>
                    {format(encounter.period.end, "dd MMM yyyy")},
                    <div className="text-gray-600">
                      {format(encounter.period.end, "hh:mma")}
                    </div>
                  </>
                ) : (
                  <span>--({t("ongoing")})</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          size="lg"
          className="w-full bg-white border-1 border-gray-300 mx-1 mb-1"
        >
          <SquarePen className="size-3" />
          <span className="text-sm font-semibold text-gray-950">
            {t("update_details")}
          </span>
        </Button>
      </div>
      <div className="bg-gray-100 rounded-md">
        <div className="flex items-center justify-between w-full p-2">
          <span className="font-semibold">{t("encounter_tags")}</span>
          {canEdit && (
            <TagAssignmentSheet
              entityType="encounter"
              entityId={encounter.id}
              currentTags={encounter.tags}
              onUpdate={() => {
                queryClient.invalidateQueries({
                  queryKey: ["encounter", encounter.id],
                });
              }}
              trigger={
                <Button variant="ghost" size="xs">
                  <SquarePen />
                </Button>
              }
              canWrite={canEdit}
            />
          )}
        </div>
        <div className="flex flex-wrap bg-white w-full p-2 rounded-md mx-1 mb-1 gap-2">
          {encounter.tags.length > 0 ? (
            <>
              {encounter.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="capitalize"
                  title={tag.description}
                >
                  {tag.display}
                </Badge>
              ))}
            </>
          ) : (
            <p className="text-sm text-gray-500">{t("no_tags")}</p>
          )}
        </div>
      </div>
      <div className="bg-gray-100 rounded-md p-2">
        <div className="flex items-center justify-between w-full p-2">
          <span className="font-semibold">{t("forms")}</span>
          <Plus className="size-4" />
        </div>
        {!readOnly && canEdit && <Questionnaires encounter={encounter} />}
      </div>
      <div className="bg-gray-100 rounded-md w-full">
        <Locations canEdit={canEdit} encounter={encounter} />
      </div>
      <div className="bg-gray-100 rounded-md w-full">
        <ManageCareTeamButton />
      </div>
      <div className="bg-gray-100 rounded-md w-full">
        <DepartmentsAndTeams canEdit={canEdit} encounter={encounter} />
      </div>
      <div className="bg-gray-100 rounded-md w-full">
        <HospitalizationDetails encounter={encounter} />
      </div>
      <div className="bg-gray-100 rounded-md w-full">
        <Account encounter={encounter} canEdit={canEdit} />
      </div>
      <div>
        <AuditLogs encounter={encounter} />
      </div>
    </div>
  );
};

export const Actions = ({
  encounter,
  canWrite,
}: {
  encounter: EncounterRead;
  canWrite: boolean;
}) => {
  const { t } = useTranslation();
  const { selectedEncounterId, currentEncounterId } = useEncounter();
  const readOnly = selectedEncounterId !== currentEncounterId;

  return (
    <div>
      <h6 className="text-black font-semibold mb-2">{t("actions")}</h6>
      <div className="flex flex-col gap-2">
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

            <CareTeamSheet
              encounter={encounter}
              trigger={
                <Button variant="outline" className="justify-start">
                  <NotebookPen />
                  {t("manage_care_team")}
                </Button>
              }
              canWrite={canWrite}
            />
            <Locations
              encounter={encounter}
              actionsTab={true}
              canEdit={canWrite}
            />
            <DepartmentsAndTeams
              canEdit={canWrite}
              encounter={encounter}
              actionsTab={true}
            />
          </>
        )}
      </div>
    </div>
  );
};

const Reports = () => {
  const { selectedEncounterId } = useEncounter();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-black font-semibold">{t("reports")}</span>
      <Button
        variant="outline"
        className="justify-start"
        onClick={() => navigate(`../${selectedEncounterId}/treatment_summary`)}
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
        <div className="bg-gray-100 rounded-md">
          <div className="flex justify-between items-center p-2 w-full">
            <span className="text-black font-semibold">
              {canWrite ? t("manage_care_team") : t("view_care_team")}
            </span>
            <SquarePen className="size-4 cursor-pointer" />
          </div>
          <div className="bg-white p-2 rounded-md mx-1">
            {encounter.care_team.length > 0 ? (
              <div className="flex flex-col gap-1">
                {encounter.care_team.slice(0, 3).map((member, index) => (
                  <div
                    key={member.member.id}
                    className="flex items-center gap-2 p-2 rounded-md border border-gray-100 bg-gray-200/20"
                  >
                    <Avatar
                      key={member.member.id}
                      name={member.member.first_name}
                      imageUrl={member.member.profile_picture_url}
                      className="size-9 rounded-full"
                    />{" "}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium text-black text-sm">
                          {member.member.first_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {member.member.user_type}
                        </span>
                      </div>
                      {index === 0 && (
                        <Badge variant="primary" className="font-normal">
                          {t("primary")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {encounter.care_team.length > 3 && (
                  <span className="text-sm font-medium text-black underline">
                    +{encounter.care_team.length - 3} {t("members")}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t("no_care_team")}</p>
            )}
          </div>
        </div>
      }
      canWrite={canWrite}
    />
  );
};

const HospitalizationDetails = ({
  encounter,
}: {
  encounter: EncounterRead;
}) => {
  const { t } = useTranslation();

  return (
    <div className="py-3">
      <span className="text-black font-semibold p-3">
        {t("hospitalisation")}
      </span>
      <div className="flex flex-col gap-2 bg-white rounded-md mx-1">
        <div className="flex justify-between items-center p-2">
          <span className="text-black font-semibold">
            {t("hospitalisation")}
          </span>
          <Badge variant="blue">
            {encounter.hospitalization?.re_admission
              ? t("re_admission")
              : t("new_admission")}
          </Badge>
        </div>
        <div className="flex flex-row gap-2 bg-gray-100 rounded-md mx-3 mb-3 border border-gray-200">
          <div className="flex flex-col p-2">
            <span className="text-sm">{t("admission_source")}</span>
            <span className="text-sm text-black font-semibold">
              {t(
                encounter.hospitalization?.admit_source
                  ? `encounter_admit_sources__${encounter.hospitalization?.admit_source}`
                  : "encounter_admit_sources__other",
              )}
            </span>
          </div>
          <div className="flex flex-col p-2">
            <span className="text-sm">{t("diet_preference")}</span>
            <span className="text-sm text-black font-semibold">
              {t(
                encounter.hospitalization?.diet_preference
                  ? `encounter_diet_preference__${encounter.hospitalization?.diet_preference}`
                  : "encounter_diet_preference__none",
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Questionnaires = ({ encounter }: { encounter: EncounterRead }) => {
  const { t } = useTranslation();

  const questionnaireOptions = useQuestionnaireOptions("encounter_actions");

  return (
    <div>
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
        <Separator className="border-dashed border-gray-200 border-b-2" />
        <QuestionnaireSearch
          placeholder={t("choose_questionnaire")}
          subjectType="encounter"
        />
      </div>
    </div>
  );
};

export const Locations = ({
  encounter,
  actionsTab = false,
  canEdit,
}: {
  encounter: EncounterRead;
  actionsTab?: boolean;
  canEdit?: boolean;
}) => {
  const { t } = useTranslation();

  if (actionsTab) {
    return (
      <div>
        <LocationSheet
          facilityId={encounter.facility.id}
          history={encounter.location_history}
          encounter={encounter}
          trigger={
            <>
              {canEdit ? (
                <Button variant="outline" className="w-full justify-start">
                  <NotebookPen className="size-4" />
                  {t("update_location")}
                </Button>
              ) : (
                <></>
              )}
            </>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center p-2">
        <span className="text-black font-semibold">{t("location")}</span>
        <LocationSheet
          facilityId={encounter.facility.id}
          history={encounter.location_history}
          encounter={encounter}
          trigger={
            <div className="flex items-center gap-2 p-2">
              <CareIcon icon="l-history" className="text-gray-700" />
              <SquarePen className="size-4 cursor-pointer" />
            </div>
          }
        />
      </div>
      <div className="bg-white rounded-md p-2 mx-1">
        {encounter.current_location ? (
          <LocationTree location={encounter.current_location} />
        ) : (
          <p className="text-gray-500 text-sm">{t("no_location_associated")}</p>
        )}
      </div>
    </div>
  );
};

const DepartmentsAndTeams = ({
  canEdit,
  encounter,
  actionsTab = false,
}: {
  canEdit: boolean;
  encounter: EncounterRead;
  actionsTab?: boolean;
}) => {
  const { t } = useTranslation();

  if (actionsTab) {
    return (
      <div>
        <LinkDepartmentsSheet
          entityType="encounter"
          entityId={encounter.id}
          currentOrganizations={encounter.organizations}
          facilityId={encounter.facility.id}
          trigger={
            <Button variant="outline" className="w-full justify-start">
              <NotebookPen className="size-4" />
              {t("update_department")}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center p-2">
        <span className="text-black font-semibold mb-2">
          {t("departments_and_teams")}
        </span>
        {canEdit && (
          <LinkDepartmentsSheet
            entityType="encounter"
            entityId={encounter.id}
            currentOrganizations={encounter.organizations}
            facilityId={encounter.facility.id}
            trigger={<SquarePen className="size-4 cursor-pointer" />}
          />
        )}
      </div>
      <div className="space-y-2 bg-white rounded-lg p-2 mx-1">
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
      </div>
    </div>
  );
};

const AuditLogs = ({ encounter }: { encounter: EncounterRead }) => {
  const { t } = useTranslation();

  return (
    <div className=" p-2">
      <div className="space-y-2">
        <div>
          <p className="text-sm text-gray-500">{t("last_modified_by")}</p>
          <p className="text-sm font-semibold">
            {formatName(encounter.updated_by)}
          </p>
          <p className="text-xs text-gray-500">
            {formatDateTime(encounter.modified_date)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">{t("created_by")}</p>
          <p className="text-sm font-semibold">
            {formatName(encounter.created_by)}
          </p>
          <p className="text-xs text-gray-500">
            {formatDateTime(encounter.created_date)}
          </p>
        </div>
      </div>
    </div>
  );
};

const Account = ({
  encounter,
  canEdit,
}: {
  encounter: EncounterRead;
  canEdit: boolean;
}) => {
  const { t } = useTranslation();
  const { data: response } = useQuery({
    queryKey: ["accounts", encounter.patient.id],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId: encounter.facility.id },
      queryParams: {
        patient: encounter.patient.id,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
        limit: 1,
      },
    }),
    enabled: false,
  });
  return (
    <div>
      <div className="flex justify-between p-2 px-3">
        <span className="text-black font-semibold">{t("account")}:</span>
        <AccountSheetButton
          encounter={encounter}
          trigger={<SquarePen className="size-4 cursor-pointer" />}
          canWrite={canEdit}
        />
      </div>
      <div className="bg-white rounded-md p-3 mx-1 mt-1 mb-1">
        <div className="flex flex-row bg-gray-100 rounded-md p-3 border border-gray-200 justify-between">
          <span className="text-sm text-black font-semibold">
            {response?.results[0]?.name}
          </span>
          <Badge variant="green">{response?.results[0]?.status}</Badge>
        </div>
      </div>
    </div>
  );
};
