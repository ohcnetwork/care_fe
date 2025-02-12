import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import CreateFacilityOrganizationSheet from "@/pages/Facility/settings/organizations/components/CreateFacilityOrganizationSheet";

export default function FacilityOrganizationIndex({
  facilityId,
}: {
  facilityId: string;
}) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const { t } = useTranslation();
  const LIMIT = 1000;
  const { data, isLoading } = useQuery({
    queryKey: ["facilityOrganization", "list", facilityId],
    queryFn: query(routes.facilityOrganization.list, {
      pathParams: { facilityId },
      queryParams: { limit: LIMIT },
    }),
    enabled: !!facilityId,
  });
  const tableData = data?.results || [];
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
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
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
              {children.length > 0 ? (
                <Button
                  size={"icon"}
                  variant={"link"}
                  onClick={() => toggleRow(org.id)}
                >
                  {expandedRows[org.id] ? (
                    <CareIcon icon="l-angle-down" className="h-5 w-5" />
                  ) : (
                    <CareIcon icon="l-angle-right" className="h-5 w-5" />
                  )}
                </Button>
              ) : org.parent && Object.keys(org.parent).length > 0 ? (
                <CareIcon
                  icon="l-corner-down-right-alt"
                  className="h-4 w-4 text-gray-400 ml-4"
                />
              ) : (
                <Button
                  size={"icon"}
                  variant={"link"}
                  onClick={() => toggleRow(org.id)}
                  className="px-0"
                >
                  {expandedRows[org.id] ? (
                    <CareIcon icon="l-angle-down" className="h-5 w-5" />
                  ) : (
                    <CareIcon icon="l-angle-right" className="h-5 w-5" />
                  )}
                </Button>
              )}
              {org.name}
            </div>
            {isTopLevel && (
              <div className="flex justify-between gap-5">
                {children.length > 0 ? (
                  <>
                    <Button
                      variant="white"
                      size={"sm"}
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
                    <Button variant="white" size={"sm"} asChild>
                      <Link
                        href={`/departments/${org.id}`}
                        className="text-gray-900  flex items-center"
                      >
                        <CareIcon icon="l-eye" className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {t("see_details")}
                        </span>
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button variant="white" size={"sm"} asChild>
                    <Link
                      href={`/departments/${org.id}`}
                      className="text-gray-900 flex items-center"
                    >
                      <CareIcon icon="l-eye" className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {t("see_details")}
                      </span>
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </TableCell>
          <TableCell className="border-l bg-white font-semibold text-gray-900">
            {org.org_type}
          </TableCell>
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
      <h2 className="mb-4 text-black">{t("departments")}</h2>
      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <div className="w-60">
          <Input
            className="px-2 placeholder:text-xs placeholder:text-gray-500"
            placeholder={t("filter_by_department_or_team_name")}
          ></Input>
        </div>
        <div className="flex md:justify-end">
          <CreateFacilityOrganizationSheet facilityId={facilityId} />
        </div>
      </div>
      <div className="flex-col sm:flex-row items-center flex gap-3 text-blue-800 text-sm border-2 rounded-lg border-blue-200 bg-blue-50 p-4 mb-4">
        <div className="p-2 bg-blue-100 rounded-sm">
          <CareIcon icon="l-info-circle" className="h-6 w-6 text-blue-900" />
        </div>
        <div className="">
          <p className="">
            {t("click")}{" "}
            <span className="font-semibold">{t("add_department_or_team")}</span>{" "}
            {t("to_create_new_one")}
          </p>
          <p className="">
            {t("click")}{" "}
            <span className="font-semibold">{t("see_details")}</span>{" "}
            {t("to_manage_create_more")}
          </p>
        </div>
      </div>
      <Table className="border rounded-lg w-full overflow-hidden">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80%] border text-gray-700  bg-gray-200">
              {t("name")}
            </TableHead>
            <TableHead className="bg-gray-200 text-gray-700">
              {t("category")}
            </TableHead>
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
