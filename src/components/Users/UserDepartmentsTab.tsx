import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import { userChildProps } from "@/components/Common/UserColumns";
import LinkUserToDepartmentSheet from "@/components/Users/LinkUserToDepartmentSheet";

import query from "@/Utils/request/query";
import EditFacilityUserRoleSheet from "@/pages/Facility/settings/organizations/components/EditFacilityUserRoleSheet";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  FacilityOrganizationRead,
  FacilityOrganizationUserRole,
} from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import { UserRead } from "@/types/user/user";

interface DepartmentCardProps {
  department: FacilityOrganizationRead;
  userData: UserRead;
  facilityId: string;
}

function DepartmentCard({
  department,
  userData,
  facilityId,
}: DepartmentCardProps) {
  const { t } = useTranslation();

  const { data: userRolesData } = useQuery({
    queryKey: [
      "facilityOrganizationUsers",
      facilityId,
      department.id,
      userData.id,
    ],
    queryFn: query(facilityOrganizationApi.listUsers, {
      pathParams: { facilityId, organizationId: department.id },
    }),
    enabled: !!facilityId && !!department.id,
  });

  const userRole = userRolesData?.results?.find(
    (role: FacilityOrganizationUserRole) => role.user.id === userData.id,
  );

  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Link
            href={`/facility/${facilityId}/settings/departments/${department.id}/departments`}
            className="flex-1 min-w-0"
          >
            <h3 className="font-semibold text-gray-900 truncate hover:text-primary-600">
              {department.name}
            </h3>
            {department.description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {department.description}
              </p>
            )}
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="capitalize">
            {t(`facility_organization_type__${department.org_type}`)}
          </Badge>
          {department.has_children && (
            <Badge variant="secondary">{t("has_sub_departments")}</Badge>
          )}
        </div>
        {department.parent?.name && (
          <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
            <CareIcon icon="l-corner-down-right" className="h-3 w-3" />
            <span className="truncate">{department.parent?.name}</span>
          </div>
        )}
        {userRole && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{t("role")}:</span>
              <Badge variant="secondary" className="text-xs">
                {userRole.role.name}
              </Badge>
            </div>
            <EditFacilityUserRoleSheet
              facilityId={facilityId}
              organizationId={department.id}
              userRole={userRole}
              trigger={
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <CareIcon icon="l-pen" className="h-3.5 w-3.5" />
                </Button>
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function UserDepartmentsTab({ userData }: userChildProps) {
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacility();

  const { data: departmentsData, isLoading } = useQuery({
    queryKey: ["facilityOrganizations", "byUser", facilityId, userData.id],
    queryFn: query(facilityOrganizationApi.list, {
      pathParams: { facilityId: facilityId! },
      queryParams: {
        containing_user: userData.id,
      },
    }),
    enabled: !!facilityId,
  });

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("departments")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardGridSkeleton count={6} />
        </div>
      </div>
    );
  }

  const departments = departmentsData?.results ?? [];

  return (
    <div className="mt-8 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("departments")}
        </h3>
        <LinkUserToDepartmentSheet
          userId={userData.id}
          facilityId={facilityId}
        />
      </div>

      {departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 rounded-lg">
          <CareIcon icon="l-building" className="h-16 w-16 text-gray-400" />
          <p className="mt-4 text-lg font-medium text-gray-600">
            {t("no_departments_assigned")}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {t("click_link_department_to_get_started")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              userData={userData}
              facilityId={facilityId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
