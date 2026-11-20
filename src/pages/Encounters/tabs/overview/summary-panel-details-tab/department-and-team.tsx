import { SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { SummaryPanelEmptyState as EmptyState } from "./empty-state";

interface DepartmentsAndTeamsProps {
  title?: string;
}

export const DepartmentsAndTeams = ({
  title,
}: DepartmentsAndTeamsProps = {}) => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    canWriteSelectedEncounter: canEdit,
    actions: { manageDepartments },
  } = useEncounter();

  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <section
      aria-label={title ?? t("departments_and_teams")}
      className="min-w-0 w-full rounded-xl border border-gray-200 bg-white"
    >
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-gray-200 px-3 py-1">
        <span className="min-w-0 [overflow-wrap:anywhere] text-sm font-bold uppercase tracking-wide text-gray-600">
          {title ?? t("departments_and_teams")}
        </span>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={manageDepartments}
            className="shrink-0"
            aria-label={t("update_department")}
          >
            <SquarePen className="cursor-pointer" strokeWidth={1.5} />
          </Button>
        )}
      </div>
      <div className="space-y-2 p-3">
        {encounter.organizations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {encounter.organizations.map((org) => (
              <Badge
                key={org.id}
                variant="blue"
                className="max-w-full whitespace-normal capitalize [overflow-wrap:anywhere]"
              >
                {org.name}
              </Badge>
            ))}
          </div>
        ) : (
          <EmptyState message={t("no_departments_and_teams")} />
        )}
      </div>
    </section>
  );
};
