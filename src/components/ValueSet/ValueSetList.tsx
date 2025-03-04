import { useQuery } from "@tanstack/react-query";
import {
  ArchiveIcon,
  FileCheckIcon,
  HelpCircle,
  NotepadTextDashedIcon,
  Pencil,
  PlusIcon,
  Search,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import Loading from "@/components/Common/Loading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import valuesetApi from "@/types/valueset/valuesetApi";

export function ValueSetList() {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });
  const { data: response, isLoading } = useQuery({
    queryKey: ["valuesets", qParams],
    queryFn: query(valuesetApi.list, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        name: qParams.name,
        status: qParams.status || "active",
      },
    }),
  });

  const valuesets = response?.results || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 ">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">{t("valuesets")}</h1>
          <p className="text-gray-600">{t("manage_and_view_valuesets")}</p>
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
                <TabsTrigger value="unknown">
                  <HelpCircle className="w-4 h-4 mr-2 " />
                  {t("unknown")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative md:min-w-80 w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t("search_valuesets")}
                className="pl-10"
                value={qParams.name || ""}
                onChange={(e) => updateQuery({ name: e.target.value })}
              />
            </div>
          </div>
          <Button>
            <Link
              href="/admin/valuesets/create"
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              {t("create_valueset")}
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
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
                            unknown:
                              "bg-gray-100 text-gray-800 hover:bg-gray-200",
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
                          variant="outline"
                          size="sm"
                          className="font-semibold shadow-gray-300 text-gray-950 border-gray-400"
                        >
                          <Link
                            href={`/admin/valuesets/${valueset.slug}/edit`}
                            className="flex items-center gap-2"
                          >
                            <Pencil className="w-4 h-4 mr-0" />
                            {t("edit")}
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination totalCount={response?.count ?? 0} />
        </>
      )}
    </div>
  );
}
