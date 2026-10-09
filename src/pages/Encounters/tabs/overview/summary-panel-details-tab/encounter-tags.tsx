import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import TagBadge from "@/components/Tags/TagBadge";
import { Button } from "@/components/ui/button";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { useQueryClient } from "@tanstack/react-query";
import { SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SummaryPanelEmptyState as EmptyState } from "./empty-state";

interface EncounterTagsProps {
  title?: string;
}

export const EncounterTags = ({ title }: EncounterTagsProps = {}) => {
  const { canWriteSelectedEncounter: canEdit, selectedEncounter: encounter } =
    useEncounter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <section
      aria-label={title ?? t("encounter_tags")}
      className="min-w-0 w-full rounded-xl border border-gray-200 bg-white"
    >
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-gray-200 px-3 py-1">
        <span className="min-w-0 [overflow-wrap:anywhere] text-sm font-bold uppercase tracking-wide text-gray-600">
          {title ?? t("encounter_tags")}
        </span>
        {canEdit && (
          <TagAssignmentSheet
            entityType="encounter"
            entityId={encounter.id}
            facilityId={encounter.facility.id}
            currentTags={encounter.tags}
            onUpdate={() => {
              queryClient.invalidateQueries({
                queryKey: ["encounter", encounter.id],
              });
            }}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                aria-label={t("edit")}
              >
                <SquarePen className=" text-gray-950" strokeWidth={1.5} />
              </Button>
            }
            canWrite={canEdit}
          />
        )}
      </div>
      <div className="flex w-full flex-wrap gap-2 p-3">
        {encounter.tags.length > 0 ? (
          <>
            {encounter.tags.map((tag) => (
              <TagBadge
                key={tag.id}
                tag={tag}
                hierarchyDisplay
                className="max-w-full whitespace-normal [overflow-wrap:anywhere]"
              />
            ))}
          </>
        ) : (
          <EmptyState message={t("no_tags")} />
        )}
      </div>
    </section>
  );
};
