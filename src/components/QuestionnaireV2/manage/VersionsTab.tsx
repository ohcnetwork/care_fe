import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";

import { cn } from "@/lib/utils";

import {
  QUESTIONNAIRE_STATUS_COLORS,
  QuestionnaireRead,
  QuestionnaireScope,
  formatRevision,
  revisionOf,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import query from "@/Utils/request/query";
import { relativeTime } from "@/Utils/utils";

interface VersionsTabProps {
  scope: QuestionnaireScope;
  questionnaire: QuestionnaireRead;
}

/** Left-rail dot with connector segments above and below, so consecutive
 *  nodes read as one continuous timeline. The dot sits ~centred against its
 *  card rather than level with the card's top corner. */
function TimelineRail({
  current,
  isFirst,
  isLast,
}: {
  current: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex w-5 shrink-0 flex-col items-center">
      <span
        className={cn("h-8 w-px", isFirst ? "bg-transparent" : "bg-gray-200")}
      />
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          current ? "bg-primary" : "bg-gray-300",
        )}
      />
      {!isLast && <span className="w-px flex-1 bg-gray-200" />}
    </div>
  );
}

export function VersionsTab({ scope, questionnaire }: VersionsTabProps) {
  const { t } = useTranslation();

  const { data: revisions, isLoading } = useQuery({
    queryKey: questionnaireKeys.revisions(questionnaire.id),
    queryFn: query(questionnaireApi.list, {
      // Backend gap: the revisions list has no way to request "all of them"
      // — pass a generously large page size so questionnaires with a long
      // history don't silently lose older versions off the end of the
      // default page. The count-vs-length check below surfaces the rest.
      queryParams: { parent_revision: questionnaire.id, limit: 100 },
    }),
  });

  // `revisionOf` shares its `?? 1` fallback with `formatRevision`, so the
  // sort order and the printed version numbers never disagree.
  const pastRevisions = [...(revisions?.results ?? [])].sort(
    (a, b) => revisionOf(b) - revisionOf(a),
  );
  const totalRevisions = revisions?.count ?? pastRevisions.length;

  /** `{username} · {relative time}`; a bare username reads as attribution
   *  ("Last edited by …") while the backend doesn't return modified_date. */
  const metaLine = (username?: string, date?: string): string => {
    if (username && date) return `${username} · ${relativeTime(date)}`;
    if (date) return relativeTime(date);
    if (username) return t("last_edited_by", { name: username });
    return "";
  };

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {t("version_history")}
      </h2>

      {isLoading ? (
        <FormSkeleton rows={4} />
      ) : (
        <div className="flex flex-col">
          <div className="flex gap-4">
            <TimelineRail current isFirst isLast={false} />
            <div className="min-w-0 flex-1 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {formatRevision(questionnaire.internal_revision)}
                    </span>
                    <Badge
                      variant={
                        QUESTIONNAIRE_STATUS_COLORS[questionnaire.status]
                      }
                    >
                      {t(questionnaire.status)}
                    </Badge>
                  </div>
                  {metaLine(
                    questionnaire.updated_by?.username,
                    questionnaire.modified_date,
                  ) && (
                    <p className="mt-1 text-sm text-gray-500">
                      {metaLine(
                        questionnaire.updated_by?.username,
                        questionnaire.modified_date,
                      )}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(`${scope.basePath}/${questionnaire.id}/edit`)
                    }
                  >
                    {t("continue_editing")}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {pastRevisions.length === 0 ? (
            <div className="flex gap-4">
              <TimelineRail current={false} isFirst={false} isLast />
              <div className="min-w-0 flex-1">
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <History className="size-5 text-primary" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {t("no_previous_versions")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            pastRevisions.map((revision, index) => (
              <div key={revision.id} className="flex gap-4">
                <TimelineRail
                  current={false}
                  isFirst={false}
                  isLast={index === pastRevisions.length - 1}
                />
                <div className="min-w-0 flex-1 pb-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {formatRevision(revision.internal_revision)}
                        </span>
                        {/* Backend gap: past revisions don't carry their own
                            status (QuestionnaireRead.status here still
                            reflects the *current* record's status, not what
                            this revision's was when it was superseded), so
                            every past entry is shown with a neutral "Retired"
                            badge rather than the real historical status. */}
                        <Badge variant="secondary">{t("retired")}</Badge>
                      </div>
                      {metaLine(
                        revision.updated_by?.username,
                        revision.modified_date,
                      ) && (
                        <p className="mt-1 text-sm text-gray-500">
                          {metaLine(
                            revision.updated_by?.username,
                            revision.modified_date,
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {/* Full-page readonly viewer (QuestionnaireRevisionPage)
                          — a dialog can't fit the renderer's tree-nav layout. */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `${scope.basePath}/${questionnaire.id}/versions/${revision.id}`,
                          )
                        }
                      >
                        {t("open")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {totalRevisions > pastRevisions.length && (
            <p className="pl-9 text-sm text-gray-400">
              {t("showing_latest_of_versions", {
                shown: pastRevisions.length,
                total: totalRevisions,
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
