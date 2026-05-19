import PublicRouter from "@/Routers/PublicRouter";
import { lazyWithRetry } from "@/Utils/lazyWithRetry";

// Lazy load routers based on auth state to improve initial bundle size
// PatientRouter only loads when user is OTP authorized
const PatientRouter = lazyWithRetry(() => import("@/Routers/PatientRouter"));
// AppRouter only loads when user is fully authorized
const AppRouter = lazyWithRetry(() => import("@/Routers/AppRouter"));

const routers = { PatientRouter, PublicRouter, AppRouter };

export default routers;
