import { AppRoutes } from "@/Routers/AppRouter";
import LocationList from "@/pages/Location/LocationList";
import LocationView from "@/pages/Location/LocationView";

const LocationRoutes: AppRoutes = {
  "/facility/:facilityId/location": ({ facilityId }) => (
    <LocationList facilityId={facilityId} />
  ),
  "/facility/:facilityId/location/:id": ({ facilityId, id }) => (
    <LocationView facilityId={facilityId} id={id} />
  ),
};

export default LocationRoutes;
