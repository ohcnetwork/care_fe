import { useQuery } from "@tanstack/react-query";
import {
  ArchiveIcon,
  Eye,
  FileCheckIcon,
  HelpCircle,
  NotepadTextDashedIcon,
  Pencil,
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
  VALUESET_STATUS_COLORS,
  ValuesetBase,
} from "@/types/valueset/valueset";
import valuesetApi from "@/types/valueset/valuesetApi";

function EmptyState() {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CareIcon icon="l-folder-open" className="size-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{t("no_valuesets_found")}</h3>
      <p className="text-sm text-gray-500 mb-4">
        {t("adjust_valueset_filters")}
      </p>
    </Card>
  );
}

const RenderCard = ({
  valuesets,
  isLoading,
}: {
  valuesets: ValuesetBase[];
  isLoading: boolean;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="lg:hidden space-y-4 px-4">
      {isLoading ? (
        <CardGridSkeleton count={5} />
      ) : valuesets.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {valuesets.map((valueset) => (
            <Card
              key={valueset.id}
              className="overflow-hidden bg-white rounded-lg transition-shadow hover:shadow-lg"
            >
              <CardContent className="p-6 relative">
                <div className="absolute top-4 right-4">
                  <Badge
                    variant={VALUESET_STATUS_COLORS[valueset.status]}
                    className="whitespace-nowrap"
                  >
                    {t(valueset.status)}
                  </Badge>
                </div>

                <div className="mb-4 border-b pb-2 border-gray-200">
                  <h3 className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("name")}
                  </h3>
                  {valueset.name && valueset.name.length > 20 ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="w-full flex">
                          <p className="mt-2 text-xl font-bold text-gray-900 truncate">
                            {valueset.name}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent className="bg-black text-white">
                          {valueset.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <p className="mt-2 text-xl font-bold text-gray-900 truncate">
                      {valueset.name}
                    </p>
                  )}
                </div>

                <div className="mb-4 flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[120px]">
                    <h3 className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("slug")}
                    </h3>
                    <p className="text-sm text-gray-900 break-words">
                      {valueset.slug}
                    </p>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <h3 className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("system")}
                    </h3>
                    <p className="text-sm text-gray-900">
                      {valueset.is_system_defined ? t("yes") : t("no")}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("description")}
                  </h3>
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {valueset.description}
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(`/admin/valuesets/${valueset.slug}/edit`)
                    }
                    className="hover:bg-primary/5"
                  >
                    {valueset.is_system_defined ? (
                      <>
                        <Eye className="size-4 mr-0" />
                        {t("view")}
                      </>
                    ) : (
                      <>
                        <Pencil className="size-4 mr-0" />
                        {t("edit")}
                      </>
                    )}
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
  valuesets,
  isLoading,
}: {
  valuesets: ValuesetBase[];
  isLoading: boolean;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="hidden lg:block overflow-hidden rounded-lg bg-white shadow-sm">
      {isLoading ? (
        <TableSkeleton count={5} />
      ) : valuesets.length === 0 ? (
        <EmptyState />
      ) : (
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
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200 bg-white">
            {valuesets.map((valueset) => (
              <TableRow key={valueset.id} className="hover:bg-gray-50">
                <TableCell className="whitespace-nowrap px-6 py-4">
                  {valueset.name && valueset.name.length > 20 ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex w-full">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {valueset.name}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-black text-white">
                          {valueset.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {valueset.name}
                    </div>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {valueset.slug}
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4">
                  <Badge
                    variant={VALUESET_STATUS_COLORS[valueset.status]}
                    className="whitespace-nowrap"
                  >
                    {t(valueset.status)}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="max-w-md truncate text-sm text-gray-900 break-words whitespace-normal">
                    {valueset.description}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4 text-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(`/admin/valuesets/${valueset.slug}/edit`)
                    }
                  >
                    {valueset.is_system_defined ? (
                      <>
                        <Eye className="size-4 mr-0" />
                        {t("view")}
                      </>
                    ) : (
                      <>
                        <Pencil className="size-4 mr-0" />
                        {t("edit")}
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export function ValueSetList() {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });
  const { data: response, isLoading } = useQuery({
    queryKey: ["valuesets", qParams],
    queryFn: query.debounced(valuesetApi.list, {
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
      <div className="mb-4 px-4 md:px-0">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">{t("valuesets")}</h1>
          <p className="text-gray-600">{t("manage_and_view_valuesets")}</p>
        </div>

        <div className="mt-8 mb-4">
          <div className="w-full overflow-x-auto pb-1">
            <Tabs
              defaultValue="active"
              value={qParams.status || "active"}
              onValueChange={(value) => updateQuery({ status: value })}
            >
              <div className="min-w-[480px]">
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
                  <TabsTrigger value="unknown" className="flex-1">
                    <HelpCircle className="size-4" />
                    {t("unknown")}
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2 top-2.5 size-4 text-gray-500" />
            <Input
              placeholder={t("search_valuesets")}
              className="pl-10 w-full"
              value={qParams.name || ""}
              onChange={(e) => updateQuery({ name: e.target.value })}
            />
          </div>

          <Button className="w-full sm:w-auto">
            <Link
              href="/admin/valuesets/create"
              className="flex items-center gap-2"
            >
              <PlusIcon className="size-4" />
              {t("create_valueset")}
            </Link>
          </Button>
        </div>
      </div>
      <RenderTable valuesets={valuesets} isLoading={isLoading} />
      <RenderCard valuesets={valuesets} isLoading={isLoading} />
      <Pagination totalCount={response?.count ?? 0} />
    </div>
  );
}
