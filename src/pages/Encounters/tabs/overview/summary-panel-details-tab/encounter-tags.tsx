import { useQueryClient } from "@tanstack/react-query";
import { SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";

import { EmptyState } from "./empty-state";

export const EncounterTags = () => {
  const { canWriteSelectedEncounter: canEdit, selectedEncounter: encounter } =
    useEncounter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <div className="bg-gray-100 rounded-md border border-gray-200 p-1 pt-2 space-y-1">
      <div className="flex items-center justify-between w-full pl-2">
        <span className="font-semibold text-gray-950">
          {t("encounter_tags")}
        </span>
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
              <Button variant="ghost" size="sm">
                <SquarePen className=" text-gray-950" strokeWidth={1.5} />
              </Button>
            }
            canWrite={canEdit}
          />
        )}
      </div>
      <div className="flex flex-wrap bg-white w-full p-2 rounded-md gap-2 shadow">
        {encounter.tags.length > 0 ? (
          <>
            {encounter.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="capitalize"
                title={tag.description}
              >
                {getTagHierarchyDisplay(tag)}
              </Badge>
            ))}
          </>
        ) : (
          <EmptyState message={t("no_tags")} />
        )}
      </div>
    </div>
  );
};
