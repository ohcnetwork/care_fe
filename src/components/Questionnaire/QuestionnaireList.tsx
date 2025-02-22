import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import {
  ArchiveIcon,
  EyeIcon,
  FileCheckIcon,
  NotepadTextDashedIcon,
  PlusIcon,
  Search,
} from "lucide-react";
import { useNavigate } from "raviger";

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

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

export function QuestionnaireList() {
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
  });

  const navigate = useNavigate();

  const { data: response } = useQuery({
    queryKey: ["questionnaires", qParams],
    queryFn: query(questionnaireApi.list, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        title: qParams.title || undefined,
        status: qParams.status || "active",
      },
    }),
  });

  const questionnaireList = response?.results || [];

  const RenderCard = () => (
    <div className="xl:hidden space-y-4 px-4">
      {questionnaireList?.length > 0 ? (
        questionnaireList.map((questionnaire: QuestionnaireDetail) => (
          <Card
            key={questionnaire.id}
            className="overflow-hidden bg-white rounded-lg cursor-pointer transition-shadow transform hover:shadow-lg"
            onClick={() =>
              navigate(`/admin/questionnaire/${questionnaire.slug}`)
            }
          >
            <CardContent className="p-6 relative flex flex-col">
              <div className="absolute top-4 right-4">
                <Badge
                  className={
                    questionnaire.status === "active"
                      ? "bg-green-100 text-green-800 px-3 py-1 rounded-full"
                      : ""
                  }
                >
                  {questionnaire.status}
                </Badge>
              </div>

              <div className="mb-4 border-b pb-2">
                <h3 className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("title")}
                </h3>
                <p className="text-xl font-bold text-gray-900 truncate">
                  {questionnaire.title}
                </p>
              </div>

              <div className="mb-4">
                <h3 className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("slug")}
                </h3>
                <p className="text-sm text-gray-900 truncate">
                  {questionnaire.slug}
                </p>
              </div>

              <div className="mb-4 flex-1">
                <h3 className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("description")}
                </h3>
                <p className="text-sm text-gray-900 line-clamp-2">
                  {questionnaire.description}
                </p>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    // prevent card's onClick if you want the button click to be separate
                    e.stopPropagation();
                    navigate(`/admin/questionnaire/${questionnaire.slug}`);
                  }}
                  className="font-semibold shadow-gray-300 text-gray-950 border-gray-400"
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  {t("View")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="py-6 text-center text-gray-500">
          {t("no_questionnaires_found")}
        </div>
      )}
    </div>
  );

  const RenderTable = () => (
    <div className="hidden xl:block overflow-hidden rounded-lg bg-white shadow overflow-x-auto">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader className="bg-gray-100 text-gray-700">
          <TableRow>
            <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              {t("title")}
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              {t("description")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200 bg-white">
          {questionnaireList?.length > 0 ? (
            questionnaireList.map((questionnaire: QuestionnaireDetail) => (
              <TableRow
                key={questionnaire.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  navigate(`/admin/questionnaire/${questionnaire.slug}`)
                }
              >
                <TableCell className="px-6 py-2">
                  <div className="text-sm font-semibold text-gray-950">
                    {questionnaire.title}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-2">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="max-w-md truncate text-sm text-gray-900">
                      {questionnaire.description}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-semibold shadow-gray-300 text-gray-950 border-gray-400"
                    >
                      <EyeIcon className="w-4 h-4 mr-0" />
                      {t("View")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4">
                {t("no_questionnaires_found")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">{t("questionnaires")}</h1>
          <p className="text-gray-600">{t("manage_and_view_questionnaires")}</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mt-8 gap-2">
          <div className="flex lg:flex-row flex-col items-center gap-4">
            <Tabs
              defaultValue="active"
              value={qParams.status || "active"}
              onValueChange={(value) => updateQuery({ status: value })}
              className="w-full"
            >
              <TabsList>
                <TabsTrigger value="active">
                  <FileCheckIcon className="w-4 h-4 mr-2 " />
                  {t("active")}
                </TabsTrigger>
                <TabsTrigger value="draft">
                  <NotepadTextDashedIcon className="w-4 h-4 mr-2" />
                  {t("draft")}
                </TabsTrigger>
                <TabsTrigger value="retired">
                  <ArchiveIcon className="w-4 h-4 mr-2" />
                  {t("retired")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative md:min-w-80 w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t("search_questionnaires")}
                className="pl-10"
                value={qParams.title || ""}
                onChange={(e) => updateQuery({ title: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center md:self-start">
            <Button onClick={() => navigate("/admin/questionnaire/create")}>
              <PlusIcon className="w-4 h-4" />
              {t("create_questionnaire")}
            </Button>
          </div>
        </div>
      </div>

      <RenderTable />
      <RenderCard />
      <Pagination totalCount={response?.count ?? 0} />
    </div>
  );
}
