import { AIWidgetsSettingsPage } from "@/components/AIWidgets/SettingsPage";

import { AppRoutes } from "@/Routers/AppRouter";

const AIWidgetsRoutes: AppRoutes = {
  "/users/:username/ai-widgets": () => <AIWidgetsSettingsPage />,
  "/ai-widgets": () => <AIWidgetsSettingsPage />,
};

export default AIWidgetsRoutes;
