import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  ClipboardList,
  Eye,
  FileCheck,
  NotepadTextDashed,
  Plus,
  Search,
} from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useCanWriteQuestionnaire } from "@/components/QuestionnaireV2/useCanWriteQuestionnaire";

import useFilters from "@/hooks/useFilters";

import { cn } from "@/lib/utils";
import {
  QuestionStatus,
  QuestionnaireScope,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import query from "@/Utils/request/query";

const STATUS_TABS: { value: QuestionStatus; icon: React.ReactNode }[] = [
  { value: "active", icon: <FileCheck className="size-4" /> },
  { value: "draft", icon: <NotepadTextDashed className="size-4" /> },
  { value: "retired", icon: <Archive className="size-4" /> },
];

export function QuestionnaireListPage({
  scope,
}: {
  scope: QuestionnaireScope;
}) {
  const { t } = useTranslation();
  const { canWrite: canWriteQuestionnaire, isLoading: isPermissionLoading } =
    useCanWriteQuestionnaire(scope);
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
    defaultQueryParams: { status: "active" },
  });

  const { data: response, isLoading } = useQuery({
    queryKey: [
      "questionnairesV2",
      scope.authContext,
      scope.facilityId,
      qParams,
    ],
    queryFn: query.debounced(questionnaireApi.list, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        title: qParams.search,
        status: qParams.status,
        // Backend gap: QuestionnaireFilter has no facility/auth_context params
        // yet — passed optimistically, harmless if ignored.
        facility: scope.facilityId,
        auth_context: scope.authContext,
      },
    }),
  });

  const questionnaires = response?.results ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {t("questionnaires")}
        </h1>
        <p className="text-sm text-gray-500">
          {t("manage_and_view_questionnaires")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="radiogroup"
          aria-label={t("status")}
          className="flex rounded-md border border-gray-200 bg-gray-50 p-0.5"
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="radio"
              aria-checked={qParams.status === tab.value}
              onClick={() => updateQuery({ status: tab.value })}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm",
                qParams.status === tab.value
                  ? "border border-gray-200 bg-white font-medium text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {tab.icon}
              {t(tab.value)}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t("search_questionnaires")}
            value={qParams.search || ""}
            onChange={(e) =>
              updateQuery({ search: e.target.value || undefined })
            }
            className="w-full pl-9"
          />
        </div>

        {canWriteQuestionnaire && (
          <Button
            className="w-full md:ml-auto md:w-auto"
            onClick={() => navigate(`${scope.basePath}/new`)}
          >
            <Plus className="mr-2 size-4" />
            {t("create_questionnaire")}
          </Button>
        )}
      </div>

      {isLoading || isPermissionLoading ? (
        <TableSkeleton count={10} />
      ) : questionnaires.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-6 text-primary" />}
          title={t("no_questionnaires_found")}
          description={t("adjust_questionnaire_filters")}
          action={
            canWriteQuestionnaire ? (
              <Button onClick={() => navigate(`${scope.basePath}/new`)}>
                <Plus className="mr-2 size-4" />
                {t("create_questionnaire")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="hidden rounded-lg border md:block">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="h-8 w-[30%] text-xs font-medium text-gray-500">
                  {t("title")}
                </TableHead>
                <TableHead className="h-8 w-[50%] text-xs font-medium text-gray-500">
                  {t("description")}
                </TableHead>
                <TableHead className="h-8 w-[20%] text-xs font-medium text-gray-500">
                  {t("slug")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionnaires.map((questionnaire) => (
                <TableRow
                  key={questionnaire.id}
                  role="link"
                  tabIndex={0}
                  className="group cursor-pointer focus-visible:bg-gray-100/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary-500"
                  onClick={() =>
                    navigate(`${scope.basePath}/${questionnaire.id}`)
                  }
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`${scope.basePath}/${questionnaire.id}`);
                    }
                  }}
                >
                  <TableCell className="truncate font-medium">
                    {questionnaire.title}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate">
                        {questionnaire.description}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="invisible shrink-0 group-hover:visible"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${scope.basePath}/${questionnaire.id}`);
                        }}
                      >
                        <Eye className="mr-1 size-4" />
                        {t("see_details")}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="max-w-full truncate font-normal"
                    >
                      {questionnaire.slug}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {/* Mobile cards */}
      {!isLoading && !isPermissionLoading && questionnaires.length > 0 && (
        <div className="grid gap-3 md:hidden">
          {questionnaires.map((questionnaire) => (
            <button
              key={questionnaire.id}
              type="button"
              className="rounded-lg border p-4 text-left"
              onClick={() => navigate(`${scope.basePath}/${questionnaire.id}`)}
            >
              <p className="font-medium">{questionnaire.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                {questionnaire.description}
              </p>
              <Badge variant="secondary" className="mt-2 font-normal">
                {questionnaire.slug}
              </Badge>
            </button>
          ))}
        </div>
      )}
      <div className="flex justify-center">
        <Pagination totalCount={response?.count || 0} />
      </div>
    </div>
  );
}
