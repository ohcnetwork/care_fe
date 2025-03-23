import { useQuery } from "@tanstack/react-query";
import { Calendar, Users } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import useAuthUser from "@/hooks/useAuthUser";

import { getPermissions } from "@/common/Permissions";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";

interface FacilityOverviewProps {
  facilityId: string;
}

export function FacilityOverview({ facilityId }: FacilityOverviewProps) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const { hasPermission } = usePermissions();

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: { id: facilityId },
    }),
  });

  const { canViewSchedule, canListEncounters } = getPermissions(
    hasPermission,
    facilityData?.permissions ?? [],
  );

  const shortcuts = [
    {
      title: t("my_schedules"),
      description: t("manage_my_schedule"),
      icon: Calendar,
      href: `/facility/${facilityId}/users/${user?.username}/availability`,
      visible: canViewSchedule,
    },
    {
      title: t("encounters"),
      description: t("manage_facility_users"),
      icon: Users,
      href: `/facility/${facilityId}/encounters`,
      visible: canListEncounters,
    },
  ];

  return (
    <div className="">
      <div className="container p-6 mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hey {user?.first_name}
              </h1>
              <p className="text-gray-500">
                {t("welcome_back_to_hospital_dashboard")}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            {t("quick_actions")}
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {shortcuts
              .filter((shortcut) => shortcut.visible)
              .map((shortcut) => (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="block h-full transition-all duration-200 hover:scale-102 hover:shadow-md"
                >
                  <Card className="h-full border-0 shadow-sm hover:bg-gray-50">
                    <CardHeader className="flex flex-row items-center h-full gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <shortcut.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {shortcut.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                          {shortcut.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacilityOverview;
