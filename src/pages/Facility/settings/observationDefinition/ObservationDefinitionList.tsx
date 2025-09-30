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
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  OBSERVATION_DEFINITION_CATEGORY,
  OBSERVATION_DEFINITION_STATUS,
  OBSERVATION_DEFINITION_STATUS_COLORS,
  type ObservationDefinitionReadSpec,
} from "@/types/emr/observationDefinition/observationDefinition";
import observationDefinitionApi from "@/types/emr/observationDefinition/observationDefinitionApi";

function ObservationDefinitionCard({
  definition,
  facilityId,
}: {
  definition: ObservationDefinitionReadSpec;
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
                  OBSERVATION_DEFINITION_STATUS_COLORS[definition.status]
                }
              >
                {t(definition.status)}
              </Badge>
            </div>
            <p className="text-lg font-medium text-gray-900">
              {definition.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {t(definition.category)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {t(definition.permitted_data_type)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/settings/observation_definitions/${definition.slug}`,
              )
            }
          >
            <CareIcon icon="l-edit" className="size-4" />
            {t("see_details")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ObservationDefinitionList({
  facilityId,
}: {
  facilityId: string;
}) {
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
    queryKey: ["observationDefinitions", qParams],
    queryFn: query.debounced(
      observationDefinitionApi.listObservationDefinition,
      {
        queryParams: {
          facility: facilityId,
          limit: resultsPerPage,
          offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
          title: qParams.search,
          status: qParams.status,
          category: qParams.category,
          ordering: "-created_date",
        },
      },
    ),
  });

  const observationDefinitions = response?.results || [];

  return (
    <Page title={t("observation_definitions")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-700">
            {t("observation_definitions")}
          </h1>
          <div className="mb-6 flex sm:flex-row sm:items-center sm:justify-between flex-col gap-4">
            <div>
              <p className="text-gray-600 text-sm">
                {t("manage_observation_definitions")}
              </p>
            </div>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/observation_definitions/new`,
                )
              }
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("add_observation_definition")}
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
                  options={OBSERVATION_DEFINITION_STATUS as unknown as string[]}
                  label={t("status")}
                  onClear={() => updateQuery({ status: undefined })}
                />
              </div>
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.category || ""}
                  onValueChange={(value) => updateQuery({ category: value })}
                  options={OBSERVATION_DEFINITION_CATEGORY}
                  label={t("category")}
                  onClear={() => updateQuery({ category: undefined })}
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
              <CardGridSkeleton count={4} />
            </div>
            <div className="hidden md:block">
              <TableSkeleton count={5} />
            </div>
          </>
        ) : observationDefinitions.length === 0 ? (
          <EmptyState
            icon={
              <CareIcon icon="l-folder-open" className="text-primary size-6" />
            }
            title={t("no_observation_definitions_found")}
            description={t("adjust_observation_definition_filters")}
          />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
              {observationDefinitions.map(
                (definition: ObservationDefinitionReadSpec) => (
                  <ObservationDefinitionCard
                    key={definition.slug}
                    definition={definition}
                    facilityId={facilityId}
                  />
                ),
              )}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead>{t("title")}</TableHead>
                      <TableHead>{t("category")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("data_type")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {observationDefinitions.map(
                      (definition: ObservationDefinitionReadSpec) => (
                        <TableRow key={definition.slug} className="divide-x">
                          <TableCell className="font-medium">
                            {definition.title}
                          </TableCell>
                          <TableCell>{t(definition.category)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                OBSERVATION_DEFINITION_STATUS_COLORS[
                                  definition.status
                                ]
                              }
                            >
                              {t(definition.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {t(definition.permitted_data_type)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/facility/${facilityId}/settings/observation_definitions/${definition.slug}`,
                                )
                              }
                            >
                              <CareIcon icon="l-edit" className="size-4" />
                              {t("see_details")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        <div className="mt-4 flex justify-center">
          <Pagination totalCount={response?.count || 0} />
        </div>
      </div>
    </Page>
  );
}
