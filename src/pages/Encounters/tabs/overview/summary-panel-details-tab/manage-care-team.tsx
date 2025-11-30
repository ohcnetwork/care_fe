import { SquarePen } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Avatar } from "@/components/Common/Avatar";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { EmptyState } from "./empty-state";

// Helper to build a full name from available fields
const buildFullName = (m: any) => {
  if (!m) return "";
  // Common fields: prefix, first_name, middle_name, last_name, suffix
  const prefix = (m.prefix || m.title || "").toString().trim();
  const first = (m.first_name || "").toString().trim();
  const middle = (m.middle_name || "").toString().trim();
  const last = (m.last_name || "").toString().trim();
  const suffix = (m.suffix || "").toString().trim();

  const nameParts = [prefix, first, middle, last].filter(Boolean);
  let full = nameParts.join(" ");
  if (suffix) {
    // append suffix with a comma if there's already a name
    full = full ? `${full}, ${suffix}` : suffix;
  }
  return full || m.username || m.email || ""; // fallback
};

export const ManageCareTeam = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    canWriteSelectedEncounter: canWrite,
    actions: { manageCareTeam },
  } = useEncounter();
  const [showAllMembers, setShowAllMembers] = useState(false);

  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <div className="bg-gray-100 rounded-md w-full border border-gray-200 p-1 pt-2 space-y-1">
      <div className="bg-gray-100 rounded-md">
        <div className="flex justify-between items-center w-full text-gray-950 pl-2">
          <span className=" font-semibold">
            {canWrite ? t("manage_care_team") : t("view_care_team")}
          </span>
          {canWrite && (
            <Button variant="ghost" size="sm" onClick={manageCareTeam}>
              <SquarePen className="cursor-pointer" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
      <div className="bg-white p-2 rounded-md shadow">
        {encounter.care_team.length > 0 ? (
          <div className="flex flex-col gap-1">
            {(showAllMembers
              ? encounter.care_team
              : encounter.care_team.slice(0, 3)
            ).map((member: any, index: number) => {
              const person = member.member || {};
              const fullName = buildFullName(person);

              return (
                <div
                  key={person.id ?? index}
                  className="flex items-center gap-2 p-2 rounded-md border border-gray-100 bg-gray-200/20"
                >
                  <Avatar
                    name={fullName || person.first_name}
                    imageUrl={person.profile_picture_url}
                    className="size-9 rounded-full border border-white shadow-sm"
                  />
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium text-black text-sm">
                        {fullName || person.first_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {member.role?.display}
                      </span>
                    </div>
                    {index === 0 && (
                      <Badge variant="primary" className="font-normal">
                        {t("primary")}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
            {encounter.care_team.length > 3 && !showAllMembers && (
              <div
                onClick={() => setShowAllMembers(true)}
                className="text-sm font-medium text-black underline cursor-pointer p-1"
              >
                <span>
                  +{encounter.care_team.length - 3} {t("members")}
                </span>
              </div>
            )}
            {encounter.care_team.length > 3 && showAllMembers && (
              <div
                onClick={() => setShowAllMembers(false)}
                className="text-sm font-medium text-black underline cursor-pointer p-1"
              >
                <span>{t("show_less")}</span>
              </div>
            )}
          </div>
        ) : (
          <EmptyState message={t("no_care_team")} />
        )}
      </div>
    </div>
  );
};
