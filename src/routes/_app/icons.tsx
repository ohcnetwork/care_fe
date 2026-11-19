import { createFileRoute } from "@tanstack/react-router";

import IconIndex from "@/CAREUI/icons/Index";

/**
 * The icon index. The legacy table listed `/icons` twice, the second time
 * behind `import.meta.env.PROD`. Both entries rendered the same page, so the
 * route existed in every build. Keep it that way.
 */
export const Route = createFileRoute("/_app/icons")({
  component: RouteComponent,
});

function RouteComponent() {
  return <IconIndex />;
}
