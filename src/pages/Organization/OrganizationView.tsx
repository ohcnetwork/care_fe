import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronRight } from "lucide-react";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import SearchInput from "@/components/Common/SearchInput";
import { SectionHeader } from "@/components/Common/SectionHeader";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import OrganizationLayout, {
  type RouteContext,
} from "./components/OrganizationLayout";

interface Props {
  id: string;
  navOrganizationId?: string;
  routeContext?: RouteContext;
}

export default function OrganizationView({
  id,
  navOrganizationId,
  routeContext,
}: Props) {
  const { t } = useTranslation();

  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: children, isFetching } = useQuery({
    queryKey: ["organization", id, "children", qParams],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        parent: id,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        limit: resultsPerPage,
        name: qParams.name || undefined,
      },
    }),
  });

  // Hack for the sidebar to work
  const baseUrl = navOrganizationId
    ? `/organization/${navOrganizationId}`
    : `/organization/${id}`;

  return (
    <OrganizationLayout
      id={id}
      navOrganizationId={navOrganizationId}
      routeContext={routeContext}
    >
      {() => {
        return (
          <div className="space-y-4">
            <SectionHeader
              title={t("organizations")}
              description={t("organization_children_description")}
              count={children?.count}
              isFetching={isFetching}
            />
            <Frame>
              <FrameHeader className="p-1 md:p-2">
                <SearchInput
                  options={[
                    {
                      key: "name",
                      type: "text",
                      placeholder: t("search_by_name"),
                      value: qParams.name || "",
                      display: t("name"),
                    },
                  ]}
                  onSearch={(key, value) =>
                    updateQuery({
                      [key]: value || undefined,
                    })
                  }
                  showSearchIcon
                  className="w-full sm:max-w-sm"
                />
              </FrameHeader>
              <FramePanel className="overflow-hidden p-0 **:data-[slot=table-container]:rounded-none **:data-[slot=table-container]:border-0">
                {!isFetching && !children?.results?.length ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {qParams.name
                      ? t("no_organizations_found")
                      : t("no_sub_organizations_found")}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-4">
                          {t("organization")}
                        </TableHead>
                        <TableHead className="px-4">
                          {t("administrative_unit")}
                        </TableHead>
                        <TableHead className="px-4">{t("type")}</TableHead>
                        <TableHead className="px-4">
                          <span className="sr-only">{t("actions")}</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-background">
                      {isFetching
                        ? Array.from({ length: 5 }, (_, index) => (
                            <TableRow key={index} aria-hidden="true">
                              <TableCell className="px-4">
                                <Skeleton className="h-5 w-40" />
                              </TableCell>
                              <TableCell className="px-4">
                                <Skeleton className="h-5 w-20" />
                              </TableCell>
                              <TableCell className="px-4">
                                <Skeleton className="h-5 w-24" />
                              </TableCell>
                              <TableCell className="px-4">
                                <Skeleton className="ml-auto h-12 w-20 md:h-10" />
                              </TableCell>
                            </TableRow>
                          ))
                        : children?.results?.map((orgChild: Organization) => (
                            <TableRow
                              key={orgChild.id}
                              onClick={() =>
                                navigate(`${baseUrl}/children/${orgChild.id}`)
                              }
                              className="cursor-pointer hover:bg-muted/50"
                            >
                              <TableCell className="px-4 whitespace-normal">
                                <div className="flex items-center gap-3">
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                    <Building2 className="size-4" aria-hidden />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-foreground">
                                      {orgChild.name}
                                    </div>
                                    {orgChild.description && (
                                      <p className="line-clamp-1 max-w-md text-xs text-muted-foreground">
                                        {orgChild.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 text-muted-foreground">
                                {orgChild.metadata?.govt_org_type
                                  ? t(
                                      `SYSTEM__govt_org_type__${orgChild.metadata.govt_org_type}`,
                                    )
                                  : "-"}
                              </TableCell>
                              <TableCell className="px-4">
                                <Badge variant="secondary">
                                  {t(`SYSTEM__org_type__${orgChild.org_type}`)}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className="px-4 text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button variant="tertiary" asChild>
                                  <Link
                                    href={`${baseUrl}/children/${orgChild.id}`}
                                    aria-label={`${t("open")} ${orgChild.name}`}
                                  >
                                    {t("open")}
                                    <ChevronRight data-icon="inline-end" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                )}
              </FramePanel>
            </Frame>
            <Pagination totalCount={children?.count ?? 0} />
          </div>
        );
      }}
    </OrganizationLayout>
  );
}
