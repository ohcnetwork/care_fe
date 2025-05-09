import { useRoutes } from "raviger";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { BillingSettingsLayout } from "@/pages/Facility/settings/billing/layout";
import CreateDevice from "@/pages/Facility/settings/devices/CreateDevice";
import DeviceDetail from "@/pages/Facility/settings/devices/DeviceShow";
import DevicesList from "@/pages/Facility/settings/devices/DevicesList";
import UpdateDevice from "@/pages/Facility/settings/devices/UpdateDevice";

import ActivityDefinitionForm from "./activityDefinition/ActivityDefinitionForm";
import ActivityDefinitionList from "./activityDefinition/ActivityDefinitionList";
import ActivityDefinitionView from "./activityDefinition/ActivityDefinitionView";
import { ChargeItemDefinitionDetail } from "./chargeItemDefinitions/ChargeItemDefinitionDetail";
import { ChargeItemDefinitionsList } from "./chargeItemDefinitions/ChargeItemDefinitionsList";
import { CreateChargeItemDefinition } from "./chargeItemDefinitions/CreateChargeItemDefinition";
import { UpdateChargeItemDefinition } from "./chargeItemDefinitions/UpdateChargeItemDefinition";
import { GeneralSettings } from "./general/general";
import HealthcareServiceForm from "./healthcareService/HealthcareServiceForm";
import HealthcareServiceList from "./healthcareService/HealthcareServiceList";
import HealthcareServiceShow from "./healthcareService/HealthcareServiceShow";
import LocationSettings from "./locations/LocationSettings";
import ObservationDefinitionForm from "./observationDefinition/ObservationDefinitionForm";
import ObservationDefinitionList from "./observationDefinition/ObservationDefinitionList";
import ObservationDefinitionView from "./observationDefinition/ObservationDefinitionView";
import FacilityOrganizationList from "./organizations/FacilityOrganizationList";
import { CreateSpecimenDefinition } from "./specimen-definitions/CreateSpecimenDefinition";
import { SpecimenDefinitionDetail } from "./specimen-definitions/SpecimenDefinitionDetail";
import { SpecimenDefinitionsList } from "./specimen-definitions/SpecimenDefinitionsList";
import { UpdateSpecimenDefinition } from "./specimen-definitions/UpdateSpecimenDefinition";

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
  "/specimen_definitions": () => (
    <SpecimenDefinitionsList facilityId={facilityId} />
  ),
  "/specimen_definitions/create": () => (
    <CreateSpecimenDefinition facilityId={facilityId} />
  ),
  "/specimen_definitions/new": () => (
    <CreateSpecimenDefinition facilityId={facilityId} />
  ),
  "/specimen_definitions/:id": ({ id }: { id: string }) => (
    <SpecimenDefinitionDetail
      facilityId={facilityId}
      specimenDefinitionId={id}
    />
  ),
  "/specimen_definitions/:id/edit": ({ id }: { id: string }) => (
    <UpdateSpecimenDefinition
      facilityId={facilityId}
      specimenDefinitionId={id}
    />
  ),
  "/observation_definitions": () => (
    <ObservationDefinitionList facilityId={facilityId} />
  ),
  "/observation_definitions/new": () => (
    <ObservationDefinitionForm facilityId={facilityId} />
  ),
  "/observation_definitions/:id/edit": ({ id }: { id: string }) => (
    <ObservationDefinitionForm
      facilityId={facilityId}
      observationDefinitionId={id}
    />
  ),
  "/observation_definitions/:id": ({ id }: { id: string }) => (
    <ObservationDefinitionView
      facilityId={facilityId}
      observationDefinitionId={id}
    />
  ),
  "/activity_definitions": () => (
    <ActivityDefinitionList facilityId={facilityId} />
  ),
  "/activity_definitions/new": () => (
    <ActivityDefinitionForm facilityId={facilityId} />
  ),
  "/activity_definitions/:id": ({ id }: { id: string }) => (
    <ActivityDefinitionView facilityId={facilityId} activityDefinitionId={id} />
  ),
  "/activity_definitions/:id/edit": ({ id }: { id: string }) => (
    <ActivityDefinitionForm facilityId={facilityId} activityDefinitionId={id} />
  ),
  "/healthcare_services": () => (
    <HealthcareServiceList facilityId={facilityId} />
  ),
  "/healthcare_services/new": () => (
    <HealthcareServiceForm facilityId={facilityId} />
  ),
  "/healthcare_services/:id": ({ id }: { id: string }) => (
    <HealthcareServiceShow facilityId={facilityId} healthcareServiceId={id} />
  ),
  "/healthcare_services/:id/edit": ({ id }: { id: string }) => (
    <HealthcareServiceForm facilityId={facilityId} healthcareServiceId={id} />
  ),
  "/billing*": () => <BillingSettingsLayout />,
  "/charge_item_definitions": () => (
    <ChargeItemDefinitionsList facilityId={facilityId} />
  ),
  "/charge_item_definitions/new": () => (
    <CreateChargeItemDefinition facilityId={facilityId} />
  ),
  "/charge_item_definitions/:id": ({ id }: { id: string }) => (
    <ChargeItemDefinitionDetail
      facilityId={facilityId}
      chargeItemDefinitionId={id}
    />
  ),
  "/charge_item_definitions/:id/edit": ({ id }: { id: string }) => (
    <UpdateChargeItemDefinition
      facilityId={facilityId}
      chargeItemDefinitionId={id}
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
