import type { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { type RouterAuth, routerAuth } from "@/lib/router/auth";
import { setRouter } from "@/lib/router/routerRef";
import { parseSearch, stringifySearch } from "@/lib/router/searchParams";
import "@/lib/router/staticData";
import { routeTree } from "@/routeTree.gen";
import queryClient from "@/Utils/request/queryClient";

export interface RouterContext {
  queryClient: QueryClient;
  auth: RouterAuth;
}

export const router = createRouter({
  routeTree,
  context: { queryClient, auth: routerAuth },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  parseSearch,
  stringifySearch,
  // Some params hold comma-separated ids (`$prescriptionIds`, `$invoiceIds`).
  // Keep the comma as is when a link is built, as raviger did, so typed links
  // and legacy links give the same URL. A `%2C` in a URL still matches.
  pathParamsAllowedCharacters: [","],
  defaultNotFoundComponent: () => <ErrorPage />,
});

setRouter(router);

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
