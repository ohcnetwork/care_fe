import { useQuery } from "@tanstack/react-query";
import { Copy, Eye, Pencil, PlusIcon, Search } from "lucide-react";
// Module-level `navigate` and `basePath="/"` on Link: inside the nested
// facility-settings router, raviger's `useNavigate()` and `<Link>` prepend
// that router's base path to absolute URLs, which would double the path.
import { Link, navigate } from "raviger";
import { ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExpandableText,
  ExpandableTextContent,
  ExpandableTextExpandButton,
} from "@/components/ui/expandable-text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import {
  VALUESET_STATUS_COLORS,
  VALUESET_STATUS_ICONS,
  ValueSetRead,
  ValueSetScope,
  ValueSetStatus,
} from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";
import { valuesOf } from "@/Utils/utils";

import { useCanWriteValueSet } from "./useCanWriteValueSet";
import { ValueSetPreview } from "./ValueSetPreview";

/** Inside a facility the list can show the facility's own sets or the
 *  instance sets it may customize. */
type Source = "facility" | "instance";

function EmptyState({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col items-center justify-center border-dashed p-8 text-center shadow-none">
      <div className="mb-4 rounded-full bg-primary-50 p-3">
        <CareIcon icon="l-folder-open" className="size-6 text-primary-700" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{t("no_valuesets_found")}</h3>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
    </Card>
  );
}

interface RowsProps {
  valuesets: ValueSetRead[];
  isLoading: boolean;
  emptyMessage: string;
  renderActions: (valueset: ValueSetRead) => ReactNode;
}

const RenderCard = ({
  valuesets,
  isLoading,
  emptyMessage,
  renderActions,
}: RowsProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 md:hidden">
      {isLoading ? (
        <CardGridSkeleton count={5} />
      ) : valuesets.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <>
          {valuesets.map((valueset) => (
            <Card
              key={valueset.id}
              className="overflow-hidden rounded-lg border-gray-200 bg-white shadow-none"
            >
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h3 className="break-words text-base font-semibold text-gray-950">
                      {valueset.name}
                    </h3>
                    <p className="break-all font-mono text-xs text-gray-500">
                      <span className="sr-only">{t("slug")}: </span>
                      {valueset.slug}
                    </p>
                  </div>
                  <Badge
                    variant={VALUESET_STATUS_COLORS[valueset.status]}
                    className="shrink-0 whitespace-nowrap"
                  >
                    {t(valueset.status)}
                  </Badge>
                </div>

                {valueset.description && (
                  <ExpandableText className="items-start gap-2 text-sm text-gray-600">
                    <ExpandableTextContent className="break-words whitespace-normal">
                      {valueset.description}
                    </ExpandableTextContent>
                    <ExpandableTextExpandButton className="shrink-0">
                      {t("read_more")}
                    </ExpandableTextExpandButton>
                  </ExpandableText>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3 [&_button]:h-10">
                  {renderActions(valueset)}
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
  emptyMessage,
  renderActions,
}: RowsProps) => {
  const { t } = useTranslation();
  return (
    <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white md:block">
      {isLoading ? (
        <TableSkeleton count={5} />
      ) : valuesets.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("name")}
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
                <TableCell className="min-w-48 max-w-xs space-y-1 px-6 py-4 whitespace-normal">
                  <div className="break-words text-sm font-medium text-gray-950">
                    {valueset.name}
                  </div>
                  <div className="break-all font-mono text-xs text-gray-500">
                    <span className="sr-only">{t("slug")}: </span>
                    {valueset.slug}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4">
                  <Badge
                    variant={VALUESET_STATUS_COLORS[valueset.status]}
                    className="whitespace-nowrap"
                  >
                    {t(valueset.status)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md text-sm text-gray-900 break-words whitespace-normal">
                  <ExpandableText>
                    <ExpandableTextContent>
                      {valueset.description}
                    </ExpandableTextContent>
                    <ExpandableTextExpandButton>
                      {t("read_more")}
                    </ExpandableTextExpandButton>
                  </ExpandableText>
                </TableCell>
                <TableCell className="whitespace-nowrap px-6 py-4 text-sm">
                  <div className="flex gap-2">{renderActions(valueset)}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export function ValueSetList({ scope }: { scope: ValueSetScope }) {
  const { t } = useTranslation();
  const filterId = useId();
  const isFacility = scope.authContext === "facility";
  const { canWrite } = useCanWriteValueSet(scope);
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  // The admin area only ever lists instance sets; inside a facility the
  // Shared catalogue is read-only and offers facility customization.
  const source: Source =
    isFacility && qParams.source !== "instance" ? "facility" : "instance";

  const { data: response, isLoading } = useQuery({
    queryKey: ["valuesets", scope.authContext, scope.facilityId, qParams],
    queryFn: query.debounced(valueSetApi.list, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        name: qParams.name,
        status: qParams.status || ValueSetStatus.ACTIVE,
        ...(source === "facility"
          ? { facility: scope.facilityId }
          : { auth_context: "instance" }),
      },
    }),
  });

  const valuesets = response?.results || [];

  const renderActions = (valueset: ValueSetRead) => {
    if (source === "instance" && scope.authContext === "facility") {
      // Instance sets are not editable from a facility (the backend
      // reserves them for superusers) — inspect, or customize a copy.
      return (
        <>
          <ValueSetPreview
            valueset={valueset}
            trigger={
              <Button variant="outline" size="sm">
                <Eye className="size-4 mr-0" />
                {t("preview")}
              </Button>
            }
          />
          {canWrite && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(`${scope.basePath}/create?parent=${valueset.id}`)
              }
            >
              <Copy className="size-4 mr-0" />
              {t("customize")}
            </Button>
          )}
        </>
      );
    }
    const readOnly = valueset.is_system_defined || !canWrite;
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`${scope.basePath}/${valueset.id}/edit`)}
        className="hover:bg-primary-50"
      >
        {readOnly ? (
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
    );
  };

  const rowsProps: RowsProps = {
    valuesets,
    isLoading,
    emptyMessage:
      source === "facility" && canWrite
        ? t("no_facility_valuesets")
        : t("adjust_valueset_filters"),
    renderActions,
  };

  return (
    <div className="container mx-auto space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
            {t("valuesets")}
          </h1>
          {!isFacility && (
            <p className="mt-1 text-sm text-gray-600">
              {t("manage_and_view_valuesets")}
            </p>
          )}
        </div>

        {/* The shared catalogue only offers customization, not instance creation. */}
        {canWrite && (!isFacility || source === "facility") && (
          <Button asChild className="h-10 shrink-0 sm:h-9">
            <Link href={`${scope.basePath}/create`} basePath="/">
              <PlusIcon className="size-4" aria-hidden="true" />
              {t("create_valueset")}
            </Link>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {isFacility ? (
          <div className="space-y-3 border-b border-gray-200 pb-4">
            <Tabs
              value={source}
              onValueChange={(value) =>
                updateQuery({
                  source: value === "instance" ? value : undefined,
                  page: 1,
                })
              }
            >
              <TabsList
                aria-label={t("source")}
                className="h-10 w-full sm:w-fit"
              >
                <TabsTrigger value="facility" className="flex-1 px-4">
                  {t("this_facility")}
                </TabsTrigger>
                <TabsTrigger value="instance" className="flex-1 px-4">
                  {t("valueset_shared_catalogue")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="max-w-3xl text-sm leading-5 text-gray-600">
              {source === "facility"
                ? t("manage_facility_valuesets")
                : t("valueset_shared_catalogue_description")}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto pb-1">
            <Tabs
              value={qParams.status || ValueSetStatus.ACTIVE}
              onValueChange={(value) => updateQuery({ status: value, page: 1 })}
            >
              <div className="min-w-[480px]">
                <TabsList aria-label={t("status")} className="flex w-full">
                  {valuesOf(ValueSetStatus).map((status) => {
                    const IconComponent = VALUESET_STATUS_ICONS[status];
                    return (
                      <TabsTrigger
                        key={status}
                        value={status}
                        className="flex-1"
                      >
                        <IconComponent className="size-4" aria-hidden="true" />
                        {t(status)}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            </Tabs>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full space-y-1.5 sm:max-w-md">
            <Label htmlFor={`${filterId}-search`} className="text-gray-700">
              {t("search")}
            </Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
                aria-hidden="true"
              />
              <Input
                id={`${filterId}-search`}
                aria-label={t("search_valuesets")}
                placeholder={t("search_valuesets")}
                className="h-10 w-full pl-9"
                value={qParams.name || ""}
                onChange={(e) => updateQuery({ name: e.target.value, page: 1 })}
              />
            </div>
          </div>

          {isFacility && (
            <div className="space-y-1.5 sm:w-40 sm:shrink-0">
              <Label htmlFor={`${filterId}-status`} className="text-gray-700">
                {t("status")}
              </Label>
              <Select
                value={qParams.status || ValueSetStatus.ACTIVE}
                onValueChange={(value) =>
                  updateQuery({ status: value, page: 1 })
                }
              >
                <SelectTrigger
                  id={`${filterId}-status`}
                  className="w-full data-[size=default]:h-10"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {valuesOf(ValueSetStatus).map((status) => {
                    const IconComponent = VALUESET_STATUS_ICONS[status];
                    return (
                      <SelectItem key={status} value={status}>
                        <IconComponent className="size-4" aria-hidden="true" />
                        {t(status)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
      <RenderTable {...rowsProps} />
      <RenderCard {...rowsProps} />
      <Pagination totalCount={response?.count ?? 0} />
    </div>
  );
}
