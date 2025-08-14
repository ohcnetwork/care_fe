import { SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { EmptyState } from "./empty-state";

export const DepartmentsAndTeams = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    canWriteSelectedEncounter: canEdit,
    actions: { manageDepartments },
  } = useEncounter();

  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <div className="bg-gray-100 rounded-md w-full border border-gray-200 pt-2 p-1 space-y-1">
      <div className="flex justify-between items-center pl-2 text-gray-950">
        <span className=" font-semibold">{t("departments_and_teams")}</span>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={manageDepartments}>
            <SquarePen className="cursor-pointer" strokeWidth={1.5} />
          </Button>
        )}
      </div>
      <div className="space-y-2 bg-white rounded-md p-2 shadow">
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
