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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 ">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">{t("questionnaire_other")}</h1>
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

      <div className="overflow-hidden rounded-lg bg-white shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 ">
          <thead className="bg-gray-100  text-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider ">
                {t("title")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider ">
                {t("description")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {questionnaireList.map((questionnaire: QuestionnaireDetail) => (
              <tr
                key={questionnaire.id}
                onClick={() =>
                  navigate(`/admin/questionnaire/${questionnaire.slug}/edit`)
                }
                className="cursor-pointer hover:bg-gray-50"
              >
                <td className="px-6 py-2">
                  <div className="text-sm font-semibold text-gray-950">
                    {questionnaire.title}
                  </div>
                </td>
                <td className="px-6 py-2">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="w-full text-sm text-gray-950">
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
