import { NotebookPen, SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";

import { EncounterRead } from "@/types/emr/encounter/encounter";

export const DepartmentsAndTeams = ({
  canEdit,
  encounter,
  actionsTab = false,
}: {
  canEdit: boolean;
  encounter: EncounterRead;
  actionsTab?: boolean;
}) => {
  const { t } = useTranslation();

  if (actionsTab) {
    return (
      <div>
        <LinkDepartmentsSheet
          entityType="encounter"
          entityId={encounter.id}
          currentOrganizations={encounter.organizations}
          facilityId={encounter.facility.id}
          trigger={
            <Button variant="outline" className="w-full justify-start">
              <NotebookPen className="size-4" />
              {t("update_department")}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center p-2">
        <span className="text-black font-semibold mb-2">
          {t("departments_and_teams")}
        </span>
        {canEdit && (
          <LinkDepartmentsSheet
            entityType="encounter"
            entityId={encounter.id}
            currentOrganizations={encounter.organizations}
            facilityId={encounter.facility.id}
            trigger={<SquarePen className="size-4 cursor-pointer" />}
          />
        )}
      </div>
      <div className="space-y-2 bg-white rounded-lg p-2 mx-1">
        {encounter.organizations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {encounter.organizations.map((org) => (
              <Badge key={org.id} variant="blue" className="capitalize">
                {org.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {t("no_departments_assigned")}
          </p>
        )}
      </div>
    </div>
  );
};
