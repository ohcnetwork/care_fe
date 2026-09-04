import { useQuery } from "@tanstack/react-query";
import { Plus, Zap } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
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

import Page from "@/components/Common/Page";

import useFilters from "@/hooks/useFilters";

import actionConfigurationApi from "@/types/actions/actionConfigurationApi";
import query from "@/Utils/request/query";

import { actionContextLabel } from "./labels";
import { actionConfigurationKeys } from "./queryKeys";

export const ADMIN_ACTIONS_PATH = "/admin/actions";

/**
 * Instance-level action configurations: what runs when an appointment is
 * booked (and, once the backend wires them, other records). One row per
 * configuration; the row opens its editor.
 */
export function ActionConfigurationList() {
  const { t } = useTranslation();
  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: actionConfigurationKeys.list(qParams),
    queryFn: query(actionConfigurationApi.list, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
      },
    }),
  });
  const configurations = response?.results ?? [];

  return (
    <Page title={t("action_configurations")} hideTitleOnPage>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t("action_configurations")}
            </h1>
            <p className="max-w-2xl text-sm text-gray-500">
              {t("action_configurations_description")}
            </p>
          </div>
          <Button onClick={() => navigate(`${ADMIN_ACTIONS_PATH}/new`)}>
            <Plus className="size-4" />
            {t("action_configuration_new")}
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton count={5} />
        ) : configurations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <Zap aria-hidden className="mx-auto mb-2 size-6 text-gray-400" />
            <p className="text-sm font-medium text-gray-900">
              {t("action_configurations_empty")}
            </p>
            <p className="mb-4 text-sm text-gray-500">
              {t("action_configurations_empty_hint")}
            </p>
            <Button onClick={() => navigate(`${ADMIN_ACTIONS_PATH}/new`)}>
              <Plus className="size-4" />
              {t("action_configuration_new")}
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="h-8 w-[40%] text-xs font-medium text-gray-500">
                    {t("name")}
                  </TableHead>
                  <TableHead className="h-8 w-[20%] text-xs font-medium text-gray-500">
                    {t("action_configuration_context")}
                  </TableHead>
                  <TableHead className="h-8 w-[20%] text-xs font-medium text-gray-500">
                    {t("actions")}
                  </TableHead>
                  <TableHead className="h-8 w-[20%] text-xs font-medium text-gray-500">
                    {t("action_configuration_on_demand")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configurations.map((configuration) => (
                  <TableRow
                    key={configuration.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(`${ADMIN_ACTIONS_PATH}/${configuration.id}`)
                    }
                  >
                    <TableCell className="py-2.5">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {configuration.name}
                      </span>
                      {configuration.description && (
                        <span className="block truncate text-xs text-gray-500">
                          {configuration.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="secondary">
                        {actionContextLabel(configuration.action_context, t)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-gray-700">
                      {t("action_count", {
                        count: configuration.actions?.length ?? 0,
                      })}
                    </TableCell>
                    <TableCell className="py-2.5 text-sm text-gray-700">
                      {configuration.performable ? t("yes") : t("no")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Pagination totalCount={response?.count ?? 0} />
      </div>
    </Page>
  );
}
