import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "raviger";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import Loading from "@/components/Common/Loading";

import query from "@/Utils/request/query";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

export function QuestionnaireList() {
  const navigate = useNavigate();
  const { data: response, isLoading } = useQuery({
    queryKey: ["questionnaires"],
    queryFn: query(questionnaireApi.list),
  });

  if (isLoading) {
    return <Loading />;
  }

  const questionnaireList = response?.results || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Questionnaires</h1>
          <p className="text-gray-600">Manage and view questionnaires</p>
        </div>
        <Button onClick={() => navigate("/questionnaire/create")}>
          Create New
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Slug
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {questionnaireList.map((questionnaire: QuestionnaireDetail) => (
              <tr
                key={questionnaire.id}
                onClick={() => navigate(`/questionnaire/${questionnaire.slug}`)}
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
    </div>
  );
}
