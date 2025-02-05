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

import CreateFacilityOrganizationSheet from "./components/CreateFacilityOrganizationSheet";

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

  if (!data?.results?.length) {
    return (
      <Page
        title={t("organizations")}
        breadcrumbs={false}
        hideBack={true}
        hideTitleOnPage={true}
      >
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
    return data.results.filter((org) => org.parent?.id === parentId);
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
        const shouldExpand = !children.some(
          (child) => prevExpandedRows[child.id],
        );
        newExpandedRows[org.id] = shouldExpand;
        toggleChildren(org.id, shouldExpand);
        return newExpandedRows;
      });
    };
    return (
      <>
        <TableRow
          key={org.id}
          style={{ "--indent": `${indent * 20}px` } as React.CSSProperties}
        >
          <TableCell
            className={`${
              isTopLevel
                ? "bg-white font-bold text-[#030712]"
                : "bg-white font-medium text-[#030712]"
            } flex justify-between items-center pl-[var(--indent)] flex-wrap gap-2`}
          >
            <div className="flex items-center">
              {children.length > 0 ? (
                <button onClick={() => toggleRow(org.id)} className=" mr-1">
                  {expandedRows[org.id] ? (
                    <CareIcon icon="l-angle-down" className="h-5 w-5" />
                  ) : (
                    <CareIcon icon="l-angle-right" className="h-5 w-5" />
                  )}
                </button>
              ) : org.parent && Object.keys(org.parent).length > 0 ? (
                <CareIcon
                  icon="l-corner-up-right"
                  className="h-4 w-4 text-gray-400"
                />
              ) : null}
              {org.name}
            </div>
            {isTopLevel && (
              <>
                {children.length > 0 ? (
                  <>
                    <Button
                      variant="outline"
                      className="h-7 shadow-gray-400 border-gray-400 sm:p-2 sm:text-sm text-xs p-1"
                      onClick={toggleAllChildren}
                    >
                      <CareIcon
                        icon="l-plus"
                        className="h-4 w-4 sm:h-2 sm:w-2"
                      />
                      {t("expand_all")}
                    </Button>
                    <Button
                      variant="outline"
                      className="sm:text-sm text-xs p-1 h-7 shadow-gray-400 border-gray-400"
                      asChild
                    >
                      <Link
                        href={`/departments/${org.id}`}
                        className="text-[#030712] flex items-center"
                      >
                        <CareIcon icon="l-eye" className="h-4 w-4" />
                        {t("see_details")}
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="sm:text-sm text-xs p-1 h-7 shadow-gray-400 border-gray-400"
                    asChild
                  >
                    <Link
                      href={`/departments/${org.id}`}
                      className="text-[#030712] flex items-center"
                    >
                      <CareIcon icon="l-eye" className="h-4 w-4" />
                      {t("see_details")}
                    </Link>
                  </Button>
                )}
              </>
            )}
          </TableCell>
          <TableCell className="border-l bg-white font-semibold text-[#030712]">
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
    <Page
      title={t("departments")}
      hideBack={true}
      hideTitleOnPage={true}
      breadcrumbs={false}
    >
      <h2 className="mb-4 text-[#000000]">{t("departments")}</h2>
      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <div className="w-60">
          <Input
            className="px-2 placeholder:text-xs placeholder:text-[#4B5563]"
            placeholder={t("filter_by_department_or_team_name")}
          ></Input>
        </div>
        <div className="flex md:justify-end">
          <CreateFacilityOrganizationSheet facilityId={facilityId} />
        </div>
      </div>
      <div className="flex-col sm:flex-row items-center flex gap-3 text-[#1E3A8A] text-sm border-2 rounded-lg border-[#BFDBFE] bg-[#EFF6FF] p-4 mb-4">
        <div className="p-2 bg-[#DBEAFE] rounded-sm">
          <CareIcon icon="l-info-circle" className="h-6 w-6 text-[#1E40AF]" />
        </div>
        <div className="">
          <p className="">
            {t("click")}{" "}
            <span className="font-semibold">{t("add_department_or_team")}</span>{" "}
            {t("to_create_a_new_one")}
          </p>
          <p className="">
            {t("click")}{" "}
            <span className="font-semibold">{t("see_details")}</span>{" "}
            {t(
              "to_open_manage_users_or_create_more_departments_teams_within_it",
            )}
          </p>
        </div>
      </div>
      <Table className="border rounded-lg w-full overflow-hidden">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80%] border text-[#374151]  bg-[#f3f4f6]">
              {t("name")}
            </TableHead>
            <TableHead className="bg-[#f3f4f6] text-[#374151]">
              {t("category")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.results
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
