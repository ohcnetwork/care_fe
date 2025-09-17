import TagAssignmentSheet, {
  TagEntityType,
} from "@/components/Tags/TagAssignmentSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PatientHoverCard } from "@/pages/Facility/services/serviceRequests/PatientHoverCard";
import { PatientRead } from "@/types/emr/patient/patient";
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
  patient: PatientRead;
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
        <CardHeader className="pb-4 flex flex-row items-center justify-between px-2">
          <div className="space-y-4">
            <PatientHoverCard patient={patient} facilityId={facilityId} />
          </div>
          {children}
        </CardHeader>
      </Card>
      <Card className="bg-white shadow-sm mx-2 rounded-md rounded-t-none ">
        <CardHeader className="px-1 py-0 pt-2 md:pt-1">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <Badge key={t.id} variant="outline">
                  {getTagHierarchyDisplay(t)}
                </Badge>
              ))}
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
                    {t("manage_tags")}
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
