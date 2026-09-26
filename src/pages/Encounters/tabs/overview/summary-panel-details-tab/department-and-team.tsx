import { SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { SummaryPanelEmptyState as EmptyState } from "./empty-state";

export const DepartmentsAndTeams = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    canWriteSelectedEncounter: canEdit,
    actions: { manageDepartments },
  } = useEncounter();

  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white">
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-gray-200 px-3 py-1">
        <span className="text-sm font-bold uppercase tracking-wide text-gray-600">
          {t("departments_and_teams")}
        </span>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={manageDepartments}>
            <SquarePen className="cursor-pointer" strokeWidth={1.5} />
          </Button>
        )}
      </div>
      <div className="space-y-2 p-3">
        {encounter.organizations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {encounter.organizations.map((org) => (
              <Badge key={org.id} variant="blue" className="capitalize">
                {org.name}
              </Badge>
            ))}
          </div>
        ) : (
          <EmptyState message={t("no_departments_and_teams")} />
        )}
      </div>
    </div>
  );
};
