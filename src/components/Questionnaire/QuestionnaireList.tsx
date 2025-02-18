import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useNavigate } from "raviger";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

      <div className="overflow-hidden rounded-lg bg-white shadow">
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
            {questionnaireList.map((questionnaire: QuestionnaireDetail) => (
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
            ))}
          </tbody>
        </table>
      </div>
      <Pagination totalCount={response?.count ?? 0} />
    </div>
  );
}
