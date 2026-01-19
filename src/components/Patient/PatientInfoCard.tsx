import { PatientTagsDisplay } from "@/components/Patient/PatientTagsDisplay";
import TagAssignmentSheet, {
  TagEntityType,
} from "@/components/Tags/TagAssignmentSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PatientHoverCard } from "@/pages/Facility/services/serviceRequests/PatientHoverCard";
import {
  PatientListRead,
  PatientRead,
  PublicPatientRead,
} from "@/types/emr/patient/patient";
import {
  getTagHierarchyDisplay,
  TagConfig,
} from "@/types/emr/tagConfig/tagConfig";
import { SettingsIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export const PatientInfoCard = ({
  patient,
  tags,
  facilityId,
  onTagsUpdate,
  children,
  tagEntityType,
  tagEntityId,
}: {
  patient: PublicPatientRead | PatientListRead | PatientRead;
  tags: TagConfig[];
  facilityId: string;
  onTagsUpdate: () => void;
  children?: React.ReactNode;
  tagEntityType: TagEntityType;
  tagEntityId: string;
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Card className="bg-white shadow-sm rounded-md">
        <CardHeader className="pb-4 flex sm:flex-row items-center justify-between px-2">
          <div className="flex flex-col md:flex-row gap-4 xl:gap-8 xl:items-center">
            <PatientHoverCard patient={patient} facilityId={facilityId} />
            <div className="flex flex-wrap xl:gap-5 gap-2">
              {"instance_identifiers" in patient &&
                patient.instance_identifiers
                  ?.filter(({ config }) => !config.config.auto_maintained)
                  .map((identifier) => (
                    <div
                      key={identifier.config.id}
                      className="flex flex-col gap-1 items-start"
                    >
                      <span className="text-xs text-gray-700 md:w-auto">
                        {identifier.config.config.display}:{" "}
                      </span>
                      <span className="text-sm font-semibold">
                        {identifier.value}
                      </span>
                    </div>
                  ))}
              <PatientTagsDisplay patient={patient} />
            </div>
          </div>
          {children}
        </CardHeader>
      </Card>
      <Card className="bg-white shadow-sm mx-3 rounded-md rounded-t-none rounded-b-md">
        <CardHeader className="px-1 py-0 pt-2 md:pt-1">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {tags.length > 0 ? (
                tags.map((t) => (
                  <Badge key={t.id} variant="outline">
                    {getTagHierarchyDisplay(t)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500 px-2">
                  {t("no_tags_assigned")}
                </span>
              )}
            </div>

            <TagAssignmentSheet
              entityType={tagEntityType}
              entityId={tagEntityId}
              facilityId={facilityId}
              currentTags={tags}
              canWrite={true}
              onUpdate={() => {
                onTagsUpdate();
              }}
              trigger={
                <Button variant="ghost">
                  <SettingsIcon className=" text-gray-950" strokeWidth={1.5} />
                  <span className="font-semibold underline">
                    {tags.length === 0 ? t("add_tags") : t("manage_tags")}
                  </span>
                </Button>
              }
            />
          </div>
        </CardHeader>
      </Card>
    </>
  );
};
