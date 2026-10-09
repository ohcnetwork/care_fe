import { SquarePen } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Avatar } from "@/components/Common/Avatar";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { formatName } from "@/Utils/utils";

import { SummaryPanelEmptyState as EmptyState } from "./empty-state";

interface ManageCareTeamProps {
  title?: string;
}

export const ManageCareTeam = ({ title }: ManageCareTeamProps = {}) => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    canWriteSelectedEncounter: canWrite,
    actions: { manageCareTeam },
  } = useEncounter();
  const [showAllMembers, setShowAllMembers] = useState(false);

  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <section
      aria-label={
        title ?? (canWrite ? t("manage_care_team") : t("view_care_team"))
      }
      className="min-w-0 w-full rounded-xl border border-gray-200 bg-white"
    >
      <div>
        <div className="flex min-h-11 items-center justify-between gap-2 border-b border-gray-200 px-3 py-1">
          <span className="min-w-0 [overflow-wrap:anywhere] text-sm font-bold uppercase tracking-wide text-gray-600">
            {title ?? (canWrite ? t("manage_care_team") : t("view_care_team"))}
          </span>
          {canWrite && (
            <Button
              variant="ghost"
              size="sm"
              onClick={manageCareTeam}
              className="shrink-0"
              aria-label={t("manage_care_team")}
            >
              <SquarePen className="cursor-pointer" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
      <div className="p-3">
        {encounter.care_team.length > 0 ? (
          <div className="flex flex-col gap-1">
            {(showAllMembers
              ? encounter.care_team
              : encounter.care_team.slice(0, 3)
            ).map((member, index) => (
              <div
                key={member.member.id}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2"
              >
                <Avatar
                  key={member.member.id}
                  name={formatName(member.member, true)}
                  imageUrl={member.member.profile_picture_url}
                  className="size-9 shrink-0 rounded-full border border-white shadow-sm"
                />{" "}
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-col [overflow-wrap:anywhere]">
                    <span className="font-medium text-black text-sm">
                      {formatName(member.member)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {member.role.display}
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
            {encounter.care_team.length > 3 && !showAllMembers && (
              <button
                type="button"
                onClick={() => setShowAllMembers(true)}
                className="text-left text-sm font-medium text-black underline cursor-pointer p-1"
              >
                <span>
                  +{encounter.care_team.length - 3} {t("members")}
                </span>
              </button>
            )}
            {encounter.care_team.length > 3 && showAllMembers && (
              <button
                type="button"
                onClick={() => setShowAllMembers(false)}
                className="text-left text-sm font-medium text-black underline cursor-pointer p-1"
              >
                <span>{t("show_less")}</span>
              </button>
            )}
          </div>
        ) : (
          <EmptyState message={t("no_care_team")} />
        )}
      </div>
    </section>
  );
};
