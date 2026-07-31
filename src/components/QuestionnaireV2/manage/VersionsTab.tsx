import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import { QuestionnaireRenderer } from "@/components/QuestionnaireV2/renderer/QuestionnaireRenderer";

import { cn } from "@/lib/utils";

import {
  QUESTIONNAIRE_STATUS_COLORS,
  QuestionnaireRead,
  QuestionnaireScope,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import query from "@/Utils/request/query";
import { relativeTime } from "@/Utils/utils";

interface VersionsTabProps {
  scope: QuestionnaireScope;
  questionnaire: QuestionnaireRead;
}

/** `{username} · {relative time}`, gracefully collapsing when either half is missing. */
function metaLine(username?: string, date?: string): string {
  return [username, date ? relativeTime(date) : undefined]
    .filter(Boolean)
    .join(" · ");
}

/** Left-rail dot + connecting line, stretched to the row's height by the flex row's default `items-stretch`. */
function TimelineRail({
  current,
  showLine,
}: {
  current: boolean;
  showLine: boolean;
}) {
  return (
    <div className="flex w-3 shrink-0 flex-col items-center">
      <span
        className={cn(
          "mt-1.5 size-3 shrink-0 rounded-full ring-4 ring-white",
          current ? "bg-primary" : "bg-gray-300",
        )}
      />
      {showLine && <span className="w-px flex-1 bg-gray-200" />}
    </div>
  );
}

export function VersionsTab({ scope, questionnaire }: VersionsTabProps) {
  const { t } = useTranslation();
  const [openRevision, setOpenRevision] = useState<QuestionnaireRead | null>(
    null,
  );

  const { data: revisions, isLoading } = useQuery({
    queryKey: ["questionnairesV2", "revisions", questionnaire.id],
    queryFn: query(questionnaireApi.list, {
      // Backend gap: the revisions list has no way to request "all of them"
      // — pass a generously large page size so questionnaires with a long
      // history don't silently lose older versions off the end of the
      // default page. The count-vs-length check below surfaces the rest.
      queryParams: { parent_revision: questionnaire.id, limit: 100 },
    }),
  });

  // Falls back the same way `internal_revision` is displayed below (`?? 1`)
  // so the sort order and the printed version numbers never disagree.
  const pastRevisions = [...(revisions?.results ?? [])].sort(
    (a, b) => (b.internal_revision ?? 1) - (a.internal_revision ?? 1),
  );
  const totalRevisions = revisions?.count ?? pastRevisions.length;

  const { data: revisionDetail, isLoading: isRevisionLoading } = useQuery({
    queryKey: ["questionnairesV2", "revision-detail", openRevision?.id],
    queryFn: query(questionnaireApi.get, {
      pathParams: { id: openRevision?.id ?? "" },
    }),
    enabled: !!openRevision,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {t("version_history")}
      </h2>

      {isLoading ? (
        <FormSkeleton rows={4} />
      ) : (
        <div className="flex flex-col">
          <div className="flex gap-4">
            <TimelineRail current showLine={pastRevisions.length > 0} />
            <div className="min-w-0 flex-1 pb-6">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {/* eslint-disable-next-line i18next/no-literal-string -- version notation ("v1"), not translatable prose */}
                  <span className="font-medium text-gray-900">
                    v{questionnaire.internal_revision ?? 1}
                  </span>
                  <Badge
                    variant={QUESTIONNAIRE_STATUS_COLORS[questionnaire.status]}
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    navigate(`${scope.basePath}/${questionnaire.id}/edit`)
                  }
                >
                  {t("continue_editing")}
                </Button>
              </div>
            </div>
          </div>

          {pastRevisions.length === 0 ? (
            <div className="flex gap-4">
              <TimelineRail current={false} showLine={false} />
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
                  showLine={index < pastRevisions.length - 1}
                />
                <div className="min-w-0 flex-1 pb-6">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">
                        v{revision.internal_revision ?? 1}
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setOpenRevision(revision)}
                    >
                      {t("open")}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

          {totalRevisions > pastRevisions.length && (
            <p className="pl-7 text-sm text-gray-400">
              {t("showing_latest_of_versions", {
                shown: pastRevisions.length,
                total: totalRevisions,
              })}
            </p>
          )}
        </div>
      )}

      <Dialog
        open={!!openRevision}
        onOpenChange={(next) => {
          if (!next) setOpenRevision(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {openRevision?.title}{" "}
              {/* eslint-disable-next-line i18next/no-literal-string -- version notation ("v1"), not translatable prose */}
              <span className="text-gray-500">
                v{openRevision?.internal_revision ?? 1}
              </span>
            </DialogTitle>
          </DialogHeader>
          {isRevisionLoading || !revisionDetail ? (
            <FormSkeleton rows={6} />
          ) : (
            <QuestionnaireRenderer
              questionnaire={revisionDetail}
              mode="readonly"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
