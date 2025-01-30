// create a layout for the facility settings page
import { Link, useRoutes } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Card } from "@/components/ui/card";

import { GeneralSettings } from "./general/general";
import { NotificationsSettings } from "./notifications";
import { UsersSettings } from "./users";

interface SettingsLayoutProps {
  facilityId: string;
}

const getRoutes = (facilityId: string) => ({
  "/": () => <GeneralSettings facilityId={facilityId} />,
  "/general": () => <GeneralSettings facilityId={facilityId} />,
  "/users": () => <UsersSettings facilityId={facilityId} />,
  "/notifications": () => <NotificationsSettings facilityId={facilityId} />,
});

export function SettingsLayout({ facilityId }: SettingsLayoutProps) {
  const { t } = useTranslation();
  const routeResult = useRoutes(getRoutes(facilityId), {
    routeProps: { base: `/facility/${facilityId}/settings` },
  });

  const settingsLinks = [
    {
      href: `/facility/${facilityId}/settings/general`,
      label: t("facility.settings.general"),
    },
    {
      href: `/facility/${facilityId}/settings/users`,
      label: t("facility.settings.users"),
    },
    {
      href: `/facility/${facilityId}/settings/notifications`,
      label: t("facility.settings.notifications"),
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 p-4">
          <nav className="space-y-2">
            {settingsLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800",
                  "text-sm font-medium transition-colors",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </Card>

        <main className="md:col-span-3">
          <Card className="p-4">{routeResult}</Card>
        </main>
      </div>
    </div>
  );
}
