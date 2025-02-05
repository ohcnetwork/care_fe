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

interface FacilityOverviewProps {
  facilityId: string;
}

export function FacilityOverview({ facilityId }: FacilityOverviewProps) {
  const { t } = useTranslation();
  const user = useAuthUser();

  const shortcuts = [
    {
      title: t("my_schedules"),
      description: t("manage_my_schedule"),
      icon: Calendar,
      href: `/facility/${facilityId}/users/${user?.username}/availability`,
    },
    {
      title: t("Encounters"),
      description: t("manage_facility_users"),
      icon: Users,
      href: `/facility/${facilityId}/encounters`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
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
          <h2 className="text-xl font-semibold mb-6 text-gray-900">
            {t("quick_actions")}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {shortcuts.map((shortcut) => (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="block h-full transition-all duration-200 hover:scale-102 hover:shadow-md"
              >
                <Card className="border-0 shadow-sm hover:bg-gray-50 h-full">
                  <CardHeader className="h-full flex flex-row items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <shortcut.icon className="h-6 w-6 text-primary" />
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
