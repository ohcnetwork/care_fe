import TagAssignmentSheet, {
  TagEntityType,
} from "@/components/Tags/TagAssignmentSheet";
import TagBadge from "@/components/Tags/TagBadge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PatientHoverCard } from "@/pages/Facility/services/serviceRequests/PatientHoverCard";
import {
  PatientListRead,
  PatientRead,
  PublicPatientRead,
} from "@/types/emr/patient/patient";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
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
        <CardHeader className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
          <div className="min-w-0 max-w-full">
            <PatientHoverCard patient={patient} facilityId={facilityId} />
          </div>
          {children && (
            <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:shrink-0">
              {children}
            </div>
          )}
        </CardHeader>
      </Card>
      <Card className="bg-white shadow-sm mx-3 rounded-md rounded-t-none rounded-b-md">
        <CardHeader className="px-3 py-2">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    hierarchyDisplay
                    variant="outline"
                  />
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-end sm:self-auto"
                >
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
