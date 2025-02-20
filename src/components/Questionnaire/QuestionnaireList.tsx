import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useNavigate } from "raviger";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import Loading from "@/components/Common/Loading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

export function QuestionnaireList() {
  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: 15,
  });
  const navigate = useNavigate();
  const { data: response, isLoading } = useQuery({
    queryKey: ["questionnaires", qParams],
    queryFn: query(questionnaireApi.list, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
    }),
  });

  if (isLoading) {
    return <Loading />;
  }

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
            <CardContent className="p-6 relative">
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

              <div>
                <h3 className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t("description")}
                </h3>
                <p className="text-sm text-gray-900 line-clamp-2">
                  {questionnaire.description}
                </p>
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
    <div className="hidden xl:block overflow-hidden rounded-lg bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              {t("title")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              {t("description")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              {t("status")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              {t("slug")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {questionnaireList?.length > 0 ? (
            questionnaireList.map((questionnaire: QuestionnaireDetail) => (
              <tr
                key={questionnaire.id}
                onClick={() =>
                  navigate(`/admin/questionnaire/${questionnaire.slug}`)
                }
                className="cursor-pointer hover:bg-gray-50"
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {questionnaire.title}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-md truncate text-sm text-gray-900">
                    {questionnaire.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    className={
                      questionnaire.status === "active"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : ""
                    }
                  >
                    {questionnaire.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {questionnaire.slug}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-4">
                {t("no_questionnaires_found")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("questionnaires")}</h1>
          <p className="text-gray-600">{t("manage_and_view_questionnaires")}</p>
        </div>
        <Button onClick={() => navigate("/admin/questionnaire/create")}>
          {t("create_new")}
        </Button>
      </div>
      <RenderTable />
      <RenderCard />
      <Pagination totalCount={response?.count ?? 0} />
    </div>
  );
}
