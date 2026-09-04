import { useQuery } from "@tanstack/react-query";
import { Copy, Eye, Pencil, PlusIcon, Search } from "lucide-react";
// Module-level `navigate` and `basePath="/"` on Link: inside the nested
// facility-settings router, raviger's `useNavigate()` and `<Link>` prepend
// that router's base path to absolute URLs, which would double the path.
import { Link, navigate } from "raviger";
import { ReactNode } from "react";
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
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CareIcon icon="l-folder-open" className="size-6 text-primary" />
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
    <div className="md:hidden space-y-4 px-4">
      {isLoading ? (
        <CardGridSkeleton count={5} />
      ) : valuesets.length === 0 ? (
        <EmptyState message={emptyMessage} />
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
                  <div className="max-w-md text-sm text-gray-900 break-words whitespace-normal">
                    <ExpandableText>
                      <ExpandableTextContent>
                        {valueset.description}
                      </ExpandableTextContent>
                      <ExpandableTextExpandButton>
                        {t("read_more")}
                      </ExpandableTextExpandButton>
                    </ExpandableText>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
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
    <div className="hidden md:block overflow-hidden rounded-lg bg-white shadow-sm">
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
  const { canWrite } = useCanWriteValueSet(scope);
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  // The admin area only ever lists instance sets; inside a facility the
  // Instance tab is a read-only catalogue of what can be customized.
  const source: Source =
    scope.authContext === "facility" && qParams.source !== "instance"
      ? "facility"
      : "instance";

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
        className="hover:bg-primary/5"
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
      source === "facility"
        ? t("no_facility_valuesets")
        : t("adjust_valueset_filters"),
    renderActions,
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 px-4 md:px-0">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">{t("valuesets")}</h1>
          <p className="text-gray-600">
            {scope.authContext === "facility"
              ? t("manage_facility_valuesets")
              : t("manage_and_view_valuesets")}
          </p>
        </div>

        {scope.authContext === "facility" && (
          <Tabs
            value={source}
            onValueChange={(value) =>
              updateQuery({
                source: value === "instance" ? value : undefined,
                page: undefined,
              })
            }
            className="mt-6"
          >
            <TabsList aria-label={t("source")}>
              <TabsTrigger value="facility">{t("this_facility")}</TabsTrigger>
              <TabsTrigger value="instance">{t("instance")}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="mt-8 mb-4">
          <div className="w-full overflow-x-auto pb-1">
            <Tabs
              defaultValue="active"
              value={qParams.status || "active"}
              onValueChange={(value) => updateQuery({ status: value })}
            >
              <div className="min-w-[480px]">
                <TabsList className="flex w-full">
                  {valuesOf(ValueSetStatus).map((status) => {
                    const IconComponent = VALUESET_STATUS_ICONS[status];
                    return (
                      <TabsTrigger
                        key={status}
                        value={status}
                        className="flex-1"
                      >
                        <IconComponent className="size-4" />
                        {t(status)}
                      </TabsTrigger>
                    );
                  })}
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

          {/* The Instance tab inside a facility is a catalogue to customize
              from, not a place to create instance sets. */}
          {canWrite &&
            (scope.authContext === "instance" || source === "facility") && (
              <Button className="w-full sm:w-auto">
                <Link
                  href={`${scope.basePath}/create`}
                  basePath="/"
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="size-4" />
                  {t("create_valueset")}
                </Link>
              </Button>
            )}
        </div>
      </div>
      <RenderTable {...rowsProps} />
      <RenderCard {...rowsProps} />
      <Pagination totalCount={response?.count ?? 0} />
    </div>
  );
}
