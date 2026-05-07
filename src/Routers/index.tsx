import { lazy } from "react";

import PublicRouter from "@/Routers/PublicRouter";

// Lazy load routers based on auth state to improve initial bundle size
// PatientRouter only loads when user is OTP authorized
const PatientRouter = lazy(() => import("@/Routers/PatientRouter"));
// AppRouter only loads when user is fully authorized
const AppRouter = lazy(() => import("@/Routers/AppRouter"));

const routers = { PatientRouter, PublicRouter, AppRouter };

export default routers;
