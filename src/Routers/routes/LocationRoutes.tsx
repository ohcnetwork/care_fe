import { AppRoutes } from "@/Routers/AppRouter";
import LocationList from "@/pages/Facility/locations/LocationList";

const LocationRoutes: AppRoutes = {
  "/facility/:facilityId/locations": ({ facilityId }) => (
    <LocationList facilityId={facilityId} />
  ),
};

export default LocationRoutes;
