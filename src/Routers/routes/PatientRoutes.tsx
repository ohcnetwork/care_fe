import { AppRoutes } from "@/Routers/AppRouter";

// The patient pages moved to file routes: `src/routes/_app/facility.$facilityId.patient*`,
// `src/routes/_app/facility.$facilityId.encounters*`, `src/routes/patient.*` and the
// matching `organization.*` files. This table is empty and can go away.
const PatientRoutes: AppRoutes = {};

export default PatientRoutes;
