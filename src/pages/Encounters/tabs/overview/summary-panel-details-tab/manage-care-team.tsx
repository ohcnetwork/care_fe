import { SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { CareTeamSheet } from "@/components/CareTeam/CareTeamSheet";
import { Avatar } from "@/components/Common/Avatar";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { EmptyState } from "./empty-state";

export const ManageCareTeam = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    selectedEncounterPermissions: { canWriteEncounter: canWrite },
  } = useEncounter();

  if (!encounter) {
    return null;
  }

  return (
    <div className="bg-gray-100 rounded-md w-full border border-gray-200">
      <CareTeamSheet
        encounter={encounter}
        trigger={
          <div className="bg-gray-100 rounded-md">
            <div className="flex justify-between items-center p-2 w-full text-gray-950 pt-3 pr-3">
              <span className=" font-semibold pl-1">
                {canWrite ? t("manage_care_team") : t("view_care_team")}
              </span>
              <SquarePen className="size-4 cursor-pointer" strokeWidth={1.5} />
            </div>
            <div className="bg-white p-2 rounded-md mx-1 mb-1 shadow">
              {encounter.care_team.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {encounter.care_team.slice(0, 3).map((member, index) => (
                    <div
                      key={member.member.id}
                      className="flex items-center gap-2 p-2 rounded-md border border-gray-100 bg-gray-200/20"
                    >
                      <Avatar
                        key={member.member.id}
                        name={member.member.first_name}
                        imageUrl={member.member.profile_picture_url}
                        className="size-9 rounded-full"
                      />{" "}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                          <span className="font-medium text-black text-sm">
                            {member.member.first_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {member.member.user_type}
                          </span>
                        </div>
                        {index === 0 && (
                          <Badge variant="primary" className="font-normal">
                            {t("primary")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {encounter.care_team.length > 3 && (
                    <span className="text-sm font-medium text-black underline">
                      +{encounter.care_team.length - 3} {t("members")}
                    </span>
                  )}
                </div>
              ) : (
                <EmptyState message={t("no_care_team")} />
              )}
            </div>
          </div>
        }
        canWrite={canWrite}
      />
    </div>
  );
};
