import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { userChildProps } from "@/components/Common/UserColumns";
import LinkUserToDepartmentSheet from "@/components/Users/LinkUserToDepartmentSheet";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import EditFacilityUserRoleSheet from "@/pages/Facility/settings/organizations/components/EditFacilityUserRoleSheet";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import { UserRead } from "@/types/user/user";

interface DepartmentRowProps {
  department: FacilityOrganizationRead;
  userData: UserRead;
  facilityId: string;
}

function DepartmentRow({
  department,
  userData,
  facilityId,
}: DepartmentRowProps) {
  const { t } = useTranslation();
  const {
    data: userRoles,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      "facilityOrganizationUsers",
      facilityId,
      department.id,
      userData.id,
    ],
    // The API supports name/username search, but no exact user-id filter.
    // Read every matching page, then match the id to avoid ambiguous names.
    queryFn: query.paginated(facilityOrganizationApi.listUsers, {
      pathParams: { facilityId, organizationId: department.id },
      queryParams: { search: userData.username },
    }),
  });
  const userRole = userRoles?.results.find(
    (role) => role.user.id === userData.id,
  );

  return (
    <TableRow>
      <TableCell className="whitespace-normal">
        <Link
          href={`/facility/${facilityId}/settings/departments/${department.id}/departments`}
          className="font-medium text-gray-900 underline underline-offset-4 break-words hover:text-primary-600"
        >
          {department.name}
        </Link>
        {department.parent?.name && (
          <p className="mt-1 text-xs text-gray-500 break-words">
            {department.parent.name}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge variant="outline">
            {t(`facility_organization_type__${department.org_type}`)}
          </Badge>
          {department.has_children && (
            <Badge variant="secondary">{t("has_sub_departments")}</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="whitespace-normal break-words">
        {isLoading ? (
          <Skeleton className="h-5 w-20" />
        ) : isError ? (
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        ) : (
          userRole?.role.name || t("unassigned")
        )}
      </TableCell>
      <TableCell className="text-right">
        {userRole && (
          <EditFacilityUserRoleSheet
            facilityId={facilityId}
            organizationId={department.id}
            userRole={userRole}
            trigger={
              <Button variant="ghost" size="icon" aria-label={t("edit_role")}>
                <CareIcon icon="l-pen" className="size-4" />
              </Button>
            }
          />
        )}
      </TableCell>
    </TableRow>
  );
}

export default function UserDepartmentsTab({ userData }: userChildProps) {
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacility();
  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "facilityOrganizations",
      "byUser",
      facilityId,
      userData.id,
      qParams.page,
      resultsPerPage,
    ],
    queryFn: query(facilityOrganizationApi.list, {
      pathParams: { facilityId: facilityId! },
      queryParams: {
        containing_user: userData.id,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
      },
    }),
    enabled: !!facilityId,
  });
  const departments = data?.results ?? [];

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("departments")}
          {data && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              {data.count}
            </span>
          )}
        </h3>
        <LinkUserToDepartmentSheet
          userId={userData.id}
          facilityId={facilityId}
        />
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-lg border p-6 text-center">
          <p>{t("departments_load_failed")}</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        </div>
      ) : departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 rounded-lg">
          <CareIcon icon="l-building" className="h-12 w-12 text-gray-400" />
          <p className="mt-4 font-medium text-gray-600">
            {t("no_departments_assigned")}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {t("click_link_department_to_get_started")}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-white">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("department")}</TableHead>
                  <TableHead className="w-1/3">{t("role")}</TableHead>
                  <TableHead className="w-14">
                    <span className="sr-only">{t("actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <DepartmentRow
                    key={department.id}
                    department={department}
                    userData={userData}
                    facilityId={facilityId}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination totalCount={data?.count ?? 0} />
        </>
      )}
    </div>
  );
}
