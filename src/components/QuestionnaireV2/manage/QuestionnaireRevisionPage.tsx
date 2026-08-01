import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";
import { QuestionnaireRenderer } from "@/components/QuestionnaireV2/renderer/QuestionnaireRenderer";

import {
  QuestionnaireScope,
  formatRevision,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import query from "@/Utils/request/query";
import { relativeTime } from "@/Utils/utils";

/**
 * Full-page read-only viewer for a single past revision, mounted at
 * `{basePath}/{id}/versions/{revisionId}`. Replaces the old cramped dialog
 * so the whole snapshot renders with the renderer's normal layout (tree nav
 * + paginated content) and users can actually read the old form before
 * deciding what to do with it.
 *
 * `id` is the head questionnaire (owns the Versions tab we came from);
 * `revisionId` is the archived row — revisions are full questionnaire rows,
 * so the plain detail endpoint returns the complete snapshot.
 */
export function QuestionnaireRevisionPage({
  scope,
  id,
  revisionId,
}: {
  scope: QuestionnaireScope;
  id: string;
  revisionId: string;
}) {
  const { t } = useTranslation();

  const {
    data: revision,
    isLoading,
    isError,
  } = useQuery({
    queryKey: questionnaireKeys.revisionDetail(revisionId),
    queryFn: query(questionnaireApi.get, { pathParams: { id: revisionId } }),
  });

  // Head record for context only ("Current version: vN"); shares the detail
  // cache key so navigating back to the detail page is warm.
  const { data: head } = useQuery({
    queryKey: questionnaireKeys.detail(id),
    queryFn: query(questionnaireApi.get, { pathParams: { id } }),
  });

  // `?tab=versions` puts the detail page back on the tab this page was
  // opened from (QuestionnaireDetailPage reads it).
  const versionsPath = `${scope.basePath}/${id}?tab=versions`;

  if (isLoading) {
    return <FormSkeleton rows={10} />;
  }

  if (isError || !revision) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>{t("error")}</AlertTitle>
          <AlertDescription>{t("no_data_found")}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate(versionsPath)}>
          <ArrowLeft className="mr-2 size-4" />
          {t("back")}
        </Button>
      </div>
    );
  }

  /** `{username} · {relative time}`; a bare username reads as attribution
   *  while the backend doesn't return modified_date for revisions. */
  const metaLine = (() => {
    const username = revision.updated_by?.username;
    const date = revision.modified_date;
    if (username && date) return `${username} · ${relativeTime(date)}`;
    if (date) return relativeTime(date);
    if (username) return t("last_edited_by", { name: username });
    return "";
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => navigate(versionsPath)}
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Button>
      </div>

      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{revision.title}</h1>
          <Badge variant="secondary">
            {formatRevision(revision.internal_revision)}
          </Badge>
          <Badge variant="yellow">{t("past_revision")}</Badge>
        </div>
        {(metaLine || head) && (
          <p className="text-sm text-gray-500">
            {[
              metaLine,
              head &&
                t("current_version_is", {
                  version: formatRevision(head.internal_revision),
                }),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>

      <QuestionnaireRenderer questionnaire={revision} mode="readonly" />
    </div>
  );
}
