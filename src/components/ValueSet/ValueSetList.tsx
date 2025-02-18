import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Link, useNavigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import Loading from "@/components/Common/Loading";

import query from "@/Utils/request/query";
import valuesetApi from "@/types/valueset/valuesetApi";

export function ValueSetList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: response, isLoading } = useQuery({
    queryKey: ["valuesets"],
    queryFn: query(valuesetApi.list),
  });

  if (isLoading) {
    return <Loading />;
  }

  const valuesets = response?.results || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("valuesets")}</h1>
          <p className="text-gray-600">{t("manage_valuesets")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/valuesets/create">
            <PlusIcon className="mr-2 size-4" />
            {t("create_new")}
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("name")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("slug")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("status")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("description")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("system")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {valuesets.map((valueset) => (
              <tr key={valueset.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {valueset.name}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {valueset.slug}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Badge
                    className={
                      valueset.status === "active"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }
                  >
                    {valueset.status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-md truncate text-sm text-gray-900">
                    {valueset.description}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {valueset.is_system_defined ? t("yes") : t("no")}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {!valueset.is_system_defined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/admin/valuesets/${valueset.slug}/edit`)
                      }
                      className="hover:bg-primary/5"
                    >
                      {t("edit")}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
