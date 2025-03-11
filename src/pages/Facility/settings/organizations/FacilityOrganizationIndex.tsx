import { TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Tooltip } from "@radix-ui/react-tooltip";
import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

import CreateFacilityOrganizationSheet from "./components/CreateFacilityOrganizationSheet";

export default function FacilityOrganizationIndex({
  facilityId,
}: {
  facilityId: string;
}) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["facilityOrganization", "list", facilityId],
    queryFn: query.paginated(facilityOrganizationApi.list, {
      pathParams: { facilityId },
    }),
    enabled: !!facilityId,
  });
  const tableData = data?.results || [];
  const isMobile = useBreakpoints({ default: true, sm: false });
  if (isLoading) {
    return (
      <div className="px-6 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-8/12 self-end" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardGridSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (!tableData?.length) {
    return (
      <Page title={t("organizations")} hideTitleOnPage={true}>
        <div className="flex justify-center md:justify-end mt-2 mb-4">
          <CreateFacilityOrganizationSheet facilityId={facilityId} />
        </div>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">
              {t("organization_not_found")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("organization_forbidden")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-primary/10 p-6 mb-4">
              <CareIcon icon="d-hospital" className="h-12 w-12 text-primary" />
            </div>
            <p className="text-center text-sm text-gray-500 max-w-sm mb-4">
              {t("organization_access_help")}
            </p>
          </CardContent>
        </Card>
      </Page>
    );
  }
  const toggleRow = (id: string) => {
    const newExpandedRows = { ...expandedRows };
    newExpandedRows[id] = !newExpandedRows[id];
    const children = getChildren(id);
    children.forEach((child) => {
      if (!child.has_children) {
        newExpandedRows[child.id] = !newExpandedRows[child.id];
      }
    });
    setExpandedRows(newExpandedRows);
  };
  const getChildren = (parentId: string) => {
    return tableData.filter((org) => org.parent?.id === parentId);
  };
  const OrganizationRow = ({
    org,
    expandedRows,
    toggleRow,
    getChildren,
    indent,
  }: {
    org: {
      id: string;
      name: string;
      parent?: { id: string };
      org_type: string;
    };
    expandedRows: Record<string, boolean>;
    toggleRow: (id: string) => void;
    getChildren: (parentId: string) => {
      id: string;
      name: string;
      parent?: { id: string };
      org_type: string;
    }[];
    indent: number;
  }) => {
    const children = getChildren(org.id);
    const isTopLevel = !org.parent || Object.keys(org.parent).length === 0;

    const toggleAllChildren = () => {
      setExpandedRows((prevExpandedRows) => {
        const newExpandedRows = { ...prevExpandedRows };
        const toggleChildren = (parentId: string, expand: boolean) => {
          getChildren(parentId).forEach((child) => {
            newExpandedRows[child.id] = expand;
            toggleChildren(child.id, expand);
          });
        };
        const shouldExpand = !children.every(
          (child) => prevExpandedRows[child.id],
        );
        newExpandedRows[org.id] = shouldExpand;
        toggleChildren(org.id, shouldExpand);
        return newExpandedRows;
      });
    };
    const allExpanded = children.every((child) => expandedRows[child.id]);
    return (
      <>
        <TableRow
          key={org.id}
          style={{ "--indent": `${indent}rem` } as React.CSSProperties}
        >
          <TableCell
            className={`${
              isTopLevel
                ? "bg-white font-bold text-gray-900"
                : "bg-white font-medium text-gray-900"
            } flex justify-between lg:flex-row flex-col pl-[var(--indent)] flex-wrap gap-2`}
          >
            <div className="flex items-center">
              {isTopLevel || children.length > 0 ? (
                <Button
                  size={"icon"}
                  variant={"link"}
                  onClick={() => toggleRow(org.id)}
                  disabled={children.length === 0}
                >
                  {expandedRows[org.id] ? (
                    <CareIcon icon="l-angle-down" className="h-5 w-5" />
                  ) : (
                    <CareIcon icon="l-angle-right" className="h-5 w-5" />
                  )}
                </Button>
              ) : (
                <CareIcon
                  icon="l-corner-down-right-alt"
                  className="h-4 w-4 text-gray-400 ml-4 mr-2"
                />
              )}
              <CareIcon
                icon={isTopLevel ? "l-building" : "l-users-alt"}
                className="mr-2"
              />
              {org.name}
            </div>

            <div className="flex justify-between gap-5">
              {isTopLevel && children.length > 0 && (
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="white"
                          size={isMobile ? "xs" : "sm"}
                          onClick={toggleAllChildren}
                        >
                          <CareIcon
                            icon={allExpanded ? "l-minus" : "l-plus"}
                            className="h-4 w-4 sm:h-2 sm:w-2"
                          />
                          <span className="hidden sm:inline">
                            {t(allExpanded ? "collapse_all" : "expand_all")}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t(allExpanded ? "collapse_all" : "expand_all")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              <div className="ml-auto">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="white"
                        size={isMobile ? "xs" : "sm"}
                        asChild
                      >
                        <Link
                          href={`/departments/${org.id}/users`}
                          className="text-gray-900 flex items-center"
                        >
                          <CareIcon
                            icon="l-arrow-up-right"
                            className="h-4 w-4"
                          />
                          <span className="hidden sm:inline">
                            {t("see_details")}
                          </span>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("see_details")}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </TableCell>
          {!isMobile && (
            <TableCell className="border-l bg-white font-semibold text-gray-900">
              {t(`facility_organization_type__${org.org_type}`)}
            </TableCell>
          )}
        </TableRow>
        {expandedRows[org.id] &&
          children.map((child) => (
            <OrganizationRow
              key={child.id}
              org={child}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
              getChildren={getChildren}
              indent={indent + 1}
            />
          ))}
      </>
    );
  };
  return (
    <Page title={t("departments")} hideTitleOnPage={true}>
      <h3 className="mb-4 text-black">{t("departments")}</h3>
      <div className="flex justify-between items-center mb-4 gap-5 lg:flex-row flex-col-reverse ">
        <div className="lg:w-3/4 w-full">
          <Input
            className="px-2 placeholder:text-xs placeholder:text-gray-500"
            placeholder={t("filter_by_department_or_team_name")}
          ></Input>
        </div>
        <div className="flex lg:justify-end w-full">
          <CreateFacilityOrganizationSheet facilityId={facilityId} />
        </div>
      </div>
      <div className="items-center flex gap-3 text-blue-800 text-xs sm:text-sm border-2 rounded-lg border-blue-200 bg-blue-50 p-4 mb-4">
        <div className="sm:p-2 p-1 bg-blue-100 rounded-sm">
          <CareIcon icon="l-info-circle" className="h-6 w-6 text-blue-900" />
        </div>
        <div className="flex-1 space-y-2 text-xs md:text-sm text-blue-800">
          <div className="flex flex-wrap items-center">
            <Trans
              i18nKey="click_add_department_team"
              components={{
                strong: <strong className="font-semibold mx-0.5" />,
              }}
            />
          </div>
          <div className="hidden lg:flex flex-wrap items-center">
            <Trans
              i18nKey="click_manage_create_users"
              components={{
                strong: <strong className="font-semibold ml-1" />,
                CareIcon: (
                  <CareIcon icon="l-arrow-up-right" className="h-4 w-4 mr-1" />
                ),
              }}
            />
          </div>
          <div className="flex flex-wrap lg:hidden items-center">
            <Trans
              i18nKey="click_manage_create_users_mobile"
              components={{
                CareIcon: (
                  <CareIcon icon="l-arrow-up-right" className="h-4 w-4" />
                ),
              }}
            />
          </div>
        </div>
      </div>
      <Table className="border rounded-lg w-full overflow-hidden">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80%] border text-gray-700  bg-gray-200">
              {t("name")}
            </TableHead>
            {!isMobile && (
              <TableHead className="bg-gray-200 text-gray-700">
                {t("category")}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData
            .filter(
              (org) => !org.parent || Object.keys(org.parent).length === 0,
            ) // Parent rows only
            .map((parent) => (
              <OrganizationRow
                key={parent.id}
                org={parent}
                expandedRows={expandedRows}
                toggleRow={toggleRow}
                getChildren={getChildren}
                indent={1}
              />
            ))}
        </TableBody>
      </Table>
    </Page>
  );
}
