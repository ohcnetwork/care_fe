import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Link, useNavigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import valuesetApi from "@/types/valueset/valuesetApi";

export function ValueSetList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: 15,
  });
  const { data: response, isLoading } = useQuery({
    queryKey: ["valuesets", qParams],
    queryFn: query(valuesetApi.list, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
    }),
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
        </div>
        <Button asChild>
          <Link href="/admin/valuesets/create">
            <PlusIcon className="mr-2 size-4" />
            {t("create_new")}
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("name")}
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("slug")}
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("status")}
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("description")}
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("system")}
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200 bg-white">
            {valuesets.map((valueset) => (
              <TableRow key={valueset.id} className="hover:bg-gray-50">
                <TableCell className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {valueset.name}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {valueset.slug}
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4">
                  <Badge
                    className={
                      {
                        active:
                          "bg-green-100 text-green-800 hover:bg-green-200",
                        draft:
                          "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                        retired: "bg-red-100 text-red-800 hover:bg-red-200",
                        unknown: "bg-gray-100 text-gray-800 hover:bg-gray-200",
                      }[valueset.status]
                    }
                  >
                    {t(valueset.status)}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 truncate text-sm text-gray-900 break-words whitespace-normal">
                  {valueset.description}
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {valueset.is_system_defined ? t("yes") : t("no")}
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4 text-sm">
                  {!valueset.is_system_defined && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        navigate(`/admin/valuesets/${valueset.slug}/edit`)
                      }
                    >
                      {t("edit")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination totalCount={response?.count ?? 0} />
    </div>
  );
}
