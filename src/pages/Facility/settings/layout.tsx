// create a layout for the facility settings page
import { Link, useRoutes } from "raviger";
import { useTranslation } from "react-i18next";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { GeneralSettings } from "./general/general";
import LocationList from "./locations/LocationList";
import LocationView from "./locations/LocationView";
import FacilityOrganizationIndex from "./organizations/FacilityOrganizationIndex";
import FacilityOrganizationUsers from "./organizations/FacilityOrganizationUsers";
import FacilityOrganizationView from "./organizations/FacilityOrganizationView";

interface SettingsLayoutProps {
  facilityId: string;
}

const getRoutes = (facilityId: string) => ({
  "/general": () => <GeneralSettings facilityId={facilityId} />,
  "/departments": () => <FacilityOrganizationIndex facilityId={facilityId} />,
  "/departments/:id": ({ id }: { id: string }) => (
    <FacilityOrganizationView facilityId={facilityId} id={id} />
  ),
  "/departments/:id/users": ({ id }: { id: string }) => (
    <FacilityOrganizationUsers facilityId={facilityId} id={id} />
  ),
  "/locations": () => <LocationList facilityId={facilityId} />,
  "/location/:id": ({ id }: { id: string }) => (
    <LocationView facilityId={facilityId} id={id} />
  ),
  "*": () => <ErrorPage />,
});

export function SettingsLayout({ facilityId }: SettingsLayoutProps) {
  const { t } = useTranslation();
  const basePath = `/facility/${facilityId}/settings`;
  const routeResult = useRoutes(getRoutes(facilityId), {
    basePath,
    routeProps: {
      facilityId,
    },
  });

  const settingsTabs = [
    {
      value: "general",
      label: t("general"),
      href: `${basePath}/general`,
    },
    {
      value: "departments",
      label: t("departments"),
      href: `${basePath}/departments`,
    },
    {
      value: "locations",
      label: t("locations"),
      href: `${basePath}/locations`,
    },
  ];

  // Extract the current tab from the URL
  const currentPath = window.location.pathname;
  const currentTab = currentPath.split("/").pop() || "general";

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue={currentTab} className="w-full" value={currentTab}>
        <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto">
          {settingsTabs.map((tab) => (
            <Link key={tab.value} href={tab.href}>
              <TabsTrigger
                value={tab.value}
                className="border-b-2 border-transparent px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-primary-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              >
                {tab.label}
              </TabsTrigger>
            </Link>
          ))}
        </TabsList>
        <div className="mt-6">{routeResult}</div>
      </Tabs>
    </div>
  );
}
