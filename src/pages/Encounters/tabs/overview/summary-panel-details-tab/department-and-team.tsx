import { SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { EmptyState } from "./empty-state";

export const DepartmentsAndTeams = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    canWriteSelectedEncounter: canEdit,
    actions: { manageDepartments },
  } = useEncounter();

  if (!encounter) return null;

  return (
    <div className="bg-gray-100 rounded-md w-full border border-gray-200">
      <div className="flex justify-between items-center px-3 py-1 text-gray-950">
        <span className=" font-semibold">{t("departments_and_teams")}</span>
        {canEdit && (
          <Button variant="ghost" size="icon" onClick={manageDepartments}>
            <SquarePen className="size-4 cursor-pointer" strokeWidth={1.5} />
          </Button>
        )}
      </div>
      <div className="space-y-2 bg-white rounded-lg p-2 mx-1 mb-1 shadow">
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
