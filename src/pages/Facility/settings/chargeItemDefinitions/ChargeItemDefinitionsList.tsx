import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  CHARGE_ITEM_DEFINITION_STATUS_COLORS,
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";

function ChargeItemDefinitionCard({
  definition,
  facilityId,
}: {
  definition: ChargeItemDefinitionRead;
  facilityId: string;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant={
                  CHARGE_ITEM_DEFINITION_STATUS_COLORS[definition.status]
                }
              >
                {t(definition.status)}
              </Badge>
            </div>
            <h3 className="font-medium text-gray-900">{definition.title}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {definition.description}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/charge_item_definitions/${definition.id}`,
                )
              }
            >
              <CareIcon icon="l-edit" className="size-4" />
              {t("see_details")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ChargeItemDefinitionsListProps {
  facilityId: string;
}

export function ChargeItemDefinitionsList({
  facilityId,
}: ChargeItemDefinitionsListProps) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  // TODO: Remove this once we have a default status (robo's PR)
  useEffect(() => {
    if (!qParams.status) {
      updateQuery({ status: "active" });
    }
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ["charge_item_definitions", facilityId, qParams],
    queryFn: query.debounced(chargeItemDefinitionApi.listChargeItemDefinition, {
      pathParams: { facilityId },
      queryParams: {
        title: qParams.search,
        status: qParams.status,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        ordering: "-created_date",
      },
    }),
  });

  const chargeItemDefinitions = response?.results || [];

  return (
    <Page title={t("charge_item_definitions")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-700">
            {t("charge_item_definitions")}
          </h1>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                {t("manage_charge_item_definitions")}
              </p>
            </div>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/charge_item_definitions/new`,
                )
              }
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("add_definition")}
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CareIcon icon="l-search" className="size-5" />
                </span>
                <Input
                  placeholder={t("search_definitions")}
                  value={qParams.search || ""}
                  onChange={(e) =>
                    updateQuery({ search: e.target.value || undefined })
                  }
                  className="w-full md:w-[300px] pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.status || ""}
                  onValueChange={(value) => updateQuery({ status: value })}
                  options={Object.values(ChargeItemDefinitionStatus)}
                  label="status"
                  onClear={() => updateQuery({ status: undefined })}
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton count={5} />
        ) : chargeItemDefinitions.length === 0 ? (
          <EmptyState
            icon="l-folder-open"
            title={t("no_charge_definitions_found")}
            description={t("adjust_filters")}
          />
        ) : (
          <>
            <div className="grid gap-4 md:hidden">
              {chargeItemDefinitions.map((definition) => (
                <ChargeItemDefinitionCard
                  key={definition.id}
                  definition={definition}
                  facilityId={facilityId}
                />
              ))}
            </div>
            <div className="hidden md:block">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead>{t("title")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("description")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {chargeItemDefinitions.map((definition) => (
                      <TableRow key={definition.id} className="divide-x">
                        <TableCell className="font-medium">
                          {definition.title}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              CHARGE_ITEM_DEFINITION_STATUS_COLORS[
                                definition.status
                              ]
                            }
                          >
                            {t(definition.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-pre-wrap">
                          {definition.description}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/facility/${facilityId}/settings/charge_item_definitions/${definition.id}`,
                              )
                            }
                          >
                            <CareIcon icon="l-edit" className="size-4" />
                            {t("see_details")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {response && response.count > resultsPerPage && (
          <div className="mt-4 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
