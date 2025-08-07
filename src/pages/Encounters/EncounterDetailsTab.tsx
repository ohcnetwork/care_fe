import { format } from "date-fns";
import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar } from "@/components/Common/Avatar";
import { Actions } from "@/components/Facility/ConsultationDetails/OverviewSideBar";

import {
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_PRIORITY_COLORS,
  ENCOUNTER_STATUS_COLORS,
  ENCOUNTER_STATUS_ICONS,
  EncounterRead,
} from "@/types/emr/encounter/encounter";

interface EncounterDetailsTabProps {
  encounter: EncounterRead;
  canEdit: boolean;
  onUpdateDetails?: () => void;
}

export default function EncounterDetailsTab({
  canEdit,
  encounter,
}: EncounterDetailsTabProps) {
  const { t } = useTranslation();

  const EncounterClassIcon = ENCOUNTER_CLASS_ICONS[encounter.encounter_class];

  const renderDetailsTab = () => (
    <div className="flex flex-col p-3 bg-white -mt-1 rounded-lg gap-4">
      <div className="flex flex-row gap-14">
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("status")}:
            </span>
            <div>
              <Badge variant={ENCOUNTER_STATUS_COLORS[encounter.status]}>
                {React.createElement(ENCOUNTER_STATUS_ICONS[encounter.status], {
                  className: "size-4",
                })}
                {t(`encounter_status__${encounter.status}`)}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("encounter_class")}:
            </span>
            <div>
              <Badge
                variant={ENCOUNTER_CLASSES_COLORS[encounter.encounter_class]}
              >
                <EncounterClassIcon className="size-3" />
                <span className="whitespace-nowrap">
                  {t(`encounter_class__${encounter.encounter_class}`)}
                </span>
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("location")}:
            </span>
            <div>
              <Badge
                variant="secondary"
                className="inline-flex items-center gap-1.5"
              >
                <CareIcon icon="l-location-point" className="size-3" />
                {encounter.current_location?.name || t("none")}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("priority")}:
            </span>
            <div>
              <Badge variant={ENCOUNTER_PRIORITY_COLORS[encounter.priority]}>
                <CareIcon icon="l-upload" className="size-3" />
                {t(`encounter_priority__${encounter.priority}`)}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("dep_and_teams")}:
            </span>
            <div className="flex flex-wrap gap-2">
              {encounter.organizations.length > 0 ? (
                <>
                  {encounter.organizations.map((org) => (
                    <Badge key={org.id} variant="blue" className="capitalize">
                      {org.name}
                    </Badge>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  {t("no_departments_assigned")}
                </p>
              )}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("hospitalisation")}:
            </span>
            <div>
              <Badge variant="blue">Re-admission</Badge>
            </div>
          </div>
        </div>
      </div>
      <div>
        <span className="text-sm font-medium text-gray-700">
          {t("encounter_tags")}:
        </span>
        <div className="flex flex-wrap gap-2">
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
      <Separator />
      <div className="flex flex-row -mt-2 gap-5">
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("start_date")}:
            </span>
            <div className="text-sm text-gray-950 font-semibold">
              {encounter.period.start
                ? format(encounter.period.start, "dd MMM yyyy hh:mma")
                : ""}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("hospital_identifier")}
            </span>
            <div className="text-sm text-gray-950 font-semibold">
              {encounter.external_identifier || "--"}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("account")}:
            </span>
            <div className="text-sm text-gray-950 font-semibold">
              {encounter.external_identifier || "BILL-ENC-78934"}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("end_date")}:
            </span>
            <div className="text-sm text-gray-950 font-semibold">
              {encounter.period.end
                ? format(encounter.period.end, "dd MMM yyyy hh:mma")
                : "(Ongoing)"}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("patient_id_abha")}:
            </span>
            <div className="text-sm text-gray-950 font-semibold">--</div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">
              {t("care_team")}:
            </span>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {encounter.care_team.slice(0, 3).map((member) => (
                  <Avatar
                    key={member.member.id}
                    name={member.member.first_name}
                    imageUrl={member.member.profile_picture_url}
                    className="size-8 rounded-full"
                  />
                ))}
              </div>
              {encounter.care_team.length > 3 && (
                <span className="text-sm font-medium text-gray-600">
                  +{encounter.care_team.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-gray-100 p-2 border border-gray-200 rounded-md mb-2">
      <Tabs defaultValue="details">
        <TabsList className="bg-gray-200 justify-between">
          <TabsTrigger value="details" className="w-full p-4">
            {t("details")}
          </TabsTrigger>
          <TabsTrigger value="actions" className="w-full p-4">
            {t("actions")}
          </TabsTrigger>
          <TabsTrigger value="reports" className="w-full p-4">
            {t("reports")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          {renderDetailsTab()}
          <Button variant="outline" size="lg" className="w-full mt-2">
            <CareIcon icon="l-edit" className="size-3" />
            <span className="text-sm font-semibold text-gray-950">
              {t("update_details")}
            </span>
          </Button>
        </TabsContent>

        <TabsContent value="actions">
          <Actions encounter={encounter} canWrite={canEdit} />
        </TabsContent>

        <TabsContent value="reports">
          <Actions encounter={encounter} canWrite={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
