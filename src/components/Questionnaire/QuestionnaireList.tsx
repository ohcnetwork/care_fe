import { useQuery } from "@tanstack/react-query";
import {
  ArchiveIcon,
  EyeIcon,
  FileCheckIcon,
  NotepadTextDashedIcon,
  PlusIcon,
  Search,
} from "lucide-react";
import { Link, useNavigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  QUESTIONNAIRE_STATUS_COLORS,
  QuestionnaireRead,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

function EmptyState() {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CareIcon icon="l-folder-open" className="size-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {t("no_questionnaires_found")}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {t("adjust_questionnaire_filters")}
      </p>
    </Card>
  );
}

const RenderCard = ({
  questionnaireList,
  isLoading,
}: {
  questionnaireList: QuestionnaireRead[];
  isLoading: boolean;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="md:hidden space-y-4">
      {isLoading ? (
        <CardGridSkeleton count={5} />
      ) : questionnaireList.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {questionnaireList.map((questionnaire: QuestionnaireRead) => (
            <Card
              key={questionnaire.id}
              className="overflow-hidden bg-card rounded-lg cursor-pointer"
              onClick={() =>
                navigate(`/admin/questionnaire/${questionnaire.slug}/edit`)
              }
            >
              <CardContent className="p-6 relative flex flex-col">
                <div className="flex flex-row gap-2 justify-between items-center mb-4 border-b pb-2">
                  <p className="mt-2 text-l text-left font-bold text-foreground line-clamp-1 text-ellipsis ">
                    {questionnaire.title}
                  </p>
                  <Badge
                    variant={QUESTIONNAIRE_STATUS_COLORS[questionnaire.status]}
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    {t(questionnaire.status)}
                  </Badge>
                </div>
                {questionnaire.description?.trim() ? (
                  <div className="mb-4 flex-1">
                    <h3 className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("description")}
                    </h3>
                    <p className="text-sm text-foreground line-clamp-2">
                      {questionnaire.description}
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 flex-1">
                    <h3 className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("description")}
                    </h3>
                    <p className="text-2xl font-light text-muted-foreground">
                      -
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(
                        `/admin/questionnaire/${questionnaire.slug}/edit`,
                      );
                    }}
                    className="font-semibold shadow-strong-border text-foreground border-stronger-border"
                  >
                    <EyeIcon className="size-4 mr-1" />
                    {t("view")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
};

const RenderTable = ({
  questionnaireList,
  isLoading,
}: {
  questionnaireList: QuestionnaireRead[];
  isLoading: boolean;
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="hidden md:block overflow-hidden rounded-lg bg-card shadow-sm overflow-x-auto">
      {isLoading ? (
        <TableSkeleton count={5} />
      ) : questionnaireList.length === 0 ? (
        <EmptyState />
      ) : (
        <Table className="min-w-full divide-y divide-border">
          <TableHeader className="bg-muted-background text-muted-foreground">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                {t("title")}
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                {t("description")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border bg-card">
            {questionnaireList.map((questionnaire: QuestionnaireRead) => (
              <TableRow
                key={questionnaire.id}
                className="cursor-pointer hover:bg-soft-background"
                onClick={() =>
                  navigate(`/admin/questionnaire/${questionnaire.slug}/edit`)
                }
              >
                <TableCell className="px-6 py-2">
                  {questionnaire.title && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-sm text-left font-semibold text-foreground truncate">
                            {questionnaire.title}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-black text-white z-40">
                          {questionnaire.title}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell className="px-6 py-2">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="truncate text-sm text-foreground break-words whitespace-normal">
                      {questionnaire.description}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-semibold shadow-strong-border text-foreground border-stronger-border"
                    >
                      <EyeIcon className="size-4 mr-0" />
                      {t("view")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export function QuestionnaireList() {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["questionnaires", qParams],
    queryFn: query.debounced(questionnaireApi.list, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        title: qParams.title || undefined,
        status: qParams.status || "active",
      },
    }),
  });

  const questionnaireList = response?.results || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">{t("questionnaire_other")}</h1>
          <p className="text-soft-foreground">
            {t("manage_and_view_questionnaires")}
          </p>
        </div>

        <div className="mt-8 mb-4">
          <div className="w-full overflow-x-auto pb-1">
            <Tabs
              defaultValue="active"
              value={qParams.status || "active"}
              onValueChange={(value) => updateQuery({ status: value })}
            >
              <div className="min-w-full sm:min-w-[50%] md:min-w-[40%]">
                <TabsList className="flex w-full">
                  <TabsTrigger value="active" className="flex-1">
                    <FileCheckIcon className="size-4" />
                    {t("active")}
                  </TabsTrigger>
                  <TabsTrigger value="draft" className="flex-1">
                    <NotepadTextDashedIcon className="size-4" />
                    {t("draft")}
                  </TabsTrigger>
                  <TabsTrigger value="retired" className="flex-1">
                    <ArchiveIcon className="size-4" />
                    {t("retired")}
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder={t("search_forms")}
              className="pl-10 w-full"
              value={qParams.title || ""}
              onChange={(e) => updateQuery({ title: e.target.value })}
            />
          </div>

          <Button className="w-full sm:w-auto">
            <Link
              href="/admin/questionnaire/create"
              className="flex items-center gap-2"
            >
              <PlusIcon className="size-4" />
              {t("create_questionnaire")}
            </Link>
          </Button>
        </div>
      </div>

      <RenderTable
        questionnaireList={questionnaireList}
        isLoading={isLoading}
      />
      <RenderCard questionnaireList={questionnaireList} isLoading={isLoading} />
      <Pagination totalCount={response?.count ?? 0} />
    </div>
  );
}
