import { useRoutes } from "raviger";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import ReportBuilderList from "@/pages/Encounters/ReportBuilder";
import ReportBuilder from "@/pages/Encounters/ReportBuilder/ReportBuilder";
import CreateDevice from "@/pages/Facility/settings/devices/CreateDevice";
import DeviceDetail from "@/pages/Facility/settings/devices/DeviceShow";
import DevicesList from "@/pages/Facility/settings/devices/DevicesList";
import UpdateDevice from "@/pages/Facility/settings/devices/UpdateDevice";

import { GeneralSettings } from "./general/general";
import LocationSettings from "./locations/LocationSettings";
import FacilityOrganizationList from "./organizations/FacilityOrganizationList";

interface SettingsLayoutProps {
  facilityId: string;
}

const getRoutes = (facilityId: string) => ({
  "/general": () => <GeneralSettings facilityId={facilityId} />,
  "/departments": () => <FacilityOrganizationList facilityId={facilityId} />,
  "/departments/:id/:tab": ({ id, tab }: { id: string; tab: string }) => (
    <FacilityOrganizationList
      facilityId={facilityId}
      organizationId={id}
      currentTab={tab}
    />
  ),
  "/locations": () => <LocationSettings facilityId={facilityId} />,
  "/locations/:id": ({ id }: { id: string }) => (
    <LocationSettings facilityId={facilityId} locationId={id} />
  ),
  "/devices": () => <DevicesList facilityId={facilityId} />,
  "/devices/create": () => <CreateDevice facilityId={facilityId} />,
  "/devices/:id": ({ id }: { id: string }) => (
    <DeviceDetail facilityId={facilityId} deviceId={id} />
  ),
  "/devices/:id/edit": ({ id }: { id: string }) => (
    <UpdateDevice facilityId={facilityId} deviceId={id} />
  ),
  "/reportbuilder": () => <ReportBuilderList facilityId={facilityId} />,
  "/reportbuilder/new": () => <ReportBuilder facilityId={facilityId} />,
  "/reportbuilder/:reportTemplateId": ({
    reportTemplateId,
  }: {
    reportTemplateId: string;
  }) => (
    <ReportBuilder
      facilityId={facilityId}
      reportTemplateId={reportTemplateId}
    />
  ),
  "*": () => <ErrorPage />,
});

export function SettingsLayout({ facilityId }: SettingsLayoutProps) {
  const basePath = `/facility/${facilityId}/settings`;
  const routeResult = useRoutes(getRoutes(facilityId), {
    basePath,
    routeProps: {
      facilityId,
    },
  });

  return <div className="container mx-auto p-4">{routeResult}</div>;
}
