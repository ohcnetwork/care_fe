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
import { Pencil, SettingsIcon } from "lucide-react";
import { Link } from "raviger";
interface PatientInfoCardProps {
  patient: PublicPatientRead | PatientListRead | PatientRead;
  tags: TagConfig[];
  facilityId: string;
  onTagsUpdate: () => void;
  children?: React.ReactNode;
  tagEntityType: TagEntityType;
  tagEntityId: string;
  editUrl?: string;
}

export const PatientInfoCard = ({
  patient,
  tags,
  facilityId,
  onTagsUpdate,
  children,
  tagEntityType,
  tagEntityId,
  editUrl,
}: PatientInfoCardProps) => {
  const { t } = useTranslation();
  return (
    <>
      <Card className="bg-white shadow-sm rounded-md">
        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <PatientHoverCard patient={patient} facilityId={facilityId} />
            {editUrl && (
              <Button asChild variant="outline" size="sm">
                <Link href={editUrl}>
                  <Pencil className="h-4 w-4 mr-1" />
                  {t("edit")}
                </Link>
              </Button>
            )}
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
