import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
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

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { EmptyState } from "@/components/definition-list/EmptyState";
import { FilterSelect } from "@/components/definition-list/FilterSelect";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { SpecimenDefinitionStatus } from "@/types/emr/specimenDefinition/specimenDefinition";
import specimenDefinitionApi from "@/types/emr/specimenDefinition/specimenDefinitionApi";

const SPECIMEN_DEFINITION_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-700",
  retired: "bg-red-100 text-red-700",
  unknown: "bg-gray-100 text-gray-700",
};

function SpecimenDefinitionCard({
  definition,
  facilityId,
}: {
  definition: any;
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
                variant="outline"
                className={
                  SPECIMEN_DEFINITION_STATUS_COLORS[definition.status] ||
                  "bg-gray-100 text-gray-700"
                }
                data-cy="specimen-definition-status-badge"
              >
                {t(definition.status)}
              </Badge>
            </div>
            <h3
              className="font-medium text-gray-900"
              data-cy="specimen-definition-title"
            >
              {definition.title}
            </h3>
            <p
              className="mt-1 text-sm text-gray-500"
              data-cy="specimen-definition-description"
            >
              {definition.description}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/settings/specimen_definitions/${definition.id}`,
              )
            }
            data-cy="specimen-definition-see-details-btn"
          >
            <CareIcon icon="l-edit" className="size-4" />
            {t("see_details")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface SpecimenDefinitionsListProps {
  facilityId: string;
}

export function SpecimenDefinitionsList({
  facilityId,
}: SpecimenDefinitionsListProps) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["specimen_definitions", facilityId, qParams],
    queryFn: query.debounced(specimenDefinitionApi.listSpecimenDefinitions, {
      pathParams: { facilityId },
      queryParams: {
        title: qParams.search,
        status: qParams.status,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
    }),
  });

  const specimenDefinitions = response?.results || [];

  return (
    <Page title={t("specimen_definitions")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <h1
            className="text-2xl font-bold text-gray-700"
            data-cy="specimen-definitions-title"
          >
            {t("specimen_definitions")}
          </h1>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p
                className="text-gray-600 text-sm"
                data-cy="specimen-definitions-subtitle"
              >
                {t("manage_specimen_definitions")}
              </p>
            </div>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/specimen_definitions/new`,
                )
              }
              data-cy="add-specimen-definition-btn"
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("add_definition")}
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  data-cy="specimen-definition-search-icon"
                >
                  <CareIcon icon="l-search" className="size-5" />
                </span>
                <Input
                  placeholder={t("search_definitions")}
                  value={qParams.search || ""}
                  onChange={(e) =>
                    updateQuery({ search: e.target.value || undefined })
                  }
                  className="w-full md:w-[300px] pl-10"
                  data-cy="specimen-definition-search-input"
                />
              </div>
            </div>
            <div
              className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto"
              data-cy="specimen-definition-filters"
            >
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.status || ""}
                  onValueChange={(value) => updateQuery({ status: value })}
                  options={Object.values(SpecimenDefinitionStatus)}
                  label="status"
                  onClear={() => updateQuery({ status: undefined })}
                  data-cy="specimen-definition-status-filter"
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <>
            <div
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden"
              data-cy="specimen-definition-mobile-loading"
            >
              <CardGridSkeleton count={4} />
            </div>
            <div
              className="phidden md:block"
              data-cy="specimen-definition-table-loading"
            >
              <TableSkeleton count={5} />
            </div>
          </>
        ) : specimenDefinitions.length === 0 ? (
          <EmptyState
            icon="l-folder-open"
            title={t("no_definitions_found")}
            description={t("adjust_filters")}
            data-cy="specimen-definition-empty-state"
          />
        ) : (
          <>
            <div
              className="grid gap-4 md:hidden"
              data-cy="specimen-definition-mobile-grid"
            >
              {specimenDefinitions.map((definition) => (
                <SpecimenDefinitionCard
                  key={definition.id}
                  definition={definition}
                  facilityId={facilityId}
                  data-cy={`specimen-definition-card-${definition.id}`}
                />
              ))}
            </div>
            <div
              className="hidden md:block"
              data-cy="specimen-definition-table-container"
            >
              <div className="rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead data-cy="specimen-definition-table-header-title">
                        {t("title")}
                      </TableHead>
                      <TableHead data-cy="specimen-definition-table-header-status">
                        {t("status")}
                      </TableHead>
                      <TableHead data-cy="specimen-definition-table-header-description">
                        {t("description")}
                      </TableHead>
                      <TableHead data-cy="specimen-definition-table-header-actions">
                        {t("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody
                    className="bg-white"
                    data-cy="specimen-definition-table-body"
                  >
                    {specimenDefinitions.map((definition) => (
                      <TableRow
                        key={definition.id}
                        className="divide-x"
                        data-cy="specimen-definition-table-row"
                      >
                        <TableCell
                          className="font-medium"
                          data-cy="specimen-definition-title-cell"
                        >
                          {definition.title}
                        </TableCell>
                        <TableCell data-cy="specimen-definition-status-cell">
                          <Badge
                            variant="outline"
                            className={
                              SPECIMEN_DEFINITION_STATUS_COLORS[
                                definition.status
                              ] || "bg-gray-100 text-gray-700"
                            }
                            data-cy="specimen-definition-status-badge"
                          >
                            {t(definition.status)}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="whitespace-pre-wrap"
                          data-cy="specimen-definition-description-cell"
                        >
                          {definition.description}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/facility/${facilityId}/settings/specimen_definitions/${definition.id}`,
                              )
                            }
                            data-cy="specimen-definition-see-details-btn"
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

        <div
          className="mt-4 flex justify-center"
          data-cy="specimen-definition-pagination"
        >
          <Pagination totalCount={response?.count || 0} />
        </div>
      </div>
    </Page>
  );
}
